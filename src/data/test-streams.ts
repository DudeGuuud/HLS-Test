export interface StreamConfig {
  name: string;
  url: string;
  description: string;
  resolution: string;
  type: 'VOD' | 'LIVE';
  source: string;
}

export const TEST_STREAMS: StreamConfig[] = [
  // Apple Official Test Streams - 最可靠的测试流
  {
    name: 'Big Buck Bunny (fMP4)',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    description: 'Apple官方测试流，支持自适应码率和字幕',
    resolution: '多分辨率 (240p-1080p)',
    type: 'VOD',
    source: 'Apple'
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
    name: 'Wowza Test Stream',
    url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    description: 'Bitdash提供的Sintel测试流',
    resolution: '多分辨率',
    type: 'VOD',
    source: 'Bitdash'
  },
  {
    name: 'HLS.js Demo Stream',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Mux提供的低带宽测试流',
    resolution: '640x360',
    type: 'VOD',
    source: 'Mux'
  },
  {
    name: 'Cloudflare Stream',
    url: 'https://customer-f33zs165nr7gyfy4.cloudflarestream.com/6b9e68b07dfee8cc2d116e4c51d6a957/manifest/video.m3u8',
    description: 'Cloudflare提供的高质量测试流，支持自适应码率',
    resolution: '多分辨率 (自适应)',
    type: 'VOD',
    source: 'Cloudflare'
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