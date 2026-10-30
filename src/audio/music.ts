/* 배경음악: 오르골 느낌의 짧은 곡을 Web Audio로 직접 연주해서 되풀이해요 (음원 파일·저작권 걱정 없음).
   대사가 나오는 동안은 소리를 줄여요(ducking). */
import { audioCtx } from './sfx';

type Note = [step: number, midi: number, len: number];   // 8분음표 단위
interface Song { bpm: number; steps: number; melody: Note[]; bass: Note[]; chords: number[][] }

const C = 60;   // 가운데 도
const n = (s: string): Note[] => s.trim().split(/\s+/).map(t => {
  const [step, midi, len] = t.split(':').map(Number);
  return [step, midi, len ?? 1];
});

/* 마디마다 화음(8분음표 8개 = 한 마디) */
const SONGS: Record<string, Song> = {
  // 들판: 밝은 다장조, 도-솔-라-파
  meadow: {
    bpm: 112, steps: 32,
    melody: n(`0:${C + 12} 1:${C + 16} 2:${C + 19}:2 4:${C + 16} 5:${C + 19} 6:${C + 24}:2
               8:${C + 19} 9:${C + 17} 10:${C + 16}:2 12:${C + 14}:2 14:${C + 11}:2
               16:${C + 12} 17:${C + 16} 18:${C + 21}:2 20:${C + 19} 21:${C + 16} 22:${C + 12}:2
               24:${C + 17} 25:${C + 16} 26:${C + 14}:2 28:${C + 12}:4`),
    bass: n(`0:${C - 12}:4 4:${C - 5}:4 8:${C - 5}:4 12:${C - 10}:4 16:${C - 3}:4 20:${C - 8}:4 24:${C - 7}:4 28:${C - 12}:4`),
    chords: [[C, C + 4, C + 7], [C - 1, C + 2, C + 7], [C, C + 4, C + 9], [C, C + 5, C + 9]],
  },
  // 숲: 사뿐사뿐 걷는 사장조 오음음계
  forest: {
    bpm: 100, steps: 32,
    melody: n(`0:${C + 7} 2:${C + 11} 3:${C + 14} 4:${C + 16}:2 6:${C + 14}:2
               8:${C + 11} 10:${C + 9} 11:${C + 7} 12:${C + 4}:4
               16:${C + 7} 18:${C + 9} 19:${C + 11} 20:${C + 14}:2 22:${C + 16}:2
               24:${C + 14} 25:${C + 11} 26:${C + 9}:2 28:${C + 7}:4`),
    bass: n(`0:${C - 5}:4 4:${C - 10}:4 8:${C - 8}:4 12:${C - 3}:4 16:${C - 5}:4 20:${C - 10}:4 24:${C - 3}:4 28:${C - 5}:4`),
    chords: [[C - 5, C - 1, C + 2], [C - 3, C + 0, C + 4], [C - 5, C - 1, C + 2], [C - 3, C + 2, C + 6]],
  },
  // 음악대: 신나는 행진곡 (브레멘 음악대 마지막)
  band: {
    bpm: 126, steps: 32,
    melody: n(`0:${C + 7} 1:${C + 7} 2:${C + 12}:2 4:${C + 11} 5:${C + 12} 6:${C + 14}:2
               8:${C + 16} 9:${C + 14} 10:${C + 12} 11:${C + 11} 12:${C + 9}:2 14:${C + 7}:2
               16:${C + 9} 17:${C + 9} 18:${C + 14}:2 20:${C + 12} 21:${C + 14} 22:${C + 16}:2
               24:${C + 17} 25:${C + 16} 26:${C + 14} 27:${C + 11} 28:${C + 12}:4`),
    bass: n(`0:${C - 12}:2 2:${C - 5}:2 4:${C - 12}:2 6:${C - 5}:2 8:${C - 7}:2 10:${C - 3}:2 12:${C - 10}:2 14:${C - 5}:2
             16:${C - 15}:2 18:${C - 8}:2 20:${C - 10}:2 22:${C - 5}:2 24:${C - 7}:2 26:${C - 5}:2 28:${C - 12}:4`),
    chords: [[C, C + 4, C + 7], [C - 3, C, C + 4], [C - 1, C + 2, C + 7], [C, C + 4, C + 7]],
  },
  // 밤(해님 달님): 조용하고 신비로운 오음음계
  night: {
    bpm: 76, steps: 32,
    melody: n(`0:${C + 9}:2 2:${C + 12}:2 4:${C + 14}:4
               8:${C + 16}:2 10:${C + 14}:2 12:${C + 12}:4
               16:${C + 9}:2 18:${C + 7}:2 20:${C + 9}:4
               24:${C + 12}:2 26:${C + 7}:2 28:${C + 9}:4`),
    bass: n(`0:${C - 15}:8 8:${C - 20}:8 16:${C - 17}:8 24:${C - 15}:8`),
    chords: [[C - 3, C + 2, C + 4], [C - 8, C - 3, C + 2], [C - 5, C, C + 4], [C - 3, C + 2, C + 7]],
  },
  // 할머니 댁: 살금살금, 조금 궁금한 가단조
  room: {
    bpm: 84, steps: 32,
    melody: n(`0:${C + 9} 2:${C + 12} 4:${C + 16}:2 6:${C + 15}:2
               8:${C + 14}:2 10:${C + 12} 11:${C + 11} 12:${C + 9}:4
               16:${C + 5} 18:${C + 9} 20:${C + 12}:2 22:${C + 11}:2
               24:${C + 8}:2 26:${C + 11}:2 28:${C + 9}:4`),
    bass: n(`0:${C - 15}:8 8:${C - 19}:8 16:${C - 19}:8 24:${C - 16}:8`),
    chords: [[C - 3, C, C + 4], [C - 7, C - 3, C], [C - 7, C - 3, C + 2], [C - 4, C - 1, C + 4]],
  },
};

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

