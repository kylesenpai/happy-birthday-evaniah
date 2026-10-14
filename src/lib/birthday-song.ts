// The tune that plays once the candles are blown out.
//
// ► YOUR OWN SONG: drop an mp3 into the `public` folder (e.g. public/song.mp3)
//   and set SONG_URL below to "/song.mp3". Leave it as "" to use the built-in
//   Happy Birthday melody, which needs no file at all.
export const SONG_URL = "/mysong.mp3";

const BEAT = 0.42; // seconds per beat
const MELODY: Array<[number, number]> = [
  [55, 0.75], [55, 0.25], [57, 1], [55, 1], [60, 1.5], [59, 1.5],
  [55, 0.75], [55, 0.25], [57, 1], [55, 1], [62, 1.5], [60, 1.5],
  [55, 0.75], [55, 0.25], [67, 1], [64, 1], [60, 1], [59, 1], [57, 2],
  [65, 0.75], [65, 0.25], [64, 1], [60, 1], [62, 1], [60, 2],
];

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

let ctx: AudioContext | null = null;
let track: HTMLAudioElement | null = null;

function note(audio: AudioContext, frequency: number, start: number, length: number, gain: number, type: OscillatorType) {
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.03);
  amp.gain.setValueAtTime(gain, start + length * 0.55);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(amp).connect(audio.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

export function stopBirthdaySong() {
  if (track) { track.pause(); track = null; }
  if (ctx) { void ctx.close(); ctx = null; }
}

export async function playBirthdaySong() {
  stopBirthdaySong();
  if (SONG_URL) {
    track = new Audio(SONG_URL);
    track.volume = 0.7;
    try {
      await track.play();
      return;
    } catch {
      track = null; // fall through to the built-in melody
    }
  }
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;
  ctx = new AudioCtor();
  await ctx.resume();
  let at = ctx.currentTime + 0.15;
  for (const [midi, beats] of MELODY) {
    const length = beats * BEAT;
    note(ctx, hz(midi), at, length * 0.94, 0.16, "triangle");
    note(ctx, hz(midi) / 2, at, length * 0.94, 0.05, "sine");
    at += length;
  }
  const closing = ctx;
  window.setTimeout(() => { if (ctx === closing) void closing.close().finally(() => { ctx = null; }); }, (at - ctx.currentTime) * 1000 + 300);
}
