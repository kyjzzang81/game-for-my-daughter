/* 타입캐스트 목소리 찾기: node scripts/list-voices.mjs [--age child] [--gender female] */
import { need, arg } from './lib/env.mjs';
const key = need('TYPECAST_API_KEY');
const res = await fetch('https://api.typecast.ai/v2/voices?model=ssfm-v30', { headers: { 'X-API-KEY': key } });
if (!res.ok) throw new Error(`목록을 못 가져왔어요: ${res.status}`);
for (const v of await res.json()) {
  if (arg('age') && v.age !== arg('age')) continue;
  if (arg('gender') && v.gender !== arg('gender')) continue;
  console.log(`${v.voice_id}\t${v.voice_name}\t${v.gender}\t${v.age}\t${(v.use_cases ?? []).join(', ')}`);
}
