import Phaser from 'phaser';
import { W, H, txt, backdrop, pillButton, visual, fitCamera, iconButton, pin } from '../ui';
import { sfx, unlockAudio } from '../audio/sfx';
import { say } from '../audio/voice';
import { playMusic } from '../audio/music';
import { UI_LINES } from '../stories/ui-lines';

export class HomeScene extends Phaser.Scene {
  constructor() { super('home'); }

  create() {
    fitCamera(this);
    backdrop(this);
    ['🐰', '🐷1', '🐻'].forEach((e, i) => {
      const t = visual(this, e, 100).setPosition(W / 2 + (i - 1) * 130, H * 0.36);
      this.tweens.add({ targets: t, y: t.y - 10, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 300 });
    });
    const title = txt(this, W / 2, H * 0.47, '동화 놀이터', 110, '#ff7aa2').setOrigin(0.5).setShadow(0, 6, '#ffffff', 0, false, true);
    this.tweens.add({ targets: title, y: title.y - 10, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    txt(this, W / 2, H * 0.62, '이야기 속으로 놀러 가요!', 30).setOrigin(0.5);
    pillButton(this, W / 2, H * 0.78, '▶ 시작하기', () => {
      unlockAudio(); sfx.pop(); playMusic('meadow'); say(UI_LINES.pick);
      this.scene.start('select');
    });
    // 만든 사람 이야기·후원 (들어가면 어른 확인을 먼저 해요). 아이 눈에 덜 띄게 구석에 작게
    pin(iconButton(this, 0, 0, '💌', 'btn-about', () => { sfx.tap(); this.scene.start('about'); }, 56), 1, 0, 48, 48);
  }
}
