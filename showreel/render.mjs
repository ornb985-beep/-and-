// Frame-exact renderer for the 成交方程式 reels.
//
//   node showreel/render.mjs sheet <reelId> [t1,t2,...]      → contact sheet PNG of chosen frames
//   node showreel/render.mjs video <reelId> <out.mp4> [--fps 30] [--workers 4] [--audio file]
//
// Every frame is produced by seeking the deterministic timeline (window.__render(t)),
// so the MP4 matches the live page exactly, independent of machine speed.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const PAGE = 'file://' + path.join(REPO, 'dist', 'render.html') + '?render';
const FFMPEG = process.env.FFMPEG || execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto(PAGE);
  const list = await page.evaluate(() => window.__ready);
  return { page, list };
}

async function sheet(reelId, times) {
  const browser = await chromium.launch();
  const { page, list } = await openPage(browser);
  const meta = list.find(r => r.id === reelId);
  if (!meta) throw new Error('unknown reel ' + reelId + ' — have: ' + list.map(r => r.id).join(', '));
  await page.evaluate(id => window.__setReel(id), reelId);
  if (!times.length) { const n = 24; for (let i = 0; i < n; i++) times.push(+(meta.dur * (i + .5) / n).toFixed(2)); }
  const outDir = path.join(REPO, '.render', 'sheets', reelId);
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  for (const t of times) {
    await page.evaluate(tt => window.__render(tt), t);
    const f = path.join(outDir, `t${String(t).padStart(6, '0')}.jpg`);
    await page.screenshot({ path: f, type: 'jpeg', quality: 80 });
    files.push([t, f]);
  }
  await browser.close();
  // tile into a contact sheet with ffmpeg (4 columns, 480px wide cells)
  const cols = 4, list2 = path.join(outDir, 'list.txt');
  fs.writeFileSync(list2, files.map(([, f]) => `file '${f}'`).join('\n'));
  const out = path.join(REPO, '.render', `sheet-${reelId}.jpg`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list2,
    '-vf', `scale=480:-1,pad=484:274:2:2:black,tile=${cols}x${Math.ceil(files.length / cols)}`,
    '-frames:v', '1', out]);
  console.log('sheet', out, 'times', times.join(','));
}

async function video(reelId, out, fps, workers, audio, crf) {
  const browser = await chromium.launch();
  const probe = await openPage(browser);
  const meta = probe.list.find(r => r.id === reelId);
  await probe.page.close();
  const total = Math.round(meta.dur * fps);
  const tmp = path.join(REPO, '.render', 'parts', reelId);
  fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  const per = Math.ceil(total / workers);
  const t0 = Date.now();
  const parts = [];
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = w * per, b = Math.min(total, a + per);
    if (a >= b) return;
    const { page } = await openPage(browser);
    await page.evaluate(id => window.__setReel(id), reelId);
    const part = path.join(tmp, `p${w}.mp4`);
    parts[w] = part;
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-tune', 'animation', '-pix_fmt', 'yuv420p', '-r', String(fps), part], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
    for (let i = a; i < b; i++) {
      await page.evaluate(tt => window.__render(tt), i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (w === 0 && i % (fps * 5) === 0) {
        const el = (Date.now() - t0) / 1000;
        console.log(`[${reelId}] ${i - a}/${b - a} frames (worker 0) · ${el.toFixed(0)}s`);
      }
    }
    ff.stdin.end();
    await done;
    await page.close();
  }));
  await browser.close();
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
  const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
  if (audio && fs.existsSync(audio)) args.push('-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest');
  // parts are already at final quality: stream-copy the video, only the audio is encoded here
  args.push('-c:v', 'copy', '-movflags', '+faststart', out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync(FFMPEG, args, { stdio: 'inherit' });
  console.log(`video ${out} · ${total} frames · ${((Date.now() - t0) / 1000).toFixed(0)}s · ${(fs.statSync(out).size / 1048576).toFixed(1)} MB`);
}

const [cmd, reel, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
if (cmd === 'sheet') await sheet(reel, (rest[0] || '').split(',').filter(Boolean).map(Number));
else if (cmd === 'video') await video(reel, rest[0], +opt('--fps', 30), +opt('--workers', 4), opt('--audio', null), +opt('--crf', 21));
else console.log('usage: render.mjs sheet <reel> [times] | video <reel> <out.mp4> [--fps 30] [--workers 4] [--audio f]');
