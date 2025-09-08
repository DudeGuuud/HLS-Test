'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

interface HLSPlayerProps {
  src: string;
  title: string;
  className?: string;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
}

export default function HLSPlayer({ 
  src, 
  title, 
  className = '', 
  onError,
  onLoadStart,
  onLoadComplete
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerInfo, setPlayerInfo] = useState<{
    currentLevel: number;
    levels: any[];
    isSupported: boolean;
    isSafari: boolean;
    version: string;
  } | null>(null);

  const isSafari = useCallback(() => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }, []);

  const initializePlayer = useCallback(async () => {
    if (!videoRef.current || !src) return;

    setIsLoading(true);
    setError(null);
    onLoadStart?.();

    try {
      const video = videoRef.current;
      
      // Check if HLS is natively supported (Safari)
      const safari = isSafari();
      const nativeSupport = video.canPlayType('application/vnd.apple.mpegurl');
      
      if (nativeSupport && safari) {
        // Use native HLS support in Safari
        video.src = src;
        setPlayerInfo({
          currentLevel: -1,
          levels: [],
          isSupported: true,
          isSafari: true,
          version: 'Native Safari Support'
        });
      } else if (Hls.isSupported()) {
        // Use hls.js for other browsers
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          debug: process.env.NODE_ENV === 'development',
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 300,
          maxMaxBufferLength: 600,
          capLevelOnFPSDrop: true,
          capLevelToPlayerSize: true,
        });

        hlsRef.current = hls;

        // Event listeners
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log('Manifest parsed, levels:', data.levels);
          setPlayerInfo({
            currentLevel: hls.currentLevel,
            levels: data.levels,
            isSupported: true,
            isSafari: false,
            version: Hls.version
          });
          onLoadComplete?.();
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          console.log('Level switched to:', data.level);
          setPlayerInfo(prev => prev ? { ...prev, currentLevel: data.level } : null);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', data);
          if (data.fatal) {
            setError(`HLS Error: ${data.type} - ${data.details}`);
            onError?.(data);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });

        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        setError('HLS is not supported in this browser');
        onError?.({ type: 'UNSUPPORTED', message: 'HLS not supported' });
      }
    } catch (err) {
      console.error('Player initialization error:', err);
      setError('Failed to initialize player');
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }, [src, onError, onLoadStart, onLoadComplete, isSafari]);

  useEffect(() => {
    initializePlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initializePlayer]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const errorMessage = `Video error: ${video.error?.code} - ${video.error?.message}`;
    setError(errorMessage);
    onError?.({ type: 'VIDEO_ERROR', message: errorMessage });
  };

  return (
    <div className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Loading {title}...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-white text-center p-4">
            <div className="text-red-400 text-xl mb-2">⚠️</div>
            <p className="text-sm font-medium mb-1">Playback Error</p>
            <p className="text-xs opacity-75">{error}</p>
            <button
              onClick={initializePlayer}
              className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full aspect-video"
        controls
        playsInline
        webkit-playsinline="true"
        onError={handleVideoError}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onLoadedData={() => setIsLoading(false)}
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23000' width='100' height='100'/%3E%3C/svg%3E"
      />

      {/* Player info overlay */}
      {playerInfo && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>Engine: {playerInfo.isSafari ? 'Safari Native' : `HLS.js ${playerInfo.version}`}</div>
          {!playerInfo.isSafari && playerInfo.levels.length > 0 && (
            <>
              <div>Current Level: {playerInfo.currentLevel === -1 ? 'Auto' : playerInfo.currentLevel}</div>
              <div>Available: {playerInfo.levels.length} levels</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}