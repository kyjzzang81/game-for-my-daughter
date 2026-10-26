import Phaser from 'phaser';
import { IMG, markLoaded } from '../ui';

interface Manifest { files: Record<string, string>; emoji: Record<string, string> }

/* 점토 그림을 미리 불러와요. 목록(manifest)에 있는 그림만 쓰고, 없는 건 이모지·직접 그린 그림으로 대신해요 */
export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() { this.load.json('imgs', 'assets/img/manifest.json'); }

  create() {
    const m: Manifest = this.cache.json.get('imgs') ?? { files: {}, emoji: {} };
    Object.entries(m.files).forEach(([name, file]) => this.load.image(`img-${name}`, `assets/img/${file}`));
    this.load.once('complete', () => {
      Object.keys(m.files).forEach(name => { if (this.textures.exists(`img-${name}`)) markLoaded(name); });
      Object.entries(m.emoji).forEach(([emoji, name]) => { if (this.textures.exists(`img-${name}`)) IMG[emoji] = `img-${name}`; });
      this.scene.start('home');
    });
    this.load.start();
  }
}
