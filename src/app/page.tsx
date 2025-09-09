'use client';

import { useState, useCallback } from 'react';
import TripleComparisonPlayer from '@/components/TripleComparisonPlayer';
import DeviceInfo from '@/components/DeviceInfo';
import StreamSelector from '@/components/StreamSelector';
import { type StreamConfig, TEST_STREAMS } from '@/data/test-streams';

export default function Home() {
  const [selectedStream, setSelectedStream] = useState<StreamConfig | null>(TEST_STREAMS[0]);
  const [tripleMetrics, setTripleMetrics] = useState<{
    nativePlayer: { playerType: string; loadTime: number; currentTime: number; buffered: number; isPlaying: boolean; bitrate: number };
    hlsjsPlayer: { playerType: string; loadTime: number; currentTime: number; buffered: number; isPlaying: boolean; bitrate: number };
    autoPlayer: { playerType: string; loadTime: number; currentTime: number; buffered: number; isPlaying: boolean; bitrate: number };
  } | null>(null);

  const handleStreamSelect = useCallback((stream: StreamConfig) => {
    setSelectedStream(stream);
  }, []);

  const handleTripleMetrics = useCallback((metrics: {
    nativePlayer: { playerType: string; loadTime: number; currentTime: number; buffered: number; isPlaying: boolean; bitrate: number };
    hlsjsPlayer: { playerType: string; loadTime: number; currentTime: number; buffered: number; isPlaying: boolean; bitrate: number };
    autoPlayer: { playerType: string; loadTime: number; currentTime: number; buffered: number; isPlaying: boolean; bitrate: number };
  }) => {
    setTripleMetrics(metrics);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              🔄
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Triple HLS Comparison Tool
              </h1>
              <p className="text-gray-600 mt-1">
                专业的三重HLS对比测试工具：Native HLS、HLS.js Standard、HLS.js ABR
              </p>
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm">
              <div className={`w-2 h-2 rounded-full ${selectedStream ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-gray-700">
                {selectedStream ? `对比中: ${selectedStream.name}` : '未选择流'}
              </span>
            </div>
            {tripleMetrics && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>
                  最大同步差异: {Math.max(
                    Math.abs(tripleMetrics.nativePlayer.currentTime - tripleMetrics.hlsjsPlayer.currentTime),
                    Math.abs(tripleMetrics.hlsjsPlayer.currentTime - tripleMetrics.autoPlayer.currentTime),
                    Math.abs(tripleMetrics.nativePlayer.currentTime - tripleMetrics.autoPlayer.currentTime)
                  ).toFixed(2)}s
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <div className="space-y-8">
          {/* Device Information */}
          <DeviceInfo />

          {/* Stream Selector */}
          <StreamSelector 
            onStreamSelect={handleStreamSelect}
            selectedStream={selectedStream}
          />

          {/* Triple HLS Comparison Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                🔄 Triple HLS Comparison: Native | HLS.js Standard | HLS.js ABR
              </h2>
              {selectedStream && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedStream.type}</span> • {selectedStream.resolution}
                </div>
              )}
            </div>

            {selectedStream ? (
              <div className="space-y-4">
                <TripleComparisonPlayer
                  src={selectedStream.url}
                  title={selectedStream.name}
                  className="w-full"
                  onMetricsUpdate={handleTripleMetrics}
                />
                
                {/* Triple Comparison Analysis */}
                {tripleMetrics ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-800 mb-3">🔄 Triple Comparison Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">Native HLS</h4>
                        <div className="space-y-1 text-sm">
                          <div>Type: <span className="font-mono">{tripleMetrics.nativePlayer.playerType}</span></div>
                          <div>Load Time: <span className="font-mono">{tripleMetrics.nativePlayer.loadTime}ms</span></div>
                          <div>Current Time: <span className="font-mono">{tripleMetrics.nativePlayer.currentTime.toFixed(2)}s</span></div>
                          <div>Buffer: <span className="font-mono">{tripleMetrics.nativePlayer.buffered.toFixed(1)}s</span></div>
                          <div>Bitrate: <span className="font-mono">{tripleMetrics.nativePlayer.bitrate > 0 ? (tripleMetrics.nativePlayer.bitrate / 1000).toFixed(0) + 'kbps' : 'N/A'}</span></div>
                          <div>Playing: <span className={`font-medium ${tripleMetrics.nativePlayer.isPlaying ? 'text-green-600' : 'text-gray-600'}`}>
                            {tripleMetrics.nativePlayer.isPlaying ? '▶️ Yes' : '⏸️ No'}
                          </span></div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">HLS.js Standard</h4>
                        <div className="space-y-1 text-sm">
                          <div>Type: <span className="font-mono">{tripleMetrics.hlsjsPlayer.playerType}</span></div>
                          <div>Load Time: <span className="font-mono">{tripleMetrics.hlsjsPlayer.loadTime}ms</span></div>
                          <div>Current Time: <span className="font-mono">{tripleMetrics.hlsjsPlayer.currentTime.toFixed(2)}s</span></div>
                          <div>Buffer: <span className="font-mono">{tripleMetrics.hlsjsPlayer.buffered.toFixed(1)}s</span></div>
                          <div>Bitrate: <span className="font-mono">{tripleMetrics.hlsjsPlayer.bitrate > 0 ? (tripleMetrics.hlsjsPlayer.bitrate / 1000).toFixed(0) + 'kbps' : 'N/A'}</span></div>
                          <div>Playing: <span className={`font-medium ${tripleMetrics.hlsjsPlayer.isPlaying ? 'text-green-600' : 'text-gray-600'}`}>
                            {tripleMetrics.hlsjsPlayer.isPlaying ? '▶️ Yes' : '⏸️ No'}
                          </span></div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">HLS.js ABR</h4>
                        <div className="space-y-1 text-sm">
                          <div>Type: <span className="font-mono">{tripleMetrics.autoPlayer.playerType}</span></div>
                          <div>Load Time: <span className="font-mono">{tripleMetrics.autoPlayer.loadTime}ms</span></div>
                          <div>Current Time: <span className="font-mono">{tripleMetrics.autoPlayer.currentTime.toFixed(2)}s</span></div>
                          <div>Buffer: <span className="font-mono">{tripleMetrics.autoPlayer.buffered.toFixed(1)}s</span></div>
                          <div>Bitrate: <span className="font-mono">{tripleMetrics.autoPlayer.bitrate > 0 ? (tripleMetrics.autoPlayer.bitrate / 1000).toFixed(0) + 'kbps' : 'N/A'}</span></div>
                          <div>Playing: <span className={`font-medium ${tripleMetrics.autoPlayer.isPlaying ? 'text-green-600' : 'text-gray-600'}`}>
                            {tripleMetrics.autoPlayer.isPlaying ? '▶️ Yes' : '⏸️ No'}
                          </span></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white p-2 rounded">
                          <div className="font-medium text-gray-700">Max Sync Diff</div>
                          <div className="text-lg font-mono text-blue-600">
                            {Math.max(
                              Math.abs(tripleMetrics.nativePlayer.currentTime - tripleMetrics.hlsjsPlayer.currentTime),
                              Math.abs(tripleMetrics.hlsjsPlayer.currentTime - tripleMetrics.autoPlayer.currentTime),
                              Math.abs(tripleMetrics.nativePlayer.currentTime - tripleMetrics.autoPlayer.currentTime)
                            ).toFixed(3)}s
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="font-medium text-gray-700">Load Time Range</div>
                          <div className="text-lg font-mono text-blue-600">
                            {Math.max(tripleMetrics.nativePlayer.loadTime, tripleMetrics.hlsjsPlayer.loadTime, tripleMetrics.autoPlayer.loadTime) - 
                             Math.min(tripleMetrics.nativePlayer.loadTime, tripleMetrics.hlsjsPlayer.loadTime, tripleMetrics.autoPlayer.loadTime)}ms
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="font-medium text-gray-700">Buffer Range</div>
                          <div className="text-lg font-mono text-blue-600">
                            {(Math.max(tripleMetrics.nativePlayer.buffered, tripleMetrics.hlsjsPlayer.buffered, tripleMetrics.autoPlayer.buffered) - 
                             Math.min(tripleMetrics.nativePlayer.buffered, tripleMetrics.hlsjsPlayer.buffered, tripleMetrics.autoPlayer.buffered)).toFixed(1)}s
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="font-medium text-gray-700">Bitrate Range</div>
                          <div className="text-lg font-mono text-blue-600">
                            {Math.max(tripleMetrics.nativePlayer.bitrate, tripleMetrics.hlsjsPlayer.bitrate, tripleMetrics.autoPlayer.bitrate) > 0 ?
                             ((Math.max(tripleMetrics.nativePlayer.bitrate, tripleMetrics.hlsjsPlayer.bitrate, tripleMetrics.autoPlayer.bitrate) - 
                               Math.min(tripleMetrics.nativePlayer.bitrate, tripleMetrics.hlsjsPlayer.bitrate, tripleMetrics.autoPlayer.bitrate)) / 1000).toFixed(0) + 'kbps'
                             : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-yellow-800 text-sm">
                      🔄 Initializing triple comparison players... Metrics will appear once all players are loaded.
                    </div>
                  </div>
                )}
                
                {/* Stream Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Stream Name:</span>
                      <p className="text-gray-600">{selectedStream.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Resolution:</span>
                      <p className="text-gray-600">{selectedStream.resolution}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-600">{selectedStream.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Source:</span>
                      <p className="text-gray-600">{selectedStream.source}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="text-gray-600">{selectedStream.description}</p>
                  </div>
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">URL:</span>
                    <p className="text-xs font-mono text-gray-500 break-all bg-white p-2 rounded border">
                      {selectedStream.url}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">🔄</div>
                  <h3 className="text-lg font-medium mb-2">选择一个测试流开始对比</h3>
                  <p className="text-sm">从上方的流选择器中选择一个HLS流进行原生HLS与HLS.js的并排对比测试</p>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}