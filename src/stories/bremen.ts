import type { Page, StoryScene } from '../scenes/StoryScene';
import type { Actor } from '../ui';
import { sfx, tone } from '../audio/sfx';
import { playInstrument, type Instrument } from '../audio/instruments';

/* 브레멘 음악대 (그림 형제). 쫓겨난 동물 넷이 친구가 되어 탑을 쌓고 노래로 도둑을 쫓아내요 */

type Animal = 'donkey' | 'dog' | 'cat' | 'rooster';
const LOOK: Record<Animal, { emoji: string; size: number; cry: string }> = {
  donkey:  { emoji: '🫏', size: 150, cry: '히이잉!' },
  dog:     { emoji: '🐕', size: 115, cry: '멍멍!' },
  cat:     { emoji: '🐈', size: 100, cry: '야옹!' },
  rooster: { emoji: '🐓', size: 95, cry: '꼬끼오!' },
};
/* 친구마다 다른 소리 (도레미…) */
const NOTE: Record<Animal, number[]> = {
  donkey: [196, 247, 294], dog: [262, 330, 392], cat: [392, 494, 587], rooster: [523, 659, 784],
};
const sing = (a: Animal) => NOTE[a].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle'), i * 110));

function animal(s: StoryScene, a: Animal, left: number, bottom = 0.12, flip = false) {
  const l = LOOK[a];
  return s.actor(l.emoji, left, bottom, { size: l.size, flip });
}

/* 앞서 친구가 된 동물들이 줄지어 서 있어요 (왼쪽부터) */
function friends(s: StoryScene, list: Animal[]) {
  return list.map((a, i) => animal(s, a, 0.02 + i * 0.12, 0.12, true));
}

/* 길에서 새 친구 만나기 */
function meet(newcomer: Animal, before: Animal[], ask: [Animal, string], answer: string): Page['play'] {
  return (s, done) => {
    s.setBg(newcomer === 'rooster' ? 'farm' : 'road');
    const crew = friends(s, before);
    const n = animal(s, newcomer, 0.62, newcomer === 'rooster' ? 0.2 : 0.12).anim('tapme');
    n.tap(() => {
      n.untap().anim('none'); sfx.tap(); sing(newcomer);
      const asker = crew[before.indexOf(ask[0])];
      s.lines([[asker, ask[1], ask[0]], [n, answer, newcomer]], () => {
        n.anim('happy'); crew.forEach(c => c.anim('happy'));
        s.delay(900, done);
      });
    });
  };
}

/* 탑: 아래 친구의 등 위에 올라앉은 자리 */
function onTop(below: Actor, a: Animal): [number, number] {
  return [below.x + (a === 'dog' ? -6 : 4), below.y - below.boxH * (a === 'dog' ? 0.55 : 0.62)];
}

/* 이미 쌓아 둔 탑 */
function stack(s: StoryScene, left: number) {
  const base = animal(s, 'donkey', left, 0.12, true);
  const tower: Actor[] = [base];
  (['dog', 'cat', 'rooster'] as const).forEach(a => {
    const t = animal(s, a, left, 0.12, true);
    [t.x, t.y] = onTop(tower[tower.length - 1], a);
    tower.push(t);
  });
  return tower;
}

