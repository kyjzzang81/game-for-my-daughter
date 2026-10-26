import type { Page } from '../scenes/StoryScene';
import type { Actor } from '../ui';
import { H, IMG } from '../ui';
import { sfx, tone } from '../audio/sfx';

const ONBED = 0.19;  // 침대 위에 누운 위치(아래에서부터 화면 비율)
const BED = { size: 216 };

/* 사라지기(꿀꺽!) */
function gulp(a: Actor) {
  a.scene.tweens.killTweensOf(a.inner);
  a.scene.tweens.add({ targets: a.inner, scale: 0, duration: 400 });
  sfx.pop();
}
/* 할머니로 변장한 늑대 (그림이 있으면 변장 그림, 없으면 모자를 얹어요) */
function nightcap(w: Actor) {
  if (IMG['🐺👒']) { w.setEmoji('🐺👒'); return; }
  w.setEmoji('🐺'); w.prop('👒', -0.05, -1.15, 0.6);
}
/* 늑대 모습 바꾸기. 그 그림이 없으면 그대로 둬요 */
function pose(w: Actor, key: string, flip = false) {
  if (IMG[key]) w.setEmoji(key, flip);
  return w;
}
/* 늑대가 왼쪽을 보며 얼굴을 크게 들이밀고 꿀꺽! 끝나면 원래 모습으로 */
function wolfGulp(w: Actor, gulpKey: string, backKey: string, victim: Actor, then: () => void) {
  const s = w.scene;
  w.anim('none');
  pose(w, gulpKey);
  s.tweens.add({ targets: w.inner, scale: 1.35, duration: 250, ease: 'Back.easeOut' });
  tone(150, 0.6, 'sawtooth', -50);
  s.time.delayedCall(350, () => {
    gulp(victim);
    s.time.delayedCall(700, () => {
      s.tweens.add({ targets: w.inner, scale: 1, duration: 300, ease: 'Sine.easeOut' });
      if (IMG[backKey]) w.setEmoji(backKey); else if (backKey === '🐺👒') nightcap(w);
      then();
    });
  });
}

/* 침대에 누워 자는 늑대 (그림이 없으면 침대 위 늑대 이모지) */
function sleepingWolf(s: Parameters<Page['play']>[0]) {
  return IMG['🐺쿨쿨'] ? s.actor('🐺쿨쿨', 0.47, ONBED - 0.02, { size: 190 }) : s.actor('🐺', 0.52, ONBED, { size: 173 });
}

