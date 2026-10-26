import Phaser from 'phaser';
import type { Page, StoryScene } from '../scenes/StoryScene';
import { W, H, IMG, tex, visual, type Actor } from '../ui';
import { talk } from '../audio/voice';
import { sfx, tone } from '../audio/sfx';

/* ---------- 집 그림 (부분별로 톡톡 나타나요) ---------- */
type Mat = 'straw' | 'wood' | 'brick';
const MAT: Record<Mat, { wall: number; line: number; roof: number; door: number }> = {
  straw: { wall: 0xf3d36b, line: 0xd6a93a, roof: 0xe8b93f, door: 0xc98a2e },
  wood: { wall: 0xc98b52, line: 0x8f5a2b, roof: 0x9c5d2e, door: 0x6b3d1c },
  brick: { wall: 0xd9573f, line: 0xfbe3d3, roof: 0x7a4b8c, door: 0x5a3a2e },
};

/* 집. 점토 집 그림이 있으면 그림을 아래에서부터 네 번에 나눠 드러내고,
   없으면 예전 SVG(220×200) 좌표대로 벽·지붕·문·창문을 그려요. 기준점은 집의 아래 가운데 */
class House extends Phaser.GameObjects.Container {
  parts: Phaser.GameObjects.Container[] = [];
  private img?: Phaser.GameObjects.Image;
  private shown = 0;

  constructor(s: StoryScene, m: Mat, left: number, full: boolean, scale: number) {
    super(s, W * left, H * 0.86);
    const t = tex(`house-${m}`);
    if (t) {
      this.img = s.add.image(0, 0, t).setOrigin(0.5, 1);
      this.img.setScale((360 * scale) / this.img.width);
      this.add(this.img);
      if (!full) this.reveal(0);
    } else {
      this.drawParts(s, m, full);
      this.setScale(1.45 * scale);
    }
    s.add.existing(this);
    s.stage.add(this);
  }

  /* 아래에서부터 n/4만큼 보이게 */
  private reveal(n: number) {
    const img = this.img!, fh = img.frame.height;
    img.setCrop(0, fh * (1 - n / 4), img.frame.width, fh * n / 4);
  }

  private drawParts(s: StoryScene, m: Mat, full: boolean) {
    const c = MAT[m];
    const part = (draw: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = s.add.graphics({ x: -110, y: -200 });
      draw(g);
      const p = s.add.container(0, 0, [g]);
      if (!full) p.setScale(0.3).setAlpha(0);
      this.add(p); this.parts.push(p);
    };
    part(g => {
      g.fillStyle(c.wall).fillRoundedRect(25, 95, 170, 100, 8).lineStyle(m === 'wood' ? 4 : 3, c.line);
      if (m === 'straw') for (let x = 30; x < 190; x += 14) g.lineBetween(x, 100, x + 4, 190);
      if (m === 'wood') for (let y = 115; y < 190; y += 22) g.lineBetween(25, y, 195, y);
      if (m === 'brick') for (let y = 110, r = 0; y < 190; y += 16, r++) {
        g.lineBetween(25, y, 195, y);
        for (let x = 25 + (r % 2) * 16; x < 195; x += 32) g.lineBetween(x, y, x, y + 16);
      }
    });
    part(g => {
      if (m === 'brick') g.fillStyle(0xd9573f).fillRect(150, 30, 24, 45);
      g.fillStyle(c.roof).fillTriangle(10, 105, 110, 20, 210, 105)
        .lineStyle(4, 0x000000, 0.13).strokeTriangle(10, 105, 110, 20, 210, 105);
    });
    part(g => g.fillStyle(c.door).fillRoundedRect(90, 130, 42, 65, 20).fillStyle(0xffd65c).fillCircle(122, 165, 4));
    part(g => [40, 145].forEach(x => g.fillStyle(0xbfe8ff).fillRoundedRect(x, 120, 36, 32, 6)
      .lineStyle(5, 0xffffff).strokeRoundedRect(x, 120, 36, 32, 6)));
  }

  show(i: number) {
    if (this.img) {
      this.reveal(++this.shown);
      const sy = this.img.scaleY;
      this.scene.tweens.add({ targets: this.img, scaleY: { from: sy * 0.92, to: sy }, duration: 400, ease: 'Back.easeOut' });
      return;
    }
    this.scene.tweens.add({ targets: this.parts[i], scale: 1, alpha: 1, duration: 500, ease: 'Back.easeOut' });
  }
  center(): [number, number] { return [this.x, this.y - (this.img ? this.img.displayHeight / 2 : 140 * this.scaleY)]; }
  shake() {
    const bx = this.x;
    this.scene.tweens.add({ targets: this, x: { from: bx - 10, to: bx + 10 }, duration: 60, yoyo: true, repeat: 5,
      onComplete: () => (this.x = bx) });
  }
  fly() {
    this.scene.tweens.add({ targets: this, x: this.x + W * 0.7, y: this.y - H * 0.8, angle: 720, scale: 0.2, alpha: 0, duration: 1400, ease: 'Quad.easeIn' });
  }
}

