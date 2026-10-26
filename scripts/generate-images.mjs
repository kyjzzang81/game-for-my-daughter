/* OpenAI로 3D 점토 그림 만들기
   node scripts/generate-images.mjs               → images.json에서 아직 없는 그림 모두
   node scripts/generate-images.mjs --only wolf   → 하나만 (다시 만들려면 assets-src/img/wolf.png를 지우고)
   node scripts/generate-images.mjs --process     → 새로 만들지 않고 원본에서 다듬기만 다시

   생성한 원본은 assets-src/img/에 두고, 다듬은 결과(테두리 정리·여백 자르기·크기 줄이기)를
   public/assets/img/에 써요. ref가 있는 그림은 참고 그림을 함께 보내 생김새와 그림체를 맞춰요. */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { need, arg } from './lib/env.mjs';
import { cleanSprite, cleanBackground } from './lib/clean-image.mjs';

const cfg = JSON.parse(readFileSync(new URL('./images.json', import.meta.url), 'utf8'));
const src = new URL('../assets-src/img/', import.meta.url);
const out = new URL('../public/assets/img/', import.meta.url);
mkdirSync(src, { recursive: true }); mkdirSync(out, { recursive: true });

const raw = k => new URL(`${k}.png`, src);
const outName = (k, img) => `${k}.${img.kind === 'bg' ? 'jpg' : 'png'}`;
/* 게임 화면에서 그려지는 크기의 약 2배 (긴 쪽 기준) */
const MAX = { sprite: 400, ui: 256 };
const maxSide = (k, img) => (k.startsWith('house-') ? 560 : k.startsWith('cover-') ? 440 : k === 'btn-start' ? 420 : MAX[img.kind]);

async function generate(k, img) {
  const key = need('OPENAI_API_KEY');
  const prompt = `${img.prompt}\n${cfg.style[img.kind]}`;
  const common = { model: cfg.model, prompt, size: img.size ?? '1024x1024', quality: img.kind === 'bg' ? 'high' : 'medium', output_format: 'png' };
  if (img.kind !== 'bg') common.background = 'transparent';
  let res;
  if (img.ref?.length) {
    // 참고 그림을 함께 보내는 편집(edits) 요청
    const form = new FormData();
    Object.entries(common).forEach(([n, v]) => form.append(n, v));
    if (img.fidelity) form.append('input_fidelity', img.fidelity);
    for (const r of img.ref) form.append('image[]', new Blob([readFileSync(raw(r))], { type: 'image/png' }), `${r}.png`);
    res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form });
  } else {
    res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(common),
    });
  }
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const { data } = await res.json();
  writeFileSync(raw(k), Buffer.from(data[0].b64_json, 'base64'));
}

async function processOne(k, img) {
  let input = readFileSync(raw(k));
  if (img.flop) input = await sharp(input).flop().png().toBuffer();
  const buf = img.kind === 'bg' ? await cleanBackground(input) : await cleanSprite(input, maxSide(k, img));
  writeFileSync(new URL(outName(k, img), out), buf);
}

const entries = Object.entries(cfg.images).filter(([k]) => !arg('only') || arg('only') === k);
const todo = arg('process') ? [] : entries.filter(([k]) => !existsSync(raw(k)));
const failed = new Set();

// 참고 그림이 먼저 있어야 하니, 준비된 것부터 네 개씩 동시에 만들어요
const pending = [...todo];
const running = new Set();
await new Promise(resolve => {
  const kick = () => {
    if (!pending.length && !running.size) return resolve();
    for (const item of [...pending]) {
      if (running.size >= 4) break;
      const [k, img] = item;
      const refs = img.ref ?? [];
      if (refs.some(r => failed.has(r))) { pending.splice(pending.indexOf(item), 1); failed.add(k); console.error(`✗ ${k}: 참고 그림이 없어 건너뜀`); continue; }
      if (!refs.every(r => existsSync(raw(r)))) continue;
      pending.splice(pending.indexOf(item), 1);
      const p = generate(k, img)
        .then(() => processOne(k, img)).then(() => console.log(`✓ ${k}`))
        .catch(e => { failed.add(k); console.error(`✗ ${k}: ${e.message}`); })
        .finally(() => { running.delete(p); kick(); });
      running.add(p);
    }
    if (!running.size && pending.length) { pending.forEach(([k]) => console.error(`✗ ${k}: 참고 그림을 찾을 수 없어요`)); resolve(); }
  };
  kick();
});

if (arg('process')) for (const [k, img] of entries) if (existsSync(raw(k))) { await processOne(k, img); console.log(`✓ ${k} 다듬기`); }

// 게임이 불러올 목록: 파일 이름과, 어떤 이모지를 바꿔 그릴지
const files = {}, emoji = {};
for (const [k, img] of Object.entries(cfg.images)) {
  if (!existsSync(new URL(outName(k, img), out))) continue;
  files[k] = outName(k, img);
  if (img.emoji) emoji[img.emoji] = k;
}
writeFileSync(new URL('manifest.json', out), JSON.stringify({ files, emoji }, null, 1) + '\n');
console.log(`\n그림 ${Object.keys(files).length}/${Object.keys(cfg.images).length}개 준비됨${failed.size ? `, 실패 ${failed.size}개` : ''}`);
