/* 타입캐스트로 대사 mp3 만들기
   node scripts/generate-voices.mjs                         → 모든 대사
   node scripts/generate-voices.mjs --story hood --page 0   → 한 장면만
   node scripts/generate-voices.mjs --redo                  → 연출을 바꿨을 때 전부 다시
   이미 만든 파일은 건너뛰어서 다시 돌려도 비용이 들지 않아요.
   연기 톤(감정·세기·빠르기)은 scripts/direction.json에서 대사마다 정해요. */
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { need, arg } from './lib/env.mjs';
import { collectLines } from './lib/collect-lines.mjs';

const key = need('TYPECAST_API_KEY');
const cfg = JSON.parse(readFileSync(new URL('./voices.json', import.meta.url), 'utf8'));
const dir = JSON.parse(readFileSync(new URL('./direction.json', import.meta.url), 'utf8'));
const out = new URL('../public/assets/voice/', import.meta.url);
const mp3s = () => readdirSync(out).filter(f => f.endsWith('.mp3'));

const all = await collectLines();
let lines = all;
if (arg('story')) lines = lines.filter(l => l.story === arg('story'));
if (arg('page') != null) lines = lines.filter(l => l.page === Number(arg('page')));

// 대사를 고치면 예전 파일이 남으니, 게임에서 더는 안 쓰는 파일은 지워요
const used = new Set(all.map(l => l.key));
for (const f of mp3s()) if (!used.has(f.slice(0, -4)) || (arg('redo') && lines.some(l => `${l.key}.mp3` === f))) unlinkSync(new URL(f, out));

async function make(l) {
  const loud = l.who.endsWith('L');
  const who = loud ? l.who.slice(0, -1) : l.who;
  const d = { ...dir.base[who], ...(loud ? dir.base.loud : {}), ...dir.lines[`${l.who}|${l.t}`] };
  const v = cfg.voices[who];
  const body = {
    model: cfg.model, text: d.speak ?? l.t, voice_id: v.voice_id, language: 'kor',
    prompt: { emotion_type: 'preset', emotion_preset: d.e ?? 'normal', emotion_intensity: d.i ?? 1 },
    output: { audio_format: 'mp3', target_lufs: -16, audio_tempo: d.tempo ?? 1, audio_pitch: (v.pitch ?? 0) + (d.pitch ?? 0) },
  };
  for (let tryNo = 1; ; tryNo++) {
    const res = await fetch('https://api.typecast.ai/v1/text-to-speech', {
      method: 'POST', headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) { writeFileSync(new URL(`${l.key}.mp3`, out), Buffer.from(await res.arrayBuffer())); return true; }
    const msg = `${res.status} ${await res.text()}`;
    if (res.status !== 429 && res.status < 500 || tryNo === 3) { console.error(`✗ ${l.who} "${l.t}": ${msg}`); return false; }
    await new Promise(r => setTimeout(r, 2000 * tryNo));   // 잠깐 쉬었다 다시
  }
}

const todo = lines.filter(l => !existsSync(new URL(`${l.key}.mp3`, out)));
let made = 0;
// 세 개씩 동시에 만들어요
for (let i = 0; i < todo.length; i += 3) {
  const batch = todo.slice(i, i + 3);
  const ok = await Promise.all(batch.map(make));
  batch.forEach((l, j) => { if (ok[j]) { made++; console.log(`✓ ${l.who}\t${l.t}`); } });
}

// 게임이 어떤 대사 파일이 있는지 알 수 있게 목록을 써 둬요
const keys = mp3s().map(f => f.slice(0, -4)).sort();
writeFileSync(new URL('manifest.json', out), JSON.stringify(keys, null, 1) + '\n');
console.log(`\n새로 만든 파일 ${made}개, 전체 ${keys.length}개 / 대사 ${all.length}줄`);
