'use client';

import { useState, useCallback } from 'react';
import HLSPlayer from '@/components/HLSPlayer';
import ComparisonPlayer from '@/components/ComparisonPlayer';
import DeviceInfo from '@/components/DeviceInfo';
import StreamSelector from '@/components/StreamSelector';
import TestControlPanel from '@/components/TestControlPanel';
import { TEST_STREAMS, type StreamConfig } from '@/data/test-streams';

export default function Home() {
  const [selectedStream, setSelectedStream] = useState<StreamConfig | null>(null);
  const [playerErrors, setPlayerErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single');
  const [comparisonMetrics, setComparisonMetrics] = useState<{
    nativePlayer: { playerType: string; loadTime: number; currentTime: number; buffered: number; isPlaying: boolean };
    hlsjsPlayer: { playerType: string; loadTime: number; currentTime: number; buffered: number; isPlaying: boolean };
  } | null>(null);

  const handleStreamSelect = useCallback((stream: StreamConfig) => {
    setSelectedStream(stream);
    setPlayerErrors([]);
  }, []);

  const handlePlayerError = useCallback((error: Error | string | { message?: string; details?: string }) => {
    const errorMessage = typeof error === 'string' ? error : 
      ('message' in error ? error.message : undefined) || ('details' in error ? error.details : undefined) || 'Unknown player error';
    setPlayerErrors(prev => [...prev.slice(0, 4), errorMessage]);
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleLoadComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleComparisonMetrics = useCallback((metrics: {
    nativePlayer: { playerType: string; loadTime: number; currentTime: number; buffered: number; isPlaying: boolean };
    hlsjsPlayer: { playerType: string; loadTime: number; currentTime: number; buffered: number; isPlaying: boolean };
  }) => {
    setComparisonMetrics(metrics);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              📺
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                HLS Safari Compatibility Test
              </h1>
              <p className="text-gray-600 mt-1">
                专业的HLS.js在Safari浏览器下的兼容性测试工具
              </p>
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm">
              <div className={`w-2 h-2 rounded-full ${selectedStream ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-gray-700">
                {selectedStream ? `播放: ${selectedStream.name}` : '未选择流'}
              </span>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>加载中...</span>
              </div>
            )}
            {playerErrors.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>发现 {playerErrors.length} 个错误</span>
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

          {/* Video Player Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                🎬 Video Player
              </h2>
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">View:</span>
                  <button
                    onClick={() => setViewMode('single')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      viewMode === 'single'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📱 Single
                  </button>
                  <button
                    onClick={() => setViewMode('comparison')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      viewMode === 'comparison'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🔄 Compare
                  </button>
                </div>
                
                {selectedStream && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{selectedStream.type}</span> • {selectedStream.resolution}
                  </div>
                )}
              </div>
            </div>

            {selectedStream ? (
              <div className="space-y-4">
                {viewMode === 'single' ? (
                  <HLSPlayer
                    src={selectedStream.url}
                    title={selectedStream.name}
                    className="w-full max-w-4xl mx-auto"
                    onError={handlePlayerError}
                    onLoadStart={handleLoadStart}
                    onLoadComplete={handleLoadComplete}
                  />
                ) : (
                  <ComparisonPlayer
                    src={selectedStream.url}
                    title={selectedStream.name}
                    className="w-full"
                    onMetricsUpdate={handleComparisonMetrics}
                  />
                )}
                
                {/* Stream metadata / Comparison Info */}
                {viewMode === 'single' ? (
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
                ) : comparisonMetrics ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-800 mb-3">🔄 Comparison Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">Safari Native</h4>
                        <div className="space-y-1 text-sm">
                          <div>Type: <span className="font-mono">{comparisonMetrics.nativePlayer.playerType}</span></div>
                          <div>Load Time: <span className="font-mono">{comparisonMetrics.nativePlayer.loadTime}ms</span></div>
                          <div>Current Time: <span className="font-mono">{comparisonMetrics.nativePlayer.currentTime.toFixed(2)}s</span></div>
                          <div>Buffer: <span className="font-mono">{comparisonMetrics.nativePlayer.buffered.toFixed(1)}s</span></div>
                          <div>Playing: <span className={`font-medium ${comparisonMetrics.nativePlayer.isPlaying ? 'text-green-600' : 'text-gray-600'}`}>
                            {comparisonMetrics.nativePlayer.isPlaying ? '▶️ Yes' : '⏸️ No'}
                          </span></div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">HLS.js</h4>
                        <div className="space-y-1 text-sm">
                          <div>Type: <span className="font-mono">{comparisonMetrics.hlsjsPlayer.playerType}</span></div>
                          <div>Load Time: <span className="font-mono">{comparisonMetrics.hlsjsPlayer.loadTime}ms</span></div>
                          <div>Current Time: <span className="font-mono">{comparisonMetrics.hlsjsPlayer.currentTime.toFixed(2)}s</span></div>
                          <div>Buffer: <span className="font-mono">{comparisonMetrics.hlsjsPlayer.buffered.toFixed(1)}s</span></div>
                          <div>Playing: <span className={`font-medium ${comparisonMetrics.hlsjsPlayer.isPlaying ? 'text-green-600' : 'text-gray-600'}`}>
                            {comparisonMetrics.hlsjsPlayer.isPlaying ? '▶️ Yes' : '⏸️ No'}
                          </span></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-2 rounded">
                          <div className="font-medium text-gray-700">Sync Difference</div>
                          <div className="text-lg font-mono text-blue-600">
                            {Math.abs(comparisonMetrics.nativePlayer.currentTime - comparisonMetrics.hlsjsPlayer.currentTime).toFixed(3)}s
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="font-medium text-gray-700">Load Time Diff</div>
                          <div className="text-lg font-mono text-blue-600">
                            {Math.abs(comparisonMetrics.nativePlayer.loadTime - comparisonMetrics.hlsjsPlayer.loadTime)}ms
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="font-medium text-gray-700">Buffer Diff</div>
                          <div className="text-lg font-mono text-blue-600">
                            {Math.abs(comparisonMetrics.nativePlayer.buffered - comparisonMetrics.hlsjsPlayer.buffered).toFixed(1)}s
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-yellow-800 text-sm">
                      🔄 Initializing comparison players... Metrics will appear once both players are loaded.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">📺</div>
                  <h3 className="text-lg font-medium mb-2">选择一个测试流开始播放</h3>
                  <p className="text-sm">从上方的流选择器中选择一个HLS流进行兼容性测试</p>
                </div>
              </div>
            )}

            {/* Error display */}
            {playerErrors.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium text-red-700">播放错误记录</h3>
                {playerErrors.map((error, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 text-sm">❌</span>
                      <div className="flex-1">
                        <p className="text-sm text-red-700">{error}</p>
                        <p className="text-xs text-red-600 mt-1">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setPlayerErrors([])}
                  className="text-sm text-red-600 hover:text-red-700 underline"
                >
                  清除错误记录
                </button>
              </div>
            )}
          </div>

          {/* Test Control Panel */}
          <TestControlPanel 
            currentStream={selectedStream?.url || null}
          />

          {/* Quick Test Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ⚡ 快速测试
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEST_STREAMS.slice(0, 6).map((stream, index) => (
                <button
                  key={index}
                  onClick={() => handleStreamSelect(stream)}
                  className={`p-4 text-left border rounded-lg hover:shadow-md transition-all ${
                    selectedStream?.url === stream.url
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">{stream.name}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {stream.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{stream.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-blue-600">📺 {stream.resolution}</span>
                    <span className="text-gray-500">• {stream.source}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-gray-600 text-sm">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="mb-2">
                🧪 <strong>HLS Safari Compatibility Test Tool</strong>
              </p>
              <p>
                基于 <a href="https://github.com/video-dev/hls.js" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">HLS.js</a> 构建
                • 使用 <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Next.js</a> 和 <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Tailwind CSS</a> 开发
              </p>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                <span>📱 移动端适配</span>
                <span>🌐 跨浏览器兼容</span>
                <span>🔧 实时测试工具</span>
                <span>📊 详细诊断信息</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}