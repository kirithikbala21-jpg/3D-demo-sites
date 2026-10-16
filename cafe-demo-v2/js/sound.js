// Optional ambient room tone made with the Web Audio API (no audio files). Off by default; starts only after a click.
import { $$ } from './util.js';

let ctx = null, master = null, running = false, clinkTimer = 0;

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0;
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; } // brown noise
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
  src.connect(lp).connect(master); master.connect(ctx.destination);
  src.start();
  return true;
}
function clink() {
  if (!running) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = 2200 + Math.random() * 1600;
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
  o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + 0.4);
  clinkTimer = setTimeout(clink, 2500 + Math.random() * 6000);
}
async function toggle() {
  if (!ctx && !build()) return;
  if (ctx.state === 'suspended') await ctx.resume();
  running = !running;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.linearRampToValueAtTime(running ? 0.07 : 0, ctx.currentTime + 0.8);
  clearTimeout(clinkTimer);
  if (running) clinkTimer = setTimeout(clink, 1500);
  $$('[data-sound]').forEach((b) => { b.setAttribute('aria-pressed', String(running)); b.querySelector('[data-sound-state]').textContent = running ? 'on' : 'off'; });
}
$$('[data-sound]').forEach((b) => b.addEventListener('click', toggle));
