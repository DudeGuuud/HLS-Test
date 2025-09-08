# 🔄 HLS Safari vs HLS.js 比对模式使用指南

## 功能概述

比对模式允许您同时运行 Safari 原生 HLS 播放器和 HLS.js 播放器，实时对比它们的性能和兼容性差异。这是验证 Safari 对 HLS.js 兼容性的核心功能。

## 如何使用比对模式

### 1. 启用比对模式

1. 在主页面选择一个测试流
2. 在视频播放器区域找到 **View** 切换按钮
3. 点击 **🔄 Compare** 按钮启用比对模式

### 2. 比对窗口界面说明

#### 双播放器布局
- **左侧**: Safari Native - 使用 Safari 原生 HLS 支持
- **右侧**: HLS.js - 使用 HLS.js 库

#### 状态指示器
每个播放器都有彩色状态点：
- 🟢 绿色：正在播放
- 🔵 蓝色：已准备就绪
- 🟡 黄色：正在加载
- 🔴 红色：发生错误
- ⚫ 灰色：空闲状态

#### 同步控制按钮
- **▶️ Sync Play**: 同时播放两个播放器
- **⏸️ Sync Pause**: 同时暂停两个播放器  
- **⏮️ Sync Reset**: 同时重置到开头

## 实时指标监控

### 播放器信息覆盖层
每个播放器左上角显示：
- **Type**: 播放器类型 (native/hls.js)
- **Time**: 当前播放时间
- **Buffer**: 缓冲区剩余时间
- **State/Quality**: 播放器状态或质量信息

### 事件日志窗口
底部两个区域实时显示：
- **Safari Native Events**: Safari 播放器的事件日志
- **HLS.js Events**: HLS.js 播放器的事件日志

### 性能对比面板
显示关键性能指标：
- **Load Time**: 加载时间对比
- **Sync Difference**: 播放同步差异
- **Buffer Health**: 缓冲区健康状况

## 比对分析面板

切换到比对模式后，元数据区域会显示：

### 播放器状态对比
```
Safari Native          HLS.js
Type: native           Type: hls.js  
Load Time: 245ms       Load Time: 312ms
Current Time: 15.23s   Current Time: 15.19s
Buffer: 5.2s          Buffer: 4.8s
Playing: ▶️ Yes        Playing: ▶️ Yes
```

### 关键差异指标
- **Sync Difference**: 两个播放器的时间同步差异
- **Load Time Diff**: 初始化时间差异
- **Buffer Diff**: 缓冲区差异

## 验证兼容性的关键指标

### 1. 播放同步性
- **理想值**: < 0.5s 差异
- **问题指标**: > 2s 差异表示可能存在兼容性问题

### 2. 加载性能
- Safari 原生通常加载更快
- HLS.js 可能需要额外的初始化时间

### 3. 缓冲区管理
- 观察两个播放器的缓冲策略
- HLS.js 提供更多可调参数

### 4. 错误处理
- 对比两个播放器的错误恢复能力
- 查看事件日志了解详细错误信息

## 常见测试场景

### 1. 基础兼容性测试
```
1. 选择 Apple 官方测试流
2. 启用比对模式
3. 使用同步播放功能
4. 观察同步差异和性能指标
```

### 2. 高级特性测试
```
1. 选择 4K HDR 或杜比视界内容
2. 比对播放器对高级编码的支持
3. 检查质量切换行为
4. 监控缓冲区性能
```

### 3. 网络适应性测试
```
1. 使用多码率流
2. 模拟网络波动
3. 对比自适应码率切换
4. 分析错误恢复机制
```

## 故障排除指南

### 播放器初始化失败
- **症状**: 红色状态指示器
- **解决**: 检查浏览器兼容性，尝试其他测试流

### 同步差异过大
- **症状**: 同步差异 > 2s
- **分析**: 查看事件日志，可能是网络或解码问题

### HLS.js 播放失败
- **症状**: HLS.js 侧显示错误
- **解决**: 检查 MSE 支持，确认流格式兼容性

## 技术细节

### Safari 原生 HLS 检测
```typescript
const nativeSupport = video.canPlayType('application/vnd.apple.mpegurl');
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

if (nativeSupport && isSafari) {
  // 使用原生支持
  video.src = src;
}
```

### HLS.js 配置
```typescript
const hls = new Hls({
  debug: process.env.NODE_ENV === 'development',
  enableWorker: true,
  lowLatencyMode: true,
  backBufferLength: 90,
  maxBufferLength: 300
});
```

### 性能监控
```typescript
// 定时更新播放指标
setInterval(() => {
  updateMetrics('native', {
    currentTime: video.currentTime,
    buffered: getBufferedAmount(video),
    networkState: video.networkState,
    readyState: video.readyState
  });
}, 1000);
```

## 最佳实践

1. **测试多种流格式**: 使用不同编码、分辨率和来源的测试流
2. **监控关键事件**: 关注 manifest 解析、级别切换、错误恢复等事件
3. **记录测试结果**: 使用测试控制面板记录和导出测试数据
4. **交叉验证**: 在不同设备和网络环境下重复测试

## 预期结果

### 理想情况
- 同步差异 < 0.5s
- 两个播放器都能正常播放
- 错误恢复机制正常工作
- 性能指标相近

### 常见差异
- Safari 原生加载更快
- HLS.js 提供更详细的事件信息
- 缓冲策略可能不同
- 错误处理机制有差异

通过比对模式，您可以全面了解 Safari 和 HLS.js 的兼容性情况，为实际项目部署提供可靠的技术参考。