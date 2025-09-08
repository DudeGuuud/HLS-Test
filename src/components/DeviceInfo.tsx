'use client';

import { useEffect, useState } from 'react';
import Hls from 'hls.js';

interface DeviceInfoState {
  browser: string;
  version: string;
  os: string;
  isMobile: boolean;
  isTablet: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  hlsSupported: boolean;
  mseSupported: boolean;
  nativeHlsSupported: boolean;
  screenSize: string;
  pixelRatio: number;
  connectionType: string;
  userAgent: string;
  viewportSize: string;
}

export default function DeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoState | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent;
      
      // Browser detection
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const isChrome = /chrome/i.test(ua) && !/edge/i.test(ua);
      const isFirefox = /firefox/i.test(ua);
      const isEdge = /edge/i.test(ua);
      
      // OS detection
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isAndroid = /Android/.test(ua);
      const isMac = /Mac/.test(ua);
      const isWindows = /Win/.test(ua);
      const isLinux = /Linux/.test(ua);
      
      let os = 'Unknown';
      if (isIOS) os = 'iOS';
      else if (isAndroid) os = 'Android';
      else if (isMac) os = 'macOS';
      else if (isWindows) os = 'Windows';
      else if (isLinux) os = 'Linux';
      
      // Device type detection
      const isMobile = /Mobi|Android/i.test(ua);
      const isTablet = /Tablet|iPad/i.test(ua);
      
      // Browser version extraction
      let browser = 'Unknown';
      let version = 'Unknown';
      
      if (isSafari) {
        browser = 'Safari';
        const match = ua.match(/Version\/([0-9._]+)/);
        version = match ? match[1] : 'Unknown';
      } else if (isChrome) {
        browser = 'Chrome';
        const match = ua.match(/Chrome\/([0-9.]+)/);
        version = match ? match[1] : 'Unknown';
      } else if (isFirefox) {
        browser = 'Firefox';
        const match = ua.match(/Firefox\/([0-9.]+)/);
        version = match ? match[1] : 'Unknown';
      } else if (isEdge) {
        browser = 'Edge';
        const match = ua.match(/Edge\/([0-9.]+)/);
        version = match ? match[1] : 'Unknown';
      }
      
      // HLS support detection
      const video = document.createElement('video');
      const nativeHlsSupported = video.canPlayType('application/vnd.apple.mpegurl') !== '';
      const hlsSupported = Hls.isSupported();
      const mseSupported = 'MediaSource' in window;
      
      // Connection info
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string; type?: string }; mozConnection?: { effectiveType?: string; type?: string }; webkitConnection?: { effectiveType?: string; type?: string } }).connection || (navigator as Navigator & { mozConnection?: { effectiveType?: string; type?: string } }).mozConnection || (navigator as Navigator & { webkitConnection?: { effectiveType?: string; type?: string } }).webkitConnection;
      const connectionType = connection ? connection.effectiveType || connection.type || 'Unknown' : 'Unknown';
      
      // Screen info
      const screenSize = `${screen.width}x${screen.height}`;
      const viewportSize = `${window.innerWidth}x${window.innerHeight}`;
      const pixelRatio = window.devicePixelRatio;
      
      setDeviceInfo({
        browser,
        version,
        os,
        isMobile,
        isTablet,
        isSafari,
        isChrome,
        isFirefox,
        isEdge,
        hlsSupported,
        mseSupported,
        nativeHlsSupported,
        screenSize,
        pixelRatio,
        connectionType,
        userAgent: ua,
        viewportSize
      });
    };

    detectDevice();
    
    // Update viewport size on resize
    const handleResize = () => {
      setDeviceInfo(prev => prev ? {
        ...prev,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`
      } : null);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!deviceInfo) return null;

  const getSupportIcon = (supported: boolean) => (
    <span className={`inline-block w-2 h-2 rounded-full ${supported ? 'bg-green-500' : 'bg-red-500'}`}></span>
  );

  return (
    <div className="bg-gray-900 text-white rounded-lg p-4 mb-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📱 Device & Browser Information
        </h3>
        <span className="text-sm text-gray-400">
          {isExpanded ? '🔼 Hide' : '🔽 Show'}
        </span>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-400 border-b border-gray-700 pb-1">Browser</h4>
              <div className="text-sm space-y-1">
                <div>Name: <span className="text-green-400">{deviceInfo.browser}</span></div>
                <div>Version: <span className="text-green-400">{deviceInfo.version}</span></div>
                <div>OS: <span className="text-green-400">{deviceInfo.os}</span></div>
                <div>Device: <span className="text-green-400">
                  {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}
                </span></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-400 border-b border-gray-700 pb-1">Display</h4>
              <div className="text-sm space-y-1">
                <div>Screen: <span className="text-green-400">{deviceInfo.screenSize}</span></div>
                <div>Viewport: <span className="text-green-400">{deviceInfo.viewportSize}</span></div>
                <div>Pixel Ratio: <span className="text-green-400">{deviceInfo.pixelRatio}x</span></div>
                <div>Connection: <span className="text-green-400">{deviceInfo.connectionType}</span></div>
              </div>
            </div>
          </div>
          
          {/* HLS Support */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-400 border-b border-gray-700 pb-1">Video Support</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {getSupportIcon(deviceInfo.nativeHlsSupported)}
                <span>Native HLS</span>
                <span className="text-xs text-gray-400">
                  ({deviceInfo.nativeHlsSupported ? 'Supported' : 'Not Supported'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getSupportIcon(deviceInfo.hlsSupported)}
                <span>HLS.js</span>
                <span className="text-xs text-gray-400">
                  ({deviceInfo.hlsSupported ? `v${Hls.version}` : 'Not Supported'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getSupportIcon(deviceInfo.mseSupported)}
                <span>MediaSource</span>
                <span className="text-xs text-gray-400">
                  ({deviceInfo.mseSupported ? 'Supported' : 'Not Supported'})
                </span>
              </div>
            </div>
          </div>
          
          {/* Recommended Strategy */}
          <div className="bg-gray-800 p-3 rounded border-l-4 border-blue-500">
            <h4 className="text-sm font-medium text-blue-400 mb-1">Recommended Playback Strategy</h4>
            <div className="text-sm text-gray-300">
              {deviceInfo.isSafari && deviceInfo.nativeHlsSupported ? (
                <span className="text-green-400">✓ Use Native Safari HLS support for best performance</span>
              ) : deviceInfo.hlsSupported ? (
                <span className="text-green-400">✓ Use HLS.js for cross-browser compatibility</span>
              ) : (
                <span className="text-red-400">⚠️ Limited video support - consider fallback options</span>
              )}
            </div>
          </div>
          
          {/* User Agent (collapsed by default) */}
          <details className="text-xs">
            <summary className="text-gray-400 cursor-pointer hover:text-white">User Agent String</summary>
            <div className="mt-2 p-2 bg-gray-800 rounded font-mono break-all">
              {deviceInfo.userAgent}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}