/* ---------- 공통 장면 ---------- */

/* 재료를 톡톡 눌러 집 짓기 */
function buildScene(m: Mat, emoji: string, voice: 'pig1' | 'pig2' | 'pig3'): Page['play'] {
  return (s, done) => {
    const h = new House(s, m, 0.58, false, 1);
    const pig = s.actor(`🐷${voice.slice(-1)}`, 0.1, 0.16);
    let n = 0;
    const spots: [number, number][] = [[0.22, 0.3], [0.32, 0.46], [0.78, 0.28], [0.86, 0.5]];
    spots.forEach(([l, t]) => {
      const it = s.item(emoji, l, t).anim('tapme');
      it.tap(() => {
        sfx.pop(); it.untap(); s.sparkle(...it.center());
        s.tweens.killTweensOf(it.inner);
        s.tweens.add({ targets: it.inner, scale: 0.2, y: -60, alpha: 0, duration: 500, ease: 'Quad.easeIn' });
        h.show(n++); pig.anim('happy');
        s.bubble(pig, '꿀꿀!!', 900, `${voice}L`);   // 우렁찬 꿀꿀
        if (n === 4) {
          sfx.yay(); s.sparkle(...h.center());
          talk([{ t: '다 지었다!', who: voice, onstart: s.guard(() => s.showBubble(pig, '다 지었다!')) }], true);
          done();
        }
      });
    });
  };
}

/* 늑대가 후~ 불기. strong이면 벽돌 집이라 끄떡없어요 */
function blowScene(m: Mat, strong = false): Page['play'] {
  return (s, done) => {
    const h = new House(s, m, 0.6, true, 1);
    const wolf = s.actor('🐺', 0.08, 0.18, { flip: true }).anim('tapme');
    let n = 0;
    wolf.tap(() => {
      if (n >= 3) return;
      n++; sfx.blow();
      // 볼을 빵빵하게 부풀려 힘껏 부는 모습으로 바꿨다가 돌아와요
      if (IMG['🐺후']) {
        wolf.anim('none').setEmoji('🐺후', true);
        s.tweens.add({ targets: wolf.inner, scaleX: 1.12, scaleY: 0.94, duration: 160, yoyo: true, repeat: 1 });
        s.delay(800, () => { wolf.setEmoji('🐺', true); if (n < 3) wolf.anim('tapme'); });
      }
      const [x, y] = wolf.center();
      s.bubble(wolf, '후우우~!', 900, 'wolf');
      for (let i = 0; i < 3; i++) s.delay(i * 120, () => {
        const w = visual(s, '💨', 50, !IMG['💨']).setOrigin(0.5).setPosition(x + 60, y - 40 + i * 30);
        s.stage.add(w);
        s.tweens.add({ targets: w, x: w.x + W * 0.4, alpha: 0, duration: 1000, ease: 'Quad.easeOut', onComplete: () => w.destroy() });
      });
      h.shake();
      if (n < 3) return;
      wolf.anim('none');
      s.delay(700, () => {
        if (!strong) {
          h.fly(); tone(900, 0.6, 'sine', -700);
          s.bubble(wolf, '하하하하!', 1800, 'wolf');
          s.delay(900, done);
          return;
        }
        tone(200, 0.5, 'triangle', -100);
        const pigs = [0.4, 0.58, 0.76].map((l, i) => s.actor(`🐷${i + 1}`, l, 0.08, { size: 110 }));
        const laughs = [['히히히!', 'pig1'], ['하하하!', 'pig2'], ['호호호!', 'pig3']] as const;
        // 늑대 대사 → 삼형제가 차례로 웃음
        talk([
          { t: '왜 안 날아가는 거야~~', who: 'wolf', onstart: s.guard(() => s.showBubble(wolf, '왜 안 날아가는 거야~~', 2400)) },
          ...laughs.map(([t, who], i) => ({
            t, who,
            onstart: s.guard(() => { pigs[i].anim('happy'); s.showBubble(pigs[i], t, 1200); }),
            onend: i === 2 ? s.guard(done) : undefined,
          })),
        ]);
        s.delay(9000, done); // 음성이 안 나오는 기기 대비
      });
    });
  };
}

