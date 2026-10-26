import { defineConfig } from 'vite';

// base를 상대 경로로 두어야 Capacitor(앱) 안에서도 파일을 찾을 수 있어요
export default defineConfig({ base: './' });
