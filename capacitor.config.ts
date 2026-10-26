import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yujeong.fairyplayground',   // App Store에 올릴 때 본인 도메인으로 바꾸세요
  appName: '동화 놀이터',
  webDir: 'dist',
  ios: { contentInset: 'never', backgroundColor: '#bfe8ff' },
};

export default config;