export const PIGS: Page[] = [
  {
    text: '옛날 옛날에 <b>아기 돼지 삼형제</b>가 살았어요.',
    hint: '👆 돼지들을 눌러서 인사해요!',
    after: '"안녕!" 삼형제는 각자 집을 짓기로 했어요.',
    play: (s, done) => {
      const names = ['첫째', '둘째', '막내'];
      const met = new Set<number>();
      [0.22, 0.44, 0.66].forEach((l, i) => {
        const p: Actor = s.actor(`🐷${i + 1}`, l, 0.16, { size: 130 - i * 15 }).anim('tapme');
        const who = `pig${i + 1}` as 'pig1' | 'pig2' | 'pig3';
        p.tap(() => {
          p.anim('happy'); s.showBubble(p, '꿀꿀!', 900); met.add(i);
          const hi = `안녕! 나는 ${names[i]}야`;
          talk([{ t: '꿀꿀!', who }, {
            t: hi, who, onstart: s.guard(() => s.showBubble(p, hi)),
            onend: s.guard(() => { if (met.size === 3) done(); }),
          }]);
        });
      });
    },
  },
  { text: '첫째 돼지는 <b>지푸라기</b>로 집을 지었어요.', hint: '👆 지푸라기를 눌러요!', after: '짠! 폭신폭신 지푸라기 집 완성!',
    play: buildScene('straw', '🌾', 'pig1') },
  { text: '둘째 돼지는 <b>나무</b>로 집을 지었어요.', hint: '👆 나무를 눌러요!', after: '짠! 튼튼한 나무 집 완성!',
    play: buildScene('wood', '🪵', 'pig2') },
  { text: '막내 돼지는 <b>벽돌</b>로 집을 지었어요. 영차영차!', hint: '👆 벽돌을 눌러요!', after: '짠! 아주아주 튼튼한 벽돌 집 완성!',
    play: buildScene('brick', '🧱', 'pig3') },
  { who: 'wolf', text: '그때, 배고픈 <b>늑대</b>가 나타났어요! "지푸라기 집쯤이야!"', hint: '👆 늑대를 세 번 눌러요!',
    after: '휘이잉~ 지푸라기 집이 날아갔어요! 첫째는 둘째 집으로 도망갔어요.', play: blowScene('straw') },
  { who: 'wolf', text: '늑대가 나무 집에 왔어요. "나무 집도 문제없지!"', hint: '👆 늑대를 세 번 눌러요!',
    after: '와르르! 나무 집도 날아갔어요! 돼지들은 막내의 벽돌 집으로 달려갔어요.', play: blowScene('wood') },
  { who: 'wolf', text: '늑대가 벽돌 집에 왔어요. "후우~ 불어 볼까?"', hint: '👆 늑대를 세 번 눌러요!',
    after: '벽돌 집은 끄떡없어요! 늑대는 힘이 다 빠졌어요.', play: blowScene('brick', true) },
  {
    text: '돼지들이 다 함께 소리쳤어요. "늑대야, 저리 가!"',
    hint: '👆 돼지들을 눌러서 응원해요!',
    after: '늑대는 깜짝 놀라 멀리멀리 도망갔어요!',
    play: (s, done) => {
      new House(s, 'brick', 0.7, true, 0.8);
      const wolf = s.actor('🐺', 0.34, 0.14, { flip: true });
      let n = 0;
      [0.04, 0.14, 0.24].forEach((l, i) => {
        const p = s.actor(`🐷${i + 1}`, l, 0.1).anim('tapme');
        p.tap(() => {
          p.untap(); sfx.oink(); p.anim('happy');
          s.bubble(p, '늑대야, 저리 가!', 1600, `pig${i + 1}` as 'pig1');
          n++; wolf.walkTo(0.34 + n * 0.12, 1600, 'Quad.easeIn');
          if (n === 3) {
            s.delay(400, () => { wolf.walkTo(1.2, 1600, 'Quad.easeIn'); tone(600, 0.8, 'sine', -500); });
            s.delay(1600, done);
          }
        });
      });
    },
  },
  {
    text: '아기 돼지 삼형제는 벽돌 집에서 <b>오래오래 행복하게</b> 살았대요. 끝!',
    hint: '👆 화면을 눌러서 축하해요!',
    after: '참 잘했어요! 🎉 다음 이야기에서 또 만나요!',
    play: (s, done) => {
      new House(s, 'brick', 0.5, true, 0.9);
      [0.2, 0.4, 0.7].forEach((l, i) => s.actor(`🐷${i + 1}`, l, 0.08).anim('dance', i * 200));
      let n = 0;
      s.tapAnywhere((x, y) => { sfx.yay(); s.sparkle(x, y, '🎉⭐🎈💖🌟'); if (++n === 3) done(); });
    },
  },
];
