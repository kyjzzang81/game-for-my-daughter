import Phaser from 'phaser';
import { IMG, markLoaded } from '../ui';
import { loadVoices } from '../audio/voice';

interface Manifest { files: Record<string, string>; emoji: Record<string, string> }
let manifest: Manifest = { files: {}, emoji: {} };

/* 게임을 만들기 전에 그림·대사 목록을 받아 둬요 (main.ts에서 기다려요) */
export async function loadManifests() {
  const imgs = fetch('assets/img/manifest.json').then(r => (r.ok ? r.json() : manifest)).catch(() => manifest);
  [manifest] = await Promise.all([imgs, loadVoices()]);
}

/* 점토 그림을 미리 불러와요. 목록에 있는 그림만 쓰고, 없는 건 이모지·직접 그린 그림으로 대신해요 */
export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    Object.entries(manifest.files).forEach(([name, file]) => this.load.image(`img-${name}`, `assets/img/${file}`));
  }

  create() {
    Object.keys(manifest.files).forEach(name => { if (this.textures.exists(`img-${name}`)) markLoaded(name); });
    Object.entries(manifest.emoji).forEach(([emoji, name]) => { if (this.textures.exists(`img-${name}`)) IMG[emoji] = `img-${name}`; });
    this.scene.start('home');
  }
}
