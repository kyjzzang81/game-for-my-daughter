import Phaser from 'phaser';
import { W, H } from './ui';
import { BootScene, loadManifests } from './scenes/BootScene';
import { HomeScene } from './scenes/HomeScene';
import { SelectScene } from './scenes/SelectScene';
import { StoryScene } from './scenes/StoryScene';

import '@fontsource/jua';

// 한글 글꼴은 글자 묶음별 파일로 나뉘어 있어요. 캔버스는 글꼴이 늦게 와도 다시 그려 주지 않으니,
// 앱에 들어 있는 Jua 묶음을 시작할 때 모두 불러 둬요
await Promise.all([...document.fonts].filter(f => f.family.includes('Jua')).map(f => f.load().catch(() => {})));

await loadManifests();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  dom: { createContainer: true },
  width: W,
  height: H,
  backgroundColor: '#bfe8ff',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, HomeScene, SelectScene, StoryScene],
});

// 개발 중에는 콘솔에서 game으로 장면을 살펴볼 수 있어요
if (import.meta.env.DEV) (window as any).game = game;