let master: GainNode | null = null;
let current = '';
let timer: number | null = null;
let nextTime = 0, step = 0;
const BASE = 0.16;   // 배경음악 전체 크기
let muted = false;

function out() {
  const ac = audioCtx();
  if (!master) { master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination); }
  return master;
}

/* 오르골 소리: 맑게 울리고 빨리 사라지는 소리 */
function bell(t: number, midi: number, dur: number, vol: number) {
  const ac = audioCtx();
  const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
  o.type = 'triangle'; o.frequency.value = hz(midi);
  o2.type = 'sine'; o2.frequency.value = hz(midi + 12);   // 한 옥타브 위를 살짝 섞어 반짝이게
  const g2 = ac.createGain(); g2.gain.value = 0.25;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.35, dur * 1.6));
  o.connect(g); o2.connect(g2).connect(g); g.connect(out());
  o.start(t); o2.start(t); o.stop(t + dur * 1.6 + 0.4); o2.stop(t + dur * 1.6 + 0.4);
}

/* 부드러운 베이스·화음 */
function pad(t: number, midi: number, dur: number, vol: number) {
  const ac = audioCtx();
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.value = hz(midi);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.08);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out());
  o.start(t); o.stop(t + dur + 0.05);
}

function tick() {
  const ac = audioCtx(), song = SONGS[current];
  if (!song) return;
  const eighth = 60 / song.bpm / 2;
  while (nextTime < ac.currentTime + 0.2) {
    const s = step % song.steps;
    song.melody.filter(([st]) => st === s).forEach(([, m, len]) => bell(nextTime, m, len * eighth, 0.22));
    song.bass.filter(([st]) => st === s).forEach(([, m, len]) => pad(nextTime, m, len * eighth, 0.18));
    if (s % 8 === 0) song.chords[(s / 8) % song.chords.length].forEach(m => pad(nextTime, m, 8 * eighth, 0.035));
    if (s % 2 === 1) song.chords[Math.floor(s / 8) % song.chords.length]
      .slice(0, 1).forEach(m => bell(nextTime, m + 12, eighth, 0.05));   // 살랑이는 반주
    nextTime += eighth; step++;
  }
}

/* 곡 바꾸기. 같은 곡이면 그대로 이어서 연주해요 */
export function playMusic(name: keyof typeof SONGS) {
  try {
    const ac = audioCtx(), g = out();
    if (current === name && timer) return;
    current = name;
    g.gain.cancelScheduledValues(ac.currentTime);
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(muted ? 0 : BASE, ac.currentTime + 1.2);
    nextTime = ac.currentTime + 0.1; step = 0;
    if (!timer) timer = window.setInterval(tick, 50);
  } catch { /* 소리를 못 내는 기기 */ }
}

/* 대사가 나오는 동안 작게 */
export function duck(on: boolean) {
  if (!master || muted) return;
  const ac = audioCtx();
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setTargetAtTime(on ? BASE * 0.35 : BASE, ac.currentTime, 0.15);
}

export function setMusicMuted(m: boolean) {
  muted = m;
  if (!master) return;
  const ac = audioCtx();
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setTargetAtTime(m ? 0 : BASE, ac.currentTime, 0.2);
}
export const isMusicMuted = () => muted;
