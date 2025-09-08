# HLS Safari Compatibility Test - 项目技术文档

## 项目概述

HLS Safari Compatibility Test 是一个专业的 HLS (HTTP Live Streaming) 兼容性测试工具，主要用于测试 HLS.js 在 Safari 浏览器及其他浏览器环境下的兼容性。该项目基于 Next.js 15 构建，使用 TypeScript 开发，支持多种视频流格式和设备环境测试。

## 技术栈详情

### 核心技术栈
- **框架**: Next.js 15.5.2 (App Router)
- **开发语言**: TypeScript 5.x
- **UI 样式**: Tailwind CSS 4.0
- **视频播放**: HLS.js 1.6.11
- **构建工具**: Turbopack (Next.js 内置)
- **代码质量**: ESLint 9.x

### 依赖详情
```json
{
  "dependencies": {
    "@types/hls.js": "^0.13.3",
    "hls.js": "^1.6.11",
    "next": "15.5.2",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "eslint": "^9",
    "typescript": "^5"
  }
}
```

## 项目架构

### 目录结构
```
src/
├── app/                    # App Router 目录
│   ├── layout.tsx         # 根布局组件
│   ├── page.tsx           # 首页组件
│   └── globals.css        # 全局样式
├── components/            # 可复用组件
│   ├── HLSPlayer.tsx      # 核心视频播放器
│   ├── StreamSelector.tsx # 流选择器
│   ├── DeviceInfo.tsx     # 设备信息展示
│   └── TestControlPanel.tsx # 测试控制面板
└── data/
    └── test-streams.ts    # 测试流数据配置
```

### 核心组件架构

## 核心组件详解

### 1. HLSPlayer 组件 - 视频播放核心

这是整个项目的核心组件，负责 HLS 视频流的播放和兼容性处理。

#### 接口定义
```typescript
interface HLSPlayerProps {
  src: string;
  title: string;
  className?: string;
  onError?: (error: Error | { type?: string; message?: string; details?: string }) => void;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
}
```

