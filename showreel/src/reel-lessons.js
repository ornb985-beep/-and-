/* ============================================================
   成交方程式 · 分阶段教学动画（第 0–9 课）
   Each lesson = a sequence of beats built from shared templates.
   One lesson teaches one thing and ends with its pass criterion.
   ============================================================ */
(function () {
  'use strict';
  const R = window.REEL;
  const { E, T, S, svgLayer, hash, clamp, lerp, E_ } = R;
  const D = R.DATA, B = R.builders;
  const GOLD = '#D8BC80';

  /* ---------- small helpers ---------- */
  const chip = (root, x, y, html, css) => E(root, 'chip', Object.assign({ left: x, top: y }, css || {}), R.tint(html));
  function head(c, g, x0, eyebrow, heading, acc, size) {
    const eb = T(g, 120, 150, 'mono', eyebrow, { fontSize: 16, letterSpacing: '.3em', color: acc }, false);
    const h = T(g, 120, 186, 'disp', heading, { fontSize: size || 58 });
    c.fade(eb, x0 + .1, { y: 10 });
    c.chars(h, x0 + .2, { st: .028 });
    return h;
  }
  const soLine = (g, x, y, text, size) => {
    const el = E(g, 'a so', { left: x, top: y, fontSize: size || 44 });
    el.innerHTML = '<span class="arr">所以 →</span><span>' + R.tint(text) + '</span>';
    return el;
  };
  const gemOff = (c, x0) => { c.pt('gemA', 0, x0, .5); c.pt('gemRays', 0, x0, .5); c.pt('beamA', 0, x0, .4); };

  /* ---------- beat templates ---------- */
  const BEATS = {
    title(c, g, x0, s, L) {
      c.pset('gemX', 1560, x0); c.pset('gemY', 540, x0); c.pset('gemR', 200, x0); c.pset('gemCut', 6, x0);
      c.pset('gemLine', 1, x0); c.pset('gemFill', 1, x0); c.pset('beamA', 0, x0);
      c.pt('gemA', 1, x0 + .2, .9); c.pt('gemFire', .8, x0 + .2, 1.2); c.pt('gemRays', .5, x0 + .3, 1.2); c.pt('dustA', .8, x0, 1);
      const no = T(g, 104, 236, 'bignum', String(L.no), { fontSize: 380, color: L.acc }, false);
      const k = T(g, 404, 250, 'mono', 'LESSON ' + String(L.no).padStart(2, '0') + ' · 第 ' + L.no + ' 课', { fontSize: 16, letterSpacing: '.34em', color: L.acc }, false);
      const tt = T(g, 400, 300, 'disp', L.title, { fontSize: L.title.length > 6 ? 92 : 110 });
      const gl = T(g, 404, 470, 'sans c-mute', '这一课的目标：' + L.goal, { fontSize: 34 }, false);
      const ck = chip(g, 404, 560, '{g:出关标准} · ' + L.pass, { fontSize: 26 });
      c.fade(no, x0 + .1, { x: -40, blur: 20, d: 1.2 });
      c.fade(k, x0 + .4, { y: 10 });
      c.chars(tt, x0 + .5, { st: .07, blur: 14, y: 40 });
      c.fade(gl, x0 + 1.4, { y: 12 });
      c.fade(ck, x0 + 2.0, { y: 12 });
      gemOff(c, x0 + s.dur - .7);
    },
    why(c, g, x0, s, L) {
      head(c, g, x0, '为什么 · 来自失败 0' + s.f, s.h, L.acc);
      const big = T(g, 1420, 250, 'bignum', '0' + s.f, { fontSize: 320, color: 'rgba(216,188,128,.2)' }, false);
      c.fade(big, x0 + .3, { x: 40, d: 1.2 });
      const facts = s.facts.map((f, i) => T(g, 122, 320 + i * 62, 'sans', f, { fontSize: 32, color: '#C9C4BA' }, false));
      c.fade(facts, x0 + 1.0, { x: -20, st: .7 });
      const so = soLine(g, 120, 340 + s.facts.length * 62 + 40, s.so, 46);
      c.fade(so, x0 + 1.4 + s.facts.length * .7, { y: 16 });
    },
    points(c, g, x0, s, L) {
      head(c, g, x0, s.eb || '要点', s.h, L.acc);
      const n = s.items.length, step = n > 4 ? 110 : 132;
      const span = Math.max(1, s.dur - 2.6);
      s.items.forEach((it, i) => {
        const y = 320 + i * step, col = it[2] || L.acc;
        const num = T(g, 120, y - 4, 'bnum', String(i + 1), { fontSize: 50, color: col }, false);
        const bar = E(g, 'a', { left: 184, top: y + 8, width: 3, height: step - 34, background: col, opacity: .5, transformOrigin: '50% 0' });
        const k = T(g, 206, y, 'disp', it[0], { fontSize: 46 });
        const dd = T(g, 208, y + 60, 'sans c-mute', it[1], { fontSize: 30 }, false);
        const at = x0 + 1.0 + i * span / n;
        c.fade(num, at, { y: 20 });
        c.tl.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: .6, ease: 'expo.out' }, c.at(at));
        c.chars(k, at + .1, { st: .03, d: .7 });
        c.fade(dd, at + .35, { x: -12 });
      });
      if (s.note) { const nt = T(g, 122, 320 + n * step + 10, 'src', s.note, { fontSize: 16 }, false); c.fade(nt, x0 + s.dur - 2.2, {}); }
    },
    table(c, g, x0, s, L) {
      head(c, g, x0, s.eb || '对照表', s.h, L.acc);
      const x = 120, top = 312, rh = s.rh || (s.rows.length > 4 ? 92 : 104);
      let cx = x;
      const xs = s.cols.map(col => { const v = cx; cx += col[1]; return v; });
      const hdr = s.cols.map((col, i) => T(g, xs[i], top, 'mono', col[0], { fontSize: 15, letterSpacing: '.22em', color: L.acc }, false));
      const rule = E(g, 'rule', { left: x, top: top + 34, width: cx - x });
      c.fade(hdr, x0 + .8, { y: 8, st: .08 }); c.grow(rule, x0 + .8, 1);
      const span = Math.max(1, s.dur - 2.8);
      s.rows.forEach((row, r) => {
        const y = top + 52 + r * rh;
        const line = E(g, 'rule', { left: x, top: y + rh - 12, width: cx - x, background: 'rgba(243,238,228,.07)' });
        const cells = row.map((txt, i) => T(g, xs[i], y, i === 0 ? 'sans7' : 'sans', txt, { fontSize: s.fs || 31, color: i === 0 ? '#F3EEE4' : '#C9C4BA' }, false));
        const at = x0 + 1.3 + r * span / s.rows.length;
        c.fade(cells, at, { x: -16, st: .12, d: .6 });
        c.grow(line, at, .8);
      });
    },
    script(c, g, x0, s, L) {
      head(c, g, x0, s.eb || '示范 · 示例话术', s.h, L.acc);
      const span = Math.max(1, s.dur - 2.6), n = s.lines.length, step = n > 4 ? 100 : 118;
      s.lines.forEach((ln, i) => {
        const y = 320 + i * step;
        const tag = E(g, 'a', { left: 120, top: y + 2, width: 150, height: 52, borderRadius: '12px', border: '1.5px solid ' + ln[2], color: ln[2], fontSize: 26, textAlign: 'center', lineHeight: '50px' }, ln[0]);
        tag.className += ' disp';
        const tx = T(g, 300, y + 6, 'sans', ln[1], { fontSize: 31, whiteSpace: 'normal', width: 1480, lineHeight: 1.45 });
        const at = x0 + 1.0 + i * span / n;
        c.fade(tag, at, { x: -20, d: .5 });
        c.tl.fromTo(tx.chs, { opacity: 0 }, { opacity: 1, duration: .05, stagger: .022 }, c.at(at + .2));
      });
      if (s.note) { const nt = T(g, 120, 320 + n * step + 6, 'src', s.note, { fontSize: 16 }, false); c.fade(nt, x0 + 1.4, {}); }
    },
    two(c, g, x0, s, L) {
      head(c, g, x0, s.eb || '对比', s.h, L.acc);
      const cols = [[120, s.a, s.ai, '#8E8C99', false], [1000, s.b, s.bi, GOLD, true]];
      const dv = E(g, 'rule', { left: 940, top: 320, width: 1, height: 520, background: 'rgba(216,188,128,.35)', transformOrigin: '50% 0' });
      c.tl.fromTo(dv, { scaleY: 0 }, { scaleY: 1, duration: 1.1 }, c.at(x0 + .8));
      cols.forEach(([x, title, items, col, on], k) => {
        const h = T(g, x, 318, 'mono', title, { fontSize: 17, letterSpacing: '.24em', color: col }, false);
        c.fade(h, x0 + .7 + k * .3, { y: 8 });
        items.forEach((t, i) => {
          const el = E(g, 'a li', { left: x, top: 372 + i * 70, fontSize: 32, color: on ? '#F3EEE4' : '#8E8C99' });
          el.style.color = on ? '#F3EEE4' : '#A3A0AE';
          el.innerHTML = `<span class="dot" style="${on ? 'background:' + col : 'background:transparent;border:1.5px solid ' + col}"></span><span>${R.tint(t)}</span>`;
          c.fade(el, x0 + 1.1 + k * 1.1 + i * .22, { x: k ? 20 : -20, d: .6 });
        });
      });
    },
    drill(c, g, x0, s, L) {
      head(c, g, x0, '练习 · 今天就做', s.h || '今天的练习', L.acc);
      const tm = chip(g, 1500, 190, '{g:每天} 15–30 分钟', { fontSize: 24 });
      c.fade(tm, x0 + .6, { y: 8 });
      const span = Math.max(1, s.dur - 2.4), n = s.items.length;
      s.items.forEach((t, i) => {
        const y = 330 + i * 96;
        const box = E(g, 'a', { left: 120, top: y + 2, width: 40, height: 40, borderRadius: '9px', border: '2px solid rgba(243,238,228,.35)' });
        const tick = E(box, '', { position: 'absolute', left: '7px', top: '3px', fontSize: 26, color: L.acc, fontFamily: 'ReelSans', fontWeight: 700 }, '✓');
        const tx = T(g, 190, y, 'sans', t, { fontSize: 34 }, false);
        const at = x0 + .9 + i * span / n;
        c.fade([box, tx], at, { x: -16, d: .5 });
        c.tl.fromTo(tick, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .4, ease: 'back.out(3)' }, c.at(at + .7));
        c.tl.to(box, { borderColor: L.acc, duration: .3 }, c.at(at + .7));
      });
    },
    check(c, g, x0, s, L) {
      const eb = T(g, 120, 150, 'mono', '出关标准 · CHECKPOINT', { fontSize: 16, letterSpacing: '.3em', color: L.acc }, false);
      const card = E(g, 'card', { left: 120, top: 300, width: 1680, height: 380 });
      const tx = T(g, 190, 400, 'disp', L.pass, { fontSize: 54, whiteSpace: 'normal', width: 1270, lineHeight: 1.4 });
      const stamp = E(g, 'a disp', { left: 1500, top: 380, width: 220, height: 220, borderRadius: '50%', border: '6px solid ' + L.acc, color: L.acc, fontSize: 64, textAlign: 'center', lineHeight: '208px', transform: 'rotate(-14deg)' }, '过关');
      c.fade(eb, x0 + .1, { y: 10 });
      c.fade(card, x0 + .2, { y: 30, d: .8 });
      c.chars(tx, x0 + .5, { st: .035 });
      c.tl.fromTo(stamp, { scale: 2.4, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: -14, duration: .45, ease: 'back.out(2)' }, c.at(x0 + Math.min(s.dur - 1.6, 3.0)));
      c.pt('flash', .12, x0 + Math.min(s.dur - 1.6, 3.0) + .3, .06, 'none'); c.pt('flash', 0, x0 + Math.min(s.dur - 1.6, 3.0) + .36, .5);
    },
    next(c, g, x0, s, L) {
      c.pset('gemX', 960, x0); c.pset('gemY', 360, x0); c.pset('gemR', 120, x0); c.pset('gemCut', 6, x0); c.pset('gemFill', 1, x0); c.pset('gemLine', 1, x0);
      c.pt('gemA', 1, x0 + .1, .6); c.pt('gemFire', 1, x0 + .1, .6);
      const k = T(g, 960, 560, 'mono ctr', '下一课', { fontSize: 18, letterSpacing: '.5em', color: L.acc }, false);
      const t = T(g, 960, 610, 'disp ctr', s.text, { fontSize: 76 });
      c.fade(k, x0 + .2, { y: 10 }); c.chars(t, x0 + .4, { st: .05, blur: 10 });
      c.pt('fade', 1, x0 + s.dur - .8, .75, 'power1.in');
    },
    finale(c, g, x0, s, L) {
      c.pset('gemX', 960, x0); c.pset('gemY', 330, x0); c.pset('gemR', 140, x0); c.pset('gemCut', 6, x0); c.pset('gemFill', 1, x0); c.pset('gemLine', 1, x0);
      c.pt('gemA', 1, x0 + .1, .8); c.pt('gemFire', 1, x0 + .1, .8); c.pt('gemRays', 1, x0 + .2, 1);
      const o1 = T(g, 960, 540, 'disp ctr', '讲到你自己都想买，', { fontSize: 76 });
      const o2 = T(g, 960, 650, 'disp ctr', '你就{g:讲对了}。', { fontSize: 76 });
      const lg = T(g, 960, 820, 'mono ctr c-mute', '成交方程式 · 主播训练体系 v1.0', { fontSize: 18, letterSpacing: '.36em' }, false);
      c.chars(o1, x0 + .6, { st: .06, blur: 12 }); c.chars(o2, x0 + 1.5, { st: .08, blur: 12 });
      c.fade(lg, x0 + 2.6, { y: 8 });
      c.pt('fade', 1, x0 + s.dur - 1.0, .95, 'power1.in');
    },

    /* ---------- lesson-specific visuals ---------- */
    words(c, g, x0, s, L) {
      const eb = T(g, 960, 250, 'sans ctr c-mute', '直播只有两个字', { fontSize: 34, letterSpacing: '.4em' }, false);
      const a = T(g, 620, 330, 'disp ctr', '拉新', { fontSize: 220 });
      const b = T(g, 1300, 330, 'disp ctr c-gold', '逼单', { fontSize: 220 });
      const la = T(g, 620, 610, 'sans ctr c-mute', '把对的人拉进来、留下来', { fontSize: 30 }, false);
      const lb = T(g, 1300, 610, 'sans ctr c-mute', '让留下来的人下单', { fontSize: 30 }, false);
      const m1 = T(g, 960, 720, 'disp ctr', '拉新，也是为了卖东西。', { fontSize: 60 });
      const m2 = T(g, 960, 820, 'sans ctr c-mute', '平台按成交分配流量：你把进来的人卖好了，平台才继续给你人。', { fontSize: 30 }, false);
      c.fade(eb, x0 + .2, { y: 10 });
      c.chars(a, x0 + .5, { st: .12, blur: 16, y: 50 }); c.chars(b, x0 + 1.0, { st: .12, blur: 16, y: 50 });
      c.fade([la, lb], x0 + 1.7, { y: 10, st: .2 });
      c.chars(m1, x0 + 2.8, { st: .04 }); c.fade(m2, x0 + 3.8, { y: 10 });
    },
    equation(c, g, x0, s, L) {
      head(c, g, x0, '核心 · 价值恒等式', '钱从哪里来：一条恒等式', L.acc);
      const eq = E(g, 'a', { left: 960, top: 330, display: 'flex', alignItems: 'baseline', gap: '30px', transform: 'translateX(-50%)' });
      const parts = [E(eq, 'bnum', { fontSize: 150 }, 'GMV'), E(eq, 'op c-gold', { fontSize: 80 }, '='), E(eq, 'bnum', { fontSize: 150 }, 'UV'),
        E(eq, 'op c-gold', { fontSize: 80 }, '×'), E(eq, '', { display: 'inline-flex', alignItems: 'baseline' }, '<span class="bnum" style="font-size:150px">UV</span><span class="disp" style="font-size:104px;margin-left:6px">价值</span>')];
      c.fade(parts, x0 + .8, { y: 40, blur: 12, st: .16 });
      const l1 = T(g, 0, 540, 'sans', '{g:拉新}：流量侧 · 曝光 → 进入 → 停留', { fontSize: 30 }, false);
      const l2 = T(g, 0, 540, 'sans', '{g:逼单}：成交侧 · 点击率 × 转化率 × 客单价', { fontSize: 30 }, false);
      c.hook(0, () => {
        if (l1._p || !parts[2].offsetWidth) return;
        const off = eq.offsetLeft - eq.offsetWidth / 2;
        const c2 = off + parts[2].offsetLeft + parts[2].offsetWidth / 2, c4 = off + parts[4].offsetLeft + parts[4].offsetWidth / 2;
        l1.style.left = (c2 - 330) + 'px'; l2.style.left = (c4 - 260) + 'px'; l1._p = true;
      });
      c.fade([l1, l2], x0 + 2.2, { y: 12, st: .35 });
      const l3 = T(g, 960, 690, 'disp ctr', '人没进来，是{m:流量问题}；进来没买，是{g:承接问题}。', { fontSize: 46 });
      const l4 = T(g, 960, 780, 'src ctr', 'SPM 宪法第 1 律 · GMV = UV × UV价值', null, false);
      c.chars(l3, x0 + 3.6, { st: .03 }); c.fade(l4, x0 + 4.6, {});
    },
    ledger(c, g, x0, s, L) {
      head(c, g, x0, '一笔真实的账 · 7/30', '同样 360 个人，多成交 {g:6} 个就达标', L.acc);
      const led = [['360', '人进场'], ['12', '人成交'], ['¥2,032', 'GMV'], ['¥5.64', 'UV价值']];
      const lx = [120, 390, 620, 1010];
      const ledEls = led.map((l, i) => { const el = E(g, 'a', { left: lx[i], top: 310 }); el.innerHTML = `<div class="bignum" style="font-size:88px">${l[0]}</div><div class="sans c-mute" style="font-size:26px;margin-top:6px">${l[1]}</div>`; return el; });
      c.fade(ledEls, x0 + .8, { y: 24, st: .15 });
      const sv = svgLayer(g);
      const dots = [];
      for (let i = 0; i < 360; i++) dots.push(S(sv, 'circle', { cx: 140 + (i % 24) * 28, cy: 500 + Math.floor(i / 24) * 28, r: 8, fill: 'rgba(243,238,228,.16)' }));
      const pick = dots.map((d, i) => [hash(i * 7.7 + 1), i]).sort((a, b) => a[0] - b[0]).map(q => q[1]);
      c.tl.fromTo(dots, { opacity: 0 }, { opacity: 1, duration: .25, stagger: { each: .003, grid: [15, 24] } }, c.at(x0 + 1.6));
      pick.slice(0, 12).forEach((idx, k) => c.tl.to(dots[idx], { attr: { fill: GOLD, r: 10 }, duration: .3 }, c.at(x0 + 3.0 + k * .06)));
      pick.slice(12, 18).forEach((idx, k) => c.tl.to(dots[idx], { attr: { fill: '#2FD9B0', r: 11 }, duration: .35, ease: 'back.out(3)' }, c.at(x0 + 5.0 + k * .18)));
      const r1 = T(g, 900, 500, 'sans c-mute', '要到 3,000 元目标（客单约 169 元）：', { fontSize: 32 }, false);
      const r2 = T(g, 900, 556, 'disp', '转化率 {g:3.3%} → {p:4.9%}', { fontSize: 72 });
      const r3 = T(g, 900, 690, 'disp', '不需要流量翻倍，', { fontSize: 44 });
      const r4 = T(g, 900, 756, 'disp c-gold', '只要 4 小时里多说服 6 个人。', { fontSize: 44 });
      const r5 = T(g, 900, 840, 'src', '单场口径，只用来说明杠杆在哪，不是预测', { fontSize: 15 }, false);
      c.fade(r1, x0 + 3.4, { y: 10 }); c.chars(r2, x0 + 3.8, { st: .04 });
      c.chars(r3, x0 + 5.6, { st: .05 }); c.chars(r4, x0 + 6.3, { st: .05 }); c.fade(r5, x0 + 7.4, {});
    },
    gates(c, g, x0, s, L) {
      const h = T(g, 120, 186, 'disp', '她心里要依次过五道门。{m:一道没开，她就走。}', { fontSize: 46 });
      const eb = T(g, 120, 150, 'mono', '核心 · 五道门', { fontSize: 16, letterSpacing: '.3em', color: L.acc }, false);
      c.fade(eb, x0 + .1, { y: 10 }); c.chars(h, x0 + .2, { st: .025 });
      B.gatesDiagram(c, g, x0, { per: 1.7 });
      c.pt('beamA', 0, x0 + s.dur - .7, .6); c.pt('gemA', 0, x0 + s.dur - .7, .6); c.pt('beamFlow', 0, x0 + s.dur - .7, .6);
    },
    gem6(c, g, x0, s, L) {
      head(c, g, x0, '核心 · 塑品', '讲品六步：给宝石切出{g:火彩}', L.acc);
      c.pset('gemX', 560, x0); c.pset('gemY', 560, x0); c.pset('gemR', 230, x0); c.pset('gemCut', 0, x0);
      c.pset('gemLine', 1, x0); c.pset('gemFill', 1, x0); c.pset('beamA', 0, x0);
      c.pt('gemA', 1, x0 + .2, .8); c.pt('gemFire', .15, x0 + .2, .8); c.pt('gemRays', 0, x0, .3);
      const rows = D.STEPS.map((st, i) => {
        const el = E(g, 'a step', { top: 300 + i * 96 });
        el.innerHTML = `<div class="sn">${i + 1}</div><div class="st">${st.n}</div><div class="sd">${st.d}</div><div class="sg"></div>`;
        return el;
      });
      c.fade(rows, x0 + .6, { x: 30, st: .08 });
      const cap = E(g, 'a caption', null, '<span class="who">示例话术 · 活动与库存以店铺真实为准</span><span class="txt"></span>');
      c.fade(cap, x0 + 1.2, { y: 16 });
      const txt = cap.querySelector('.txt');
      const lines = D.STEPS.map(st => { const sp = E(txt, 'a', { left: 0, top: 0, position: 'relative', whiteSpace: 'normal' }); sp.innerHTML = R.rich(st.line); sp.style.display = 'none'; return sp; });
      const per = (s.dur - 3.4) / 6;
      D.STEPS.forEach((st, i) => {
        const at = x0 + 1.6 + i * per, col = D.GATES[st.g].col, el = rows[i];
        c.tl.to([el.querySelector('.st'), el.querySelector('.sn')], { color: col, duration: .4 }, c.at(at));
        c.tl.to(el.querySelector('.sd'), { color: '#F3EEE4', duration: .4 }, c.at(at));
        c.tl.fromTo(el.querySelector('.sg'), { width: 0, background: col }, { width: 150, duration: .8, ease: 'expo.out' }, c.at(at));
        c.pt('gemCut', i + 1, at, .55, 'power2.out');
        c.tl.set(lines, { display: 'none' }, c.at(at));
        c.tl.set(lines[i], { display: 'block' }, c.at(at));
        c.tl.fromTo(lines[i].querySelectorAll('.ch'), { opacity: 0 }, { opacity: 1, duration: .05, stagger: .026 }, c.at(at + .05));
      });
      c.pt('gemFire', 1, x0 + s.dur - 1.6, .8);
      gemOff(c, x0 + s.dur - .6);
    },
    four(c, g, x0, s, L) {
      head(c, g, x0, '核心 · 收口', '逼单四要素', L.acc);
      const sub = T(g, 122, 268, 'sans c-mute', '只要产品没问题，练好这四个，一定卖得动。', { fontSize: 30 }, false);
      c.fade(sub, x0 + .8, { y: 10 });
      D.FOUR.forEach((f, i) => {
        const el = E(g, 'card pillar', { left: 120 + i * 426, top: 350, width: 400, height: 420 });
        el.innerHTML = `<div class="pk" style="color:${f.c};font-size:84px">${f.n}</div><div class="pd" style="font-size:30px;top:150px">${f.d}</div><div class="pr" style="font-size:16px">${f.r}</div>`;
        c.fade(el, x0 + 1.2 + i * .7, { y: 60, d: .8 });
        c.tl.to(el, { borderColor: f.c + 'aa', boxShadow: `0 0 40px ${f.c}22`, duration: .5 }, c.at(x0 + 1.5 + i * .7));
      });
      const bl = T(g, 120, 830, 'sans', '{g:价值}立住了，{p:比价}才有说服力；{t:保障}让她敢下单；{s:稀缺}告诉她为什么是现在。', { fontSize: 32 }, false);
      c.fade(bl, x0 + s.dur - 3.6, { y: 10 });
    },
    ring(c, g, x0, s, L) {
      head(c, g, x0, '核心 · 节拍', '两分钟逼一次单', L.acc);
      const sv = svgLayer(g);
      S(sv, 'circle', { cx: 420, cy: 600, r: 190, fill: 'none', stroke: 'rgba(243,238,228,.12)', 'stroke-width': 18 });
      const ring = S(sv, 'circle', { cx: 420, cy: 600, r: 190, fill: 'none', stroke: L.acc, 'stroke-width': 18, 'stroke-dasharray': 1193.8, 'stroke-dashoffset': 1193.8, transform: 'rotate(-90 420 600)', 'stroke-linecap': 'round' });
      const lab = T(g, 420, 530, 'bnum ctr', '2′', { fontSize: 130, color: L.acc }, false);
      c.fade([sv, lab], x0 + .6, { sc: .8, d: .7 });
      c.hook(x0 + .8, lt => { const u = Math.max(0, lt) % 2.4 / 2.4; ring.setAttribute('stroke-dashoffset', 1193.8 * (1 - u)); });
      const h2 = T(g, 760, 330, 'sans7', '每一次：一个具体动作 + 一个要素', { fontSize: 36 }, false);
      c.fade(h2, x0 + 1.0, { y: 10 });
      const acts = ['扣 1', '拍几号链接', '报后台真实库存', '下单后登记礼物', '按店铺真实活动提醒凑单'];
      acts.forEach((a, i) => { const el = E(g, 'a li', { left: 760, top: 420 + i * 78, fontSize: 34 }); el.innerHTML = `<span class="dot" style="background:${L.acc}"></span><span>${a}</span>`; c.fade(el, x0 + 1.6 + i * .5, { x: 20 }); });
      const nt = T(g, 760, 830, 'src', '不是每两分钟喊一次「快买」', { fontSize: 16 }, false);
      c.fade(nt, x0 + 4.4, {});
    },
    flow(c, g, x0, s, L) {
      head(c, g, x0, '核心 · 憋单框架', '先放钩子留人，再四要素逼单', L.acc);
      const steps = [['钩子留人', '拿一款当钩子'], ['憋', '塑价值、留住人'], ['放', '开链接'], ['逼', '四要素收口'], ['预告', '具体到哪一款']];
      steps.forEach((st, i) => {
        const x = 120 + i * 350;
        const box = E(g, 'card', { left: x, top: 380, width: 310, height: 260 });
        box.innerHTML = `<div class="bnum" style="position:absolute;left:24px;top:14px;font-size:44px;color:${L.acc}">${i + 1}</div><div class="disp" style="position:absolute;left:24px;top:84px;font-size:${st[0].length > 2 ? 52 : 64}px">${st[0]}</div><div class="sans c-mute" style="position:absolute;left:24px;top:186px;font-size:26px">${st[1]}</div>`;
        c.fade(box, x0 + .9 + i * .45, { y: 40, d: .7 });
        if (i < 4) { const ar = T(g, x + 316, 490, 'op c-gold', '→', { fontSize: 30 }, false); c.fade(ar, x0 + 1.2 + i * .45, {}); }
      });
      const bl = T(g, 120, 720, 'sans', '预告的下一款，就是下一轮的钩子：{g:再拉新，也是为了卖东西}。', { fontSize: 32 }, false);
      c.fade(bl, x0 + 3.8, { y: 10 });
    },
    rhythm(c, g, x0, s, L) {
      head(c, g, x0, '核心 · 一轮 20–25 分钟', '一轮怎么排：钩子 → 放单 → 六步 → 套装 → 预告', L.acc, 46);
      const P1 = B.phone(g, 150, 280);
      P1.el.style.height = '700px'; P1.el.style.width = '400px';
      c.fade(P1.el, x0 + .4, { x: -30 });
      const sv = svgLayer(g);
      const X0 = 640, X1 = 1800, Y0 = 330, Y1 = 760;
      const mx = m => X0 + (X1 - X0) * m / 22, my = v => Y1 - (Y1 - Y0) * v / 20;
      const ONL = m => { if (m < 7) return 3 + 13 * E_.inOut(m / 7) + .6 * Math.sin(m * 2.1); if (m < 8) return lerp(16, 13, m - 7); if (m < 18) return 13 - .2 * (m - 8) + 1.3 * Math.sin(m * 1.4); if (m < 21) return lerp(11, 12.6, (m - 18) / 3) + .5 * Math.sin(m * 2); return lerp(12.6, 15.5, m - 21); };
      const bands = [[0, 7, '#FFB443', '钩子 · 憋单 6–8′'], [7, 8, '#2FD9B0', '放'], [8, 18, '#F3EEE4', '转化品讲六步 约 10′'], [18, 21, '#2FD9B0', '套装 3′'], [21, 22, '#AE7BFF', '预告']];
      const labs = [];
      bands.forEach(([a, b, col, lab]) => { S(sv, 'rect', { x: mx(a), y: Y0, width: mx(b) - mx(a), height: Y1 - Y0, fill: col, opacity: col === '#F3EEE4' ? .035 : .09 }); labs.push(T(g, mx(a) + 8, Y0 + 8, 'mono', lab, { fontSize: 14, color: col }, false)); });
      S(sv, 'line', { x1: X0, y1: Y1, x2: X1, y2: Y1, stroke: 'rgba(243,238,228,.3)' });
      for (let m = 0; m <= 22; m += 2) labs.push(T(g, mx(m), Y1 + 10, 'mono ctr c-dim', m + '′', { fontSize: 13 }, false));
      const curve = S(sv, 'path', { d: '', fill: 'none', stroke: '#F3EEE4', 'stroke-width': 3 });
      const bi = [10, 12, 14, 16, 18].map(m => { const gg = S(sv, 'g', { opacity: 0 }); S(gg, 'line', { x1: mx(m), y1: Y1 - 14, x2: mx(m), y2: Y1 + 34, stroke: GOLD, 'stroke-width': 2 }); const tx = S(gg, 'text', { x: mx(m), y: Y1 + 58, fill: GOLD, 'font-size': 18, 'text-anchor': 'middle', 'font-family': 'ReelSerif' }); tx.textContent = '逼'; return [m, gg]; });
      c.fade([sv].concat(labs), x0 + .8, { d: .6 });
      const warn = T(g, 640, 880, 'sans c-alarm', '红线：憋单期间在线掉超 20% = 憋太久，先砍到 5 分钟', { fontSize: 26 }, false);
      c.fade(warn, x0 + 4.0, { y: 8 });
      const span = s.dur - 3.2;
      c.hook(x0 + 1.4, lt => {
        const m = clamp(lt / span) * 22 + Math.max(0, lt - span) * 1.2;
        P1.update(m);
        const mm = Math.min(m, 22); let d = '';
        const N = Math.max(1, Math.round(mm * 6));
        for (let k = 0; k <= N; k++) { const u = mm * k / N; d += (k ? ' L ' : 'M ') + mx(u).toFixed(1) + ' ' + my(ONL(u)).toFixed(1); }
        curve.setAttribute('d', d);
        bi.forEach(([bm, gg]) => gg.setAttribute('opacity', mm >= bm ? 1 : 0));
      });
    },
    data5(c, g, x0, s, L) {
      head(c, g, x0, '核心 · 每轮五个数', '按轮次记，不看整场汇总', L.acc);
      const cells = [['憋单时长', '7′10″'], ['憋单期间在线变化', '<span class="op">−</span>24%'], ['开链接后 3 分钟成交', '5<span class="sans" style="font-style:normal;font-size:34px;margin-left:8px">笔</span>'], ['讲品时长', '9′20″'], ['逼单次数', '2<span class="sans" style="font-style:normal;font-size:34px;margin-left:8px">次</span>']];
      const cellEls = cells.map((k, i) => { const el = E(g, 'card', { left: 120 + i * 340, top: 300, width: 320, height: 166 }); el.innerHTML = `<div class="sans c-mute" style="position:absolute;left:24px;top:20px;font-size:24px">${k[0]}</div><div class="bignum" style="position:absolute;left:24px;top:64px;font-size:80px">${k[1]}</div>`; return el; });
      const tag = T(g, 1640, 198, 'tag', '示例数据', null, false);
      c.fade(cellEls, x0 + .7, { y: 30, st: .1 }); c.fade(tag, x0 + 1.0, {});
      const rules = [['憋单期间在线掉超 20%', '憋太久', '先砍到 5 分钟', 1], ['在线涨，开链接后转化低', '钩子和品不匹配', '换钩子，或加大价格反差', 2], ['讲品时长够，点击率低', '价值塑造不到位', '回到试岗第 2 天重练', 3], ['点击高，转化低', '逼单软或信任不够', '改逼单和赠品，不改讲品', 4]];
      const span = s.dur - 3.4;
      rules.forEach((r, i) => {
        const el = E(g, 'a', { left: 120, top: 540 + i * 80, width: 1680, height: 64 });
        el.innerHTML = `<span class="sans" style="position:absolute;left:0;top:10px;font-size:30px">${r[0]}</span><span class="op c-gold" style="position:absolute;left:560px;top:12px;font-size:24px">→</span><span class="sans7 c-gold" style="position:absolute;left:620px;top:10px;font-size:30px">${r[1]}</span><span class="op c-gold" style="position:absolute;left:1020px;top:12px;font-size:24px">→</span><span class="sans" style="position:absolute;left:1080px;top:10px;font-size:30px">${r[2]}</span>`;
        const at = x0 + 2.0 + i * span / 4;
        c.fade(el, at, { x: -24, d: .6 });
        const cell = cellEls[r[3]];
        c.tl.to(cell, { borderColor: 'rgba(255,90,103,.9)', boxShadow: '0 0 30px rgba(255,90,103,.25)', duration: .3 }, c.at(at));
        c.tl.to(cell, { borderColor: 'rgba(243,238,228,.14)', boxShadow: '0 0 0 rgba(0,0,0,0)', duration: .4 }, c.at(at + span / 4 - .2));
      });
    },
    control(c, g, x0, s, L) {
      head(c, g, x0, '核心 · 看趋势，不追单场', '带内起伏不追问，越线才去查', L.acc);
      const sv = svgLayer(g);
      const X0 = 120, X1 = 1160, cy = 560, ucl = 420, lcl = 700;
      S(sv, 'rect', { x: X0, y: ucl, width: X1 - X0, height: lcl - ucl, fill: 'rgba(216,188,128,.07)' });
      [ucl, lcl].forEach(y => S(sv, 'line', { x1: X0, x2: X1, y1: y, y2: y, stroke: 'rgba(243,238,228,.28)', 'stroke-dasharray': '6 8' }));
      S(sv, 'line', { x1: X0, x2: X1, y1: cy, y2: cy, stroke: 'rgba(216,188,128,.55)', 'stroke-dasharray': '10 8' });
      const vals = [.2, -.3, .5, -.1, .7, -.4, .1, -.55, .35, .0, -1.35, .15, -.2, .6, -.05, .3, -.35, .1];
      const pts = vals.map((v, i) => [X0 + 30 + i * 58, cy - v * 118]);
      const pl = S(sv, 'polyline', { points: '', fill: 'none', stroke: 'rgba(243,238,228,.45)', 'stroke-width': 2 });
      const pc = pts.map((p, i) => S(sv, 'circle', { cx: p[0], cy: p[1], r: i === 10 ? 11 : 7, fill: i === 10 ? '#FF5A67' : '#F3EEE4', opacity: 0 }));
      const la = T(g, X1 - 250, ucl + 14, 'mono c-mute', '带内起伏 · 不追问', { fontSize: 16 }, false);
      const lb = T(g, pts[10][0] - 70, pts[10][1] + 20, 'mono c-alarm', '越线 · 该查', { fontSize: 18 }, false);
      const lt0 = T(g, X0, 350, 'tag', '示意 · 个人控制图', null, false);
      c.fade([sv, lt0], x0 + .6, { d: .5 });
      c.hook(x0 + .8, lt => { const n = clamp(lt / 2.4) * pts.length; pc.forEach((el, i) => el.setAttribute('opacity', i < n ? 1 : 0)); pl.setAttribute('points', pts.slice(0, Math.max(1, Math.floor(n))).map(p => p.join(',')).join(' ')); });
      c.fade(la, x0 + 2.2, { y: 8 }); c.fade(lb, x0 + 3.0, { y: 8, sc: .8 });
      const rs = ['每场只改一个问题', '看 7 日均值，不看单场', '能算的算，算不出的问', '达标那天只给心法'];
      rs.forEach((t, i) => { const el = E(g, 'a li', { left: 1280, top: 400 + i * 78 }); el.innerHTML = `<span class="dot" style="background:${['#FFB443', '#2FD9B0', '#5B85FF', '#AE7BFF'][i]}"></span><span>${t}</span>`; c.fade(el, x0 + 2.0 + i * .5, { x: 20 }); });
    },
    compass(c, g, x0, s, L) {
      head(c, g, x0, '核心 · 播法定位', '没有标准主播，只有{g:标准骨架}', L.acc);
      const sv = svgLayer(g);
      S(sv, 'line', { x1: 220, y1: 604, x2: 1160, y2: 604, stroke: 'rgba(216,188,128,.5)', 'stroke-width': 1.5 });
      S(sv, 'line', { x1: 690, y1: 330, x2: 690, y2: 880, stroke: 'rgba(216,188,128,.5)', 'stroke-width': 1.5 });
      c.fade(sv, x0 + .6, {});
      const axl = [T(g, 206, 590, 'mono c-gold', '感性', { fontSize: 16, transform: 'translateX(-100%)' }, false), T(g, 1172, 590, 'mono c-gold', '理性', { fontSize: 16 }, false), T(g, 700, 316, 'mono c-gold', '节奏快', { fontSize: 16 }, false), T(g, 700, 872, 'mono c-gold', '节奏稳', { fontSize: 16 }, false)];
      c.fade(axl, x0 + .8, { st: .1 });
      const Q = [[240, 360, '能量带动型', '主负责：憋单、逼单段'], [710, 360, '控场主导型', '主负责：人多时段、接播、开价'], [240, 624, '审美种草型', '主负责：成套搭配'], [710, 624, '专业讲解型', '主负责：利润款讲解、信任段']];
      const qs = Q.map(q => { const el = E(g, 'card quad', { left: q[0], top: q[1], width: 430, height: 230 }); el.innerHTML = `<div class="qt">${q[2]}</div><div class="qd">${q[3]}</div>`; return el; });
      c.fade(qs, x0 + 1.0, { sc: .92, st: .12 });
      const you = E(g, 'a', { left: 0, top: 0, width: 26, height: 26, borderRadius: '50%', background: GOLD, boxShadow: '0 0 0 8px rgba(216,188,128,.25), 0 0 40px rgba(216,188,128,.6)' });
      const yl = T(g, 0, 0, 'mono c-gold', '你', { fontSize: 18 }, false);
      c.fade([you, yl], x0 + 2.0, { sc: .2 });
      c.hook(x0 + 2.0, lt => { const p = E_.inOut(clamp(lt / 3.4)), wob = 1 - p; const x = lerp(690, 455, p) + Math.sin(lt * 3.1) * 90 * wob, y = lerp(604, 740, p) + Math.cos(lt * 2.3) * 70 * wob; you.style.left = (x - 13) + 'px'; you.style.top = (y - 13) + 'px'; yl.style.left = (x + 22) + 'px'; yl.style.top = (y - 34) + 'px'; qs[2].style.borderColor = p > .98 ? 'rgba(216,188,128,.9)' : 'rgba(243,238,228,.14)'; });
      const r1 = T(g, 1260, 380, 'disp c-gold', '强项放大', { fontSize: 60 });
      const r2 = T(g, 1260, 480, 'disp', '弱项补到及格', { fontSize: 48 });
      const r3 = T(g, 1262, 590, 'sans c-mute', '前 3 场真播 + 六力打分，\n定出你的类型', { fontSize: 28, lineHeight: 1.6 }, false);
      c.chars(r1, x0 + 3.2, { st: .07 }); c.chars(r2, x0 + 4.0, { st: .06 }); c.fade(r3, x0 + 4.8, { y: 10 });
    },
    quote(c, g, x0, s, L) {
      const q = T(g, 960, 300, 'disp ctr c-mute', s.q, { fontSize: 60 });
      const w = T(g, 960, 400, 'mono ctr c-dim', s.who, { fontSize: 16, letterSpacing: '.3em' }, false);
      const a = T(g, 960, 520, 'sans7 ctr', s.a, { fontSize: 40 }, false);
      const b = T(g, 960, 610, 'disp ctr c-gold', s.b, { fontSize: 150 });
      c.chars(q, x0 + .3, { st: .035 }); c.fade(w, x0 + 1.4, {});
      c.fade(a, x0 + 2.4, { y: 10 }); c.chars(b, x0 + 3.4, { st: .14, blur: 18, sc: 1.3 });
    },
    decode7(c, g, x0, s, L) {
      head(c, g, x0, '方法 · 拆解七步', '拆解一个顶尖直播间', L.acc);
      const steps = [['录屏一整轮', '20–30 分钟'], ['转逐字稿', '一句不漏'], ['按分钟标动作', '钩子/憋/讲/逼/福利/预告'], ['对齐在线曲线', '在线和成交放在一起'], ['找峰值前 30 秒', '他说了什么、做了什么'], ['映射到五道门', '每句话在开哪道门'], ['分成两类', '学得来 / 学不来']];
      steps.forEach((st, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const x = 120 + col * 425, y = 320 + row * 250;
        const el = E(g, 'card', { left: x, top: y, width: 400, height: 210 });
        el.innerHTML = `<div class="bnum" style="position:absolute;left:24px;top:12px;font-size:48px;color:${L.acc}">${i + 1}</div><div class="disp" style="position:absolute;left:24px;top:84px;font-size:38px">${st[0]}</div><div class="sans c-mute" style="position:absolute;left:24px;top:146px;font-size:24px">${st[1]}</div>`;
        c.fade(el, x0 + .9 + i * .45, { y: 30, d: .6 });
      });
      const nt = T(g, 1400, 610, 'sans', '顺序：{g:先自己讲一轮}，\n带着自己的 3 个问题\n去看回放。', { fontSize: 32, lineHeight: 1.6 }, false);
      c.fade(nt, x0 + 4.2, { x: 20 });
    },
    cards(c, g, x0, s, L) {
      B.fail3(c, x0, true);
      const e3 = soLine(g, 200, 720, '底层逻辑照搬，打法按量级重建。', 50);
      c.fade(e3, x0 + 5.0, { y: 14 });
    },
    compliance(c, g, x0, s, L) {
      head(c, g, x0, '红线 · 一句都不能说', '合规红线：账号比单场重要', L.acc);
      const bad = ['天然', '真钻', 'A货', '保值', '升值', '治疗', '开光', '辟邪', '转运', '最', '第一', '顶级'];
      bad.forEach((w, i) => {
        const x = 120 + (i % 6) * 190, y = 320 + Math.floor(i / 6) * 110;
        const el = E(g, 'a', { left: x, top: y, width: 170, height: 84, borderRadius: '12px', border: '1.5px solid rgba(255,90,103,.6)', textAlign: 'center', lineHeight: '82px', fontSize: 38, color: '#F3EEE4' }, w);
        el.className += ' disp';
        const st = E(g, 'a', { left: x + 14, top: y + 41, width: 142, height: 4, background: '#FF5A67', transformOrigin: '0 50%' });
        c.fade(el, x0 + .8 + i * .12, { sc: .8, d: .4 });
        c.grow(st, x0 + 1.6 + i * .12, .4);
      });
      const must = T(g, 1320, 320, 'mono', '必须如实说', { fontSize: 16, letterSpacing: '.24em', color: '#2FD9B0' }, false);
      const mw = ['人工仿宝石', '合金镀金', '饰品非珠宝'].map((w, i) => chip(g, 1320, 370 + i * 76, '{p:✓} ' + w + '（按实际材质）', { fontSize: 26 }));
      c.fade(must, x0 + 2.4, {}); c.fade(mw, x0 + 2.6, { x: 20, st: .25 });
      const rows = ['价格：不虚构原价，比价用真实可查的参照', '稀缺：库存、限量、倒计时都必须真实', '顺序：账号 > 单场 · 合规 > 转化 · 净利 > GMV'];
      rows.forEach((t, i) => { const el = T(g, 120, 600 + i * 70, 'sans', t, { fontSize: 32 }, false); c.fade(el, x0 + 4.0 + i * .7, { x: -16 }); });
    },
    roadmap(c, g, x0, s, L) {
      head(c, g, x0, '路线 · 每一段都有出关标准', '从筛选到出师', L.acc);
      const nodes = [['筛选', '两道门 + 作业'], ['试岗 D1', '3 款各 1 分钟'], ['试岗 D2', '六步 4–6 分钟'], ['试岗 D3', '搭配 · 逼单 3 次'], ['留用判定', '同一问题不犯二次'], ['节奏循环', '一轮 22 分钟'], ['真播试播', '每场只改一处'], ['出师', '连续 2 场达标']];
      const sv = svgLayer(g);
      const x = i => 180 + i * 222, y = 520;
      const line = S(sv, 'line', { x1: x(0), y1: y, x2: x(7), y2: y, stroke: 'rgba(216,188,128,.5)', 'stroke-width': 2, 'stroke-dasharray': 1600, 'stroke-dashoffset': 1600 });
      c.tl.to(line, { attr: { 'stroke-dashoffset': 0 }, duration: s.dur - 4, ease: 'none' }, c.at(x0 + .8));
      const span = s.dur - 4;
      nodes.forEach((n, i) => {
        const at = x0 + .8 + i * span / 7;
        const dot = S(sv, 'circle', { cx: x(i), cy: y, r: i === 7 ? 16 : 11, fill: i === 7 ? L.acc : '#0A0C14', stroke: L.acc, 'stroke-width': 3, opacity: 0 });
        c.tl.to(dot, { opacity: 1, duration: .3 }, c.at(at));
        const a = T(g, x(i), y - 96, 'disp ctr', n[0], { fontSize: i === 7 ? 44 : 34, color: i === 7 ? L.acc : '#F3EEE4' });
        const b = T(g, x(i), y + 36, 'sans ctr c-mute', n[1], { fontSize: 22 }, false);
        c.chars(a, at, { st: .04, d: .5 }); c.fade(b, at + .2, { y: 8 });
      });
      const nt = T(g, 120, 760, 'sans', '出师标准：{g:连续 2 场达到场均目标（目前 3,000 元）}。出师后按自己的类型定打法，每周只练一件事。', { fontSize: 30 }, false);
      c.fade(nt, x0 + s.dur - 2.6, { y: 10 });
    }
  };
  const CH = { title: '开场', why: '为什么', points: '要点', table: '对照', script: '示范', two: '对比', drill: '练习', check: '出关', next: '下一课', finale: '收尾',
    words: '两个字', equation: '恒等式', ledger: '一笔账', gates: '五道门', gem6: '六步', four: '四要素', ring: '两分钟', flow: '憋单框架', rhythm: '一轮循环',
    data5: '五个数', control: '看趋势', compass: '定位', quote: '讲人话', decode7: '拆解七步', cards: '打法卡', compliance: '红线', roadmap: '路线' };

  /* ---------- the ten lessons ---------- */
  const A = { gold: '#D8BC80', need: '#FF6A55', value: '#FFB443', perk: '#2FD9B0', trust: '#5B85FF', scarce: '#AE7BFF', alarm: '#FF5A67' };
  const LESSONS = [
    { no: 0, short: '为什么', title: '为什么这样教', acc: A.gold, goal: '知道每条规矩是从哪次失败里来的', pass: '能用自己的话讲出三次失败，以及各自换来的规矩。', beats: [
      { t: 'title', dur: 6 },
      { t: 'why', dur: 9, f: 1, h: '有经验的主播，试训半天就走了', facts: ['3 年直播经验 · 卖过玉 · 自己就是用户 · 语速快', '没谈条件、没收资料：她走的成本是零', '还没自己讲过一轮，先看了头部回放：先看到的是差距'], so: '先筛后教；先自己讲一轮，再看高手回放。' },
      { t: 'why', dur: 10, f: 2, h: '19 场直播，只有 4 场达标', facts: ['目标 4 小时 3,000 元 · 最低 197 元 · 最高 10,433 元', '主管：「销售的感觉太强了，太格式化了。」', '8/26 爆发：货对了（珊瑚海），人准了，不是她突然变强了'], so: '骨架统一，血肉自己长；分清流量问题和承接问题。' },
      { t: 'cards', dur: 8.5 },
      { t: 'points', dur: 9, h: '三次失败，换来三条规矩', items: [['先筛后教', '两道门 + 回家作业 + 书面确认，过了才进试岗'], ['讲人话', '五道门、六步、四要素是骨架，每句话用自己的话说'], ['学底层逻辑', '头部的战术是量级的产物，打法按自己的量级重建']] },
      { t: 'check', dur: 6 },
      { t: 'next', dur: 4, text: '第 1 课 · 底层方程' }] },
    { no: 1, short: '底层方程', title: '底层方程', acc: A.gold, goal: '分清「人没进来」和「进来没买」', pass: '复盘第一句话，说清今天是流量问题还是承接问题。', beats: [
      { t: 'title', dur: 6 },
      { t: 'words', dur: 7.5 },
      { t: 'equation', dur: 9 },
      { t: 'table', dur: 9.5, h: '两类问题，两个负责人', cols: [['现象', 560], ['是哪类问题', 380], ['谁来改', 740]], rows: [['进来的人少、不准', '{g:流量问题}', '运营与选品：排品、钩子品、投放'], ['进来了留不住', '{p:承接问题}', '主播：开场、留人、节奏'], ['点了不买', '{p:承接问题}', '主播：逼单四要素、信任'], ['讲得久、卖得少', '{p:承接问题}', '主播：回到讲品六步']] },
      { t: 'ledger', dur: 10 },
      { t: 'drill', dur: 7, items: ['翻出你昨天那一场：写下进场人数、成交人数、GMV', '算出 UV价值 = GMV ÷ 进场人数', '用一句话写：今天是流量问题，还是承接问题'] },
      { t: 'check', dur: 6 },
      { t: 'next', dur: 4, text: '第 2 课 · 五道门' }] },
    { no: 2, short: '五道门', title: '五道门', acc: A.need, goal: '知道她为什么买，也知道她为什么走', pass: '顾客走了，5 秒内说出她卡在哪道门。', beats: [
      { t: 'title', dur: 6 },
      { t: 'gates', dur: 15 },
      { t: 'table', dur: 10.5, h: '她走了，卡在哪道门？', cols: [['她的表现', 700], ['卡在', 240], ['你该补', 740]], rows: [['压根没停下来', '{n:需求}', '痛点和场景没打中她'], ['停了，一听价格就走', '{v:价值}', '报价太早，价值没立住'], ['说「别家更便宜」', '{p:福利}', '没做比价，没给今天的理由'], ['问「会不会掉色」「是不是真的」', '{t:信任}', '如实材质、售后、现场验货'], ['说「下次再买」', '{s:稀缺}', '给真实的库存和截止时间']] },
      { t: 'points', dur: 9.5, h: '我们客群的真实顾虑', eb: '她是谁 · 40–49 岁女性', items: [['送礼要体面', '需求门：给她一个送人的场景', '#FF6A55'], ['要高级感', '价值门：先立价值，再报价', '#FFB443'], ['想花小钱', '福利门：比价，加上今天的福利', '#2FD9B0'], ['怕假、怕掉色', '信任门：如实说明，现场验货', '#5B85FF'], ['怕撞款', '稀缺门：真实的批次和库存', '#AE7BFF']] },
      { t: 'drill', dur: 7, items: ['看一段自己的回放', '每个离开的顾客，标上她卡在哪道门', '数一数哪道门最常卡住：明天只补这一道'] },
      { t: 'check', dur: 6 },
      { t: 'next', dur: 4, text: '第 3 课 · 讲品六步' }] },
    { no: 3, short: '讲品六步', title: '讲品六步', acc: A.value, goal: '一款产品，两三分钟讲到她想买', pass: '单品 4–6 分钟完整跑完六步，不看稿。', beats: [
      { t: 'title', dur: 6 },
      { t: 'gem6', dur: 15 },
      { t: 'points', dur: 10, h: '开播前，每款填一张产品拆解卡', eb: '从用户的角度拆，不从参数拆', items: [['她是谁，她在什么市场里', '平时在哪买、买什么价位'], ['她能看到哪些替代品', '同价位的、同款的、商场里的'], ['我们的优势', '相比那些替代品，强在哪'], ['痛点 1·2·3 · 卖点 1·2·3', '卖点：看得见、摸得着、想得到'], ['比价锚点 · 保障 · 稀缺点', '全部必须真实、可查']] },
      { t: 'two', dur: 9, h: '你为什么买它，你为什么不买它', a: '为什么不买 · 每条准备一句回应', ai: ['贵', '怕假', '怕掉色', '撞款', '不会搭', '送人不体面'], b: '为什么买 · 按五道门讲三条', bi: ['看得见的颜色和光泽', '摸得着的做工和分量', '想得到的场合和体面', '被挑刺，5 秒内接回来'] },
      { t: 'drill', dur: 7, items: ['每款讲 3 遍，每遍录像', '把录音转成文字，每句话标上它在开哪道门', '标不上门的句子，删掉'] },
      { t: 'check', dur: 6 },
      { t: 'next', dur: 4, text: '第 4 课 · 逼单四要素' }] },
    { no: 4, short: '逼单四要素', title: '逼单四要素', acc: A.scarce, goal: '每一次逼单都有动作、有理由', pass: '同一款，用四个要素各逼一次单，每次都有具体动作。', beats: [
      { t: 'title', dur: 6 },
      { t: 'four', dur: 11 },
      { t: 'script', dur: 11, h: '四个要素，各一句示范', lines: [['价值', '先别急着看价格。你看这个切面，灯一打，火彩出来了，这是看得见的做工。', '#FFB443'], ['比价', '同样的款式，你在别处看到的是什么价，就按真实参照说，不编原价。', '#2FD9B0'], ['保障', '材质我如实跟你说；售后按店铺规则；我现场给你验做工。', '#5B85FF'], ['稀缺', '这一批后台还剩多少，我报真实数字。喜欢的扣 1。', '#AE7BFF']], note: '示例话术 · 价格、库存、活动一律按真实情况说' },
      { t: 'ring', dur: 8 },
      { t: 'two', dur: 8.5, h: '红线：这几种逼单会出事', a: '不能做', ai: ['虚构原价', '假库存、假倒计时', '夸大材质和功效', '承诺做不到的售后'], b: '要这样做', bi: ['比价参照真实可查', '报后台真实数字', '如实说明材质', '按店铺规则讲售后'] },
      { t: 'check', dur: 6 },
      { t: 'next', dur: 4, text: '第 5 课 · 节奏' }] },
    { no: 5, short: '节奏', title: '节奏', acc: A.perk, goal: '一场怎么排，人多人少怎么接', pass: '一轮完整循环 22 分钟内跑完，不看稿。', beats: [
      { t: 'title', dur: 6 },
      { t: 'flow', dur: 7.5 },
      { t: 'rhythm', dur: 14 },
      { t: 'table', dur: 10, h: '人少和人多，是两种打法', eb: '来自老板对主播的点评', cols: [['情况', 280], ['怎么做', 1400]], rows: [['人少（0–5 人）', '不重开。一对一去 cue，像跟朋友聊天；先过自己最会讲的'], ['有人点讲解', '优先过，让她感觉被重视'], ['人多', '千万别急，稳在自己的节奏里；先控场，多讲信任话术'], ['累了', '别播到麻木：「咱们慢点，我给你们讲清楚」']] },
      { t: 'points', dur: 7.5, h: '两条红线', items: [['憋单期间在线掉超过 20%', '说明憋太久，先砍到 5 分钟', '#FF5A67'], ['预告必须具体到哪一款', '不能只说「待会有福利」', '#FF5A67']] },
      { t: 'check', dur: 6 },
      { t: 'next', dur: 4, text: '第 6 课 · 数据' }] },
    { no: 6, short: '数据', title: '数据', acc: A.trust, goal: '用数据找到下一场要改的那一句', pass: '复盘能指出「下一场只改哪一句」。', beats: [
      { t: 'title', dur: 6 },
      { t: 'data5', dur: 12 },
      { t: 'table', dur: 9, h: '漏斗分责：哪一环掉了，谁来改', eb: 'SPM 五维四率', cols: [['哪一环掉了', 560], ['通常是', 520], ['谁来改', 600]], rows: [['进入率低', '画面、封面', '运营（不怪主播）'], ['点击率低', '引导话术', '主播'], ['点击后转化低', '逼单、价格、信任', '主播 + 运营（赠品、价格）']] },
      { t: 'control', dur: 10 },
      { t: 'drill', dur: 7, items: ['按轮记五个数（场控帮你记）', '对照诊断表，找出一个病因', '下一场只改这一处'] },
      { t: 'check', dur: 6 },
      { t: 'next', dur: 4, text: '第 7 课 · 你的播法' }] },
    { no: 7, short: '你的播法', title: '你的播法', acc: A.need, goal: '找到自己的主负责段落，用自己的话讲', pass: '定出自己的类型；把一段逐字稿改成自己的话。', beats: [
      { t: 'title', dur: 6 },
      { t: 'compass', dur: 11 },
      { t: 'table', dur: 10, h: '四种播法，各管一段', cols: [['类型', 250], ['你的样子', 360], ['主负责', 520], ['弱项怎么补', 550]], fs: 26, rows: [['能量带动型', '语速快、能量强', '憋单和逼单段', '讲品用逐字稿控速'], ['审美种草型', '审美好，自己就是用户', '成套搭配', '逼单背固定三句'], ['专业讲解型', '讲细节稳、有耐心', '利润款讲解、信任段', '憋单段由场控补气氛'], ['控场主导型', '反应快、敢带节奏', '人多时段、接播、开价', '讲品放慢，多讲人话']] },
      { t: 'quote', dur: 8, q: '「销售的感觉太强了，太格式化了。」', who: '主管对主播A 的点评', a: '框架是骨架，话要用你自己的。', b: '讲人话。' },
      { t: 'drill', dur: 7, items: ['把逐字稿改写成「跟闺蜜说」的版本', '开场白换成自己平时会说的话', '录下来当一次顾客：你自己想买吗？'] },
      { t: 'check', dur: 6 },
      { t: 'next', dur: 4, text: '第 8 课 · 拆解头部' }] },
    { no: 8, short: '拆解头部', title: '拆解顶尖直播间', acc: A.gold, goal: '学到头部能复制的部分', pass: '交一份拆解表：每分钟的动作、峰值前 30 秒、学得来和学不来。', beats: [
      { t: 'title', dur: 6 },
      { t: 'two', dur: 9, h: '学头部：抄结构，不抄运气', a: '学不来 · 护城河（靠时间和资源攒）', ai: ['颜值与人设 IP', '定制货、独家款', '需求大于供给', '没有同款和仿品竞争', '投流预算', '场控、剪辑、私域团队'], b: '学得来 · 方法', bi: ['憋单结构', '逼单节奏', '五道门的顺序', '信任动作：验货、拆盒、实测', '场控配合', '复盘机制'] },
      { t: 'decode7', dur: 9 },
      { t: 'cards', dur: 8.5 },
      { t: 'points', dur: 9, h: '我们这个量级用得上的五张卡', eb: '在主播A 的 19 条复盘里命中过', note: '命中只说明场景对得上，效果还要用自己的数据验证', items: [['憋单拉流', '在线断档时，用福利款把人拉回来'], ['停留撬流', '用场景故事留人，不硬逼单'], ['嗓音状态', '场控提醒语速和情绪'], ['净利还原', '按退款后的结算额算账'], ['价格弹性测试', '不同价、不同赠品，小范围测']] },
      { t: 'check', dur: 6 },
      { t: 'next', dur: 4, text: '第 9 课 · 合规与出师' }] },
    { no: 9, short: '合规与出师', title: '合规红线与出师', acc: A.alarm, goal: '知道哪些话一句都不能说，知道自己走到哪一步', pass: '连续 2 场达到场均目标（目前 3,000 元）。', beats: [
      { t: 'title', dur: 6 },
      { t: 'compliance', dur: 11 },
      { t: 'roadmap', dur: 13 },
      { t: 'points', dur: 9, h: '每天练 15–30 分钟', items: [['两分钟讲品', '随机一款，两分钟过完五道门'], ['挑刺接话', '「会不会掉色？」5 秒内接回来'], ['冷场接回', '连续 30 秒没人说话，怎么接'], ['四要素逼单', '同一款，四个要素各逼一次'], ['讲人话改写', '一段逐字稿改成自己的话']] },
      { t: 'check', dur: 6 },
      { t: 'finale', dur: 7 }] }
  ];
  R.LESSONS = LESSONS;

  R.buildLessons = function () {
    return LESSONS.map(L => {
      const gap = .0;
      const dur = L.beats.reduce((a, b) => a + b.dur + gap, 0);
      const reel = R.makeReel('l' + L.no, { dur, audio: 'audio/lesson-' + L.no + '.mp3', label: '第 ' + L.no + ' 课 · ' + L.short, hud: true });
      R.scene(reel, 0, dur, c => {
        const wmw = E(c.root, 'a', { left: 0, top: 0 });
        const wm = T(wmw, 1500, 180, 'bignum', String(L.no), { fontSize: 860, color: L.acc, opacity: .045 }, false);
        c.tl.set(wmw, { autoAlpha: 0 }, 0);
        c.tl.to(wmw, { autoAlpha: 1, duration: 1.2 }, c.at(L.beats[0].dur));
        c.hook(0, lt => { wm.style.transform = 'translateY(' + (Math.sin(lt * .25) * 14).toFixed(1) + 'px)'; });
        let x = 0;
        L.beats.forEach((b, i) => {
          const g = E(c.root, 'a', { left: 0, top: 0 });
          const cc = Object.create(c); cc.root = g;
          reel.chapters.push({ title: b.ch || CH[b.t] || b.t, start: x, dur: b.dur });
          c.tl.set(g, { autoAlpha: 0 }, 0);
          c.tl.set(g, { autoAlpha: 1 }, c.at(x));
          BEATS[b.t](cc, g, x, b, L);
          const last = i === L.beats.length - 1;
          if (!last) {
            c.tl.to(g, { autoAlpha: 0, duration: .45, ease: 'power2.in' }, c.at(x + b.dur - .5));
            c.sweep(x + b.dur - .45);
          }
          x += b.dur + gap;
        });
      });
      R.hud(reel, .6, dur - .9, 'LESSON ' + String(L.no).padStart(2, '0') + ' · ' + L.short);
      return reel;
    });
  };
})();