export const HOOD: Page[] = [
  {
    who: 'mom',
    text: '빨간 두건이 잘 어울리는 아이가 있었어요. 모두 이 아이를 <b>빨간 모자</b>라고 불렀지요. 엄마가 말했어요. "할머니가 편찮으시대. 맛있는 빵과 과자를 가져다 드리렴."',
    hint: '👆 바구니에 담을 음식을 눌러요!',
    afterWho: ['mom', 'girl'], after: '"숲에서는 딴 데 가지 말고 길로만 가야 한다!" "네, 엄마!"',
    play: (s, done) => {
      s.actor('👩', 0.08, 0.14);
      const g = s.girl(0.28, 0.14);
      const basket = s.actor('🧺', 0.48, 0.14, { size: 80 });
      const names: Record<string, string> = { '🍞': '빵', '🍪': '과자', '🧁': '컵케이크' };
      s.tapItems([['🍞', 0.62, 0.4], ['🍪', 0.78, 0.52], ['🧁', 0.86, 0.32]],
        (_, e) => { g.anim('happy'); basket.anim('happy'); s.bubble(g, `${names[e]} 담았다!`, 1400, 'girl'); },
        () => s.delay(1600, done));
    },
  },
  {
    who: 'wolf',
    text: '빨간 모자가 콧노래를 부르며 숲길을 걷는데, 덤불 뒤에서 <b>늑대</b>가 불쑥 나왔어요. "얘, 어디 가는 길이니?"',
    hint: '👆 빨간 모자를 눌러서 대답해요!',
    after: '빨간 모자는 엄마와 한 약속을 그만 잊어버렸어요.',
    play: (s, done) => {
      s.forest();
      const g = s.girl(0.16, 0.12).anim('tapme');
      const w = s.actor('🐺', 0.62, 0.14);
      g.tap(() => {
        g.untap().anim('none'); sfx.tap();
        s.lines([[g, '할머니 댁에 가요! 할머니가 아프시대요.', 'girl'], [w, '그럼 꽃을 꺾어 가렴. 할머니가 아주 기뻐하실걸?', 'wolf'], [g, '우아, 그거 좋겠다!', 'girl']], done);
      });
    },
  },
  {
    text: '빨간 모자는 길을 벗어나 <b>꽃</b>을 꺾기 시작했어요.',
    hint: '👆 꽃을 눌러서 꽃다발을 만들어요!',
    after: '그 사이에 늑대는 빠른 길로 할머니 댁까지 먼저 달려갔어요!',
    play: (s, done) => {
      s.forest();
      const g = s.girl(0.4, 0.12);
      const w = s.actor('🐺', 0.6, 0.14, { flip: true });
      let first = true;
      s.tapItems([['🌷', 0.08, 0.58], ['🌼', 0.26, 0.48], ['🌸', 0.68, 0.5], ['🌻', 0.84, 0.58]],
        () => {
          g.anim('happy');
          s.bubble(g, ['예쁘다!', '향기 좋아!', '와아!'][Math.random() * 3 | 0], 1200, 'girl');
          if (first) { first = false; s.showBubble(w, '헉헉! 히히히~', 1200); w.walkTo(1.2, 1600, 'Quad.easeIn'); }
        },
        () => { g.prop('💐', 0.55, -0.4, 0.6); s.delay(1200, done); });
    },
  },
  {
    who: 'wolf',
    text: '늑대가 문을 두드리며 목소리를 바꿔 말했어요. "할머니, 빨간 모자 왔어요~"',
    hint: '👆 문을 세 번 똑똑 두드려요!',
    after: '늑대는 할머니를 꿀꺽 삼키고, 할머니 잠옷과 모자를 쓰고 이불 속에 숨었어요.',
    play: (s, done) => {
      s.room();
      s.actor('🛏️', 0.48, 0.08, BED);
      const gm = s.actor('👵', 0.54, ONBED);
      const door = s.actor('🚪', 0.24, 0.12, { size: 160 }).anim('tapme');
      const w = s.actor('🐺', 0.04, 0.14, { flip: true });
      let n = 0;
      door.tap(() => {
        if (n >= 3) return;
        n++; sfx.knock(); s.showBubble(door, '똑똑!', 700); door.anim('shake');
        if (n < 3) return;
        door.untap();
        s.lines([[gm, '빨간 모자구나! 문 열려 있단다~', 'grandma']], () => {
          // 침대 옆으로 돌아가서, 왼쪽(할머니 쪽)을 보고 꿀꺽
          w.walkTo(0.7, 1400);
          s.delay(1500, () => {
            pose(w, '🐺');
            s.lines([[gm, '앗, 늑대다!', 'grandma'], [w, '꿀꺽!', 'wolf']]);
            s.delay(1800, () => wolfGulp(w, '🐺꿀꺽', '🐺', gm, () => {
              s.delay(400, () => {
                w.walkTo(0.54);
                s.tweens.add({ targets: w, y: H * (1 - ONBED), duration: 1000, ease: 'Sine.easeInOut' });
                nightcap(w);
                s.delay(1000, done);
              });
            }));
          });
        });
      });
    },
  },
  {
    text: '빨간 모자가 할머니 댁에 왔어요. 그런데 할머니 모습이 좀 이상해요!',
    hint: '👆 반짝이는 걸 눌러서 물어봐요!',
    after: '늑대는 빨간 모자까지 꿀꺽! 배가 빵빵해진 늑대는 드르렁 잠이 들었어요.',
    play: (s, done) => {
      s.room();
      s.actor('🛏️', 0.48, 0.08, BED);
      const w = s.actor('🐺', 0.54, ONBED);
      nightcap(w);
      const g = s.girl(0.12, 0.12);
      const QA = [
        ['👂', '할머니, 귀가 왜 이렇게 커요?', '네 말소리를 더 잘 들으려고 그렇지~'],
        ['👀', '할머니, 눈은 왜 이렇게 커요?', '너를 더 잘 보려고 그렇지~'],
        ['👄', '할머니, 입은 왜 이렇게 커요?', '너를 한입에 먹으려고 그렇지!'],
      ];
      const btns = QA.map(([e], i) => s.item(e, 0.14 + i * 0.16, 0.44).setAlpha(0.35));
      const ask = (i: number) => {
        const b = btns[i].setAlpha(1).anim('tapme');
        b.tap(() => {
          b.untap().anim('none'); sfx.tap();
          s.lines([[g, QA[i][1], 'girl'], [w, QA[i][2], 'wolf']], () => {
            if (i < 2) return ask(i + 1);
            s.lines([[w, '꿀꺽!', 'wolf']]);
            s.delay(600, () => wolfGulp(w, '🐺👒꿀꺽', '🐺👒', g, () => s.delay(600, done)));
          });
        });
      };
      ask(0);
    },
  },
  {
    who: 'man',
    text: '숲을 지나던 <b>사냥꾼</b>이 엄청 큰 코 고는 소리를 들었어요. "할머니 댁에서 웬 소리지? 가 봐야겠어!"',
    hint: '👆 ✂️ 가위를 눌러서 늑대 배를 조심조심 열어요!',
    after: '빨간 모자와 할머니가 늑대 배 속에서 무사히 나왔어요!',
    play: (s, done) => {
      s.room();
      s.actor('🛏️', 0.48, 0.08, BED);
      const w = sleepingWolf(s);
      s.showBubble(w, '드르렁~ 쿨쿨 💤', 99999);
      s.actor('🤠', 0.06, 0.12);
      const sc = s.item('✂️', 0.34, 0.4).anim('tapme');
      let n = 0;
      sc.tap(() => {
        if (n >= 3) return;
        n++; tone(1200, 0.08, 'square', -400); s.showBubble(sc, '싹둑!', 600); w.anim('shake');
        if (n < 3) return;
        sc.untap().anim('none').setAlpha(0);
        s.sparkle(...w.center());
        const g = s.girl(0.34, 0.12).anim('happy'), gm = s.actor('👵', 0.78, 0.12).anim('happy');
        s.lines([[g, '휴, 이제 살았다!', 'girl'], [gm, '사냥꾼 아저씨, 정말 고마워요!', 'grandma']], done);
      });
    },
  },
  {
    text: '세 사람은 늑대 배 속에 무거운 <b>돌멩이</b>를 채워 넣었어요.',
    hint: '👆 돌멩이를 눌러요!',
    after: '잠에서 깬 늑대는 허둥지둥 달아나다 쿵! 넘어져서 다시는 오지 않았대요.',
    play: (s, done) => {
      s.room();
      s.actor('🛏️', 0.48, 0.08, BED);
      const w = sleepingWolf(s);
      const snore = s.showBubble(w, '드르렁~ 💤', 99999);
      s.actor('🤠', 0.02, 0.1); s.girl(0.14, 0.1); s.actor('👵', 0.26, 0.1);
      s.tapItems([['🪨', 0.36, 0.4], ['🪨', 0.82, 0.3], ['🪨', 0.88, 0.52]],
        i => {
          // 돌이 들어갈 때마다 배가 점점 불러요
          tone(120, 0.2, 'square', -40);
          pose(w, `🐺배${i + 1}`);
          const k = 1 + 0.04 * (i + 1);   // 그림이 바뀌는 것에 더해 조금씩 더 커져요
          s.tweens.add({ targets: w.inner, scaleY: { from: k * 0.9, to: k }, scaleX: { from: k * 1.08, to: k }, duration: 450, ease: 'Back.easeOut' });
        },
        () => s.delay(700, () => s.lines([[w, '아이고 배야! 왜 이렇게 무겁지?', 'wolf']], () => {
          // 잠에서 깨 일어나, 무거운 배를 안고 오른쪽으로 허둥지둥
          snore.destroy();
          w.y = H * 0.86;
          w.anim('none').setEmoji(IMG['🐺무거워'] ? '🐺무거워' : '🐺', true).walkTo(0.64, 2400, 'Quad.easeIn');
          s.delay(2300, () => {
            s.tweens.add({ targets: w.inner, angle: 90, duration: 500 });
            tone(90, 0.5, 'square', -40); s.showBubble(w, '쿵!', 1200); s.delay(1000, done);
          });
        })));
    },
  },
  {
    who: 'girl',
    text: '"이제 숲에서는 길로만 다닐게요!" 빨간 모자는 할머니, 사냥꾼 아저씨와 함께 활짝 웃었어요. 끝!',
    hint: '👆 화면을 눌러서 축하해요!',
    after: '참 잘했어요! 🎉 우리도 길을 갈 때 한눈팔지 않기로 약속해요!',
    play: (s, done) => {
      s.room();
      ([['🍞', 0.34], ['🍪', 0.42], ['💐', 0.5]] as const).forEach(([e, l]) => s.actor(e, l, 0.34, { size: 64 }));
      [s.girl(0.22, 0.1), s.actor('👵', 0.46, 0.1), s.actor('🤠', 0.68, 0.1)].forEach((p, i) => p.anim('dance', i * 200));
      let n = 0;
      s.tapAnywhere((x, y) => { sfx.yay(); s.sparkle(x, y, '🎉⭐🎈💖🌷'); if (++n === 3) done(); });
    },
  },
];
