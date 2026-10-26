import type { Page, StoryScene } from '../scenes/StoryScene';
import { H, IMG, type Actor } from '../ui';
import { sfx, tone } from '../audio/sfx';

/* 해님 달님 (전래동화). 아이들이 보기 편하게 엄마는 숲에 숨었다가 마지막에 다시 만나요 */

const TREE_TOP = 0.5;   // 우물가 나무 위 (아래에서부터 화면 비율)

/* 그림이 있으면 그 모습으로 바꿔요 */
function pose(a: Actor, key: string, flip = false) {
  if (IMG[key]) a.setEmoji(key, flip);
  return a;
}

/* 나무 위 오누이 */
function kidsOnTree(s: StoryScene) {
  return [s.actor('👦오빠', 0.68, TREE_TOP, { size: 100 }), s.actor('👧동생', 0.8, TREE_TOP + 0.03, { size: 90 })];
}

/* 위에서 동아줄이 스르르 내려와요 */
function dropRope(s: StoryScene, key: string, left: number, onDown: () => void) {
  const rope = s.actor(key, left, 0, { size: 260 });
  const toY = rope.y - H * 0.42;
  rope.y = -10;
  s.tweens.add({ targets: rope, y: toY, duration: 1600, ease: 'Sine.easeOut', onComplete: onDown });
  return rope;
}

