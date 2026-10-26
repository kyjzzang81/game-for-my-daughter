/* 효과음: 지금은 오실레이터로 만들고, 나중에 ElevenLabs/라이브러리 mp3로 바꿔요 */
const AC = window.AudioContext || (window as any).webkitAudioContext;
let ac: AudioContext | undefined;

/* 효과음과 배경음악이 함께 쓰는 오디오 */
export function audioCtx() { return (ac ??= new AC()); }

export function tone(f = 600, d = 0.15, type: OscillatorType = 'sine', slide = 0) {
  try {
    ac ??= new AC();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    if (slide) o.frequency.linearRampToValueAtTime(f + slide, ac.currentTime + d);
    g.gain.setValueAtTime(0.25, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
  } catch { /* 소리를 못 내는 기기는 조용히 넘어가요 */ }
}

/* iOS는 첫 터치 안에서 오디오를 깨워야 소리가 나요 */
export function unlockAudio() {
  try { ac ??= new AC(); if (ac.state === 'suspended') ac.resume(); } catch { /* 무시 */ }
}

export const sfx = {
  tap: () => tone(700, 0.12, 'triangle', 200),
  pop: () => { tone(500, 0.1, 'sine', 400); setTimeout(() => tone(900, 0.12, 'sine', 300), 90); },
  blow: () => { for (let i = 0; i < 5; i++) setTimeout(() => tone(200 + Math.random() * 100, 0.25, 'sawtooth', -150), i * 60); },
  yay: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'triangle'), i * 120)),
  oink: () => { tone(300, 0.12, 'square', -80); setTimeout(() => tone(260, 0.14, 'square', -80), 140); },
  knock: () => { tone(180, 0.12, 'square'); setTimeout(() => tone(160, 0.12, 'square'), 130); },
};