#### 核心状态管理
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [playerInfo, setPlayerInfo] = useState<{
  currentLevel: number;
  levels: Array<{ height?: number; width?: number; bitrate?: number; name?: string }>;
  isSupported: boolean;
  isSafari: boolean;
  version: string;
} | null>(null);
```

#### Safari 检测逻辑
```typescript
const isSafari = useCallback(() => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}, []);
```

#### 播放器初始化核心逻辑
```typescript
const initializePlayer = useCallback(async () => {
  if (!videoRef.current || !src) return;

  setIsLoading(true);
  setError(null);
  onLoadStart?.();

  try {
    const video = videoRef.current;
    
    // 检测 HLS 原生支持 (Safari)
    const safari = isSafari();
    const nativeSupport = video.canPlayType('application/vnd.apple.mpegurl');
    
    if (nativeSupport && safari) {
      // 使用 Safari 原生 HLS 支持
      video.src = src;
      setPlayerInfo({
        currentLevel: -1,
        levels: [],
        isSupported: true,
        isSafari: true,
        version: 'Native Safari Support'
      });
    } else if (Hls.isSupported()) {
      // 使用 hls.js 处理其他浏览器
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

      // 事件监听器配置
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
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

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        console.log('Level switched to:', data.level);
        setPlayerInfo(prev => prev ? { ...prev, currentLevel: data.level } : null);
      });

      // 错误处理
      hls.on(Hls.Events.ERROR, (_, data) => {
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
    onError?.(err instanceof Error ? err : { message: 'Failed to initialize player' });
  } finally {
    setIsLoading(false);
  }
}, [src, onError, onLoadStart, onLoadComplete, isSafari]);
```

### 2. StreamSelector 组件 - 流选择器

负责管理和展示可用的测试流，支持分类筛选和自定义 URL 输入。

#### 核心功能实现
```typescript
export default function StreamSelector({ onStreamSelect, selectedStream }: StreamSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<StreamCategory>(STREAM_CATEGORIES.ALL);
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // 流筛选逻辑
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

  // 自定义流处理
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
}
```

### 3. DeviceInfo 组件 - 设备检测

提供详细的设备、浏览器和兼容性信息，用于诊断播放问题。

#### 设备检测核心逻辑
```typescript
const detectDevice = () => {
  const ua = navigator.userAgent;
  
  // 浏览器检测
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edge/i.test(ua);
  const isFirefox = /firefox/i.test(ua);
  const isEdge = /edge/i.test(ua);
  
  // 操作系统检测
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isMac = /Mac/.test(ua);
  const isWindows = /Win/.test(ua);
  const isLinux = /Linux/.test(ua);
  
  // HLS 支持检测
  const video = document.createElement('video');
  const nativeHlsSupported = video.canPlayType('application/vnd.apple.mpegurl') !== '';
  const hlsSupported = Hls.isSupported();
  const mseSupported = 'MediaSource' in window;
  
  // 网络连接信息
  const connection = (navigator as Navigator & { 
    connection?: { effectiveType?: string; type?: string };
    mozConnection?: { effectiveType?: string; type?: string };
    webkitConnection?: { effectiveType?: string; type?: string } 
  }).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  const connectionType = connection ? connection.effectiveType || connection.type || 'Unknown' : 'Unknown';
  
  // 屏幕信息
  const screenSize = `${screen.width}x${screen.height}`;
  const viewportSize = `${window.innerWidth}x${window.innerHeight}`;
  const pixelRatio = window.devicePixelRatio;
};
```

### 4. TestControlPanel 组件 - 测试控制面板

提供连接性测试、结果记录和导出功能。

#### 测试结果类型定义
```typescript
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
```

#### 连接性测试实现
```typescript
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

    setTestResults(prev => [result, ...prev.slice(0, 49)]);
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
```

## 数据管理

### 测试流配置

项目包含丰富的预设测试流，涵盖不同质量、格式和来源：

```typescript
export interface StreamConfig {
  name: string;
  url: string;
  description: string;
  resolution: string;
  type: 'VOD' | 'LIVE';
  source: string;
}

export const TEST_STREAMS: StreamConfig[] = [
  // Apple 官方测试流
  {
    name: 'Big Buck Bunny (fMP4)',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    description: '经典测试视频，支持自适应码率',
    resolution: '多分辨率 (240p-1080p)',
    type: 'VOD',
    source: 'Apple'
  },
  // 杜比视界/全景声内容
  {
    name: 'Dolby Vision/Atmos (4K HDR)',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8',
    description: '支持Dolby Vision和Atmos的4K HDR内容',
    resolution: '4K (3840x2160)',
    type: 'VOD',
    source: 'Apple'
  },
  // 实时流
  {
    name: 'Akamai Test Live',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    description: 'Akamai提供的实时流测试',
    resolution: '多分辨率',
    type: 'LIVE',
    source: 'Akamai'
  }
  // ... 更多测试流
];
```

### 分类系统
```typescript
export const STREAM_CATEGORIES = {
  ALL: 'all',
  VOD: 'VOD',
  LIVE: 'LIVE',
  LOW_RES: 'low_res',
  HIGH_RES: 'high_res',
  MOBILE: 'mobile'
} as const;
```

## 主页面组件架构

### 状态管理
```typescript
export default function Home() {
  const [selectedStream, setSelectedStream] = useState<StreamConfig | null>(null);
  const [playerErrors, setPlayerErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 流选择处理
  const handleStreamSelect = useCallback((stream: StreamConfig) => {
    setSelectedStream(stream);
    setPlayerErrors([]);
  }, []);

  // 错误处理
  const handlePlayerError = useCallback((error: Error | string | { message?: string; details?: string }) => {
    const errorMessage = typeof error === 'string' ? error : 
      ('message' in error ? error.message : undefined) || ('details' in error ? error.details : undefined) || 'Unknown player error';
    setPlayerErrors(prev => [...prev.slice(0, 4), errorMessage]);
  }, []);

  // 加载状态管理
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleLoadComplete = useCallback(() => {
    setIsLoading(false);
  }, []);
}
```

## 核心工作流程

### 1. 应用启动流程
1. **初始化**: Next.js 应用启动，加载全局样式和字体
2. **设备检测**: DeviceInfo 组件检测浏览器、操作系统和 HLS 支持
3. **界面渲染**: 渲染流选择器和播放器界面
4. **等待交互**: 等待用户选择测试流

### 2. 流播放流程
1. **流选择**: 用户在 StreamSelector 中选择或输入流 URL
2. **播放器配置**: HLSPlayer 根据浏览器类型选择播放策略
3. **兼容性处理**:
   - Safari: 优先使用原生 HLS 支持
   - 其他浏览器: 使用 HLS.js 库
4. **错误处理**: 监听各种播放错误并提供恢复机制
5. **状态反馈**: 实时更新播放状态和错误信息

### 3. 测试流程
1. **连接性测试**: TestControlPanel 发送 HEAD 请求测试流可达性
2. **播放测试**: 实际播放流并监控性能指标
3. **结果记录**: 记录测试结果并存储到 localStorage
4. **报告生成**: 支持导出 JSON 格式的测试报告

## HLS.js 配置优化

### 性能优化配置
```typescript
const hls = new Hls({
  debug: process.env.NODE_ENV === 'development',
  enableWorker: true,           // 启用 Web Worker
  lowLatencyMode: true,         // 低延迟模式
  backBufferLength: 90,         // 后缓冲区长度
  maxBufferLength: 300,         // 最大缓冲区长度
  maxMaxBufferLength: 600,      // 最大缓冲区限制
  capLevelOnFPSDrop: true,      // 帧率下降时限制质量
  capLevelToPlayerSize: true,   // 根据播放器大小限制质量
});
```

### 错误恢复策略
```typescript
hls.on(Hls.Events.ERROR, (_, data) => {
  if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        // 网络错误：重新开始加载
        hls.startLoad();
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        // 媒体错误：尝试恢复
        hls.recoverMediaError();
        break;
      default:
        // 其他致命错误：销毁播放器
        hls.destroy();
        break;
    }
  }
});
```

## UI/UX 设计模式

### 响应式设计
- 使用 Tailwind CSS 的响应式类名
- 支持移动端、平板和桌面设备
- 自适应视口尺寸变化

### 加载状态管理
```typescript
{isLoading && (
  <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
    <div className="text-white text-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
      <p className="text-sm">Loading {title}...</p>
    </div>
  </div>
)}
```

### 错误状态展示
```typescript
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
```

## 类型安全与代码质量

### TypeScript 类型定义
项目使用严格的 TypeScript 配置，确保类型安全：

```typescript
// 播放器属性类型
interface HLSPlayerProps {
  src: string;
  title: string;
  className?: string;
  onError?: (error: Error | { type?: string; message?: string; details?: string }) => void;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
}

