/* ============================================================
   成交方程式 · 市场篇 — 时尚饰品市场地图（约 68 秒）
   数据全部来自 主播知识库/raw/公开数据 里的公开资料（2026-09-28 录入）
   ============================================================ */
(function () {
  'use strict';
  const R = window.REEL;
  const { E, T, S, svgLayer, slate, hash, clamp, E_, fmtInt } = R;

  const so = (root, x, y, text, size) => {
    const el = E(root, 'a so', { left: x, top: y, fontSize: size || 44 });
    el.innerHTML = '<span class="arr">所以 →</span><span>' + R.tint(text) + '</span>';
    return el;
  };

  /* ---------- 0 · open ---------- */
  function mOpen(c) {
    const { root } = c;
    const k = .55;
    c.pset('gemX', 960, 0); c.pset('gemY', 540, 0); c.pset('gemR', 230, 0); c.pset('gemCut', 6, 0);
    c.pset('gemLine', 0, 0); c.pset('gemFill', 0, 0); c.pset('gemFire', 0, 0); c.pset('gemA', 0, 0);
    c.pt('gemA', 1, .9 * k, .5 * k);
    c.pt('gemLine', 1, 1.0 * k, 2.3 * k, 'power1.inOut');
    c.pt('gemFill', 1, 3.0 * k, 1.3 * k, 'power2.out');
    c.pt('gemFire', 1, 3.8 * k, 1.2 * k, 'power2.out');
    c.pt('flash', .3, 3.95 * k, .1, 'none'); c.pt('flash', 0, 3.95 * k + .1, 1.0, 'power2.out');
    c.pt('dustA', 1, 3.9 * k, 2.5 * k);
    c.pt('gemRays', 1, 4.0 * k, 2 * k);
    c.pt('gemR', 480, 2.4, 1.0, 'power3.inOut'); c.pt('gemA', .2, 2.4, 1.0);
    const t0 = 2.5;
    const eb = T(root, 960, 318, 'mono ctr c-gold', 'MARKET MAP  ·  仿宝石设计款  ·  2026', { fontSize: 18, letterSpacing: '.42em' }, false);
    const tt = T(root, 960, 380, 'disp ctr', '时尚饰品市场地图', { fontSize: 150, letterSpacing: '.05em' });
    const sub = T(root, 960, 600, 'sans ctr c-mute', '在哪个品类  ·  有多大  ·  谁在抢  ·  红线在哪', { fontSize: 32, letterSpacing: '.14em' }, false);
    const en = T(root, 960, 690, 'bod ctr c-gold', 'The Market Chapter', { fontSize: 54 }, false);
    c.fade(eb, t0, { y: 16, d: 1 });
    c.chars(tt, t0 + .1, { st: .07, blur: 18, y: 36, sc: 1.2, d: 1.2 });
    c.fade(sub, t0 + 1.0, { y: 14, d: 1 });
    c.fade(en, t0 + 1.4, { y: 12, d: 1 });
    const tx = c.d - .85;
    c.tl.to(tt.chs, {
      y: i => -50 - hash(i) * 70, x: i => (hash(i + 3) - .5) * 220, rotation: i => (hash(i + 7) - .5) * 36,
      opacity: 0, filter: 'blur(8px)', duration: .7, ease: 'power3.in', stagger: .035
    }, c.at(tx));
    c.out([eb, sub, en], tx + .05, { d: .5 });
    c.pt('gemA', 0, tx, .6);
    c.sweep(tx + .1);
  }

  /* ---------- 1 · five scopes ---------- */
  function mScope(c) {
    const { root } = c;
    slate(c, '01', '市场口径', 'THE SCOPE');
    c.pt('dustA', .6, 0, 1);
    const h = T(root, 120, 234, 'disp', '同一个「饰品市场」，五个数字。', { fontSize: 50 });
    c.chars(h, .3, { st: .035 });
    const ROWS = [
      { l: '流行饰品及其他', s: '中宝协 · 2024 · 零售', v: 130, t: '130 亿元', em: 1 },
      { l: '中国人造首饰', s: '海外咨询 · 2025 · 零售 · 推算', v: 181, t: '约 181 亿元', em: 1 },
      { l: '义乌饰品产业带', s: '工厂产值 · 含出口和发饰', v: 1000, t: '超 1,000 亿元' },
      { l: '金银珠宝类零售', s: '国家统计局 · 2025 · 以贵金属为主', v: 3736, t: '3,736 亿元' },
      { l: '珠宝玉石首饰产业', s: '中宝协 · 2024 · 黄金占 73%', v: 7788, t: '7,788 亿元' }
    ];
    const X0 = 640, WMAX = 960;
    const rows = ROWS.map((r, i) => {
      const y = 330 + i * 106;
      const g = E(root, 'a', { left: 0, top: 0 });
      const lb = T(g, 120, y, 'sans7', r.l, { fontSize: 32 }, false);
      const sb = T(g, 120, y + 46, 'src', r.s, null, false);
      const w = Math.max(6, r.v / 7788 * WMAX);
      const bar = E(g, 'a', { left: X0, top: y + 12, width: w, height: 30, borderRadius: '0 5px 5px 0', background: 'rgba(243,238,228,.34)', transformOrigin: '0 50%' });
      const val = T(g, X0 + w + 22, y + 6, 'sans7', r.t, { fontSize: 32 }, false);
      const at = 1.2 + i * .32;
      c.fade([lb, sb], at - .2, { x: -20, d: .6 });
      c.grow(bar, at, 1.1);
      c.fade(val, at + .5, { x: -12, d: .6 });
      return { g, bar, val, em: r.em };
    });
    // highlight our retail scope
    rows.forEach(r => {
      if (r.em) c.tl.to(r.bar, { background: '#D8BC80', duration: .6, ease: 'power2.out' }, c.at(5.6));
      else c.tl.to(r.g, { opacity: .38, duration: .6 }, c.at(5.6));
    });
    const br = E(root, 'a', { left: 1030, top: 336, width: 3, height: 150, background: '#D8BC80', transformOrigin: '50% 0' });
    const bl = T(root, 1060, 352, 'disp c-gold', '我们这个品类的零售口径', { fontSize: 40 });
    const bl2 = T(root, 1062, 420, 'sans', '一年大约 {g:130–180 亿元}', { fontSize: 34 }, false);
    c.tl.fromTo(br, { scaleY: 0 }, { scaleY: 1, duration: .7, ease: 'expo.out' }, c.at(5.8));
    c.chars(bl, 6.0, { st: .04 });
    c.fade(bl2, 6.8, { y: 12 });
    const s1 = so(root, 120, 900, '说数字之前，先说口径。', 46);
    c.fade(s1, 9.4, { x: -20, d: .7 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ---------- 2 · buyers ---------- */
  function mBuyer(c) {
    const { root } = c;
    slate(c, '02', '谁在买', 'THE BUYER');
    const h = T(root, 120, 234, 'disp', '她先看合不合适，再看价格。', { fontSize: 50 });
    c.chars(h, .3, { st: .04 });
    const B = [['和个人风格合不合适', 39.75], ['材质', 37.95], ['设计', 36.93]];
    B.forEach((b, i) => {
      const y = 350 + i * 118;
      const lb = T(root, 120, y, 'sans7', b[0], { fontSize: 32 }, false);
      const w = b[1] / 70 * 760;
      const bar = E(root, 'a', { left: 120, top: y + 52, width: w, height: 22, borderRadius: '0 4px 4px 0', background: i ? 'rgba(243,238,228,.34)' : '#D8BC80', transformOrigin: '0 50%' });
      const v = T(root, 120 + w + 20, y + 40, 'bnum', b[1].toFixed(2) + '%', { fontSize: 44 }, false);
      const at = 1.0 + i * .35;
      c.fade(lb, at, { x: -16, d: .6 }); c.grow(bar, at + .1, 1.1); c.fade(v, at + .6, { d: .6 });
    });
    const s1 = T(root, 120, 720, 'src', '来源 · 艾媒咨询 2025 饰品消费调查（多选，样本含买黄金的人）', null, false);
    c.fade(s1, 2.4, {});
    const c1 = E(root, 'card', { left: 1000, top: 300, width: 800, height: 250 });
    const n1 = E(c1, 'a bignum c-gold', { left: 44, top: 40, fontSize: 150 }, '0%');
    const l1 = E(c1, 'a disp', { left: 410, top: 62, fontSize: 44 }, '最喜欢赠品');
    const d1 = E(c1, 'a sans c-mute', { left: 410, top: 132, fontSize: 28 }, '福利用赠品，不用降价');
    c.fade(c1, 3.6, { y: 30, d: .8 });
    c.hook(3.8, lt => { n1.textContent = Math.round(61 * E_.outExpo(clamp(lt / 1.4))) + '%'; });
    c.fade([l1, d1], 4.3, { x: 16, st: .2 });
    const c2 = E(root, 'card', { left: 1000, top: 590, width: 800, height: 250 });
    const n2 = E(c2, 'a bignum', { left: 44, top: 40, fontSize: 150 }, '0%');
    const l2 = E(c2, 'a disp', { left: 410, top: 62, fontSize: 44 }, '是女性');
    const d2 = E(c2, 'a sans c-mute', { left: 410, top: 132, fontSize: 28, lineHeight: 1.45 }, '视频号购买用户<br>微信官方 · 2023');
    c.fade(c2, 5.4, { y: 30, d: .8 });
    c.hook(5.6, lt => { n2.textContent = Math.round(78 * E_.outExpo(clamp(lt / 1.4))) + '%'; });
    c.fade([l2, d2], 6.1, { x: 16, st: .2 });
    const s2 = so(root, 120, 900, '讲品先讲「适合谁、怎么搭」，再讲价格。', 42);
    c.fade(s2, 7.6, { x: -20, d: .7 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ---------- 3 · rivals ---------- */
  function mRivals(c) {
    const { root } = c;
    slate(c, '03', '谁在抢', 'THE RIVALS');
    const h = T(root, 120, 234, 'disp', '价格带上的对手。', { fontSize: 50 });
    c.chars(h, .3, { st: .05 });
    const g = E(root, 'a', { left: 0, top: 0 });
    const X0 = 620, X1 = 1790, LMIN = 1, LMAX = Math.log10(20000);
    const X = v => X0 + (Math.log10(v) - LMIN) / (LMAX - LMIN) * (X1 - X0);
    const sv = svgLayer(g);
    [10, 50, 100, 300, 1000, 3000, 10000].forEach(t => {
      S(sv, 'line', { x1: X(t), x2: X(t), y1: 318, y2: 842, stroke: 'rgba(243,238,228,.08)', 'stroke-width': 1 });
    });
    const band = S(sv, 'rect', { x: X(100), y: 318, width: X(300) - X(100), height: 524, fill: 'rgba(216,188,128,.13)', stroke: 'rgba(216,188,128,.55)', 'stroke-width': 1 });
    const axis = [10, 50, 100, 300, 1000, 3000, 10000].map(t => T(g, X(t), 858, 'mono ctr c-mute', (t >= 1000 ? (t / 1000) + 'k' : t) + (t === 10 ? ' 元' : ''), { fontSize: 16 }, false));
    c.fade(sv, .6, { d: .6 }); c.fade(axis, .8, { y: 8, st: .05 });
    const P = [
      { n: '电镀饰品（平替）', lo: 30, hi: 600, fz: 1, t: '几十到几百元' },
      { n: '我们 · 仿宝石设计款', lo: 100, hi: 300, em: 1, t: '100–300 元' },
      { n: '南奢 · 名媛风', at: 400, t: '客单约 400 元' },
      { n: '范琦 · 银饰', at: 500, t: '多在 500 元以内' },
      { n: 'Caraxy · 培育钻', at: 1000, t: '千元档' },
      { n: '戴拉 · 礼兰（视频号）', lo: 100, hi: 10000, fz: 1, t: '百元至万元以上' }
    ];
    P.forEach((p, i) => {
      const y = 346 + i * 82;
      const nm = T(g, 120, y - 6, p.em ? 'sans7 c-gold' : 'sans7', p.n, { fontSize: 28 }, false);
      let mark, tx;
      if (p.at) {
        mark = S(sv, 'circle', { cx: X(p.at), cy: y + 12, r: 11, fill: '#F3EEE4', stroke: '#0A0C14', 'stroke-width': 3 });
        tx = X(p.at) + 24;
      } else {
        mark = S(sv, 'rect', { x: X(p.lo), y: y + 3, width: X(p.hi) - X(p.lo), height: 18, rx: 9,
          fill: p.em ? '#D8BC80' : (p.fz ? 'rgba(243,238,228,.16)' : 'rgba(243,238,228,.42)'),
          stroke: p.fz ? 'rgba(243,238,228,.5)' : 'none', 'stroke-dasharray': p.fz ? '6 5' : 'none', 'stroke-width': 1.5 });
        tx = X(p.hi) + 22;
      }
      const flip = tx > 1560;
      const lab = T(g, flip ? X(p.lo) - 22 : tx, y - 2, 'sans c-mute', p.t, { fontSize: 24 }, false);
      // right-anchor via xPercent so the fade's x tween can't wipe it
      if (flip) gsap.set(lab, { xPercent: -100 });
      const at = 1.3 + i * .38;
      c.fade(nm, at, { x: -16, d: .6 });
      c.tl.fromTo(mark, { opacity: 0, scale: p.at ? 0 : 1, transformOrigin: p.at ? `${X(p.at)}px ${y + 12}px` : `${X(p.lo)}px ${y + 12}px` },
        { opacity: 1, scale: 1, duration: .7, ease: p.at ? 'back.out(2.5)' : 'expo.out' }, c.at(at + .1));
      c.fade(lab, at + .4, { x: -10, d: .6 });
    });
    c.out(g, 7.6, { d: .5 });
    c.out(h, 7.6, { d: .5 });
    // two stats
    const k1 = E(root, 'card', { left: 120, top: 300, width: 800, height: 520 });
    const kn = E(k1, 'a', { left: 56, top: 60, display: 'flex', alignItems: 'baseline', gap: '18px' });
    kn.innerHTML = '<span class="bignum c-gold" style="font-size:230px">8</span><span class="bnum" style="font-size:110px;color:#A3A0AE">/ 10</span>';
    const kt = E(k1, 'a disp w', { left: 56, top: 310, width: 690, fontSize: 40, lineHeight: 1.35 }, '抖音双 11 时尚饰品前十，<br>八个是新面孔。');
    const ks = E(k1, 'a src', { left: 56, top: 440 }, '沥金 × 蝉魔方 · 2024');
    c.fade(k1, 8.0, { y: 30, d: .7 }); c.fade(kn.children, 8.2, { sc: .6, st: .15, d: .7, ease: 'back.out(2)' });
    c.fade([kt, ks], 8.7, { y: 10, st: .2 });
    const k2 = E(root, 'card', { left: 1000, top: 300, width: 800, height: 520 });
    const pn = E(k2, 'a', { left: 56, top: 50, display: 'flex', alignItems: 'baseline', gap: '6px' });
    pn.innerHTML = '<span class="op c-alarm" style="font-size:120px">–</span><span class="bignum" style="font-size:190px">71%</span>';
    const pt = E(k2, 'a disp w', { left: 56, top: 262, width: 420, fontSize: 36, lineHeight: 1.35 }, '潘多拉中国区销售额<br>2019 → 2023');
    const ps = E(k2, 'a src', { left: 56, top: 440 }, '亿丹麦克朗 · 公司财报');
    const COLS = [['2019', 19.7], ['2021', 11.26], ['2023', 5.64]];
    COLS.forEach((cc, i) => {
      const hgt = cc[1] / 19.7 * 190;
      const col = E(k2, 'a', { left: 520 + i * 86, top: 440 - hgt, width: 56, height: hgt, borderRadius: '5px 5px 0 0', background: i === 2 ? '#FF5A67' : 'rgba(243,238,228,.34)', transformOrigin: '50% 100%' });
      const cv = E(k2, 'a mono ctr', { left: 548 + i * 86, top: 440 - hgt - 30, fontSize: 16 }, String(cc[1]));
      const cy = E(k2, 'a mono ctr c-mute', { left: 548 + i * 86, top: 452, fontSize: 15 }, cc[0]);
      c.tl.fromTo(col, { scaleY: 0 }, { scaleY: 1, duration: .6, ease: 'power3.out' }, c.at(9.3 + i * .3));
      c.fade([cv, cy], 9.5 + i * .3, { d: .4 });
    });
    c.fade(k2, 8.9, { y: 30, d: .7 }); c.fade(pn.children, 9.1, { sc: .7, st: .12, d: .6 });
    c.fade([pt, ps], 9.6, { y: 10, st: .2 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ---------- 4 · wind & red line ---------- */
  function mRedline(c) {
    const { root } = c;
    slate(c, '04', '风向与红线', 'THE LINE');
    const h = T(root, 120, 234, 'disp', '金价两年多翻了一倍多。', { fontSize: 50 });
    c.chars(h, .3, { st: .045 });
    const g = E(root, 'a', { left: 0, top: 0 });
    const sv = svgLayer(g);
    const t0 = Date.parse('2023-10-01'), t1 = Date.parse('2026-12-01');
    const X = d => 160 + (Date.parse(d) - t0) / (t1 - t0) * 900, Y = v => 830 - v / 1500 * 460;
    [0, 500, 1000, 1500].forEach(v => {
      S(sv, 'line', { x1: 160, x2: 1060, y1: Y(v), y2: Y(v), stroke: 'rgba(243,238,228,.08)', 'stroke-width': 1 });
    });
    const yl = [0, 500, 1000, 1500].map(v => T(g, 140, Y(v) - 12, 'mono c-mute', v.toLocaleString('en-US'), { fontSize: 15, textAlign: 'right', transform: 'translateX(-100%)' }, false));
    const xl = ['2024', '2025', '2026'].map(yv => T(g, X(yv + '-01-01'), 846, 'mono ctr c-mute', yv, { fontSize: 15 }, false));
    const PTS = [['2023-12-31', 500, '约 500'], ['2025-09-17', 1092, '1,092'], ['2025-12-28', 1400, '约 1,400'], ['2026-09-25', 1292, '1,292']];
    const d = PTS.map((p, i) => (i ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1])).join(' ');
    const path = S(sv, 'path', { d, fill: 'none', stroke: '#D8BC80', 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const len = 1100;
    path.setAttribute('stroke-dasharray', len); path.setAttribute('stroke-dashoffset', len);
    c.fade([yl, xl], .7, { d: .6 });
    c.hook(1.0, lt => { path.setAttribute('stroke-dashoffset', len * (1 - E_.inOut(clamp(lt / 2.2)))); });
    PTS.forEach((p, i) => {
      const dot = S(sv, 'circle', { cx: X(p[0]), cy: Y(p[1]), r: 9, fill: '#D8BC80', stroke: '#0A0C14', 'stroke-width': 4 });
      // label offsets keep each value clear of the line: below-right, below-right, above-right, below-left
      const [dx, dy] = [[16, 10], [16, 8], [14, -52], [-14, 24]][i];
      const lab = T(g, X(p[0]) + dx, Y(p[1]) + dy, 'bnum', p[2], { fontSize: 40 }, false);
      if (dx < 0) gsap.set(lab, { xPercent: -100 });
      const at = 1.0 + [0, .9, 1.6, 2.1][i];
      c.tl.fromTo(dot, { opacity: 0 }, { opacity: 1, duration: .3 }, c.at(at));
      c.fade(lab, at + .1, { y: 10, d: .5 });
    });
    const unit = T(g, 160, 312, 'src', '首饰金价 · 元/克 · 2026-09-25 为周大福挂牌价', null, false);
    c.fade(unit, .9, {});
    const n1 = T(root, 1160, 340, 'sans7', '平替需求很大：', { fontSize: 34 }, false);
    const n2 = T(root, 1160, 396, 'sans c-mute', '金包银约 50 元/克，电镀饰品几十到几百元。', { fontSize: 28 }, false);
    c.fade([n1, n2], 3.4, { x: 20, st: .25 });
    // red stamp
    const st = E(root, 'card', { left: 1160, top: 480, width: 640, height: 330, borderColor: 'rgba(255,90,103,.7)', background: 'linear-gradient(180deg, rgba(60,14,20,.86), rgba(24,8,12,.86))' });
    const sk = E(st, 'a mono c-alarm', { left: 32, top: 28, fontSize: 16, letterSpacing: '.24em' }, '视频号 · 禁售');
    const sq = E(st, 'a disp w', { left: 32, top: 72, width: 580, fontSize: 36, lineHeight: 1.42 }, '黄金外观、但基底为仿黄金材质的商品');
    const sm = E(st, 'a sans w c-mute', { left: 32, top: 190, width: 580, fontSize: 25, lineHeight: 1.5 }, '铜合金、塑料镀金、银镀金、包金都算');
    const ss = E(st, 'a src', { left: 32, top: 282 }, '微信官方 · 珠宝首饰类目规则 4.1.1');
    c.fade(st, 4.8, { sc: 1.08, d: .5, ease: 'power3.out' });
    c.fade([sk, sq, sm, ss], 5.0, { y: 10, st: .15 });
    c.pt('flash', .12, 4.8, .05, 'none'); c.pt('flash', 0, 4.85, .5);
    const s1 = so(root, 120, 920, '做设计款，不做黄金平替。', 46);
    c.fade(s1, 8.2, { x: -20, d: .7 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ---------- 5 · plays + loop ---------- */
  function mPlay(c) {
    const { root } = c;
    slate(c, '05', '我们的打法', 'THE PLAY');
    const h = T(root, 120, 234, 'disp', '三件事，一个每周循环。', { fontSize: 50 });
    c.chars(h, .2, { st: .045 });
    const Q = [['做设计款', '卖风格、场景和「适合我」，不卖「像金子」。'], ['把信任讲出来', '如实说材质，现场看切工、镀层、爪镶，讲清售后。'], ['押讲品，不押爆款', '款式会被复制，讲品能力和老客复购复制不了。']];
    Q.forEach((q, i) => {
      const el = E(root, 'card quad', { left: 120 + i * 580, top: 340, width: 520 });
      el.innerHTML = `<div class="qt">${q[0]}</div><div class="qd">${q[1]}</div>`;
      c.fade(el, .7 + i * .35, { y: 36, d: .7 });
    });
    const fl = E(root, 'a flow', { left: 120, top: 700 });
    const steps = ['看直播间', '记进竞品雷达', 'AI 对比', '存回知识库', '只改一处'];
    fl.innerHTML = steps.map((s, i) => (i ? '<span class="fa">→</span>' : '') + `<span class="fn">${s}</span>`).join('');
    c.fade(fl.children, 2.8, { x: -14, st: .18, d: .5 });
    const lp = T(root, 120, 812, 'mono c-mute', '↺ 每周一轮 · 看 7 日均值，不看单场', { fontSize: 20 }, false);
    c.fade(lp, 4.4, { y: 8 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ---------- 6 · outro ---------- */
  function mOutro(c) {
    const { root } = c;
    c.pset('gemX', 960, 0); c.pset('gemY', 330, 0); c.pset('gemR', 130, 0); c.pset('gemCut', 6, 0); c.pset('gemLine', 1, 0); c.pset('gemFill', 1, 0);
    c.pt('gemA', 1, .1, .8); c.pt('gemFire', 1, .1, 1); c.pt('gemRays', 1, .3, 1.2); c.pt('dustA', 1, 0, 1);
    c.pt('flash', .2, .5, .08, 'none'); c.pt('flash', 0, .58, .9);
    const lg = T(root, 960, 490, 'disp ctr', '时尚饰品市场地图', { fontSize: 110, letterSpacing: '.05em' });
    const en = T(root, 960, 650, 'bod ctr c-gold', 'The Closing Equation · Market', { fontSize: 44 }, false);
    const tl = T(root, 960, 748, 'sans ctr', '机会在{g:讲品}、{g:设计}和{g:信任}。', { fontSize: 38, letterSpacing: '.08em' }, false);
    const vv = T(root, 960, 830, 'mono ctr c-mute', '成交方程式  ·  市场篇  ·  2026', { fontSize: 16, letterSpacing: '.3em' }, false);
    c.chars(lg, .5, { st: .06, blur: 14, sc: 1.2 });
    c.fade(en, 1.2, { y: 12 }); c.fade(tl, 1.6, { y: 12 }); c.fade(vv, 2.0, {});
    c.pt('fade', 1, c.d - 1.0, .95, 'power1.in');
  }

  R.buildMarket = function () {
    const r = R.makeReel('market', { dur: 68, audio: 'audio/reel-market.mp3', label: '市场篇', hud: true });
    const seq = [
      [0, 7, mOpen, null],
      [7, 13, mScope, ['市场口径', '五个数字差六十倍：先分清口径']],
      [20, 11, mBuyer, ['谁在买', '她先看合不合适，再看价格']],
      [31, 13, mRivals, ['谁在抢', '价格带、新面孔、潘多拉的下滑']],
      [44, 12, mRedline, ['风向与红线', '金价翻倍，但金色仿品在视频号禁售']],
      [56, 7, mPlay, ['我们的打法', '讲品、设计、信任；每周只改一处']],
      [63, 5, mOutro, null]
    ];
    seq.forEach(([s, d, b, ch]) => R.scene(r, s, d, b, ch ? { title: ch[0], gist: ch[1] } : null));
    R.hud(r, 6.6, 62.6, 'MARKET MAP 2026');
    return r;
  };
})();
