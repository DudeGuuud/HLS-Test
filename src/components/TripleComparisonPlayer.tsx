'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

interface TripleComparisonPlayerProps {
  src: string;
  title: string;
  className?: string;
  onMetricsUpdate?: (metrics: TriplePlayerMetrics) => void;
}

interface PlayerMetrics {
  loadTime: number;
  currentTime: number;
  buffered: number;
  errors: string[];
  quality: string;
  playerType: 'native' | 'hls.js' | 'auto' | 'unsupported';
  isPlaying: boolean;
  networkState: number;
  readyState: number;
  bitrate: number;
  events: string[];
}

interface TriplePlayerMetrics {
  nativePlayer: PlayerMetrics;
  hlsjsPlayer: PlayerMetrics;
  autoPlayer: PlayerMetrics;
}

export default function TripleComparisonPlayer({ 
  src, 
  title, 
  className = '',
  onMetricsUpdate 
}: TripleComparisonPlayerProps) {
  const nativeVideoRef = useRef<HTMLVideoElement>(null);
  const hlsjsVideoRef = useRef<HTMLVideoElement>(null);
  const autoVideoRef = useRef<HTMLVideoElement>(null);
  const hlsjsRef = useRef<Hls | null>(null);
  const autoHlsRef = useRef<Hls | null>(null);
  
  const [isLoading, setIsLoading] = useState({ native: false, hlsjs: false, auto: false });
  const [errors, setErrors] = useState({ native: '', hlsjs: '', auto: '' });
  const [metrics, setMetrics] = useState<TriplePlayerMetrics>({
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
      bitrate: 0,
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
      bitrate: 0,
      events: []
    },
    autoPlayer: {
      loadTime: 0,
      currentTime: 0,
      buffered: 0,
      errors: [],
      quality: 'Unknown',
      playerType: 'unsupported',
      isPlaying: false,
      networkState: 0,
      readyState: 0,
      bitrate: 0,
      events: []
    }
  });

  const addEvent = useCallback((player: 'native' | 'hlsjs' | 'auto', event: string) => {
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

  const updateMetrics = useCallback((player: 'native' | 'hlsjs' | 'auto', updates: Partial<PlayerMetrics>) => {
    setMetrics(prev => ({
      ...prev,
      [`${player}Player`]: {
        ...prev[`${player}Player`],
        ...updates
      }
    }));
  }, []);

  // Call onMetricsUpdate when metrics change
  useEffect(() => {
    onMetricsUpdate?.(metrics);
  }, [metrics, onMetricsUpdate]);

  const getBufferedAmount = (video: HTMLVideoElement) => {
    if (video.buffered.length > 0) {
      return video.buffered.end(video.buffered.length - 1) - video.currentTime;
    }
    return 0;
  };

  // Native Player Initialization
  const initializeNativePlayer = useCallback(async () => {
    if (!nativeVideoRef.current || !src) return;

    const video = nativeVideoRef.current;
    const startTime = performance.now();
    setIsLoading(prev => ({ ...prev, native: true }));
    setErrors(prev => ({ ...prev, native: '' }));
    addEvent('native', 'Initializing native player');

    try {
      const nativeSupport = video.canPlayType('application/vnd.apple.mpegurl');
      
      if (nativeSupport) {
        addEvent('native', 'Using browser native HLS support');
        video.src = src;
        
        updateMetrics('native', {
          playerType: 'native',
          loadTime: Math.round(performance.now() - startTime)
        });
      } else {
        addEvent('native', 'Native HLS not supported in this browser');
        setErrors(prev => ({ ...prev, native: 'Browser does not support native HLS playback' }));
        updateMetrics('native', {
          playerType: 'unsupported',
          loadTime: Math.round(performance.now() - startTime)
        });
      }

      // Event listeners
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
      
      // Update metrics interval
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
  }, [src, addEvent, updateMetrics]);

  // HLS.js Player Initialization  
  const initializeHlsjsPlayer = useCallback(async () => {
    if (!hlsjsVideoRef.current || !src) return;

    const video = hlsjsVideoRef.current;
    const startTime = performance.now();
    setIsLoading(prev => ({ ...prev, hlsjs: true }));
    setErrors(prev => ({ ...prev, hlsjs: '' }));
    addEvent('hlsjs', 'Initializing HLS.js player');

    try {
      if (Hls.isSupported()) {
        if (hlsjsRef.current) {
          hlsjsRef.current.destroy();
        }

        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 300,
          maxMaxBufferLength: 600,
        });

        hlsjsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          addEvent('hlsjs', `Manifest parsed: ${data.levels.length} levels`);
          updateMetrics('hlsjs', {
            playerType: 'hls.js',
            quality: `${data.levels.length} levels available`,
            loadTime: Math.round(performance.now() - startTime)
          });
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const level = data.level === -1 ? 'Auto' : data.level;
          addEvent('hlsjs', `Level switched to: ${level}`);
          updateMetrics('hlsjs', {
            quality: `Level ${level}`,
            bitrate: data.level >= 0 ? hls.levels[data.level]?.bitrate || 0 : 0
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

        hls.loadSource(src);
        hls.attachMedia(video);

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

  // Auto HLS Player Initialization (with ABR)
  const initializeAutoPlayer = useCallback(async () => {
    if (!autoVideoRef.current || !src) return;

    const video = autoVideoRef.current;
    const startTime = performance.now();
    setIsLoading(prev => ({ ...prev, auto: true }));
    setErrors(prev => ({ ...prev, auto: '' }));
    addEvent('auto', 'Initializing Auto HLS player with ABR');

    try {
      if (Hls.isSupported()) {
        if (autoHlsRef.current) {
          autoHlsRef.current.destroy();
        }

        // Enhanced configuration for automatic bitrate selection
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
          maxBufferLength: 120,
          maxMaxBufferLength: 300,
          // ABR specific settings
          capLevelOnFPSDrop: true,
          capLevelToPlayerSize: true,
          abrEwmaFastLive: 3.0,
          abrEwmaSlowLive: 9.0,
          abrEwmaFastVoD: 3.0,
          abrEwmaSlowVoD: 9.0,
          abrEwmaDefaultEstimate: 500000,
          abrBandWidthFactor: 0.95,
          abrBandWidthUpFactor: 0.7,
          maxStarvationDelay: 4,
          maxLoadingDelay: 4,
        });

        autoHlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          addEvent('auto', `Manifest parsed: ${data.levels.length} levels, ABR enabled`);
          updateMetrics('auto', {
            playerType: 'auto',
            quality: `ABR (${data.levels.length} levels)`,
            loadTime: Math.round(performance.now() - startTime)
          });
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const level = data.level === -1 ? 'Auto' : data.level;
          const bitrate = data.level >= 0 ? hls.levels[data.level]?.bitrate || 0 : 0;
          addEvent('auto', `ABR switched to: ${level} (${Math.round(bitrate/1000)}kbps)`);
          updateMetrics('auto', {
            quality: `ABR Level ${level}`,
            bitrate: bitrate
          });
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          const errorMsg = `Auto HLS Error: ${data.type} - ${data.details}`;
          addEvent('auto', `Error: ${errorMsg}`);
          
          if (data.fatal) {
            setErrors(prev => ({ ...prev, auto: errorMsg }));
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                addEvent('auto', 'ABR attempting network error recovery');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                addEvent('auto', 'ABR attempting media error recovery');
                hls.recoverMediaError();
                break;
              default:
                addEvent('auto', 'Fatal ABR error - destroying player');
                hls.destroy();
                break;
            }
          }
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        video.addEventListener('canplay', () => {
          setIsLoading(prev => ({ ...prev, auto: false }));
          addEvent('auto', 'ABR player ready');
        });
        video.addEventListener('playing', () => {
          updateMetrics('auto', { isPlaying: true });
          addEvent('auto', 'ABR playback started');
        });
        video.addEventListener('pause', () => {
          updateMetrics('auto', { isPlaying: false });
          addEvent('auto', 'ABR playback paused');
        });

        const updateInterval = setInterval(() => {
          if (video && hls) {
            updateMetrics('auto', {
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
        throw new Error('HLS.js is not supported for Auto player');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, auto: errorMsg }));
      addEvent('auto', `Auto initialization error: ${errorMsg}`);
      setIsLoading(prev => ({ ...prev, auto: false }));
    }
  }, [src, addEvent, updateMetrics]);

  useEffect(() => {
    const cleanupNative = initializeNativePlayer();
    const cleanupHlsjs = initializeHlsjsPlayer();
    const cleanupAuto = initializeAutoPlayer();

    return () => {
      cleanupNative?.then(cleanup => cleanup?.());
      cleanupHlsjs?.then(cleanup => cleanup?.());
      cleanupAuto?.then(cleanup => cleanup?.());
      if (hlsjsRef.current) {
        hlsjsRef.current.destroy();
        hlsjsRef.current = null;
      }
      if (autoHlsRef.current) {
        autoHlsRef.current.destroy();
        autoHlsRef.current = null;
      }
    };
  }, [initializeNativePlayer, initializeHlsjsPlayer, initializeAutoPlayer]);

  const syncPlayback = (action: 'play' | 'pause' | 'seek', value?: number) => {
    const nativeVideo = nativeVideoRef.current;
    const hlsjsVideo = hlsjsVideoRef.current;
    const autoVideo = autoVideoRef.current;

    if (!nativeVideo || !hlsjsVideo || !autoVideo) return;

    switch (action) {
      case 'play':
        nativeVideo.play();
        hlsjsVideo.play();
        autoVideo.play();
        addEvent('native', 'Sync play triggered');
        addEvent('hlsjs', 'Sync play triggered');
        addEvent('auto', 'Sync play triggered');
        break;
      case 'pause':
        nativeVideo.pause();
        hlsjsVideo.pause();
        autoVideo.pause();
        addEvent('native', 'Sync pause triggered');
        addEvent('hlsjs', 'Sync pause triggered');
        addEvent('auto', 'Sync pause triggered');
        break;
      case 'seek':
        if (value !== undefined) {
          nativeVideo.currentTime = value;
          hlsjsVideo.currentTime = value;
          autoVideo.currentTime = value;
          addEvent('native', `Sync seek to ${value}s`);
          addEvent('hlsjs', `Sync seek to ${value}s`);
          addEvent('auto', `Sync seek to ${value}s`);
        }
        break;
    }
  };

  const getPlayerStatus = (player: 'native' | 'hlsjs' | 'auto') => {
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
        <h2 className="text-xl font-bold text-gray-900">🔄 Triple HLS Comparison</h2>
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
          Compare Native HLS, HLS.js Standard, and HLS.js ABR
        </div>
      </div>

      {/* Video Players */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Native Player */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">1. Native HLS</h3>
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
            
            {/* Player Info */}
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
            <h3 className="text-lg font-semibold text-gray-800">2. HLS.js Standard</h3>
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
            
            {/* Player Info */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
              <div>Type: {metrics.hlsjsPlayer.playerType}</div>
              <div>Time: {metrics.hlsjsPlayer.currentTime.toFixed(1)}s</div>
              <div>Buffer: {metrics.hlsjsPlayer.buffered.toFixed(1)}s</div>
              <div>Quality: {metrics.hlsjsPlayer.quality}</div>
              {metrics.hlsjsPlayer.bitrate > 0 && (
                <div>Bitrate: {Math.round(metrics.hlsjsPlayer.bitrate/1000)}kbps</div>
              )}
            </div>
          </div>
        </div>

        {/* Auto ABR Player */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">3. HLS.js ABR</h3>
            <div className={`w-3 h-3 rounded-full ${getPlayerStatus('auto').color}`}
                 title={getPlayerStatus('auto').status}></div>
          </div>
          
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {isLoading.auto && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-white text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Loading ABR...</p>
                </div>
              </div>
            )}
            
            {errors.auto && (
              <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-white text-center p-4">
                  <div className="text-red-400 text-lg mb-2">⚠️</div>
                  <p className="text-xs">{errors.auto}</p>
                </div>
              </div>
            )}
            
            <video
              ref={autoVideoRef}
              className="w-full h-full"
              controls
              playsInline
              muted
            />
            
            {/* Player Info */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
              <div>Type: {metrics.autoPlayer.playerType}</div>
              <div>Time: {metrics.autoPlayer.currentTime.toFixed(1)}s</div>
              <div>Buffer: {metrics.autoPlayer.buffered.toFixed(1)}s</div>
              <div>Quality: {metrics.autoPlayer.quality}</div>
              {metrics.autoPlayer.bitrate > 0 && (
                <div>Bitrate: {Math.round(metrics.autoPlayer.bitrate/1000)}kbps</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Native Events */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Native HLS Events</h4>
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
          <h4 className="font-medium text-gray-800">HLS.js Standard Events</h4>
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

        {/* Auto ABR Events */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">HLS.js ABR Events</h4>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
            {metrics.autoPlayer.events.length > 0 ? (
              metrics.autoPlayer.events.map((event, index) => (
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Load Time:</span>
            <div>Native: {metrics.nativePlayer.loadTime}ms</div>
            <div>HLS.js: {metrics.hlsjsPlayer.loadTime}ms</div>
            <div>ABR: {metrics.autoPlayer.loadTime}ms</div>
          </div>
          <div>
            <span className="font-medium">Current Bitrate:</span>
            <div>Native: N/A</div>
            <div>HLS.js: {Math.round(metrics.hlsjsPlayer.bitrate/1000)}kbps</div>
            <div>ABR: {Math.round(metrics.autoPlayer.bitrate/1000)}kbps</div>
          </div>
          <div>
            <span className="font-medium">Buffer Health:</span>
            <div>Native: {metrics.nativePlayer.buffered.toFixed(1)}s</div>
            <div>HLS.js: {metrics.hlsjsPlayer.buffered.toFixed(1)}s</div>
            <div>ABR: {metrics.autoPlayer.buffered.toFixed(1)}s</div>
          </div>
          <div>
            <span className="font-medium">Sync Status:</span>
            <div className="text-gray-600">
              Max Diff: {Math.max(
                Math.abs(metrics.nativePlayer.currentTime - metrics.hlsjsPlayer.currentTime),
                Math.abs(metrics.hlsjsPlayer.currentTime - metrics.autoPlayer.currentTime),
                Math.abs(metrics.nativePlayer.currentTime - metrics.autoPlayer.currentTime)
              ).toFixed(2)}s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}