// 设备信息类型
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
```

### ESLint 配置
使用严格的 ESLint 规则，禁止使用 `any` 类型，确保代码质量。

## 字幕功能实现原理

虽然项目代码中没有显式的字幕处理逻辑，但支持字幕显示的原理是：

### 1. HLS 流内嵌字幕
- Apple 测试流（如 `img_bipbop_adv_example_fmp4`）包含内嵌的 WebVTT 字幕轨道
- 杜比视界内容通常包含多语言字幕

### 2. 自动检测与处理
- **Safari 原生支持**: 自动检测并显示 HLS 流中的字幕轨道
- **HLS.js 支持**: 自动解析 manifest 中的字幕信息并处理 WebVTT 内容

### 3. 浏览器原生控件
- 字幕选择选项会自动出现在视频播放控制栏中
- 用户可以通过浏览器原生界面选择字幕语言

## 部署与构建

### 构建配置
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint"
  }
}
```

### Next.js 配置
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 使用默认配置，支持 Turbopack
};

export default nextConfig;
```

### Vercel 部署配置
```json
// vercel.json
{
  "functions": {
    "app/**/*": {
      "includeFiles": "public/**"
    }
  }
}
```

## 性能优化策略

### 1. 代码分割
- 使用 Next.js App Router 的自动代码分割
- 组件级别的懒加载

### 2. 资源优化
- Turbopack 构建优化
- 静态资源预生成
- 字体优化（Geist 字体）

### 3. HLS 播放优化
- 自适应码率选择
- 缓冲区优化配置
- 错误恢复机制

### 4. 内存管理
```typescript
useEffect(() => {
  return () => {
    // 清理 HLS 实例
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };
}, []);
```

## 兼容性支持

### 浏览器支持矩阵
- **Safari**: 原生 HLS 支持，最佳兼容性
- **Chrome/Edge**: HLS.js 支持，功能完整
- **Firefox**: HLS.js 支持，需要 MSE
- **移动浏览器**: iOS Safari 原生支持，Android Chrome 通过 HLS.js

### 设备支持
- **桌面设备**: 全功能支持
- **移动设备**: 触摸优化，原生播放控件
- **平板设备**: 响应式界面适配

## 测试策略

### 1. 自动化测试流
项目内置多种测试流，覆盖：
- 不同分辨率（240p - 4K）
- 不同编码格式（H.264, HEVC）
- 不同内容类型（VOD, Live）
- 高级特性（HDR, 杜比全景声）

### 2. 兼容性测试
- 浏览器检测和报告
- HLS 支持能力检测
- 网络条件测试
- 性能指标监控

### 3. 错误处理测试
- 网络中断恢复
- 媒体解码错误处理
- 流切换测试
- 超时处理

## 项目特色功能

### 1. 智能播放策略选择
根据浏览器类型和支持能力自动选择最优播放方案：
- Safari 优先使用原生 HLS
- 其他浏览器使用 HLS.js
- 自动错误恢复和降级

### 2. 详细的设备诊断
提供全面的设备和环境信息，帮助诊断播放问题：
- 浏览器版本检测
- HLS 支持能力分析
- 网络条件评估
- 屏幕和设备信息

### 3. 专业测试工具
内置专业的测试功能：
- 连接性测试
- 性能指标监控
- 测试结果记录和导出
- 自定义流测试支持

### 4. 用户友好的界面
- 响应式设计，适配各种设备
- 直观的错误提示和恢复机制
- 实时状态反馈
- 可折叠的详细信息面板

## 扩展性设计

### 1. 组件化架构
- 每个功能模块独立封装
- 清晰的接口定义
- 易于复用和扩展

### 2. 配置化测试流
- 测试流配置与代码分离
- 支持动态添加新的测试内容
- 分类和筛选系统

### 3. 插件化错误处理
- 标准化的错误处理接口
- 可扩展的错误恢复策略
- 详细的错误信息记录

## 总结

HLS Safari Compatibility Test 是一个技术先进、功能完善的 HLS 兼容性测试工具。它采用现代化的 React/Next.js 技术栈，结合专业的 HLS.js 视频播放库，为开发者提供了一个全面的 HLS 流媒体兼容性测试平台。

项目的核心价值在于：

1. **专业性**: 深度集成 HLS.js，提供专业级别的流媒体播放支持
2. **兼容性**: 智能适配不同浏览器环境，特别优化 Safari 体验
3. **实用性**: 内置丰富的测试流和诊断工具，满足实际测试需求
4. **可扩展性**: 组件化架构和配置化设计，易于维护和扩展

通过详细的代码分析和工作流程说明，本文档为项目的理解、维护和扩展提供了全面的技术参考。