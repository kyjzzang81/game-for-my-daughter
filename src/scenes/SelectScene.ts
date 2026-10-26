import Phaser from 'phaser';
import { W, H, txt, backdrop, iconButton, tex } from '../ui';
import { sfx, tone } from '../audio/sfx';
import { say } from '../audio/voice';
import { playMusic } from '../audio/music';
import { UI_LINES } from '../stories/ui-lines';
import { HOOD } from '../stories/hood';
import { PIGS } from '../stories/pigs';
import { SUNMOON } from '../stories/sunmoon';

export class SelectScene extends Phaser.Scene {
  constructor() { super('select'); }

  create() {
    backdrop(this);
    playMusic('meadow');
    iconButton(this, 52, 52, '🏠', 'btn-home', () => { sfx.tap(); this.scene.start('home'); });
    txt(this, W / 2, H * 0.17, '어떤 이야기를 볼까?', 52).setOrigin(0.5).setShadow(0, 4, '#ffffff', 0, false, true);

    this.card(W / 2 - 290, 'cover-pigs', '🐷🐺', '아기 돼지 삼형제', 'play', () => this.scene.start('story', { pages: PIGS }));
    this.card(W / 2, 'cover-hood', '👧🧺', '빨간 모자', 'play', () => this.scene.start('story', { pages: HOOD }));
    this.card(W / 2 + 290, 'cover-sunmoon', '☀️🌙', '해님 달님', 'play', () => this.scene.start('story', { pages: SUNMOON }));
  }

  /* 표지 그림 (없으면 이모지) */
  private cover(name: string, art: string, maxW: number, maxH: number) {
    const t = tex(name);
    if (!t) return txt(this, 0, 0, art, 80).setOrigin(0.5);
    const img = this.add.image(0, 0, t);
    return img.setScale(Math.min(maxW / img.width, maxH / img.height));
  }

  private card(x: number, cover: string, art: string, name: string, kind: 'play' | 'lock', onClick: () => void) {
    const w = 260, h = 300, y = H * 0.6;
    const g = this.add.graphics()
      .fillStyle(0x000000, 0.13).fillRoundedRect(-w / 2, -h / 2 + 10, w, h, 32)
      .fillStyle(0xfffaf0).fillRoundedRect(-w / 2, -h / 2, w, h, 32);
    if (kind === 'play') g.lineStyle(6, 0xff9fb8).strokeRoundedRect(-w / 2, -h / 2, w, h, 32);
    const tag = txt(this, 0, -h / 2, kind === 'play' ? '⭐ 놀이 가능' : '🔒 곧 만나요', 16).setOrigin(0.5);
    const tw = tag.width + 28, th = tag.height + 4;
    const tagBg = this.add.graphics().fillStyle(0x000000, 0.13).fillRoundedRect(-tw / 2, -h / 2 - th / 2 + 3, tw, th, th / 2)
      .fillStyle(0xffffff).fillRoundedRect(-tw / 2, -h / 2 - th / 2, tw, th, th / 2);
    const c = this.add.container(x, y, [
      g, this.cover(cover, art, w - 28, 196).setPosition(0, -34), txt(this, 0, 108, name, 30).setOrigin(0.5), tagBg, tag,
    ]).setSize(w, h).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => { if (kind === 'play') sfx.pop(); onClick(); });
    if (kind === 'lock') c.setAlpha(0.6);
    // 3초마다 살짝 흔들어서 눌러 보고 싶게
    else this.tweens.chain({ targets: c, loop: -1, tweens: [
      { angle: 0, duration: 2700 }, { angle: -3, duration: 90 }, { angle: 3, duration: 90 }, { angle: 0, duration: 120 },
    ] });
  }
}
