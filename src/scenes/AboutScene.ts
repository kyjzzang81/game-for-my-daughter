import Phaser from 'phaser';
import { W, H, txt, backdrop, iconButton, fitCamera, pin } from '../ui';
import { sfx } from '../audio/sfx';
import { TIPS, canTip, loadPrices, buyTip } from '../tips';

const STORY = [
  '안녕하세요! 저는 2023년 3월에 태어난 딸의 아빠예요.',
  '',
  '밤마다 아이와 동화책을 읽다가, 이야기 속에 함께 들어가 놀 수 있으면 좋겠다는 마음으로 이 게임을 만들었어요.',
  '',
  '광고도, 잠긴 이야기도 없어요. 모든 이야기는 처음부터 끝까지 무료예요.',
  '',
  '아이와 즐겁게 노셨다면 커피 한 잔으로 응원해 주세요. 새 이야기를 만드는 데 큰 힘이 돼요.',
].join('\n');

/* 만든 사람 이야기와 후원. 아이가 결제하지 않도록 들어오기 전에 어른 확인(곱셈 문제)을 거쳐요 */
export class AboutScene extends Phaser.Scene {
  constructor() { super('about'); }

  create() {
    fitCamera(this);
    backdrop(this);
    pin(iconButton(this, 52, 52, '🏠', 'btn-home', () => { sfx.tap(); this.scene.start('home'); }), 0, 0, 52, 52);
    this.gate(() => this.content());
  }

  /* ── 어른 확인 ── */
  private gate(onPass: () => void) {
    const layer = this.add.container(0, 0);
    const ask = () => {
      layer.removeAll(true);
      const a = Phaser.Math.Between(6, 9), b = Phaser.Math.Between(3, 9), answer = a * b;
      const choices = new Set([answer]);
      while (choices.size < 4) choices.add(answer + Phaser.Math.Between(-12, 12) || answer + 1);
      const panel = this.add.graphics()
        .fillStyle(0x000000, 0.13).fillRoundedRect(W / 2 - 360, H / 2 - 230 + 10, 720, 460, 40)
        .fillStyle(0xfffaf0).fillRoundedRect(W / 2 - 360, H / 2 - 230, 720, 460, 40);
      layer.add([
        panel,
        txt(this, W / 2, H / 2 - 170, '🔒 어른만 들어갈 수 있어요', 40).setOrigin(0.5),
        txt(this, W / 2, H / 2 - 105, '보호자분, 아래 문제의 답을 눌러 주세요', 26, '#8a6a5e').setOrigin(0.5),
        txt(this, W / 2, H / 2 - 20, `${a} × ${b} = ?`, 72, '#ff7aa2').setOrigin(0.5),
      ]);
      Phaser.Utils.Array.Shuffle([...choices]).forEach((n, i) => {
        const x = W / 2 + (i - 1.5) * 160, y = H / 2 + 120;
        const bg = this.add.graphics().fillStyle(0xd9a92a).fillRoundedRect(-65, -40 + 6, 130, 80, 24).fillStyle(0xffd65c).fillRoundedRect(-65, -40, 130, 80, 24);
        const c = this.add.container(x, y, [bg, txt(this, 0, -2, String(n), 44).setOrigin(0.5)]).setSize(130, 80)
          .setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            if (n === answer) { sfx.pop(); layer.destroy(true); onPass(); return; }
            sfx.tap();
            this.tweens.add({ targets: layer, x: { from: -12, to: 12 }, duration: 60, yoyo: true, repeat: 3, onComplete: () => { layer.x = 0; ask(); } });
          });
        layer.add(c);
      });
    };
    ask();
  }

  /* ── 만든 사람 이야기 + 후원 ── */
  private content() {
    const card = (x: number, y: number, w: number, h: number) => this.add.graphics()
      .fillStyle(0x000000, 0.13).fillRoundedRect(x, y + 10, w, h, 36)
      .fillStyle(0xfffaf0).fillRoundedRect(x, y, w, h, 36);

    // 왼쪽: 만든 사람 이야기
    card(90, 110, 600, 540);
    txt(this, 390, 160, '💌 만든 사람 이야기', 40, '#ff7aa2').setOrigin(0.5);
    txt(this, 130, 215, STORY, 25).setAlign('left').setLineSpacing(6)
      .setWordWrapWidth(520, true);

    // 오른쪽: 커피 한 잔 후원
    card(730, 110, 460, 540);
    txt(this, 960, 160, '☕ 커피 한 잔 사 주기', 40, '#ff7aa2').setOrigin(0.5);
    const note = txt(this, 960, 600, '후원해도 바뀌는 건 없어요.\n마음이 내킬 때만 해 주세요 🙂', 20, '#8a6a5e').setOrigin(0.5);

    const buttons = TIPS.map((t, i) => {
      const y = 260 + i * 110;
      const bg = this.add.graphics().fillStyle(0xd9a92a).fillRoundedRect(-190, -42 + 6, 380, 84, 42).fillStyle(0xffd65c).fillRoundedRect(-190, -42, 380, 84, 42);
      const label = txt(this, -160, -2, `${t.emoji} ${t.name}`, 28).setOrigin(0, 0.5);
      const price = txt(this, 160, -2, t.fallback, 28, '#8a5a2e').setOrigin(1, 0.5);
      const c = this.add.container(960, y, [bg, label, price]).setSize(380, 84).setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => this.tip(t.id, note));
      return { t, c, price };
    });

    if (!canTip()) {
      buttons.forEach(b => b.c.setAlpha(0.5).disableInteractive());
      note.setText('후원은 아이폰·아이패드 앱에서 할 수 있어요');
      return;
    }
    loadPrices().then(prices => buttons.forEach(b => {
      if (prices[b.t.id]) b.price.setText(prices[b.t.id]);
      else b.c.setAlpha(0.5).disableInteractive();   // 스토어에서 상품을 못 찾으면 누를 수 없게
    }));
  }

  private busy = false;
  private async tip(id: string, note: Phaser.GameObjects.Text) {
    if (this.busy) return;
    this.busy = true;
    sfx.pop();
    note.setText('결제 창을 여는 중이에요…');
    const status = await buyTip(id);
    this.busy = false;
    if (!this.scene.isActive()) return;
    if (status === 'success') {
      note.setText('고마워요! 💛 덕분에 새 이야기를 만들 수 있어요');
      for (let i = 0; i < 24; i++) {
        const h = txt(this, Phaser.Math.Between(760, 1160), 640, Phaser.Utils.Array.GetRandom(['💛', '☕', '⭐', '💖']), 34).setOrigin(0.5);
        this.tweens.add({ targets: h, y: Phaser.Math.Between(120, 400), alpha: 0, duration: 1600, delay: i * 40, onComplete: () => h.destroy() });
      }
    } else if (status === 'pending') note.setText('승인을 기다리고 있어요. 승인되면 처리돼요');
    else if (status === 'cancelled') note.setText('괜찮아요! 즐겁게 놀아 주는 것만으로도 고마워요 🙂');
    else note.setText('결제가 되지 않았어요. 잠시 뒤에 다시 해 주세요');
  }
}
