import Phaser from 'phaser';

/* 기준 화면 크기. 기기 화면에는 비율을 유지한 채 맞춰져요 */
export const W = 1280, H = 720;
export const FONT = 'Jua, sans-serif';
export const INK = '#5a3a2e';

export function txt(s: Phaser.Scene, x: number, y: number, str: string, size: number, color = INK) {
  // 이모지 윗부분이 잘리지 않게 여백을 줘요
  return s.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, align: 'center', padding: { x: 4, y: size * 0.15 } });
}

/* 점토 그림 (BootScene이 채워요)
   IMG: 이모지 → 텍스처, tex(): 그림 이름(bg-meadow, btn-home …) → 텍스처 (없으면 undefined) */
export const IMG: Record<string, string> = {};
const LOADED = new Set<string>();
export const markLoaded = (name: string) => LOADED.add(name);
export const tex = (name: string) => (LOADED.has(name) ? `img-${name}` : undefined);

/* 배경. 그림이 있으면 그림, 없으면 하늘·풀밭·해·구름·꽃을 직접 그려요 */
export type Bg = 'meadow' | 'forest' | 'room';
export function backdrop(s: Phaser.Scene, kind: Bg = 'meadow') {
  const c = s.add.container();
  const t = tex(`bg-${kind}`);
  if (t) return c.add(s.add.image(0, 0, t).setOrigin(0).setDisplaySize(W, H));
  const g = s.add.graphics();
  c.add(g);
  if (kind === 'room') { g.fillStyle(0xffe9d6).fillRect(0, 0, W, H * 0.62).fillStyle(0xc99a6b).fillRect(0, H * 0.62, W, H * 0.38); return c; }
  g.fillGradientStyle(0xaee3ff, 0xaee3ff, 0xdff5ff, 0xdff5ff).fillRect(0, 0, W, H * 0.6);
  g.fillGradientStyle(0x8fd46b, 0x8fd46b, 0x6fbf4f, 0x6fbf4f).fillRect(0, H * 0.6, W, H * 0.4);

  const sun = s.add.graphics({ x: W * 0.94 - 45, y: H * 0.06 + 45 });
  sun.fillStyle(0xffe066, 0.13).fillCircle(0, 0, 73).fillStyle(0xffe066, 0.33).fillCircle(0, 0, 59).fillStyle(0xffe066).fillCircle(0, 0, 45);
  s.tweens.add({ targets: sun, scale: 1.08, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  c.add(sun);

  ([[160, 50, 0.14, 40000, 0.12], [110, 36, 0.26, 55000, 0.4]] as const).forEach(([w, h, top, dur, start]) => {
    const cl = s.add.graphics().fillStyle(0xffffff, 0.9);
    cl.fillRoundedRect(0, 0, w, h, h / 2).fillEllipse(w * 0.4, 0, w * 0.5, h * 1.6).fillEllipse(w * 0.68, h * 0.15, w * 0.35, h * 1.2);
    cl.setPosition(-W * 0.3 + start * W * 1.6, H * top);
    s.tweens.add({ targets: cl, x: W * 1.3, duration: dur * (1 - start), onComplete: () => {
      cl.x = -W * 0.3; s.tweens.add({ targets: cl, x: W * 1.3, duration: dur, repeat: -1 });
    } });
    c.add(cl);
  });

  ([['🌷', 0.06, 0.06], ['🌼', 0.2, 0.16], ['🌸', 0.86, 0.1], ['🌼', 0.66, 0.04]] as const)
    .forEach(([e, l, b]) => c.add(txt(s, W * l, H * (1 - b), e, 28).setOrigin(0, 1)));
  return c;
}

/* 누르면 쏙 들어갔다 나오는 느낌 */
function pressable(c: Phaser.GameObjects.Container, onClick: () => void) {
  const s = c.scene;
  c.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
    s.tweens.add({ targets: c, scale: 0.9, duration: 80, yoyo: true, ease: 'Quad.easeOut' });
    onClick();
  });
  return c;
}

/* 동그란 아이콘 버튼 (뒤로, 다시 듣기 등). 점토 버튼 그림이 있으면 그걸 써요 */
export function iconButton(s: Phaser.Scene, x: number, y: number, emoji: string, name: string, onClick: () => void, size = 72) {
  const c = s.add.container(x, y);
  const t = tex(name);
  if (t) c.add(s.add.image(0, 0, t).setDisplaySize(size, size));
  else c.add([s.add.graphics().fillStyle(0x000000, 0.13).fillCircle(0, 5, 32).fillStyle(0xffffff).fillCircle(0, 0, 32),
    txt(s, 0, 0, emoji, 30).setOrigin(0.5)]);
  return pressable(c.setSize(size, size), onClick);
}

