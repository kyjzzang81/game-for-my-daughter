/* 악기 소리: 녹음 파일 없이 각 악기가 소리 나는 원리를 흉내 내 Web Audio로 합성해요.
   북은 울림통+북면, 트럼펫은 밝게 열리는 금관 소리, 바이올린은 활로 켜는 소리, 기타는 줄을 퉁기는 소리(Karplus-Strong). */
import { audioCtx } from './sfx';
import { duck } from './music';

export type Instrument = 'drum' | 'trumpet' | 'violin' | 'guitar';

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

function out(vol: number) {
  const ac = audioCtx(), g = ac.createGain();
  g.gain.value = vol;
  g.connect(ac.destination);
  return g;
}

/* ---------- 북 ---------- */
function noise(seconds: number) {
  const ac = audioCtx(), buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
/* 둥: 낮게 울리는 큰북 */
function kick(t: number) {
  const ac = audioCtx(), o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
  g.gain.setValueAtTime(1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  o.connect(g).connect(out(0.9));
  o.start(t); o.stop(t + 0.5);
}
/* 탁: 작은북 (북면 울림 + 쇠줄 사각거림) */
function snare(t: number) {
  const ac = audioCtx();
  const n = ac.createBufferSource(); n.buffer = noise(0.25);
  const bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 1500;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.7, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  n.connect(bp).connect(ng).connect(out(0.6));
  n.start(t); n.stop(t + 0.25);
  const o = ac.createOscillator(), og = ac.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.1);
  og.gain.setValueAtTime(0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(og).connect(out(0.6));
  o.start(t); o.stop(t + 0.15);
}

/* ---------- 트럼펫 ---------- */
function brass(t: number, midi: number, dur: number) {
  const ac = audioCtx();
  const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(midi);
  // 살짝 떨리는 소리(비브라토)
  const lfo = ac.createOscillator(), lg = ac.createGain();
  lfo.frequency.value = 5.5; lg.gain.value = hz(midi) * 0.006;
  lfo.connect(lg).connect(o.frequency);
  // 불기 시작하면 소리가 밝게 열려요 (필터가 빠르게 열림)
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
  f.frequency.setValueAtTime(400, t);
  f.frequency.linearRampToValueAtTime(hz(midi) * 6, t + 0.06);
  f.frequency.linearRampToValueAtTime(hz(midi) * 4, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.04);
  g.gain.linearRampToValueAtTime(0.38, t + 0.12);
  g.gain.setValueAtTime(0.38, t + dur - 0.05);
  g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05);
  o.connect(f).connect(g).connect(out(0.45));
  o.start(t); lfo.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
}

/* ---------- 바이올린 ---------- */
function bow(t: number, midi: number, dur: number) {
  const ac = audioCtx();
  const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(midi);
  const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = hz(midi) * 1.003;   // 살짝 어긋나 풍성하게
  // 소리가 난 뒤 조금 있다가 비브라토가 들어와요
  const lfo = ac.createOscillator(), lg = ac.createGain();
  lfo.frequency.value = 6;
  lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(hz(midi) * 0.012, t + 0.3);
  lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  // 나무 몸통이 울리는 느낌(공명)
  const body = ac.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 2800; body.Q.value = 1.2; body.gain.value = 6;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.32, t + 0.12);   // 활로 천천히 켜기 시작
  g.gain.setValueAtTime(0.32, t + dur - 0.08);
  g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.12);
  o.connect(body); o2.connect(body); body.connect(lp).connect(g).connect(out(0.4));
  [o, o2, lfo].forEach(x => { x.start(t); x.stop(t + dur + 0.2); });
}

/* ---------- 기타 (Karplus-Strong: 잡음을 짧은 고리에 돌리면 줄 퉁기는 소리가 나요) ---------- */
const plucks = new Map<number, AudioBuffer>();
function pluckBuffer(midi: number) {
  const ac = audioCtx();
  const cached = plucks.get(midi);
  if (cached) return cached;
  const sr = ac.sampleRate, len = Math.ceil(sr * 1.6), period = Math.round(sr / hz(midi));
  const buf = ac.createBuffer(1, len, sr), d = buf.getChannelData(0);
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  for (let i = 0, p = 0; i < len; i++) {
    const next = (p + 1) % period;
    const v = ring[p];
    ring[p] = 0.996 * 0.5 * (ring[p] + ring[next]);   // 이웃끼리 평균 내며 점점 부드럽게 사라져요
    d[i] = v;
    p = next;
  }
  plucks.set(midi, buf);
  return buf;
}
function pluck(t: number, midi: number) {
  const ac = audioCtx(), s = ac.createBufferSource();
  s.buffer = pluckBuffer(midi);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3500;
  s.connect(lp).connect(out(0.55));
  s.start(t);
}

/* 악기마다 짧은 한 소절 */
export function playInstrument(name: Instrument) {
  try {
    const ac = audioCtx(), t = ac.currentTime + 0.02, b = 0.18;   // b: 8분음표 길이(초)
    // 연주하는 동안 배경음악을 작게
    duck(true); setTimeout(() => duck(false), 1600);
    if (name === 'drum') {
      // 둥 탁 둥둥 탁
      kick(t); snare(t + b * 2); kick(t + b * 3); kick(t + b * 4); snare(t + b * 6);
    }
    if (name === 'trumpet') {
      // 빠밤빠 빠~ (팡파르)
      ([[67, 0], [67, 1], [72, 2], [76, 3], [79, 4.5]] as const).forEach(([m, at], i, a) =>
        brass(t + at * b, m, i === a.length - 1 ? b * 3 : b * 0.85));
    }
    if (name === 'violin') {
      // 미~ 솔 라~ 솔
      ([[76, 0, 2], [79, 2, 1], [81, 3, 2], [79, 5, 2]] as const).forEach(([m, at, len]) => bow(t + at * b, m, len * b));
    }
    if (name === 'guitar') {
      // 도미솔 화음을 아래에서 위로 쓸어내리듯 퉁기고, 한 번 더
      [48, 52, 55, 60, 64].forEach((m, i) => pluck(t + i * 0.03, m));
      [48, 52, 55, 60, 64].forEach((m, i) => pluck(t + b * 3 + i * 0.03, m + 5));
    }
  } catch { /* 소리를 못 내는 기기 */ }
}
