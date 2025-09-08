'use client';

import { useState, useEffect } from 'react';

interface TestResult {
  streamName: string;
  url: string;
  timestamp: Date;
  status: 'success' | 'error' | 'warning';
  loadTime: number;
  errorMessage?: string;
  playerType: 'hls.js' | 'native' | 'unknown';
  quality?: string;
}

interface TestControlPanelProps {
  currentStream: string | null;
  onTestResult?: (result: TestResult) => void;
}

export default function TestControlPanel({ currentStream, onTestResult }: TestControlPanelProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [autoTestEnabled, setAutoTestEnabled] = useState(false);
  const [testNotes, setTestNotes] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Load test results from localStorage
  useEffect(() => {
    const savedResults = localStorage.getItem('hls-test-results');
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults).map((result: any) => ({
          ...result,
          timestamp: new Date(result.timestamp)
        }));
        setTestResults(parsed);
      } catch (error) {
        console.error('Failed to load test results:', error);
      }
    }
  }, []);

  // Save test results to localStorage
  useEffect(() => {
    if (testResults.length > 0) {
      localStorage.setItem('hls-test-results', JSON.stringify(testResults));
    }
  }, [testResults]);

  const runConnectivityTest = async () => {
    if (!currentStream) return;

    setIsRunningTest(true);
    const startTime = performance.now();

    try {
      const response = await fetch(currentStream, { 
        method: 'HEAD',
        mode: 'cors'
      });
      
      const loadTime = performance.now() - startTime;
      const result: TestResult = {
        streamName: 'Stream Connectivity Test',
        url: currentStream,
        timestamp: new Date(),
        status: response.ok ? 'success' : 'error',
        loadTime: Math.round(loadTime),
        errorMessage: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        playerType: 'unknown'
      };

      setTestResults(prev => [result, ...prev.slice(0, 49)]); // Keep last 50 results
      onTestResult?.(result);
    } catch (error) {
      const loadTime = performance.now() - startTime;
      const result: TestResult = {
        streamName: 'Stream Connectivity Test',
        url: currentStream,
        timestamp: new Date(),
        status: 'error',
        loadTime: Math.round(loadTime),
        errorMessage: error instanceof Error ? error.message : 'Network error',
        playerType: 'unknown'
      };

      setTestResults(prev => [result, ...prev.slice(0, 49)]);
      onTestResult?.(result);
    } finally {
      setIsRunningTest(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
    localStorage.removeItem('hls-test-results');
  };

  const exportTestResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hls-safari-test-results-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const addTestNote = () => {
    if (!testNotes.trim()) return;

    const note: TestResult = {
      streamName: '📝 Test Note',
      url: currentStream || 'N/A',
      timestamp: new Date(),
      status: 'warning',
      loadTime: 0,
      errorMessage: testNotes.trim(),
      playerType: 'unknown'
    };

    setTestResults(prev => [note, ...prev.slice(0, 49)]);
    setTestNotes('');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">🧪 Test Control Panel</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Results: {testResults.length}</span>
          <button
            onClick={() => setShowResults(!showResults)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showResults ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Test Controls */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Manual Tests */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Manual Tests</h3>
            <div className="space-y-2">
              <button
                onClick={runConnectivityTest}
                disabled={!currentStream || isRunningTest}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {isRunningTest ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Testing...
                  </>
                ) : (
                  <>🔗 Test Stream Connectivity</>
                )}
              </button>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoTest"
                  checked={autoTestEnabled}
                  onChange={(e) => setAutoTestEnabled(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autoTest" className="text-sm text-gray-700">
                  Auto-test on stream change
                </label>
              </div>
            </div>
          </div>

          {/* Test Notes */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Test Notes</h3>
            <div className="space-y-2">
              <textarea
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
                placeholder="Add test observations, device behavior, etc..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <button
                onClick={addTestNote}
                disabled={!testNotes.trim()}
                className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
              >
                📝 Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t">
          <button
            onClick={exportTestResults}
            disabled={testResults.length === 0}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
          >
            📤 Export Results
          </button>
          <button
            onClick={clearTestResults}
            disabled={testResults.length === 0}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
          >
            🗑️ Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {showResults && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 border-t pt-4">Recent Test Results</h3>
          {testResults.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No test results yet.</p>
              <p className="text-sm">Run some tests to see results here.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getStatusIcon(result.status)}</span>
                        <span className="font-medium">{result.streamName}</span>
                        <span className="text-xs opacity-75">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      {result.errorMessage && (
                        <p className="text-sm mb-1">{result.errorMessage}</p>
                      )}
                      {result.loadTime > 0 && (
                        <p className="text-xs opacity-75">
                          ⏱️ Load time: {result.loadTime}ms
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.url)}
                      className="p-1 opacity-50 hover:opacity-100 rounded"
                      title="Copy URL"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}