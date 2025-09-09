'use client';

import { useState } from 'react';
import { TEST_STREAMS, STREAM_CATEGORIES, type StreamConfig, type StreamCategory } from '@/data/test-streams';

interface StreamSelectorProps {
  onStreamSelect: (stream: StreamConfig) => void;
  selectedStream: StreamConfig | null;
}

export default function StreamSelector({ onStreamSelect, selectedStream }: StreamSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<StreamCategory>(STREAM_CATEGORIES.ALL);
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const filteredStreams = TEST_STREAMS.filter(stream => {
    if (selectedCategory === STREAM_CATEGORIES.ALL) return true;
    if (selectedCategory === STREAM_CATEGORIES.VOD) return stream.type === 'VOD';
    if (selectedCategory === STREAM_CATEGORIES.LIVE) return stream.type === 'LIVE';
    if (selectedCategory === STREAM_CATEGORIES.LOW_RES) {
      return stream.resolution.includes('240p') || stream.resolution.includes('360p');
    }
    if (selectedCategory === STREAM_CATEGORIES.HIGH_RES) {
      return stream.resolution.includes('4K') || stream.resolution.includes('UHD') || stream.resolution.includes('1080p');
    }
    if (selectedCategory === STREAM_CATEGORIES.MOBILE) {
      return stream.resolution.includes('240p') || stream.resolution.includes('360p') || stream.resolution.includes('480p');
    }
    return true;
  });

  const handleCustomStreamLoad = () => {
    if (customUrl.trim()) {
      const customStream: StreamConfig = {
        name: 'Custom Stream',
        url: customUrl.trim(),
        description: 'User provided stream URL',
        resolution: 'Unknown',
        type: 'VOD',
        source: 'Custom'
      };
      onStreamSelect(customStream);
      setShowCustomInput(false);
    }
  };

  const getCategoryIcon = (category: StreamCategory) => {
    switch (category) {
      case STREAM_CATEGORIES.ALL: return '🎬';
      case STREAM_CATEGORIES.VOD: return '📹';
      case STREAM_CATEGORIES.LIVE: return '🔴';
      case STREAM_CATEGORIES.LOW_RES: return '📱';
      case STREAM_CATEGORIES.HIGH_RES: return '🖥️';
      case STREAM_CATEGORIES.MOBILE: return '📲';
      default: return '🎬';
    }
  };

  const getCategoryLabel = (category: StreamCategory) => {
    switch (category) {
      case STREAM_CATEGORIES.ALL: return 'All Streams';
      case STREAM_CATEGORIES.VOD: return 'VOD Only';
      case STREAM_CATEGORIES.LIVE: return 'Live Only';
      case STREAM_CATEGORIES.LOW_RES: return 'Low Resolution';
      case STREAM_CATEGORIES.HIGH_RES: return 'High Resolution';
      case STREAM_CATEGORIES.MOBILE: return 'Mobile Optimized';
      default: return 'All Streams';
    }
  };

  const getStreamTypeIcon = (type: 'VOD' | 'LIVE') => {
    return type === 'LIVE' ? '🔴' : '📹';
  };

  const getResolutionColor = (resolution: string) => {
    if (resolution.includes('4K') || resolution.includes('UHD')) return 'text-purple-400';
    if (resolution.includes('1080p')) return 'text-blue-400';
    if (resolution.includes('720p')) return 'text-green-400';
    if (resolution.includes('480p')) return 'text-yellow-400';
    if (resolution.includes('240p') || resolution.includes('360p')) return 'text-orange-400';
    return 'text-gray-400';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">🎥 Test Stream Selector</h2>
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="group relative px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium text-sm rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out"
        >
          <span className="flex items-center gap-2">
            {showCustomInput ? (
              <>
                <span className="text-red-200">✕</span>
                Cancel
              </>
            ) : (
              <>
                <span className="text-yellow-200 group-hover:animate-pulse">🎯</span>
                Custom URL
              </>
            )}
          </span>
          <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
        </button>
      </div>

      {/* Custom URL Input */}
      {showCustomInput && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-medium text-gray-900 mb-2">Custom Stream URL</h3>
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/stream.m3u8"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCustomStreamLoad}
              disabled={!customUrl.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              Load
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Enter any HLS (.m3u8) stream URL to test custom content
          </p>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 mb-2">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {Object.values(STREAM_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {getCategoryIcon(category)} {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Stream List */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">
          Available Streams ({filteredStreams.length})
        </h3>
        {filteredStreams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No streams found for the selected category.</p>
            <button
              onClick={() => setSelectedCategory(STREAM_CATEGORIES.ALL)}
              className="mt-2 text-blue-600 hover:text-blue-700 underline"
            >
              Show all streams
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredStreams.map((stream, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedStream?.url === stream.url
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onStreamSelect(stream)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getStreamTypeIcon(stream.type)}</span>
                      <h4 className="font-medium text-gray-900">{stream.name}</h4>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {stream.source}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{stream.description}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className={`font-medium ${getResolutionColor(stream.resolution)}`}>
                        📺 {stream.resolution}
                      </span>
                      <span className="text-gray-500">
                        🏷️ {stream.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedStream?.url === stream.url && (
                      <span className="text-green-600 text-sm">✓ Selected</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(stream.url);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Copy URL"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Stream Info */}
      {selectedStream && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-1">Currently Selected Stream</h4>
          <p className="text-sm text-green-700">{selectedStream.name}</p>
          <p className="text-xs text-green-600 font-mono break-all">{selectedStream.url}</p>
        </div>
      )}
    </div>
  );
}