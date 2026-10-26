/* 내레이션과 등장인물 목소리.
   scripts/generate-voices.mjs로 만든 타입캐스트 mp3가 있으면 그걸 틀고,
   없는 대사는 브라우저 speechSynthesis로 읽어요. */
export type Who = 'narr' | 'pig1' | 'pig2' | 'pig3' | 'wolf' | 'girl' | 'mom' | 'grandma' | 'man';
export interface Line { t: string; who: Who | `${Who}L`; onstart?: () => void; onend?: () => void }

const HAS_TTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
let koVoice: SpeechSynthesisVoice | null = null;
function loadVoice() { koVoice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ko')) ?? null; }
if (HAS_TTS) { loadVoice(); speechSynthesis.onvoiceschanged = loadVoice; }

/* 이름 끝에 L을 붙이면 우렁찬 목소리(낮고 느리게) */
const VOICES: Record<Who, { pitch: number; rate: number }> = {
  narr: { pitch: 1.15, rate: 0.85 }, pig1: { pitch: 1.3, rate: 0.9 }, pig2: { pitch: 1.65, rate: 1 }, pig3: { pitch: 2, rate: 1.15 },
  wolf: { pitch: 0.3, rate: 0.75 }, girl: { pitch: 1.45, rate: 1 }, mom: { pitch: 1.2, rate: 0.9 },
  grandma: { pitch: 0.85, rate: 0.8 }, man: { pitch: 0.7, rate: 0.9 },
};

/* 대사 파일 이름: 생성 스크립트와 똑같이 계산해야 해요 (FNV-1a 해시) */
export function voiceKey(who: string, text: string) {
  let h = 0x811c9dc5;
  for (const ch of `${who}|${text}`) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 0x01000193) >>> 0; }
  return `${who}-${h.toString(16).padStart(8, '0')}`;
}

let recorded: Set<string> | null = null;
if (typeof window !== 'undefined') {
  fetch('assets/voice/manifest.json').then(r => (r.ok ? r.json() : [])).then((keys: string[]) => { recorded = new Set(keys); })
    .catch(() => { recorded = new Set(); });
}

/* 생성 스크립트가 게임을 흉내 내며 모든 대사를 모을 때 씁니다 */
export const voiceHooks: { record: ((l: Line) => void) | null } = { record: null };

/* 한 줄 말하기. 끝나면 done */
let audio: HTMLAudioElement | null = null;
function speakOne(l: Line, done: () => void) {
  const key = voiceKey(l.who, l.t);
  if (recorded?.has(key)) {
    audio = new Audio(`assets/voice/${key}.mp3`);
    audio.onended = audio.onerror = done;
    audio.play().catch(done);
    return;
  }
  if (!HAS_TTS) { setTimeout(done, 900); return; }
  const loud = l.who.endsWith('L'), v = VOICES[(loud ? l.who.slice(0, -1) : l.who) as Who] ?? VOICES.narr;
  const u = new SpeechSynthesisUtterance(l.t);
  u.lang = 'ko-KR'; u.volume = 1; u.rate = loud ? 0.8 : v.rate; u.pitch = loud ? v.pitch * 0.6 : v.pitch;
  if (koVoice) u.voice = koVoice;
  u.onend = u.onerror = done;
  speechSynthesis.speak(u);
}

/* 대사 목록을 차례로 말해요. queue=false면 지금 말하던 걸 멈추고 새로 시작.
   (Chrome은 cancel 직후 바로 speak하면 소리가 씹혀서 잠깐 기다렸다가 말해요) */
let buf: Line[] = [];
let busy = false;
let run = 0;
function pump(r: number) {
  if (r !== run) return;
  const l = buf.shift();
  if (!l) { busy = false; return; }
  busy = true;
  l.onstart?.();
  let fired = false;
  speakOne(l, () => { if (fired || r !== run) return; fired = true; l.onend?.(); pump(r); });
}

export function talk(lines: Line[], queue = false) {
  if (voiceHooks.record) { lines.forEach(l => { voiceHooks.record!(l); l.onstart?.(); l.onend?.(); }); return; }
  if (!queue) stopTalk();
  buf.push(...lines);
  if (!busy) { busy = true; const r = run; setTimeout(() => pump(r), queue ? 0 : 100); }
}

export function stopTalk() {
  run++; buf = []; busy = false;
  if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio = null; }
  if (HAS_TTS) speechSynthesis.cancel();
}

/* 문장 속 "따옴표" 부분은 who(등장인물) 목소리로, 나머지는 내레이터 목소리로 읽어요.
   who가 배열이면 따옴표마다 차례로 다른 목소리 */
export function say(text: string, who: Who | Who[] = 'narr', queue = false) {
  let q = 0;
  const lines: Line[] = [];
  // 태그와 이모지는 읽지 않아요
  text.replace(/<[^>]+>/g, '').replace(/\p{Extended_Pictographic}\uFE0F?/gu, '').split(/("[^"]*")/).forEach(seg => {
    if (!seg.trim()) return;
    if (seg.startsWith('"')) {
      const v = Array.isArray(who) ? who[Math.min(q++, who.length - 1)] : who;
      lines.push({ t: seg.slice(1, -1), who: v === 'narr' ? 'pig2' : v });
    } else lines.push({ t: seg.trim(), who: 'narr' });
  });
  talk(lines, queue);
}
