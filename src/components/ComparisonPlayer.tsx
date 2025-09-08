'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

interface ComparisonPlayerProps {
  src: string;
  title: string;
  className?: string;
  onMetricsUpdate?: (metrics: PlaybackMetrics) => void;
}

interface PlaybackMetrics {
  nativePlayer: PlayerMetrics;
  hlsjsPlayer: PlayerMetrics;
}

interface PlayerMetrics {
  loadTime: number;
  currentTime: number;
  buffered: number;
  errors: string[];
  quality: string;
  playerType: 'native' | 'hls.js' | 'unsupported';
  isPlaying: boolean;
  networkState: number;
  readyState: number;
  events: string[];
}

export default function ComparisonPlayer({ 
  src, 
  title, 
  className = '',
  onMetricsUpdate 
}: ComparisonPlayerProps) {
  const nativeVideoRef = useRef<HTMLVideoElement>(null);
  const hlsjsVideoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [isLoading, setIsLoading] = useState({ native: false, hlsjs: false });
  const [errors, setErrors] = useState({ native: '', hlsjs: '' });
  const [metrics, setMetrics] = useState<PlaybackMetrics>({
    nativePlayer: {
      loadTime: 0,
      currentTime: 0,
      buffered: 0,
      errors: [],
      quality: 'Unknown',
      playerType: 'unsupported',
      isPlaying: false,
      networkState: 0,
      readyState: 0,
      events: []
    },
    hlsjsPlayer: {
      loadTime: 0,
      currentTime: 0,
      buffered: 0,
      errors: [],
      quality: 'Unknown',
      playerType: 'unsupported',
      isPlaying: false,
      networkState: 0,
      readyState: 0,
      events: []
    }
  });

  const isSafari = useCallback(() => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }, []);

  const addEvent = useCallback((player: 'native' | 'hlsjs', event: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const eventWithTime = `${timestamp}: ${event}`;
    
    setMetrics(prev => ({
      ...prev,
      [`${player}Player`]: {
        ...prev[`${player}Player`],
        events: [...prev[`${player}Player`].events.slice(-9), eventWithTime]
      }
    }));
  }, []);

  const updateMetrics = useCallback((player: 'native' | 'hlsjs', updates: Partial<PlayerMetrics>) => {
    setMetrics(prev => {
      const newMetrics = {
        ...prev,
        [`${player}Player`]: {
          ...prev[`${player}Player`],
          ...updates
        }
      };
      onMetricsUpdate?.(newMetrics);
      return newMetrics;
    });
  }, [onMetricsUpdate]);

  const getBufferedAmount = (video: HTMLVideoElement) => {
    if (video.buffered.length > 0) {
      return video.buffered.end(video.buffered.length - 1) - video.currentTime;
    }
    return 0;
  };

  const initializeNativePlayer = useCallback(async () => {
    if (!nativeVideoRef.current || !src) return;

    const video = nativeVideoRef.current;
    const startTime = performance.now();
    setIsLoading(prev => ({ ...prev, native: true }));
    setErrors(prev => ({ ...prev, native: '' }));
    addEvent('native', 'Initializing native player');

    try {
      const safari = isSafari();
      const nativeSupport = video.canPlayType('application/vnd.apple.mpegurl');
      
      if (nativeSupport && safari) {
        addEvent('native', 'Using Safari native HLS support');
        video.src = src;
        
        updateMetrics('native', {
          playerType: 'native',
          loadTime: Math.round(performance.now() - startTime)
        });
      } else {
        addEvent('native', 'Native HLS not supported - fallback to HLS.js in native slot');
        // 在native槽位也使用hls.js作为对比
        if (Hls.isSupported()) {
          const hls = new Hls({
            debug: false,
            enableWorker: false // 避免与另一个实例冲突
          });
          
          hls.loadSource(src);
          hls.attachMedia(video);
          
          updateMetrics('native', {
            playerType: 'hls.js',
            loadTime: Math.round(performance.now() - startTime)
          });
          
          addEvent('native', 'HLS.js fallback initialized');
        } else {
          throw new Error('Neither native HLS nor HLS.js supported');
        }
      }

      // 事件监听
      video.addEventListener('loadstart', () => addEvent('native', 'Load start'));
      video.addEventListener('loadedmetadata', () => addEvent('native', 'Metadata loaded'));
      video.addEventListener('canplay', () => {
        setIsLoading(prev => ({ ...prev, native: false }));
        addEvent('native', 'Can play');
      });
      video.addEventListener('playing', () => {
        updateMetrics('native', { isPlaying: true });
        addEvent('native', 'Playing started');
      });
      video.addEventListener('pause', () => {
        updateMetrics('native', { isPlaying: false });
        addEvent('native', 'Paused');
      });
      video.addEventListener('error', () => {
        const errorMsg = `Video error: ${video.error?.code} - ${video.error?.message}`;
        setErrors(prev => ({ ...prev, native: errorMsg }));
        addEvent('native', `Error: ${errorMsg}`);
      });
      
      // 定时更新指标
      const updateInterval = setInterval(() => {
        if (video) {
          updateMetrics('native', {
            currentTime: video.currentTime,
            buffered: getBufferedAmount(video),
            networkState: video.networkState,
            readyState: video.readyState
          });
        }
      }, 1000);
      
      return () => clearInterval(updateInterval);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, native: errorMsg }));
      addEvent('native', `Initialization error: ${errorMsg}`);
      setIsLoading(prev => ({ ...prev, native: false }));
    }
  }, [src, isSafari, addEvent, updateMetrics]);

  const initializeHlsjsPlayer = useCallback(async () => {
    if (!hlsjsVideoRef.current || !src) return;

    const video = hlsjsVideoRef.current;
    const startTime = performance.now();
    setIsLoading(prev => ({ ...prev, hlsjs: true }));
    setErrors(prev => ({ ...prev, hlsjs: '' }));
    addEvent('hlsjs', 'Initializing HLS.js player');

    try {
      if (Hls.isSupported()) {
        // 清理之前的实例
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

        // HLS.js 事件监听
        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          addEvent('hlsjs', `Manifest parsed: ${data.levels.length} levels`);
          updateMetrics('hlsjs', {
            playerType: 'hls.js',
            quality: `${data.levels.length} levels available`,
            loadTime: Math.round(performance.now() - startTime)
          });
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          addEvent('hlsjs', `Level switched to: ${data.level}`);
          updateMetrics('hlsjs', {
            quality: `Level ${data.level}`
          });
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          const errorMsg = `HLS Error: ${data.type} - ${data.details}`;
          addEvent('hlsjs', `Error: ${errorMsg}`);
          
          if (data.fatal) {
            setErrors(prev => ({ ...prev, hlsjs: errorMsg }));
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                addEvent('hlsjs', 'Attempting network error recovery');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                addEvent('hlsjs', 'Attempting media error recovery');
                hls.recoverMediaError();
                break;
              default:
                addEvent('hlsjs', 'Fatal error - destroying player');
                hls.destroy();
                break;
            }
          }
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          addEvent('hlsjs', 'Fragment loaded');
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        // 视频元素事件监听
        video.addEventListener('loadstart', () => addEvent('hlsjs', 'Load start'));
        video.addEventListener('loadedmetadata', () => addEvent('hlsjs', 'Metadata loaded'));
        video.addEventListener('canplay', () => {
          setIsLoading(prev => ({ ...prev, hlsjs: false }));
          addEvent('hlsjs', 'Can play');
        });
        video.addEventListener('playing', () => {
          updateMetrics('hlsjs', { isPlaying: true });
          addEvent('hlsjs', 'Playing started');
        });
        video.addEventListener('pause', () => {
          updateMetrics('hlsjs', { isPlaying: false });
          addEvent('hlsjs', 'Paused');
        });

        // 定时更新指标
        const updateInterval = setInterval(() => {
          if (video && hls) {
            updateMetrics('hlsjs', {
              currentTime: video.currentTime,
              buffered: getBufferedAmount(video),
              networkState: video.networkState,
              readyState: video.readyState
            });
          }
        }, 1000);

        return () => {
          clearInterval(updateInterval);
          hls.destroy();
        };
      } else {
        throw new Error('HLS.js is not supported');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, hlsjs: errorMsg }));
      addEvent('hlsjs', `Initialization error: ${errorMsg}`);
      setIsLoading(prev => ({ ...prev, hlsjs: false }));
    }
  }, [src, addEvent, updateMetrics]);

  useEffect(() => {
    const cleanupNative = initializeNativePlayer();
    const cleanupHlsjs = initializeHlsjsPlayer();

    return () => {
      cleanupNative?.then(cleanup => cleanup?.());
      cleanupHlsjs?.then(cleanup => cleanup?.());
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initializeNativePlayer, initializeHlsjsPlayer]);

  const syncPlayback = (action: 'play' | 'pause' | 'seek', value?: number) => {
    const nativeVideo = nativeVideoRef.current;
    const hlsjsVideo = hlsjsVideoRef.current;

    if (!nativeVideo || !hlsjsVideo) return;

    switch (action) {
      case 'play':
        nativeVideo.play();
        hlsjsVideo.play();
        addEvent('native', 'Sync play triggered');
        addEvent('hlsjs', 'Sync play triggered');
        break;
      case 'pause':
        nativeVideo.pause();
        hlsjsVideo.pause();
        addEvent('native', 'Sync pause triggered');
        addEvent('hlsjs', 'Sync pause triggered');
        break;
      case 'seek':
        if (value !== undefined) {
          nativeVideo.currentTime = value;
          hlsjsVideo.currentTime = value;
          addEvent('native', `Sync seek to ${value}s`);
          addEvent('hlsjs', `Sync seek to ${value}s`);
        }
        break;
    }
  };

  const getPlayerStatus = (player: 'native' | 'hlsjs') => {
    const metric = metrics[`${player}Player`];
    const loading = isLoading[player];
    const error = errors[player];
    
    if (error) return { status: 'error', color: 'bg-red-500' };
    if (loading) return { status: 'loading', color: 'bg-yellow-500' };
    if (metric.isPlaying) return { status: 'playing', color: 'bg-green-500' };
    if (metric.readyState >= 3) return { status: 'ready', color: 'bg-blue-500' };
    return { status: 'idle', color: 'bg-gray-500' };
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">🔄 Safari vs HLS.js Comparison</h2>
        <div className="text-sm text-gray-600">{title}</div>
      </div>

      {/* Sync Controls */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
        <button
          onClick={() => syncPlayback('play')}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
        >
          ▶️ Sync Play
        </button>
        <button
          onClick={() => syncPlayback('pause')}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
        >
          ⏸️ Sync Pause
        </button>
        <button
          onClick={() => syncPlayback('seek', 0)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          ⏮️ Sync Reset
        </button>
        <div className="ml-auto text-xs text-gray-600">
          Use sync controls to compare playback behavior
        </div>
      </div>

      {/* Video Players */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Native Player */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Safari Native</h3>
            <div className={`w-3 h-3 rounded-full ${getPlayerStatus('native').color}`} 
                 title={getPlayerStatus('native').status}></div>
          </div>
          
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {isLoading.native && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-white text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Loading Native...</p>
                </div>
              </div>
            )}
            
            {errors.native && (
              <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-white text-center p-4">
                  <div className="text-red-400 text-lg mb-2">⚠️</div>
                  <p className="text-xs">{errors.native}</p>
                </div>
              </div>
            )}
            
            <video
              ref={nativeVideoRef}
              className="w-full h-full"
              controls
              playsInline
              muted
            />
            
            {/* Native Player Info */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
              <div>Type: {metrics.nativePlayer.playerType}</div>
              <div>Time: {metrics.nativePlayer.currentTime.toFixed(1)}s</div>
              <div>Buffer: {metrics.nativePlayer.buffered.toFixed(1)}s</div>
              <div>State: {metrics.nativePlayer.readyState}/4</div>
            </div>
          </div>
        </div>

        {/* HLS.js Player */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">HLS.js</h3>
            <div className={`w-3 h-3 rounded-full ${getPlayerStatus('hlsjs').color}`}
                 title={getPlayerStatus('hlsjs').status}></div>
          </div>
          
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {isLoading.hlsjs && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-white text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Loading HLS.js...</p>
                </div>
              </div>
            )}
            
            {errors.hlsjs && (
              <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-white text-center p-4">
                  <div className="text-red-400 text-lg mb-2">⚠️</div>
                  <p className="text-xs">{errors.hlsjs}</p>
                </div>
              </div>
            )}
            
            <video
              ref={hlsjsVideoRef}
              className="w-full h-full"
              controls
              playsInline
              muted
            />
            
            {/* HLS.js Player Info */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
              <div>Type: {metrics.hlsjsPlayer.playerType}</div>
              <div>Time: {metrics.hlsjsPlayer.currentTime.toFixed(1)}s</div>
              <div>Buffer: {metrics.hlsjsPlayer.buffered.toFixed(1)}s</div>
              <div>Quality: {metrics.hlsjsPlayer.quality}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Native Events */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Safari Native Events</h4>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
            {metrics.nativePlayer.events.length > 0 ? (
              metrics.nativePlayer.events.map((event, index) => (
                <div key={index} className="mb-1">{event}</div>
              ))
            ) : (
              <div className="text-gray-500">No events yet...</div>
            )}
          </div>
        </div>

        {/* HLS.js Events */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">HLS.js Events</h4>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
            {metrics.hlsjsPlayer.events.length > 0 ? (
              metrics.hlsjsPlayer.events.map((event, index) => (
                <div key={index} className="mb-1">{event}</div>
              ))
            ) : (
              <div className="text-gray-500">No events yet...</div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Performance Comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Load Time:</span>
            <div>Native: {metrics.nativePlayer.loadTime}ms</div>
            <div>HLS.js: {metrics.hlsjsPlayer.loadTime}ms</div>
          </div>
          <div>
            <span className="font-medium">Sync Difference:</span>
            <div className="text-gray-600">
              {Math.abs(metrics.nativePlayer.currentTime - metrics.hlsjsPlayer.currentTime).toFixed(2)}s
            </div>
          </div>
          <div>
            <span className="font-medium">Buffer Health:</span>
            <div>Native: {metrics.nativePlayer.buffered.toFixed(1)}s</div>
            <div>HLS.js: {metrics.hlsjsPlayer.buffered.toFixed(1)}s</div>
          </div>
        </div>
      </div>
    </div>
  );
}