/* 노란 알약 버튼 */
export function pillButton(s: Phaser.Scene, x: number, y: number, label: string, onClick: () => void) {
  const t = txt(s, 0, -4, label, 44).setOrigin(0.5);
  const w = t.width + 120, h = t.height + 40;
  const bg = tex('btn-start');
  const back = bg
    ? s.add.image(0, 0, bg).setDisplaySize(w * 1.12, h * 1.5)
    : s.add.graphics().fillStyle(0xd9a92a).fillRoundedRect(-w / 2, -h / 2 + 8, w, h, h / 2).fillStyle(0xffd65c).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  return pressable(s.add.container(x, y, [back, t]).setSize(w, h), onClick);
}

/* 이모지를 그림으로: 점토 그림이 있으면 그림, 없으면 이모지 글자.
   '🐷1'처럼 뒤에 숫자를 붙여 같은 이모지의 다른 그림(첫째 돼지 등)을 고를 수 있어요 */
export function visual(s: Phaser.Scene, emoji: string, size: number, flip = false): Phaser.GameObjects.Text | Phaser.GameObjects.Image {
  const key = IMG[emoji];
  if (!key) return txt(s, 0, 0, emoji.replace(/[0-9]/g, ''), size).setOrigin(0.5, 1).setFlipX(flip);
  const img = s.add.image(0, 0, key).setOrigin(0.5, 1).setFlipX(flip);
  // 그림은 여백을 잘라 둬서, 이모지 글자와 비슷한 크기의 상자에 맞춰 넣어요
  const box = size * 1.4;
  return img.setScale(Math.min(box / img.height, (box * 1.3) / img.width));
}

/* 등장인물·소품 하나. 바깥 컨테이너는 자리(아래 가운데 기준), 안쪽(inner)은 통통·흔들 애니메이션 담당.
   나중에 이미지가 생기면 label 대신 이미지를 넣으면 돼요. */
export type Anim = 'tapme' | 'happy' | 'shake' | 'dance' | 'none';
export class Actor extends Phaser.GameObjects.Container {
  inner: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text | Phaser.GameObjects.Image;
  size: number;

  constructor(s: Phaser.Scene, emoji: string, left: number, y: number, size: number, flip = false) {
    super(s, 0, y);
    this.size = size;
    this.label = visual(s, emoji, size, flip);
    this.inner = s.add.container(0, 0, [this.label]);
    this.add(this.inner);
    this.x = W * left + this.boxW / 2;
  }

  get boxW() { return this.label.displayWidth; }
  get boxH() { return this.label.displayHeight; }
  get isImage() { return this.label instanceof Phaser.GameObjects.Image; }
  /* 화면 좌표 기준 가운데 (반짝이 효과 위치용) */
  center(): [number, number] { return [this.x, this.y - this.boxH / 2]; }

  tap(fn: () => void) {
    this.label.setInteractive({ useHandCursor: true }).on('pointerdown', fn);
    return this;
  }
  untap() { this.label.disableInteractive(); return this; }

  setEmoji(e: string, flip = false) {
    const next = visual(this.scene, e, this.size, flip);
    if (this.label.input) next.setInteractive({ useHandCursor: true });
    this.label.listeners('pointerdown').forEach(fn => next.on('pointerdown', fn));
    this.inner.replace(this.label, next, true);
    this.label = next;
    return this;
  }

  /* 머리 위 모자, 손에 든 꽃다발처럼 덧붙이는 소품 (dx, dy는 크기에 대한 비율) */
  prop(emoji: string, dx: number, dy: number, scale: number) {
    const p = visual(this.scene, emoji, this.size * scale).setPosition(this.size * dx, this.size * dy).setOrigin(0.5);
    this.inner.add(p);
    return p;
  }

  anim(kind: Anim, delay = 0) {
    const t = this.scene.tweens, i = this.inner;
    t.killTweensOf(i);
    i.setScale(1).setAngle(0).setPosition(0, 0);
    const ease = 'Sine.easeInOut';
    if (kind === 'tapme') t.add({ targets: i, scale: 1.14, angle: -4, duration: 550, yoyo: true, repeat: -1, ease });
    if (kind === 'happy') t.add({ targets: i, y: -40, duration: 250, yoyo: true, repeat: 1, ease });
    if (kind === 'shake') t.add({ targets: i, x: { from: -10, to: 10 }, duration: 60, yoyo: true, repeat: 5, onComplete: () => (i.x = 0) });
    if (kind === 'dance') {
      i.setAngle(-10);
      t.add({ targets: i, angle: 10, y: -24, duration: 400, yoyo: true, repeat: -1, ease, delay });
    }
    return this;
  }

  /* 왼쪽 위치(화면 비율)로 걸어가요 */
  walkTo(left: number, duration = 1000, ease = 'Sine.easeInOut') {
    this.scene.tweens.add({ targets: this, x: W * left + this.boxW / 2, duration, ease });
    return this;
  }
}