export const SUNMOON: Page[] = [
  {
    who: 'tiger',
    text: '옛날 깊은 산골에 엄마와 <b>오누이</b>가 살았어요. 떡을 팔고 고개를 넘던 엄마 앞에 <b>호랑이</b>가 나타났어요. "떡 하나 주면 안 잡아먹지!"',
    hint: '👆 떡을 눌러서 호랑이에게 줘요!',
    after: '떡이 다 떨어지자 호랑이는 엄마 옷을 빼앗아 입었어요. 엄마는 숲속에 꼭꼭 숨었지요.',
    play: (s, done) => {
      s.setBg('mountain');
      const mom = s.actor('👩떡', 0.1, 0.12);
      const tiger = s.actor('🐯', 0.6, 0.12, { size: 150 });
      const eat = ['냠냠! 하나 더 주면 안 잡아먹지!', '쩝쩝! 또 하나 주면 안 잡아먹지!', '꿀꺽! 하나만 더!'];
      s.tapItems([['🍡떡', 0.25, 0.54], ['🍡떡', 0.36, 0.6], ['🍡떡', 0.46, 0.5]],   // 지문창 아래, 엄마와 호랑이 사이
        i => { tiger.anim('happy'); s.bubble(tiger, eat[i], 1800, 'tiger'); },
        () => s.delay(1800, () => s.lines([[mom, '이제 떡이 하나도 없어요!', 'mom'], [tiger, '어흥! 그럼 옷이라도 내놔라!', 'tiger']], () => {
          tone(180, 0.4, 'sawtooth', -60);
          s.tweens.add({ targets: mom, x: -200, duration: 900, ease: 'Quad.easeIn' });   // 엄마는 숲으로 숨어요
          pose(tiger, '🐯엄마옷'); tiger.anim('happy');
          s.delay(1000, done);
        })));
    },
  },
  {
    who: 'tiger',
    text: '호랑이는 엄마 옷을 입고 오누이네 집에 갔어요. "얘들아, 엄마 왔다. 문 열어라~"',
    hint: '👆 문을 눌러서 확인해요!',
    after: '오누이는 뒷문으로 살금살금 빠져나와 우물가 큰 나무 위로 올라갔어요.',
    play: (s, done) => {
      s.setBg('hanok');
      const boy = s.actor('👦오빠', 0.06, 0.1, { size: 110 }), sis = s.actor('👧동생', 0.18, 0.1, { size: 100 });
      const door = s.actor('🚪', 0.4, 0.12, { size: 170 }).anim('tapme');
      const tiger = s.actor('🐯엄마옷', 0.66, 0.1, { size: 150 });
      const QA: [Actor, string, 'boy' | 'sis', string][] = [
        [sis, '엄마 목소리가 왜 그래요?', 'sis', '추운 데서 일해서 목이 쉬었단다~'],
        [boy, '그럼 손을 보여 주세요!', 'boy', '자, 엄마 손이다~'],
        [sis, '손이 왜 이렇게 털이 숭숭 났어요?', 'sis', '일을 많이 해서 그렇단다~'],
      ];
      let n = 0;
      door.tap(() => {
        if (n >= QA.length) return;
        const [kid, q, who, a] = QA[n++];
        door.untap().anim('shake'); sfx.knock();
        if (n === 2) {   // 문틈으로 털북숭이 손이 쑥!
          const paw = s.actor('🐾', 0.47, 0.34, { size: 80 });
          s.tweens.add({ targets: paw, x: { from: paw.x + 40, to: paw.x }, duration: 400, ease: 'Back.easeOut' });
        }
        s.lines([[kid, q, who], [tiger, a, 'tiger']], () => {
          if (n < QA.length) { door.anim('tapme'); door.label.setInteractive({ useHandCursor: true }); return; }
          s.lines([[boy, '앗, 호랑이 꼬리다! 도망가자!', 'boy']], () => {
            [boy, sis].forEach(k => k.walkTo(-0.2, 1200, 'Quad.easeIn'));
            s.delay(1300, done);
          });
        });
      });
    },
  },
  {
    who: 'tiger',
    text: '호랑이가 우물을 들여다보았어요. "얘들아, 우물 속에 숨었니?"',
    hint: '👆 나무 위 오누이를 눌러요!',
    after: '호랑이는 손에 참기름을 바르고 나무에 오르기 시작했어요.',
    afterWho: 'narr',
    play: (s, done) => {
      s.setBg('well');
      const [boy, sis] = kidsOnTree(s);
      const tiger = s.actor('🐯엄마옷', 0.24, 0.1, { size: 150 });
      [boy, sis].forEach(k => k.anim('tapme'));
      let tapped = false;
      const go = () => {
        if (tapped) return;
        tapped = true;
        [boy, sis].forEach(k => k.anim('none').untap());
        sfx.tap();
        s.lines([[sis, '히히! 우리는 나무 위에 있지롱!', 'sis']], () => {
          tiger.setEmoji(IMG['🐯엄마옷'] ? '🐯엄마옷' : '🐯', true); tiger.walkTo(0.5, 900);
          s.delay(1000, () => s.lines([[tiger, '거기는 어떻게 올라갔니?', 'tiger'], [boy, '참기름을 바르고 올라왔지!', 'boy']], done));
        });
      };
      boy.tap(go); sis.tap(go);
    },
  },
  {
    text: '그런데 손이 미끌미끌, 호랑이는 자꾸 미끄러졌어요.',
    hint: '👆 호랑이를 세 번 눌러요!',
    after: '그러자 호랑이는 도끼를 가져와 쿵쿵 찍으며 나무를 오르기 시작했어요!',
    play: (s, done) => {
      s.setBg('well');
      const [boy, sis] = kidsOnTree(s);
      const tiger = s.actor('🐯엄마옷', 0.62, 0.1, { size: 150, flip: true }).anim('tapme');
      const baseY = tiger.y;
      let n = 0;
      tiger.tap(() => {
        if (n >= 3) return;
        const i = n++;
        tiger.untap().anim('none');
        // 영차 올라갔다가 주르륵 미끄러져요
        s.tweens.add({ targets: tiger, y: baseY - 90, duration: 450, ease: 'Sine.easeOut', onComplete: () => {
          pose(tiger, '🐯미끌', true);
          tone(700, 0.5, 'sine', -500);
          s.bubble(tiger, ['어이쿠!', '아이고, 미끄러워!', '으악!'][i], 1200, 'tiger');
          s.tweens.add({ targets: tiger, y: baseY, duration: 350, ease: 'Quad.easeIn', onComplete: () => {
            pose(tiger, '🐯엄마옷', true);
            if (i < 2) { tiger.anim('tapme'); tiger.label.setInteractive({ useHandCursor: true }); return; }
            boy.anim('happy'); sis.anim('happy');
            s.delay(1200, () => s.lines([[sis, '바보 호랑이! 도끼로 찍고 올라오면 되지!', 'sis'], [boy, '쉿! 말하면 안 돼!', 'boy']], done));
          } });
        } });
      });
    },
  },
  {
    text: '오누이는 하늘에 빌었어요. "하느님, 저희를 살리시려면 튼튼한 동아줄을 내려 주세요!"',
    who: 'boy',
    hint: '👆 반짝이는 별을 눌러요!',
    after: '튼튼한 동아줄을 꼭 잡고 오누이는 하늘로 올라갔어요.',
    play: (s, done) => {
      s.setBg('well');
      const [boy, sis] = kidsOnTree(s);
      const tiger = s.actor('🐯도끼', 0.62, 0.12, { size: 150, flip: true });
      s.tweens.add({ targets: tiger, y: tiger.y - 60, duration: 5000, ease: 'Sine.easeInOut' });   // 쿵쿵 올라와요
      const star = s.item('✨', 0.86, 0.3, 90).anim('tapme');   // 지문창을 피해 오른쪽에
      star.tap(() => {
        star.untap(); s.tweens.add({ targets: star, alpha: 0, duration: 400 });
        sfx.yay(); s.sparkle(...star.center(), '✨⭐🌟');
        const rope = dropRope(s, '🪢', 0.72, () => {
          // 오누이가 동아줄을 잡고 하늘로
          s.tweens.add({ targets: [boy, sis, rope], y: '-=' + H * 0.8, duration: 2200, delay: 400, ease: 'Sine.easeIn' });
          s.delay(2600, done);
        });
        s.stage.sendToBack(rope);   // 동아줄은 오누이 뒤로
      });
    },
  },
  {
    who: 'tiger',
    text: '호랑이도 하늘에 빌었어요. "하느님, 저에게도 동아줄을 내려 주세요!"',
    hint: '👆 동아줄을 잡은 호랑이를 눌러요!',
    after: '썩은 동아줄이 뚝! 호랑이는 쿵! 엉덩방아를 찧고는 산속으로 멀리멀리 도망갔대요.',
    afterWho: 'narr',
    play: (s, done) => {
      s.setBg('well');
      const tiger = s.actor('🐯도끼', 0.62, 0.12, { size: 150, flip: true });
      dropRope(s, '🪢썩은', 0.6, () => {
        s.tweens.add({ targets: tiger, y: tiger.y - 120, duration: 900, ease: 'Sine.easeOut' });
        tiger.anim('tapme');
        tiger.tap(() => {
          tiger.untap().anim('none');
          tone(400, 0.15, 'square'); s.showBubble(tiger, '뚝!', 800);
          s.lines([[tiger, '으악! 썩은 동아줄이잖아!', 'tiger']]);
          pose(tiger, '🐯쿵', true);
          s.tweens.add({ targets: tiger, y: H * 0.88, angle: 20, duration: 700, ease: 'Bounce.easeOut', onComplete: () => {
            tone(90, 0.5, 'square', -40); s.showBubble(tiger, '쿵!', 1000);
            s.delay(1400, () => { tiger.walkTo(1.3, 1400, 'Quad.easeIn'); s.delay(1500, done); });
          } });
        });
      });
    },
  },
  {
    text: '하늘에 올라간 오빠는 <b>해</b>가, 동생은 <b>달</b>이 되었어요.',
    hint: '👆 오누이를 눌러요!',
    after: '그래서 동생은 환한 해가, 오빠는 밤을 비추는 달이 되었대요.',
    play: (s, done) => {
      s.setBg('sky');
      const boy = s.actor('👦오빠', 0.3, 0.3, { size: 120 }).anim('tapme');
      const sis = s.actor('👧동생', 0.6, 0.3, { size: 110 }).anim('tapme');
      let n = 0;
      const turn = (a: Actor, key: string) => () => {
        a.untap().anim('none'); sfx.pop(); s.sparkle(...a.center(), '✨⭐🌟');
        pose(a, key); a.anim('happy');
        if (++n < 2) return;
        s.delay(800, () => s.lines([[sis, '오빠, 밤은 너무 깜깜하고 무서워….', 'sis'], [boy, '그럼 우리 서로 바꾸자!', 'boy']], () => {
          // 자리를 바꾸면서 해와 달도 바꿔요
          const bx = boy.x, sx = sis.x;
          s.tweens.add({ targets: boy, x: sx, duration: 900, ease: 'Sine.easeInOut' });
          s.tweens.add({ targets: sis, x: bx, duration: 900, ease: 'Sine.easeInOut', onComplete: () => {
            pose(boy, '🌙오빠'); pose(sis, '☀️동생');
            s.sparkle(boy.x, boy.y - 80, '✨⭐'); s.sparkle(sis.x, sis.y - 80, '✨🌟'); sfx.yay();
            s.delay(800, done);
          } });
        }));
      };
      boy.tap(turn(boy, '☀️오빠')); sis.tap(turn(sis, '🌙동생'));
    },
  },
  {
    who: 'sis',
    text: '"엄마! 우리가 하늘에서 늘 지켜 줄게요!" 숨어 있던 엄마도 하늘을 보며 활짝 웃었어요. 끝!',
    hint: '👆 화면을 눌러서 축하해요!',
    after: '참 잘했어요! 🎉 무서울 땐 서로 꼭 도와줘요!',
    play: (s, done) => {
      s.setBg('meadow');
      s.actor('☀️동생', 0.18, 0.62, { size: 110 }).anim('dance');
      s.actor('🌙오빠', 0.7, 0.62, { size: 110 }).anim('dance', 300);
      const mom = s.actor('👩떡', 0.44, 0.08);
      s.tweens.add({ targets: mom, x: { from: -150, to: mom.x }, duration: 1200, ease: 'Sine.easeOut', onComplete: () => mom.anim('happy') });
      let n = 0;
      s.tapAnywhere((x, y) => { sfx.yay(); s.sparkle(x, y, '🎉⭐☀️🌙💖'); if (++n === 3) done(); });
    },
  },
];
