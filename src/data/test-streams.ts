export interface StreamConfig {
  name: string;
  url: string;
  description: string;
  resolution: string;
  type: 'VOD' | 'LIVE';
  source: string;
}

export const TEST_STREAMS: StreamConfig[] = [
  // Apple Test Streams
  {
    name: 'Big Buck Bunny (fMP4)',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    description: '经典测试视频，支持自适应码率',
    resolution: '多分辨率 (240p-1080p)',
    type: 'VOD',
    source: 'Apple'
  },
  {
    name: 'Sintel (高质量)',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/sintel/sintel.ism/.m3u8',
    description: 'Blender开源电影，高质量流媒体',
    resolution: '多分辨率',
    type: 'VOD',
    source: 'Unified Streaming'
  },
  {
    name: 'Tears of Steel (4K)',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    description: 'Blender开源电影，4K高质量',
    resolution: '4K UHD',
    type: 'VOD',
    source: 'Unified Streaming'
  },
  {
    name: 'Dolby Vision/Atmos (4K HDR)',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8',
    description: '支持Dolby Vision和Atmos的4K HDR内容',
    resolution: '4K (3840x2160)',
    type: 'VOD',
    source: 'Apple'
  },
  {
    name: 'MV-HEVC/UHD',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/historic_planet_content_2023-10-26-3d-video/main.m3u8',
    description: 'MV-HEVC编码的UHD内容',
    resolution: 'UHD',
    type: 'VOD',
    source: 'Apple'
  },
  // Live Streams
  {
    name: 'Akamai Test Live',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    description: 'Akamai提供的实时流测试',
    resolution: '多分辨率',
    type: 'LIVE',
    source: 'Akamai'
  },
  {
    name: 'Blender Movies 24/7',
    url: 'https://ireplay.tv/test/blender.m3u8',
    description: '24小时连续播放Blender电影的直播流',
    resolution: '原始帧率',
    type: 'LIVE',
    source: 'iReplay.TV'
  },
  // Different Quality Streams
  {
    name: 'Low Bandwidth (240p)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: '低带宽测试流，适合网络较慢的情况',
    resolution: '240p',
    type: 'VOD',
    source: 'Mux'
  },
  {
    name: 'Standard Quality (720p)',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/big_buck_bunny/big_buck_bunny.ism/.m3u8',
    description: '标准质量流，常见分辨率',
    resolution: '720p',
    type: 'VOD',
    source: 'Unified Streaming'
  },
  {
    name: 'High Quality (1080p)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: '高质量1080p视频流',
    resolution: '1080p',
    type: 'VOD',
    source: 'Google'
  }
];

export const STREAM_CATEGORIES = {
  ALL: 'all',
  VOD: 'VOD',
  LIVE: 'LIVE',
  LOW_RES: 'low_res',
  HIGH_RES: 'high_res',
  MOBILE: 'mobile'
} as const;

export type StreamCategory = typeof STREAM_CATEGORIES[keyof typeof STREAM_CATEGORIES];