// Dump reel timings (durations, chapters, lesson beats) so the soundtrack can hit every cue.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('file://' + path.join(REPO, 'dist', 'render.html') + '?render');
const list = await p.evaluate(() => window.__ready);
const lessons = await p.evaluate(() => (window.REEL.LESSONS || []).map(L => ({ id: 'l' + L.no, beats: L.beats.map(b => ({ t: b.t, dur: b.dur })) })));
for (const r of list) {
  const L = lessons.find(l => l.id === r.id);
  if (L) { let x = 0; r.beats = L.beats.map(b => { const o = { type: b.t, start: +x.toFixed(3), dur: b.dur }; x += b.dur; return o; }); }
}
await b.close();
const out = path.join(HERE, 'timings.json');
fs.writeFileSync(out, JSON.stringify(list, null, 1));
console.log('wrote', out, list.map(r => `${r.id}:${r.dur}s`).join(' '));
