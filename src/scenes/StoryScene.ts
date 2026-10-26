import Phaser from 'phaser';
import { W, H, INK, txt, backdrop, iconButton, tex, Actor, type Bg } from '../ui';
import { say, talk, stopTalk, type Who, type Line } from '../audio/voice';
import { sfx } from '../audio/sfx';

/* 이야기 한 장면. play 안에서 상호작용이 끝나면 done()을 불러요 */
export interface Page {
  who?: Who;
  text: string;
  hint?: string;
  after?: string;
  afterWho?: Who | Who[];
  play: (s: StoryScene, done: () => void) => void;
}

const STORY_CSS = 'max-width:860px;width:max-content;box-sizing:border-box;background:#fffdf5ee;border-radius:28px;padding:16px 28px;'
  + `font:34px/1.4 Jua,sans-serif;color:${INK};text-align:center;box-shadow:0 6px 0 #0001;word-break:keep-all;pointer-events:none`;

interface ActorOpts { flip?: boolean; size?: number; top?: number }
type Spot = [emoji: string, left: number, top: number];

export class StoryScene extends Phaser.Scene {
  private pages: Page[] = [];
  private idx = 0;
  private gen = 0;                 // 장면이 바뀌면 늘어나서, 지난 장면의 늦은 콜백을 막아요
  private curWho: Who | Who[] = 'narr';
  private curText = '';
  stage!: Phaser.GameObjects.Container;
  private bgLayer!: Phaser.GameObjects.Container;
  private bgKind?: Bg;
  private story!: Phaser.GameObjects.DOMElement;
  private hint!: Phaser.GameObjects.Container;
  private hintText!: Phaser.GameObjects.Text;
  private dots: Phaser.GameObjects.Arc[] = [];
  private nextBtn!: Phaser.GameObjects.Container;

  constructor() { super('story'); }

  init(data: { pages: Page[] }) { this.pages = data.pages; this.idx = 0; }

