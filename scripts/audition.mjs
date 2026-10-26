/* 목소리 오디션: 후보 목소리로 같은 대사를 읽혀서 비교해요
   node scripts/audition.mjs grandma   → assets-src/audition/grandma-<이름>.mp3
   마음에 드는 목소리의 voice_id를 scripts/voices.json에 넣고 npm run voices -- --who grandma --redo */
import { writeFileSync, mkdirSync } from 'node:fs';
import { need } from './lib/env.mjs';

const CANDIDATES = {
  grandma: { line: '빨간 모자구나! 문 열려 있단다~', ids: {
    숙희: 'tc_61c2f70c343884babeed840b', 순이: 'tc_60ad0841061ee28740ec2e1c', 정순: 'tc_5ebea242728f5b00075e6211',
    주하: 'tc_5d01a52563338e00072b8c9c', 경애: 'tc_6a867e7a0e6ddfd2f2dd17b6' } },
  wolf: { line: '너를 한입에 먹으려고 그렇지!', ids: {
    하데스: 'tc_6a867e6bd49b8f6a07db59da', 학철: 'tc_63a3d9d14b235ddd6541a78e', 스모크: 'tc_60126fbf8e097503c73ed8d6',
    덕춘: 'tc_5c3c52c95827e00008dd7f34', 덕환: 'tc_66860d458ca8b2dc5f72b865' } },
  man: { line: '할머니 댁에서 웬 소리지? 가 봐야겠어!', ids: {
    김반장: 'tc_63aaebf1cef3e7d6ce6d3628', 하데스: 'tc_6a867e6bd49b8f6a07db59da', 대진: 'tc_6a0e85a97f7750959b970d5d',
    잭: 'tc_60e5426de8b95f1d3000d7b5' } },
};

const who = process.argv[2];
const c = CANDIDATES[who];
if (!c) { console.error(`누구 목소리? ${Object.keys(CANDIDATES).join(', ')}`); process.exit(1); }
const key = need('TYPECAST_API_KEY');
const dir = new URL('../assets-src/audition/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [name, id] of Object.entries(c.ids)) {
  const res = await fetch('https://api.typecast.ai/v1/text-to-speech', {
    method: 'POST', headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'ssfm-v30', text: c.line, voice_id: id, language: 'kor', output: { audio_format: 'mp3' } }),
  });
  if (!res.ok) { console.error(`✗ ${name}: ${res.status}`); continue; }
  writeFileSync(new URL(`${who}-${name}.mp3`, dir), Buffer.from(await res.arrayBuffer()));
  console.log(`✓ ${name}\t${id}`);
}
