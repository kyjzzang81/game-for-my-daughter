/* .env 파일을 읽어 process.env에 넣어요 (따로 패키지 없이) */
import { readFileSync, existsSync } from 'node:fs';
const path = new URL('../../.env', import.meta.url);
if (existsSync(path)) {
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
export function need(name) {
  if (!process.env[name]) { console.error(`.env에 ${name}가 없어요`); process.exit(1); }
  return process.env[name];
}
/* --story hood --page 0 같은 옵션 읽기 */
export function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? undefined : process.argv[i + 1] ?? true;
}