  create() {
    this.bgLayer = this.add.container();
    this.stage = this.add.container();

    // 이야기 글은 <b> 강조를 쓰려고 캔버스 대신 HTML로 그려요
    this.story = this.add.dom(W / 2, 92, 'div', STORY_CSS).setOrigin(0.5, 0);

    this.hintText = txt(this, 0, 0, '', 26).setOrigin(0.5);
    this.hint = this.add.container(W / 2, 0, [this.add.graphics(), this.hintText]);
    this.tweens.add({ targets: this.hintText, y: -10, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.dots = this.pages.map((_, i) =>
      this.add.circle(W / 2 + (i - (this.pages.length - 1) / 2) * 28, 37, 9, 0xffffff, 0.5).setStrokeStyle(3, 0xffffff));

    iconButton(this, 52, 52, '⬅️', 'btn-back', () => { sfx.tap(); stopTalk(); this.scene.start('select'); });
    iconButton(this, W - 52, 52, '🔊', 'btn-sound', () => { sfx.tap(); say(this.curText, this.curWho); });

    const nt = tex('btn-next');
    const nb = nt ? [this.add.image(0, 0, nt).setDisplaySize(124, 124)]
      : [this.add.graphics().fillStyle(0xd9748f).fillCircle(0, 8, 55).fillStyle(0xff9fb8).fillCircle(0, 0, 55), txt(this, 0, 0, '➜', 56, '#ffffff').setOrigin(0.5)];
    this.nextBtn = this.add.container(W - 84, H - 90, nb)
      .setSize(118, 118).setInteractive({ useHandCursor: true }).setVisible(false)
      .on('pointerdown', () => {
        sfx.pop(); this.idx++;
        if (this.idx < this.pages.length) this.runPage(); else { stopTalk(); this.scene.start('select'); }
      });
    this.tweens.add({ targets: this.nextBtn, scale: 1.14, angle: -4, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.events.once('shutdown', () => { this.gen++; stopTalk(); });
    this.runPage();
  }

  private setStory(text: string, who: Who | Who[], queue = false) {
    this.curText = text; this.curWho = who;
    const node = this.story.node as HTMLElement;
    node.innerHTML = text.replace(/<b>/g, '<b style="color:#e8577e">');
    this.story.updateSize();
    this.hint.y = 92 + node.offsetHeight + 40;
    say(text, who, queue);
  }

  private setHint(text?: string) {
    this.hint.setVisible(!!text);
    if (!text) return;
    this.hintText.setText(text);
    const w = this.hintText.width + 44, h = this.hintText.height + 8;
    (this.hint.list[0] as Phaser.GameObjects.Graphics).clear().fillStyle(0xffffff).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  }

  private runPage() {
    const p = this.pages[this.idx];
    const gen = ++this.gen;
    this.time.removeAllEvents();
    this.killDeep(this.stage);
    this.stage.removeAll(true);
    this.nextBtn.setVisible(false);
    this.setBg('meadow');   // 장면에서 forest()·room()을 부르면 바뀌어요
    this.dots.forEach((d, i) => d.setFillStyle(i <= this.idx ? 0xffd65c : 0xffffff, i <= this.idx ? 1 : 0.5));
    this.setStory(p.text, p.who ?? 'narr');
    this.setHint(p.hint);

    let finished = false;
    p.play(this, () => {
      if (finished || gen !== this.gen) return;
      finished = true;
      this.setHint();
      if (p.after) this.setStory(p.after, p.afterWho ?? p.who ?? 'narr', true);
      this.delay(600, () => this.nextBtn.setVisible(true));
    });
  }

  private killDeep(o: Phaser.GameObjects.GameObject) {
    this.tweens.killTweensOf(o);
    if (o instanceof Phaser.GameObjects.Container) o.list.forEach(c => this.killDeep(c));
  }

  /* ---------- 장면에서 쓰는 도우미 ---------- */

  /* 지난 장면으로 넘어간 뒤에는 실행되지 않는 콜백 */
  guard<A extends unknown[]>(fn: (...a: A) => void) {
    const g = this.gen;
    return (...a: A) => { if (g === this.gen) fn(...a); };
  }

  delay(ms: number, fn: () => void) { this.time.delayedCall(ms, fn); }

  /* left·bottom은 화면 비율(0~1). top을 주면 위에서부터 위치를 잡아요 */
  actor(emoji: string, left: number, bottom: number, o: ActorOpts = {}) {
    const size = o.size ?? 130;
    const a = new Actor(this, emoji, left, 0, size, o.flip);
    a.y = o.top != null ? H * o.top + a.boxH : H * (1 - bottom);
    this.add.existing(a);
    this.stage.add(a);
    return a;
  }

  item(emoji: string, left: number, top: number, size = 80) { return this.actor(emoji, left, 0, { top, size }); }

  /* 빨간 두건을 쓴 소녀 */
  girl(left: number, bottom: number) {
    const a = this.actor('👧', left, bottom);
    if (a.isImage) return a;   // 점토 이미지에는 두건이 이미 있어요
    const s = a.size;
    const hood = this.add.graphics()
      .fillStyle(0xb82535).fillEllipse(0, -s * 0.7 + 6, s * 1.12, s * 0.98)
      .fillStyle(0xe53b4b).fillEllipse(0, -s * 0.7, s * 1.12, s * 0.98);
    a.inner.addAt(hood, 0);
    return a;
  }

  showBubble(target: Actor, text: string, ms = 1600) {
    const t = txt(this, 0, 0, text, 26).setOrigin(0.5);
    const w = t.width + 32, h = t.height + 12;
    const g = this.add.graphics().fillStyle(0x000000, 0.13).fillRoundedRect(-w / 2, -h / 2 + 4, w, h, 22)
      .fillStyle(0xffffff).fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    const x = Phaser.Math.Clamp(target.x, w / 2 + 8, W - w / 2 - 8);
    const y = Math.max(h / 2 + 8, target.y - target.boxH - h / 2 + 10);
    const b = this.add.container(x, y, [g, t]).setScale(0);
    this.stage.add(b);
    this.tweens.add({ targets: b, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.delay(ms, () => b.destroy());
  }

  /* 말풍선 + 그 목소리로 말하기 */
  bubble(target: Actor, text: string, ms = 1600, who?: Line['who'], queue = false) {
    this.showBubble(target, text, ms);
    if (who) talk([{ t: text, who }], queue);
  }

  /* 대사를 말풍선과 함께 차례로: [[대상, 대사, 목소리], ...] */
  lines(list: [Actor, string, Who][], onDone?: () => void, queue = false) {
    talk(list.map(([a, t, who], i) => ({
      t, who,
      onstart: this.guard(() => this.showBubble(a, t, 2200)),
      onend: i === list.length - 1 && onDone ? this.guard(onDone) : undefined,
    })), queue);
  }

  sparkle(x: number, y: number, chars = '⭐✨💖🌟') {
    const cs = [...chars];
    for (let i = 0; i < 10; i++) {
      const s = txt(this, x, y, cs[i % cs.length], 34).setOrigin(0.5);
      this.stage.add(s);
      this.tweens.add({
        targets: s, x: x + (Math.random() - 0.5) * 300, y: y + (Math.random() - 0.8) * 260,
        scale: 0.3, angle: 180, alpha: 0, duration: 1000, ease: 'Quad.easeOut', onComplete: () => s.destroy(),
      });
    }
  }

  /* 누를 것들을 화면에 뿌려요. 다 누르면 onAll */
  tapItems(spots: Spot[], onTap: (i: number, e: string) => void, onAll: () => void) {
    let n = 0;
    spots.forEach(([e, l, t], i) => {
      const it = this.item(e, l, t).anim('tapme');
      it.tap(() => {
        sfx.pop(); it.untap();
        this.sparkle(...it.center());
        this.tweens.killTweensOf(it.inner);
        this.tweens.add({ targets: it.inner, scale: 0.2, y: -60, alpha: 0, duration: 500, ease: 'Quad.easeIn' });
        onTap(i, e);
        if (++n === spots.length) onAll();
      });
    });
  }

  /* 화면 아무 데나 누르는 층 (마지막 축하 장면용) */
  tapAnywhere(fn: (x: number, y: number) => void) {
    const z = this.add.zone(0, 0, W, H).setOrigin(0).setInteractive();
    z.on('pointerdown', (p: Phaser.Input.Pointer) => fn(p.x, p.y));
    this.stage.add(z);
  }

  /* 배경 바꾸기 (같은 배경이면 그대로 둬서 깜빡이지 않아요) */
  setBg(kind: Bg) {
    if (this.bgKind === kind) return;
    this.bgKind = kind;
    this.killDeep(this.bgLayer);
    this.bgLayer.removeAll(true);
    this.bgLayer.add(backdrop(this, kind));
  }

  /* 숲. 숲 배경 그림이 없으면 나무를 세워요 */
  forest() {
    this.setBg('forest');
    if (tex('bg-forest')) return;
    ([[0, 0.36, '🌲'], [0.14, 0.4, '🌳'], [0.72, 0.38, '🌲'], [0.86, 0.34, '🌳']] as const)
      .forEach(([l, b, e]) => this.actor(e, l, b, { size: 150 }));
  }

  /* 할머니 댁 안. 방 배경 그림에 창문이 있어서, 그림이 없을 때만 창문을 달아요 */
  room() {
    this.setBg('room');
    if (!tex('bg-room')) this.item('🪟', 0.4, 0.34, 110);
  }
}