export const BREMEN: Page[] = [
  {
    who: 'donkey',
    text: '옛날 어느 농장에 늙은 <b>당나귀</b>가 살았어요. 힘이 빠진 당나귀는 생각했어요. "나는 브레멘에 가서 음악대가 될 테야!"',
    hint: '👆 당나귀를 눌러서 출발해요!',
    after: '당나귀는 콧노래를 부르며 브레멘으로 길을 떠났어요.',
    afterWho: 'narr',
    play: (s, done) => {
      s.setBg('farm');
      const d = animal(s, 'donkey', 0.32, 0.12, true).anim('tapme');
      d.tap(() => {
        d.untap().anim('happy'); sing('donkey');
        s.bubble(d, '히이잉~! 브레멘으로 출발!', 1800, 'donkey');
        s.delay(1600, () => { d.walkTo(1.15, 2200, 'Sine.easeIn'); s.delay(2200, done); });
      });
    },
  },
  {
    who: 'dog',
    text: '길을 가다가 지친 <b>개</b>를 만났어요. "멍… 나는 이제 늙어서 쫓겨났어."',
    hint: '👆 개를 눌러서 같이 가자고 해요!',
    after: '개는 꼬리를 살랑살랑 흔들며 따라나섰어요.',
    afterWho: 'narr',
    play: meet('dog', ['donkey'], ['donkey', '우리랑 같이 브레멘 음악대가 되자!'], '멍멍! 좋아, 나도 갈래!'),
  },
  {
    who: 'cat',
    text: '조금 더 가니 시무룩한 <b>고양이</b>가 앉아 있었어요. "야옹… 쥐를 못 잡는다고 쫓겨났어."',
    hint: '👆 고양이를 눌러서 같이 가자고 해요!',
    after: '고양이도 사뿐사뿐 따라왔어요.',
    afterWho: 'narr',
    play: meet('cat', ['donkey', 'dog'], ['dog', '우리랑 같이 노래하자!'], '야옹! 노래라면 자신 있지!'),
  },
  {
    who: 'rooster',
    text: '울타리 위에서는 <b>수탉</b>이 목청껏 울고 있었어요. "꼬끼오! 이제 내가 필요 없대!"',
    hint: '👆 수탉을 눌러서 같이 가자고 해요!',
    after: '네 친구는 사이좋게 브레멘으로 걸어갔어요.',
    afterWho: 'narr',
    play: meet('rooster', ['donkey', 'dog', 'cat'], ['cat', '우리랑 브레멘에 가자!'], '꼬끼오! 좋아, 내 멋진 목소리를 들려줄게!'),
  },
  {
    text: '밤이 되자 깜깜한 숲속에 <b>불빛</b>이 보였어요. 창문 안에서는 <b>도둑들</b>이 맛있는 음식을 먹고 있었지요.',
    hint: '👆 불빛이 반짝이는 집을 눌러요!',
    after: '친구들은 서로 등에 올라타 높은 탑을 쌓기로 했어요.',
    play: (s, done) => {
      s.setBg('woods');
      const crew = friends(s, ['donkey', 'dog', 'cat', 'rooster']);
      const house = s.actor('🏚️', 0.56, 0.1, { size: 250 }).anim('tapme');
      house.tap(() => {
        house.untap().anim('none'); sfx.tap();
        s.lines([
          [house, '하하하! 이 맛있는 음식은 다 우리 거야!', 'robber'],
          [crew[3], '꼬르륵… 배고프다.', 'rooster'],
          [crew[0], '좋은 생각이 있어! 우리가 도둑들을 쫓아내자!', 'donkey'],
        ], done);
      });
    },
  },
  {
    text: '당나귀 등에 개가, 개 등에 고양이가, 고양이 등에 수탉이 올라가요!',
    hint: '👆 차례대로 친구를 눌러서 탑을 쌓아요!',
    after: '와! 아주아주 높은 동물 탑이 되었어요.',
    play: (s, done) => {
      s.setBg('woods');
      s.actor('🏚️', 0.62, 0.1, { size: 250 });
      const tower: Actor[] = [animal(s, 'donkey', 0.4, 0.12, true)];
      const order: Animal[] = ['dog', 'cat', 'rooster'];
      const waiting = order.map((a, i) => animal(s, a, 0.02 + i * 0.12, 0.12, true));
      const next = (i: number) => {
        const w = waiting[i].anim('tapme');
        w.tap(() => {
          w.untap().anim('none'); sing(order[i]);
          const [x, y] = onTop(tower[tower.length - 1], order[i]);
          // 깡충 뛰어올라 앉아요
          s.tweens.add({ targets: w, x, duration: 600, ease: 'Sine.easeInOut' });
          s.tweens.add({ targets: w, y: { from: w.y, to: y }, duration: 600, ease: 'Back.easeOut', onComplete: () => {
            tower.push(w); tower.forEach(t => t.anim('shake'));
            s.bubble(w, LOOK[order[i]].cry, 900, order[i]);
            if (i < order.length - 1) s.delay(500, () => next(i + 1)); else s.delay(1200, done);
          } });
        });
      };
      next(0);
    },
  },
  {
    who: 'donkey',
    text: '"하나, 둘, 셋!" 친구들이 창문 앞에서 다 함께 노래를 불렀어요.',
    hint: '👆 친구들을 하나씩 눌러서 노래해요!',
    after: '도둑들은 깜짝 놀라 숲 밖으로 멀리멀리 도망갔어요.',
    afterWho: 'narr',
    play: (s, done) => {
      s.setBg('woods');
      const house = s.actor('🏚️', 0.62, 0.1, { size: 250 });
      const tower = stack(s, 0.4);
      const kinds: Animal[] = ['donkey', 'dog', 'cat', 'rooster'];
      const sung = new Set<number>();
      tower.forEach((t, i) => {
        t.anim('tapme');
        t.tap(() => {
          if (sung.has(i)) return;
          sung.add(i); t.anim('happy'); sing(kinds[i]);
          s.bubble(t, LOOK[kinds[i]].cry, 1000, kinds[i]);
          s.sparkle(...t.center(), '🎵🎶');
          if (sung.size < 4) return;
          // 다 같이 부르면 도둑들이 깜짝 놀라 뛰쳐나와요
          s.delay(1200, () => {
            tower.forEach(a => a.anim('shake')); house.anim('shake');
            [0, 1, 2].forEach(k => s.delay(k * 150, () => kinds.forEach(sing)));
            const rob = s.actor('🦹', 0.7, 0.08, { size: 120, flip: true });
            s.lines([[rob, '으악! 괴물이다! 도망가자!', 'robber']], () => {
              rob.walkTo(1.3, 1200, 'Quad.easeIn');
              s.delay(1300, done);
            });
          });
        });
      });
    },
  },
  {
    text: '네 친구는 도둑들이 두고 간 음식을 배불리 먹고, 그 집에서 함께 음악을 연주하며 행복하게 살았대요. 끝!',
    hint: '👆 친구들을 눌러서 연주해요!',
    after: '참 잘했어요! 🎉 친구와 힘을 합치면 무엇이든 할 수 있어요!',
    play: (s, done) => {
      s.setBg('cottage');
      const band: [Animal, string, Instrument, number][] = [
        ['donkey', '🥁', 'drum', 0.12], ['dog', '🎺', 'trumpet', 0.34], ['cat', '🎻', 'violin', 0.54], ['rooster', '🎸', 'guitar', 0.74]];
      const played = new Set<Animal>();
      band.forEach(([a, inst, sound, left]) => {
        const m = animal(s, a, left, 0.1).anim('tapme');
        m.prop(inst, 0.45, -0.45, 0.55);
        m.tap(() => {
          playInstrument(sound); m.anim('dance'); s.sparkle(...m.center(), '🎵🎶✨');
          if (played.has(a)) return;
          played.add(a);
          if (played.size === band.length) s.delay(1500, done);
        });
      });
    },
  },
];
