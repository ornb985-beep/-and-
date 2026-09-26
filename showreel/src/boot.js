/* ============================================================
   成交方程式 · boot: build reels, then either
   - render mode (?render): expose frame-exact API for the MP4 renderer
   - player mode: scaled stage + controls + reel tabs + chapters
   ============================================================ */
(function () {
  'use strict';
  const R = window.REEL;
  const RENDER = /[?&]render\b/.test(location.search);

  async function fontsReady() {
    const faces = ['900 64px ReelSerif', '400 32px ReelSans', '700 32px ReelSans', 'italic 500 64px ReelBodoni', 'italic 700 64px ReelBodoni', '400 20px ReelMono'];
    try { await Promise.all(faces.map(f => document.fonts.load(f, '成交方程式ABC123'))); await document.fonts.ready; } catch (e) { /* fall back to system fonts */ }
  }

  const ready = (async function () {
    await fontsReady();
    R.initFX();
    const order = [];
    if (R.buildFull) order.push(R.buildFull());
    if (R.buildInvestor) order.push(R.buildInvestor());
    if (R.buildTeaser) order.push(R.buildTeaser());
    if (R.buildLessons) R.buildLessons().forEach(r => order.push(r));
    R.ORDER = order;
    R.useReel(order[0].id);
    return order.map(r => ({ id: r.id, label: r.label, dur: r.dur, audio: r.audio, chapters: r.chapters.map(c => ({ title: c.title, start: c.start })) }));
  })();

  if (RENDER) {
    document.documentElement.classList.add('render');
    window.__ready = ready;
    window.__setReel = id => { R.useReel(id); return R.cur.dur; };
    window.__render = t => { R.renderAt(t); return true; };
    return;
  }

  /* ---------------- player ---------------- */
  const $ = s => document.querySelector(s);
  const screen = $('#screen'), stage = $('#stage');
  if (!screen || !stage) return;
  const ui = {
    pp: $('#pp'), tc: $('#tc'), scrub: $('#scrub'), fill: $('#scrub .fill'), knob: $('#scrub .knob'), marks: $('#scrub .marks'),
    snd: $('#snd'), spd: $('#spd'), fs: $('#fs'), big: $('#bigplay'), tabs: $('#reels'), chapters: $('#chapters'), now: $('#nowtitle')
  };
  const audio = new Audio();
  audio.preload = 'auto';
  let audioOK = true, playing = false, t = 0, lastPerf = 0, rate = 1, muted = false, scrubbing = false, info = [];
  audio.addEventListener('error', () => { audioOK = false; });

  function fit() {
    const k = screen.clientWidth / 1920;
    stage.style.transform = `scale(${k})`;
  }
  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(screen);
  fit();

  const fmt = s => { s = Math.max(0, s); const m = Math.floor(s / 60), x = Math.floor(s % 60); return String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0'); };
  function syncUI() {
    const d = R.cur.dur;
    ui.tc.textContent = fmt(t) + ' / ' + fmt(d);
    const p = (t / d * 100) + '%';
    ui.fill.style.width = p; ui.knob.style.left = p;
    ui.pp.textContent = playing ? '暂停' : (t >= d - .05 ? '重播' : '播放');
    ui.pp.setAttribute('aria-label', ui.pp.textContent);
    ui.big.hidden = playing || (t > 0.05 && t < d - .05);
    const chs = ui.chapters.querySelectorAll('[data-t]');
    let cur = -1; chs.forEach((el, i) => { if (t >= +el.dataset.t) cur = i; });
    chs.forEach((el, i) => el.classList.toggle('on', i === cur));
  }
  function frame() {
    if (!playing) return;
    if (audioOK && !audio.paused && !audio.ended) t = audio.currentTime;
    else { const now = performance.now(); t += (now - lastPerf) / 1000 * rate; lastPerf = now; }
    if (t >= R.cur.dur) { t = R.cur.dur; pause(); }
    R.renderAt(t); syncUI();
    requestAnimationFrame(frame);
  }
  function play() {
    if (t >= R.cur.dur - .05) t = 0;
    playing = true; lastPerf = performance.now();
    if (audioOK && R.cur.audio) {
      try { audio.currentTime = t; } catch (e) { /* not loaded yet */ }
      audio.muted = muted; audio.playbackRate = rate;
      const p = audio.play(); if (p && p.catch) p.catch(() => { audioOK = false; lastPerf = performance.now(); });
    }
    requestAnimationFrame(frame); syncUI();
  }
  function pause() { playing = false; audio.pause(); syncUI(); }
  function seek(nt) {
    t = Math.max(0, Math.min(R.cur.dur, nt));
    if (audioOK) { try { audio.currentTime = t; } catch (e) { /* ignore */ } }
    lastPerf = performance.now();
    R.renderAt(t); syncUI();
  }
  function setReel(id, poster) {
    pause();
    R.useReel(id);
    const meta = info.find(r => r.id === id);
    audioOK = true;
    if (R.cur.audio) { audio.src = R.cur.audio; audio.load(); } else audioOK = false;
    ui.tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    ui.now.textContent = meta.label;
    // chapter marks on the scrubber + chapter list
    ui.marks.innerHTML = '';
    meta.chapters.forEach(c => { const b = document.createElement('b'); b.style.left = (c.start / meta.dur * 100) + '%'; ui.marks.appendChild(b); });
    ui.chapters.innerHTML = meta.chapters.map((c, i) =>
      `<button class="chap" data-t="${c.start}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="tt">${c.title}</span><span class="ts">${fmt(c.start)}</span></button>`).join('');
    ui.chapters.hidden = !meta.chapters.length;
    t = 0;
    seek(poster != null ? poster : 0);
    try { localStorage.setItem('reel', id); } catch (e) { /* ignore */ }
  }

  ready.then(list => {
    info = list;
    const btn = r => `<button data-id="${r.id}" aria-pressed="false"><span>${r.label}</span><small>${fmt(r.dur)}</small></button>`;
    const val = list.filter(r => !/^l\d/.test(r.id)), les = list.filter(r => /^l\d/.test(r.id));
    ui.tabs.innerHTML = '<div class="grp">价值动画</div>' + val.map(btn).join('') +
      (les.length ? '<div class="grp">分阶段教学动画 · 一课只教一件事</div>' + les.map(btn).join('') : '');
    ui.tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setReel(b.dataset.id, 0); });
    let start = list[0].id;
    try { const s = localStorage.getItem('reel'); if (s && list.some(r => r.id === s)) start = s; } catch (e) { /* ignore */ }
    const h = (location.hash || '').slice(1);
    if (h && list.some(r => r.id === h)) start = h;
    setReel(start, start === 'full' ? 10.8 : 0);
    document.body.classList.add('ready');
  });

  ui.pp.addEventListener('click', () => (playing ? pause() : play()));
  ui.big.addEventListener('click', () => { if (t > 5 && !playing) t = 0; play(); });
  screen.addEventListener('click', e => { if (e.target === screen || e.target.closest('#stage')) playing ? pause() : play(); });
  ui.chapters.addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) { seek(+b.dataset.t + .01); if (!playing) play(); } });
  ui.snd.addEventListener('click', () => { muted = !muted; audio.muted = muted; ui.snd.textContent = muted ? '声音：关' : '声音：开'; ui.snd.setAttribute('aria-pressed', String(!muted)); });
  ui.spd.addEventListener('click', () => { rate = rate === 1 ? .75 : rate === .75 ? .5 : 1; audio.playbackRate = rate; ui.spd.textContent = rate + '×'; });
  ui.fs.addEventListener('click', () => {
    const el = screen;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', fit);
  // scrubbing
  const pos = e => { const r = ui.scrub.getBoundingClientRect(); return Math.max(0, Math.min(1, ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width)); };
  let wasPlaying = false;
  const down = e => { scrubbing = true; wasPlaying = playing; if (playing) pause(); seek(pos(e) * R.cur.dur); e.preventDefault(); };
  const move = e => { if (scrubbing) seek(pos(e) * R.cur.dur); };
  const up = () => { if (scrubbing) { scrubbing = false; if (wasPlaying) play(); } };
  ui.scrub.addEventListener('mousedown', down); window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  ui.scrub.addEventListener('touchstart', down, { passive: false }); window.addEventListener('touchmove', move, { passive: true }); window.addEventListener('touchend', up);
  ui.scrub.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { seek(t + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { seek(t - 5); e.preventDefault(); }
  });
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea,[contenteditable]')) return;
    if (e.code === 'Space' && (e.target === document.body || e.target.closest('#player'))) { e.preventDefault(); playing ? pause() : play(); }
    else if (e.key === 'f' || e.key === 'F') ui.fs.click();
    else if (e.key === 'm' || e.key === 'M') ui.snd.click();
  });
})();
