/* ============================================================
   成交方程式 · Showreel — engine
   Deterministic timeline: every frame is a pure function of t,
   so the same code drives the live player and the MP4 render.
   ============================================================ */
(function () {
  'use strict';
  const W = 1920, H = 1080, PI = Math.PI, TAU = PI * 2;

  const COL = {
    ink: '#0A0C14', ivory: '#F3EEE4', mute: '#A3A0AE', dim: '#5F5D6D',
    gold: '#D8BC80', need: '#FF6A55', value: '#FFB443', perk: '#2FD9B0',
    trust: '#5B85FF', scarce: '#AE7BFF', alarm: '#FF5A67'
  };
  const GATE_KEYS = ['need', 'value', 'perk', 'trust', 'scarce'];
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const GATE_RGB = GATE_KEYS.map(k => hex(COL[k]));
  const GOLD = hex(COL.gold), IVORY = hex(COL.ivory);

  /* ---------- math ---------- */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const E_ = {
    outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outBack: t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  };
  const seg = (t, a, b) => clamp((t - a) / (b - a));

  /* ---------- DOM helpers ---------- */
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const CLS = { g: 'c-gold', m: 'c-mute', d: 'c-dim', n: 'c-need', v: 'c-value', p: 'c-perk', t: 'c-trust', s: 'c-scarce', a: 'c-alarm', o: 'op', b: 'bnum', B: 'bnum c-gold' };
  function rich(text) {
    let out = '';
    const emit = (s, cls) => {
      for (const ch of s) {
        if (ch === '\n') out += '<br>';
        else out += '<span class="ch' + (cls ? ' ' + cls : '') + '">' + esc(ch) + '</span>';
      }
    };
    const re = /\{(\w):([^}]*)\}/g; let last = 0, m;
    while ((m = re.exec(text))) { emit(text.slice(last, m.index)); emit(m[2], CLS[m[1]]); last = re.lastIndex; }
    emit(text.slice(last));
    return out;
  }
  // plain markup (no per-char spans): {g:..} → colored span
  function tint(text) {
    return esc(text).replace(/\{(\w):([^}]*)\}/g, (_, c, s) => '<span class="' + CLS[c] + '">' + s + '</span>').replace(/\n/g, '<br>');
  }
  const UNITLESS = { opacity: 1, lineHeight: 1, zIndex: 1, fontWeight: 1, flex: 1, scale: 1 };
  function E(parent, cls, css, html, tag) {
    const e = document.createElement(tag || 'div');
    if (cls) e.className = cls;
    if (css) for (const k in css) e.style[k] = (typeof css[k] === 'number' && !UNITLESS[k]) ? css[k] + 'px' : css[k];
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    // centered boxes: let GSAP own the -50% so later transform tweens compose with it
    if (cls && /(^|\s)ctr(\s|$)/.test(cls) && window.gsap) gsap.set(e, { xPercent: -50 });
    return e;
  }
  // absolutely positioned text; returns element (chars available via .chs)
  function T(parent, x, y, cls, text, css, split) {
    const el = E(parent, 'a ' + (cls || ''), Object.assign({ left: x, top: y }, css || {}));
    if (split === false) el.innerHTML = tint(text);
    else { el.innerHTML = rich(text); el.chs = el.querySelectorAll('.ch'); }
    return el;
  }
  const SVGNS = 'http://www.w3.org/2000/svg';
  function S(parent, tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }
  function svgLayer(parent, css) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('width', W); s.setAttribute('height', H); s.setAttribute('viewBox', `0 0 ${W} ${H}`);
    s.style.position = 'absolute'; s.style.left = '0'; s.style.top = '0'; s.style.overflow = 'visible';
    if (css) Object.assign(s.style, css);
    parent.appendChild(s);
    return s;
  }
  const fmtInt = n => Math.round(n).toLocaleString('en-US');

  /* ---------- reels ---------- */
  const REELS = {};
  let CUR = null;

  function newP(extra) {
    return Object.assign({
      dot: 0, dustA: 0, flash: 0, sweep: 0, fade: 0,
      gemA: 0, gemX: 960, gemY: 540, gemR: 230, gemRot: 0, gemSpin: .16,
      gemLine: 0, gemFill: 0, gemFire: 0, gemCut: 6, gemRays: 0,
      beamA: 1, beamSet: 0, b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, bOut: 0, beamFlow: 0
    }, extra || {});
  }

  function makeReel(id, opts) {
    const root = E(document.getElementById('scenes'), 'reel');
    root.dataset.reel = id;
    const reel = {
      id, root, P: newP(), hooks: [], chapters: [], dur: opts.dur, audio: opts.audio,
      label: opts.label, beamSets: [], hud: !!opts.hud,
      tl: gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
    };
    REELS[id] = reel;
    return reel;
  }

  // one scene = one absolutely positioned root that is visible only inside [s, s+d]
  function scene(reel, s, d, build, chapter) {
    const root = E(reel.root, 'scene');
    const tl = reel.tl;
    tl.set(root, { autoAlpha: 1 }, s);
    tl.set(root, { autoAlpha: 0 }, s + d);
    if (chapter) reel.chapters.push(Object.assign({ start: s, dur: d }, chapter));
    const ctx = {
      reel, root, tl, s, d, P: reel.P,
      at: x => s + x,
      // P tween (canvas params): fromTo with lazy render so multiple tweens chain cleanly
      p(prop, from, to, x, dur, ease) {
        tl.fromTo(reel.P, { [prop]: from }, { [prop]: to, duration: dur, ease: ease || 'power2.inOut', immediateRender: false }, s + x);
      },
      pset(prop, v, x) { tl.set(reel.P, { [prop]: v }, s + x); },
      // P tween with lazy start value (chains from whatever the previous tween left)
      pt(prop, to, x, dur, ease) {
        tl.to(reel.P, { [prop]: to, duration: dur, ease: ease || 'power2.inOut' }, s + x);
      },
      // frame hook: runs on every frame while the scene is on screen; fn(localTimeFromX0, t)
      hook(x0, fn) { reel.hooks.push({ s, e: s + d, fn: (lt, t) => fn(lt - x0, t) }); },
      // entrances ---------------------------------------------------
      chars(el, x, o) {
        o = o || {};
        const from = { opacity: 0, y: o.y != null ? o.y : 46 };
        const to = { opacity: 1, y: 0, duration: o.d || .9, ease: o.ease || 'expo.out', stagger: o.st != null ? o.st : .035 };
        if (o.blur) { from.filter = `blur(${o.blur}px)`; to.filter = 'blur(0px)'; }
        if (o.sc) { from.scale = o.sc; to.scale = 1; }
        if (o.rot) { from.rotation = o.rot; to.rotation = 0; }
        tl.fromTo(el.chs, from, to, s + x);
      },
      fade(el, x, o) {
        o = o || {};
        const from = { opacity: 0 }, to = { opacity: 1, duration: o.d || .8, ease: o.ease || 'power2.out' };
        if (o.y != null) { from.y = o.y; to.y = 0; }
        if (o.x != null) { from.x = o.x; to.x = 0; }
        if (o.sc != null) { from.scale = o.sc; to.scale = 1; }
        if (o.blur) { from.filter = `blur(${o.blur}px)`; to.filter = 'blur(0px)'; }
        if (o.st) to.stagger = o.st;
        tl.fromTo(el, from, to, s + x);
      },
      out(el, x, o) {
        o = o || {};
        const to = { opacity: 0, duration: o.d || .5, ease: o.ease || 'power2.in' };
        if (o.y != null) to.y = o.y;
        if (o.x != null) to.x = o.x;
        if (o.sc != null) to.scale = o.sc;
        if (o.blur) to.filter = `blur(${o.blur}px)`;
        if (o.st) to.stagger = o.st;
        tl.to(el, to, s + x);
      },
      grow(el, x, d, o) { // scaleX line draw
        tl.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: d || .9, ease: (o && o.ease) || 'expo.out' }, s + x);
      },
      // exit everything in the scene at the end (plus prism sweep)
      exit(x, o) {
        o = o || {};
        // autoAlpha (not opacity) so a backward seek restores visibility together with opacity
        tl.to(root, { autoAlpha: 0, duration: o.d || .5, ease: 'power2.in' }, s + (x != null ? x : d - .55));
      },
      sweep(x) { this.p('sweep', 0, 1, x, .9, 'power1.inOut'); }
    };
    build(ctx);
    return ctx;
  }

  // chapter slate: number + name + english
  function slate(c, no, nm, en, x) {
    x = x || 0;
    const el = E(c.root, 'a slate');
    // number follows the chapter order of whichever reel this scene sits in
    if (c.reel.chapters.length) no = String(c.reel.chapters.length).padStart(2, '0');
    el.innerHTML = `<span class="no">${no}</span><span class="nm">${nm}</span><span class="en">${en}</span>`;
    const rule = E(c.root, 'rule', { left: 120, top: 208, width: 1680 });
    c.fade(el.children, x + .05, { y: 24, st: .08, d: .9, ease: 'expo.out' });
    c.grow(rule, x + .2, 1.4);
    return el;
  }

  /* ---------- canvas FX ---------- */
  let cv, g;
  const GRAIN = document.createElement('canvas');
  function initFX() {
    cv = document.getElementById('fx');
    cv.width = W; cv.height = H;
    g = cv.getContext('2d');
    GRAIN.width = GRAIN.height = 256;
    const gx = GRAIN.getContext('2d'), id = gx.createImageData(256, 256);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = (hash(i * .013) * 255) | 0;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
    }
    gx.putImageData(id, 0, 0);
  }

  // round-brilliant top view, unit radius
  const GEM = (function () {
    const rt = .5, rs = .74, F = [];
    const th = k => k * PI / 4 + PI / 8;
    const Tv = k => [rt * Math.cos(th(k)), rt * Math.sin(th(k))];
    const Sv = k => [rs * Math.cos(th(k) + PI / 8), rs * Math.sin(th(k) + PI / 8)];
    const Gv = a => [Math.cos(a), Math.sin(a)];
    const arc = (a0, a1, n) => { const p = []; for (let i = 0; i <= n; i++) p.push(Gv(a0 + (a1 - a0) * i / n)); return p; };
    F.push({ pts: [0, 1, 2, 3, 4, 5, 6, 7].map(Tv), az: 0, tilt: 0, grp: 0 });
    for (let k = 0; k < 8; k++) F.push({ pts: [Tv(k), Tv((k + 1) % 8), Sv(k)], az: th(k) + PI / 8, tilt: .30, grp: 1 });
    for (let k = 0; k < 8; k++) F.push({ pts: [Tv(k), Sv((k + 7) % 8), Gv(th(k)), Sv(k)], az: th(k), tilt: .62, grp: k % 2 ? 3 : 2 });
    for (let k = 0; k < 8; k++) {
      const a0 = th(k), am = th(k) + PI / 8, a1 = th(k) + PI / 4;
      F.push({ pts: [Sv(k)].concat(arc(a0, am, 5)), az: (a0 + am) / 2, tilt: .80, grp: 4 });
      F.push({ pts: [Sv(k)].concat(arc(am, a1, 5)), az: (am + a1) / 2, tilt: .80, grp: 5 });
    }
    F.forEach((f, i) => {
      f.i = i;
      let cx = 0, cy = 0; f.pts.forEach(p => { cx += p[0]; cy += p[1]; });
      f.c = [cx / f.pts.length, cy / f.pts.length];
    });
    // edges in drawing order (for the line-draw reveal)
    const L = [];
    for (let k = 0; k < 8; k++) L.push([Tv(k), Tv((k + 1) % 8), 1]);
    for (let k = 0; k < 8; k++) { L.push([Tv(k), Sv(k), 2]); L.push([Sv(k), Tv((k + 1) % 8), 2]); }
    for (let k = 0; k < 8; k++) { L.push([Sv((k + 7) % 8), Gv(th(k)), 3]); L.push([Gv(th(k)), Sv(k), 3]); }
    for (let k = 0; k < 8; k++) L.push([Sv(k), Gv(th(k) + PI / 8), 4]);
    return { F, L };
  })();

  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

  function drawGem(P, t) {
    if (P.gemA <= .002) return;
    const R = P.gemR, rot = P.gemRot + t * P.gemSpin, A = P.gemA;
    const fire = P.gemFire, fill = P.gemFill, line = P.gemLine;
    g.save();
    g.translate(P.gemX, P.gemY);
    // glow
    g.globalCompositeOperation = 'lighter';
    const gl = g.createRadialGradient(0, 0, R * .1, 0, 0, R * 2.1);
    gl.addColorStop(0, `rgba(120,150,255,${.20 * A * (.45 + .55 * fill)})`);
    gl.addColorStop(.45, `rgba(90,110,200,${.07 * A * (.4 + .6 * fire)})`);
    gl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gl; g.fillRect(-R * 2.2, -R * 2.2, R * 4.4, R * 4.4);
    // dispersion rays
    if (P.gemRays > .01) {
      for (let i = 0; i < 20; i++) {
        const a = i / 20 * TAU + t * .05 + hash(i) * .3, len = R * (1.6 + 1.4 * hash(i + 3));
        const c = GATE_RGB[i % 5], al = P.gemRays * A * .10 * (.5 + .5 * Math.sin(t * 1.3 + i));
        const gr = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        gr.addColorStop(0, rgba(c, al)); gr.addColorStop(1, rgba(c, 0));
        g.strokeStyle = gr; g.lineWidth = 2 + 3 * hash(i + 9);
        g.beginPath(); g.moveTo(Math.cos(a) * R * .9, Math.sin(a) * R * .9); g.lineTo(Math.cos(a) * len, Math.sin(a) * len); g.stroke();
      }
    }
    g.globalCompositeOperation = 'source-over';
    g.rotate(rot);
    // light directions
    const L1 = norm([Math.cos(t * .62) * .62, Math.sin(t * .47) * .5 - .25, .62]);
    const L2 = norm([-.55, .35, .76]);
    const glints = [];
    if (fill > .002) {
      for (const f of GEM.F) {
        const s = Math.sin(f.tilt), c = Math.cos(f.tilt);
        const n = [s * Math.cos(f.az + rot), s * Math.sin(f.az + rot), c];
        const d1 = Math.max(0, n[0] * L1[0] + n[1] * L1[1] + n[2] * L1[2]);
        const d2 = Math.max(0, n[0] * L2[0] + n[1] * L2[1] + n[2] * L2[2]);
        const spec = Math.min(1.4, Math.pow(d1, 30) * 1.4 + Math.pow(d2, 70) * .7);
        let b = .08 + .40 * d1 + .16 * d2;
        b *= .82 + .3 * hash(f.i * 1.7) + .08 * Math.sin(t * 2.3 + f.i);
        let col = mix3([15, 19, 36], [190, 208, 245], clamp(b));
        const fc = GATE_RGB[(f.i + Math.floor(t * 1.2)) % 5];
        col = mix3(col, fc, clamp(spec * fire * 1.1 + fire * .12 * hash(f.i + Math.floor(t * 2))));
        col = mix3(col, [255, 255, 255], clamp(spec * .7));
        const cut = clamp(P.gemCut - f.grp);
        if (cut < 1) col = mix3([30, 33, 48], col, cut);
        g.fillStyle = rgba(col, A * fill * (.9 + .1 * cut));
        g.beginPath();
        f.pts.forEach((p, j) => (j ? g.lineTo(p[0] * R, p[1] * R) : g.moveTo(p[0] * R, p[1] * R)));
        g.closePath(); g.fill();
        if (spec * cut > .55) glints.push([f.c[0] * R, f.c[1] * R, spec * cut, f.i]);
      }
    }
    // facet lines
    g.lineJoin = 'round';
    if (line >= .999) {
      g.strokeStyle = rgba(GOLD, A * lerp(.9, .32, fill));
      g.lineWidth = 1.4;
      for (const f of GEM.F) {
        g.beginPath();
        f.pts.forEach((p, j) => (j ? g.lineTo(p[0] * R, p[1] * R) : g.moveTo(p[0] * R, p[1] * R)));
        g.closePath(); g.stroke();
      }
    } else if (line > 0) {
      g.strokeStyle = rgba(GOLD, A * .95);
      g.lineWidth = 1.6;
      // girdle circle first (0 → .3)
      const gc = seg(line, 0, .3);
      if (gc > 0) { g.beginPath(); g.arc(0, 0, R, -PI / 2, -PI / 2 + TAU * E_.inOut(gc)); g.stroke(); }
      const rest = seg(line, .28, 1), n = GEM.L.length;
      for (let i = 0; i < n; i++) {
        const e = GEM.L[i], p = clamp(rest * n * 1.0 - i * .85, 0, 1);
        if (p <= 0) continue;
        g.beginPath(); g.moveTo(e[0][0] * R, e[0][1] * R);
        g.lineTo(lerp(e[0][0], e[1][0], p) * R, lerp(e[0][1], e[1][1], p) * R); g.stroke();
      }
    }
    // glints
    g.globalCompositeOperation = 'lighter';
    for (const q of glints) {
      const sz = R * .34 * clamp(q[2] - .45), a = A * clamp(q[2]) * .9;
      const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], sz * .5);
      gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(q[0], q[1], sz * .5, 0, TAU); g.fill();
      g.strokeStyle = `rgba(255,250,240,${a * .8})`; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(q[0] - sz, q[1]); g.lineTo(q[0] + sz, q[1]); g.moveTo(q[0], q[1] - sz); g.lineTo(q[0], q[1] + sz); g.stroke();
    }
    g.restore();
  }

  function bez(b, u) {
    const v = 1 - u;
    return [v * v * b[0] + 2 * v * u * b[2] + u * u * b[4], v * v * b[1] + 2 * v * u * b[3] + u * u * b[5]];
  }
  function drawBeams(reel, P, t) {
    const set = reel.beamSets[Math.round(P.beamSet)];
    if (!set || P.beamA <= 0) return;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    const passes = [[26, .06], [11, .16], [3.2, .9]];
    set.forEach((b, i) => {
      const pr = P['b' + i]; if (pr <= 0) return;
      const c = GATE_RGB[i], N = 70, M = Math.max(2, Math.round(N * pr));
      const pts = []; for (let k = 0; k <= M; k++) pts.push(bez(b, (k / N)));
      for (const [w, a] of passes) {
        g.strokeStyle = rgba(c, a * P.beamA); g.lineWidth = w;
        g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
      }
      const hd = pts[pts.length - 1];
      if (pr < 1) {
        const gr = g.createRadialGradient(hd[0], hd[1], 0, hd[0], hd[1], 26);
        gr.addColorStop(0, rgba([255, 255, 255], .9 * P.beamA)); gr.addColorStop(.3, rgba(c, .6 * P.beamA)); gr.addColorStop(1, rgba(c, 0));
        g.fillStyle = gr; g.beginPath(); g.arc(hd[0], hd[1], 26, 0, TAU); g.fill();
      } else if (P.beamFlow > 0) {
        for (let k = 0; k < 4; k++) {
          const u = ((t * .45 + k / 4 + i * .13) % 1), p = bez(b, u);
          g.fillStyle = rgba([255, 255, 255], .7 * P.beamFlow * P.beamA * Math.sin(u * PI));
          g.beginPath(); g.arc(p[0], p[1], 3.2, 0, TAU); g.fill();
        }
      }
    });
    if (P.bOut > 0) {
      const x0 = P.gemX + P.gemR * .6, y0 = P.gemY, x1 = lerp(x0, W + 60, E_.outCubic(P.bOut));
      for (const [w, a] of [[46, .05], [18, .14], [5, .95]]) {
        const gr = g.createLinearGradient(x0, 0, W, 0);
        gr.addColorStop(0, `rgba(255,252,244,${a * P.beamA})`); gr.addColorStop(1, `rgba(216,188,128,${a * .6 * P.beamA})`);
        g.strokeStyle = gr; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke();
      }
    }
    g.restore();
  }

  const DUST = Array.from({ length: 150 }, (_, i) => ({
    x: hash(i + .1) * W, y: hash(i + .5) * H, vx: (hash(i + .2) - .5) * 16, vy: -5 - hash(i + .3) * 16,
    r: .7 + hash(i + .7) * 1.9, ph: hash(i + .9) * TAU, sp: .5 + hash(i + .4) * 1.6,
    c: i % 11 === 0 ? GATE_RGB[i % 5] : (i % 3 ? GOLD : IVORY)
  }));

  function drawFX(reel, t) {
    const P = reel.P;
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    // velvet ground
    const bx = 960 + Math.sin(t * .05) * 160, by = 470 + Math.cos(t * .07) * 70;
    const bg = g.createRadialGradient(bx, by, 40, bx, by, 1250);
    bg.addColorStop(0, '#171C30'); bg.addColorStop(.45, '#0E111D'); bg.addColorStop(1, '#06070B');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // grain (static)
    g.globalAlpha = .05; g.globalCompositeOperation = 'overlay';
    g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H);
    g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
    // dust
    if (P.dustA > .005) {
      for (const d of DUST) {
        let x = (d.x + d.vx * t) % W; if (x < 0) x += W;
        let y = (d.y + d.vy * t) % H; if (y < 0) y += H;
        const tw = .5 + .5 * Math.sin(d.ph + t * d.sp), a = P.dustA * (.12 + .5 * tw * tw);
        g.fillStyle = rgba(d.c, a); g.beginPath(); g.arc(x, y, d.r, 0, TAU); g.fill();
      }
    }
    // point light (cold open)
    if (P.dot > .005) {
      const pr = 90 + 30 * Math.sin(t * 6), gr = g.createRadialGradient(960, 540, 0, 960, 540, pr);
      gr.addColorStop(0, `rgba(255,248,232,${P.dot})`); gr.addColorStop(.15, `rgba(216,188,128,${P.dot * .5})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(960 - pr, 540 - pr, pr * 2, pr * 2);
    }
    g.globalCompositeOperation = 'source-over';
    drawBeams(reel, P, t);
    drawGem(P, t);
    // prism sweep
    if (P.sweep > .001 && P.sweep < .999) {
      const x = lerp(-700, W + 700, P.sweep), a = Math.sin(P.sweep * PI) * .42;
      g.save(); g.globalCompositeOperation = 'lighter';
      g.translate(x, H / 2); g.transform(1, 0, -.42, 1, 0, 0);
      GATE_RGB.forEach((c, i) => {
        const gr = g.createLinearGradient(-60 + i * 30, 0, 30 + i * 30, 0);
        gr.addColorStop(0, rgba(c, 0)); gr.addColorStop(.5, rgba(c, a)); gr.addColorStop(1, rgba(c, 0));
        g.fillStyle = gr; g.fillRect(-60 + i * 30, -H, 90, H * 2);
      });
      g.restore();
    }
    if (P.flash > .002) {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(255,246,228,${P.flash})`; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
    }
    // vignette
    const vg = g.createRadialGradient(960, 540, 420, 960, 540, 1180);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.62)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (P.fade > .001) { g.fillStyle = `rgba(0,0,0,${P.fade})`; g.fillRect(0, 0, W, H); }
  }

  /* ---------- render ---------- */
  function renderAt(t) {
    const r = CUR; if (!r) return;
    t = clamp(t, 0, r.dur);
    r.tl.time(t, false);
    for (const h of r.hooks) if (t >= h.s && t <= h.e) h.fn(t - h.s, t);
    drawFX(r, t);
    r.lastT = t;
  }
  function useReel(id) {
    for (const k in REELS) REELS[k].root.style.display = k === id ? '' : 'none';
    CUR = REELS[id];
    CUR.tl.render(0, false, true);
    renderAt(0);
    return CUR;
  }

  // per-reel HUD: brand, chapter, timecode, progress with chapter ticks
  function hud(reel, showFrom, showTo, tag) {
    const h = E(reel.root, 'hudwrap');
    h.style.position = 'absolute'; h.style.inset = '0'; h.style.opacity = '0';
    E(h, 'a hud-brand', null, '<span class="disp">成交方程式</span><span class="mono">THE CLOSING EQUATION</span>');
    const ch = E(h, 'a hud-ch', null, '<span class="mono"></span><span class="sans7"></span>');
    const tc = E(h, 'a hud-tc mono', null, '00:00:00');
    E(h, 'a hud-tag mono', null, tag || 'SHOWREEL 2026');
    const bar = E(h, 'hud-bar', null, '<i></i><span class="hud-ticks"></span>');
    const fill = bar.querySelector('i'), ticks = bar.querySelector('.hud-ticks');
    const total = reel.dur, n = reel.chapters.length;
    reel.chapters.forEach(c => { const b = document.createElement('b'); b.style.left = (c.start / total * 100) + '%'; ticks.appendChild(b); });
    reel.tl.to(h, { opacity: 1, duration: .8, ease: 'power2.out' }, showFrom);
    reel.tl.to(h, { opacity: 0, duration: .6, ease: 'power2.in' }, showTo);
    const chNo = ch.children[0], chNm = ch.children[1];
    let lastIdx = -2;
    reel.hooks.push({
      s: 0, e: total, fn: (lt, t) => {
        let idx = -1;
        reel.chapters.forEach((c, i) => { if (t >= c.start) idx = i; });
        if (idx !== lastIdx) {
          lastIdx = idx;
          if (idx >= 0) { chNo.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0'); chNm.textContent = reel.chapters[idx].title; }
        }
        const fr = Math.floor(t * 30) % 30, sec = Math.floor(t) % 60, min = Math.floor(t / 60);
        tc.textContent = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0') + ':' + String(fr).padStart(2, '0');
        fill.style.width = (t / total * 100) + '%';
      }
    });
  }

  window.REEL = {
    W, H, COL, GATE_KEYS, GATE_RGB, hash, clamp, lerp, seg, E_, fmtInt,
    E, T, S, svgLayer, rich, tint, makeReel, scene, slate, hud, initFX, renderAt, useReel,
    get cur() { return CUR; }, REELS
  };
})();
