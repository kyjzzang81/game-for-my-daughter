/* 게임을 화면 없이 흉내 내서, 이야기마다 실제로 말하는 대사를 모두 모아요.
   (등장인물을 누르는 동작을 대신 실행하고, 말하는 순간을 가로채 기록해요) */
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

/* 무엇을 부르든 자기 자신을 돌려주는 대역 객체 (그래픽, 트윈 등) */
function anything() {
  const f = function () { return p; };
  const p = new Proxy(f, {
    get: (_, k) => (k === Symbol.iterator ? function* () {} : k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : p),
    apply: () => p,
    construct: () => p,
  });
  return p;
}

function mockScene(taps, anywhere, later) {
  const any = anything();
  const actor = () => new Proxy({}, {
    get: (_, k) => {
      if (k === 'tap') return fn => { taps.push(fn); return act; };
      if (k === 'center') return () => [0, 0];
      if (k === 'scene') return s;
      if (k === 'inner' || k === 'label') return any;
      return () => act;
    },
  });
  let act = actor();
  let s;
  s = new Proxy({}, {
    get: (_, k) => ({
      actor: () => (act = actor()), girl: () => (act = actor()), item: () => (act = actor()),
      guard: fn => fn,
      delay: (_ms, fn) => later.push(fn),
      lines: (list, onDone) => talkHook(list.map(([, t, who]) => ({ t, who })), onDone),
      bubble: (_a, t, _ms, who) => { if (who) talkHook([{ t, who }]); },
      tapItems: (spots, onTap, onAll) => { spots.forEach(([e], i) => onTap(i, e)); onAll(); },
      tapAnywhere: fn => anywhere.push(fn),
      // 애니메이션이 끝난 뒤에 나오는 대사도 모으려고, 끝 콜백을 미뤄 둔 일로 실행해요
      tweens: { add: cfg => { if (cfg.onComplete) later.push(cfg.onComplete); return any; }, killTweensOf: () => {} },
      time: { delayedCall: (_ms, fn) => later.push(fn) },
    })[k] ?? any,
  });
  return s;
}

let talkHook;

export async function collectLines() {
  globalThis.window ??= globalThis;   // sfx.ts가 window를 찾아서 넣어 둬요
  const server = await createServer({
    root, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false },
    resolve: { alias: { phaser: `${root}scripts/lib/phaser-stub.ts` } },
  });
  try {
    const voice = await server.ssrLoadModule('/src/audio/voice.ts');
    const stories = {
      hood: (await server.ssrLoadModule('/src/stories/hood.ts')).HOOD,
      pigs: (await server.ssrLoadModule('/src/stories/pigs.ts')).PIGS,
      sunmoon: (await server.ssrLoadModule('/src/stories/sunmoon.ts')).SUNMOON,
      bremen: (await server.ssrLoadModule('/src/stories/bremen.ts')).BREMEN,
    };
    const out = new Map();   // key → { who, t, story, page }
    let where = {};
    voice.voiceHooks.record = l => out.set(voice.voiceKey(l.who, l.t), { who: l.who, t: l.t, ...where });
    talkHook = (list, onDone) => { voice.talk(list); onDone?.(); };

    for (const [story, pages] of Object.entries(stories)) {
      pages.forEach((p, page) => {
        where = { story, page };
        voice.say(p.text, p.who ?? 'narr');
        if (p.hint) voice.say(p.hint);
        if (p.after) voice.say(p.after, p.afterWho ?? p.who ?? 'narr');
        const taps = [], anywhere = [], later = [];
        p.play(mockScene(taps, anywhere, later), () => {});
        // 누를 수 있는 걸 여러 번 누르고, 미뤄 둔 일을 실행하면서 대사가 더 안 나올 때까지 돌려요
        for (let round = 0; round < 12; round++) {
          taps.splice(0).forEach(fn => { for (let i = 0; i < 6; i++) fn(); });
          later.splice(0).forEach(fn => fn());
          anywhere.forEach(fn => fn(0, 0));
        }
      });
    }
    // 홈·선택 화면 내레이션
    const { UI_LINES } = await server.ssrLoadModule('/src/stories/ui-lines.ts');
    where = { story: 'ui', page: 0 };
    Object.values(UI_LINES).forEach(t => voice.say(t));
    // 무작위로 고르는 대사(꽃 꺾을 때)는 위에서 일부만 나올 수 있어서 따로 넣어요
    for (const t of ['예쁘다!', '향기 좋아!', '와아!']) out.set(voice.voiceKey('girl', t), { who: 'girl', t, story: 'hood', page: 2 });
    return [...out.entries()].map(([key, v]) => ({ key, ...v }));
  } finally {
    await server.close();
  }
}
