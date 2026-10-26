/* 게임에서 말하는 대사를 모두 보여줘요: node scripts/list-lines.mjs */
import { collectLines } from './lib/collect-lines.mjs';
const lines = await collectLines();
for (const l of lines) console.log(`${l.story}#${l.page}\t${l.who}\t${l.t}`);
console.log(`\n총 ${lines.length}줄`);
