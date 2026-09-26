/* ============================================================
   成交方程式 · Showreel — chapter builders + full / investor / teaser reels
   All builders take a scene context `c` with local time 0..c.d
   ============================================================ */
(function () {
  'use strict';
  const R = window.REEL;
  const { E, T, S, svgLayer, slate, hash, clamp, lerp, seg, E_, fmtInt } = R;
  const W = 1920;

  /* ---------- shared data (all from company records / sources) ---------- */
  const GATES = [
    { n: '需求', c: 'n', col: '#FF6A55', q: '跟我有关吗？', act: '讲痛点，给场景', worry: '送礼要体面' },
    { n: '价值', c: 'v', col: '#FFB443', q: '值这个价吗？', act: '先立价值，再报价', worry: '要高级感' },
    { n: '福利', c: 'p', col: '#2FD9B0', q: '现在买划算吗？', act: '比价，加上今天的福利', worry: '想花小钱' },
    { n: '信任', c: 't', col: '#5B85FF', q: '会掉色吗？靠谱吗？', act: '如实材质、售后、现场验货', worry: '怕假、怕掉色' },
    { n: '稀缺', c: 's', col: '#AE7BFF', q: '为什么是现在？', act: '真实库存、真实截止', worry: '怕撞款' }
  ];
  // 主播A 视频号 7/24–8/26：[日期, GMV, 目标(0=未写)]
  const SESS = [['7/24', 276, 3000], ['7/25', 3361.3, 3000], ['7/26', 1190.2, 3000], ['7/27', 3546.2, 3000], ['7/29', 1135.1, 3000],
    ['7/30', 2032, 3000], ['7/31', 651, 3000], ['8/1', 3327.2, 3000], ['8/2', 1336, 3000], ['8/3', 1379, 3000], ['8/5', 1350, 2800],
    ['8/7', 828, 2800], ['8/8', 718.2, 0], ['8/9', 673, 3000], ['8/18', 2262, 2800], ['8/19', 2190, 2800], ['8/21', 197, 0],
    ['8/25', 1180, 0], ['8/26', 10433.1, 2800]];
  // 14 张头部打法卡在主播A 19 条复盘上的命中情况：1 命中 / 0 未命中 / -1 未能转成规则
  const CARDS = [['憋单拉流', '交个朋友', 1], ['梯队承接', '辛选', 0], ['五分钟赛马', '交个朋友', 0], ['人群包赛马', '广东夫妇', 0],
    ['信任时长', '周大生模式', -1], ['情绪词云', '东方甄选', 0], ['停留撬流', '东方甄选', 1], ['流量分流话术', '卡思', 0],
    ['私域撬公域', '视频号实战', 0], ['切片回流', '遥望', 0], ['新老粉健康', '百亿自播', 0], ['净利还原', '结算派', 1],
    ['嗓音状态', '无忧传媒', 1], ['价格弹性测试', '赵圆圆', 1]];
  const STEPS = [
    { n: '痛点', g: 0, d: '说出她正在烦的事', line: '买过那种戴两次就发暗的吗？好看，但不敢常戴。' },
    { n: '卖点', g: 1, d: '看得见 · 摸得着 · 想得到', line: '灯一打，切面一闪一闪。颜色看得见，做工摸得着。' },
    { n: '场景', g: 1, d: '让她看见自己戴上的样子', line: '白衬衫、米色风衣都压得住。聚会上，别人第二眼就问你在哪买的。' },
    { n: '福利', g: 2, d: '今天在这里买，多得到什么', line: '今天直播间下单，礼盒给你配好，送人拿得出手。' },
    { n: '质保', g: 3, d: '如实材质，讲清售后', line: '材质如实说：人工仿宝石。教你三招看做工：切工、镀层、爪镶。' },
    { n: '逼单', g: 4, d: '四要素收口，给具体动作', line: '这一批就这些，喜欢的扣 1，我按顺序优先给你过。' }
  ];
  const FOUR = [
    { n: '价值', c: '#FFB443', d: '先把心理价值拉到位，再报价。', r: '红线 · 报价太早' },
    { n: '比价', c: '#2FD9B0', d: '跟她能看到的替代品比，参照必须真实。', r: '红线 · 不虚构原价' },
    { n: '保障', c: '#5B85FF', d: '售后规则、如实材质、现场验货。', r: '红线 · 不做做不到的承诺' },
    { n: '稀缺', c: '#AE7BFF', d: '真实库存、真实批次、真实截止。', r: '红线 · 假稀缺就是违规' }
  ];
  R.DATA = { GATES, SESS, CARDS, STEPS, FOUR };

  const so = (root, x, y, text, size) => {
    const el = E(root, 'a so', { left: x, top: y, fontSize: size || 44 });
    el.innerHTML = '<span class="arr">所以 →</span><span>' + R.tint(text) + '</span>';
    return el;
  };
  const chip = (root, x, y, html, css) => E(root, 'chip', Object.assign({ left: x, top: y }, css || {}), R.tint(html));

  /* ============================================================
     C0 · cold open
     ============================================================ */
  function bOpen(c, short) {
    const { root } = c;
    const k = short ? .55 : 1; // time scale for the short version
    c.pset('gemX', 960, 0); c.pset('gemY', 540, 0); c.pset('gemR', 230, 0); c.pset('gemCut', 6, 0);
    c.pset('gemLine', 0, 0); c.pset('gemFill', 0, 0); c.pset('gemFire', 0, 0); c.pset('gemA', 0, 0);
    c.pt('dot', 1, .1 * k, .7 * k, 'power2.out'); c.pt('dot', 0, 1.4 * k, .9 * k);
    c.pt('gemA', 1, .9 * k, .5 * k);
    c.pt('gemLine', 1, 1.0 * k, 2.3 * k, 'power1.inOut');
    c.pt('gemFill', 1, 3.0 * k, 1.3 * k, 'power2.out');
    c.pt('gemFire', 1, 3.8 * k, 1.2 * k, 'power2.out');
    c.pt('flash', .32, 3.95 * k, .1, 'none'); c.pt('flash', 0, 3.95 * k + .1, 1.0, 'power2.out');
    c.pt('dustA', 1, 3.9 * k, 2.5 * k);
    c.pt('gemRays', 1, 4.0 * k, 2 * k);
    if (!short) {
      c.pt('gemY', 400, 4.6, 1.3, 'power3.inOut'); c.pt('gemR', 170, 4.6, 1.3, 'power3.inOut');
      const l1 = T(root, 960, 650, 'disp ctr', '讲到你自己都想买，', { fontSize: 88 });
      const l2 = T(root, 960, 770, 'disp ctr', '你就{g:讲对了}。', { fontSize: 88 });
      c.chars(l1, 5.0, { st: .06, blur: 16, y: 26, d: 1.1 });
      c.chars(l2, 6.5, { st: .08, blur: 16, y: 26, d: 1.1 });
      c.out([l1, l2], 8.5, { y: -30, blur: 10, d: .6 });
      c.pt('gemY', 540, 8.5, 1.3, 'power3.inOut'); c.pt('gemR', 480, 8.5, 1.3, 'power3.inOut');
      c.pt('gemA', .2, 8.5, 1.3); c.pt('gemRays', .4, 8.5, 1.3);
    } else {
      c.pt('gemY', 540, 0, .1); c.pt('gemR', 480, 2.4, 1.0, 'power3.inOut'); c.pt('gemA', .2, 2.4, 1.0);
    }
    const t0 = short ? 2.5 : 8.9;
    const eb = T(root, 960, 330, 'mono ctr c-gold', short ? 'INVESTOR CUT  ·  2026' : 'SHOWREEL  ·  主播训练体系  ·  2026', { fontSize: 18, letterSpacing: '.42em' }, false);
    const tt = T(root, 960, 385, 'disp ctr', '成交方程式', { fontSize: 196, letterSpacing: '.06em' });
    const en = T(root, 960, 632, 'bod ctr c-gold', 'The Closing Equation', { fontSize: 66 }, false);
    const sub = T(root, 960, 742, 'sans ctr c-mute', short ? '一条可以复制的主播生产线' : '讲给主播听  ·  算给投资人看', { fontSize: 30, letterSpacing: '.16em' }, false);
    c.fade(eb, t0, { y: 16, d: 1 });
    c.chars(tt, t0 + .1, { st: .09, blur: 20, y: 40, sc: 1.2, d: 1.3 });
    c.fade(en, t0 + .8, { y: 20, d: 1.1 });
    c.fade(sub, t0 + 1.2, { y: 14, d: 1 });
    const tx = c.d - .85;
    c.tl.to(tt.chs, {
      y: i => -60 - hash(i) * 80, x: i => (hash(i + 3) - .5) * 260, rotation: i => (hash(i + 7) - .5) * 40,
      opacity: 0, filter: 'blur(8px)', duration: .7, ease: 'power3.in', stagger: .04
    }, c.at(tx));
    c.out([eb, en, sub], tx + .05, { d: .5 });
    c.sweep(tx + .1);
  }

  /* ============================================================
     C1 · market
     ============================================================ */
  function bMarket(c) {
    const { root } = c;
    slate(c, '01', '市场', 'THE STAGE');
    c.pt('gemA', 0, 0, .8); c.pt('gemRays', 0, 0, .8); c.pt('dustA', .7, 0, 1);
    // beat 1 — 5 万亿+
    const g1 = E(root, 'a', { left: 0, top: 0 });
    const row = E(g1, 'a', { left: 150, top: 250, display: 'flex', alignItems: 'baseline', gap: '18px' });
    const five = E(row, 'bignum', { fontSize: 420 }, '0');
    const wy = E(row, 'disp', { fontSize: 150 }, '万亿');
    const pl = E(row, 'bod c-gold', { fontSize: 190 }, '+');
    const cap1 = T(g1, 160, 700, 'sans7', '2025 年直播电商 GMV', { fontSize: 46 }, false);
    const cap2 = T(g1, 160, 772, 'sans c-mute', '占网络零售额近三分之一 · 直播电商用户约 6.6 亿', { fontSize: 34 }, false);
    const src1 = T(g1, 160, 850, 'src', '来源 · 经济日报 2026-03-02（直播电商 GMV 超 5 万亿元）', null, false);
    c.fade(five, .5, { y: 60, blur: 20, d: 1.2 });
    c.fade(wy, 1.1, { x: -30, d: 1 }); c.fade(pl, 1.7, { sc: .4, d: .8, ease: 'back.out(2)' });
    c.hook(.5, lt => { five.textContent = String(Math.min(5, Math.max(0, Math.floor(E_.outCubic(clamp(lt / 1.3)) * 5.99)))); });
    c.fade([cap1, cap2, src1], 1.9, { y: 18, st: .15 });
    // donut: 近 1/3
    const svg = svgLayer(g1);
    const cx = 1450, cy = 500, r = 210, C = 2 * Math.PI * r;
    S(svg, 'circle', { cx, cy, r, fill: 'none', stroke: 'rgba(243,238,228,.09)', 'stroke-width': 34 });
    const arc = S(svg, 'circle', { cx, cy, r, fill: 'none', stroke: '#D8BC80', 'stroke-width': 34, 'stroke-dasharray': C, 'stroke-dashoffset': C, transform: `rotate(-90 ${cx} ${cy})`, 'stroke-linecap': 'butt' });
    const dl = T(g1, cx, cy - 70, 'bod ctr', '{o:≈} 1/3', { fontSize: 104 }, false);
    const dl2 = T(g1, cx, cy + 58, 'sans ctr c-mute', '的网络零售', { fontSize: 28 }, false);
    c.fade(svg, 1.2, { d: .6 });
    c.hook(1.3, lt => { arc.setAttribute('stroke-dashoffset', C * (1 - E_.inOut(clamp(lt / 1.6)) / 3)); });
    c.fade([dl, dl2], 2.4, { y: 14, st: .2 });
    c.out(g1, 4.3, { y: -24, d: .5 });
    // beat 2 — three stats
    const g2 = E(root, 'a', { left: 0, top: 0 });
    const stats = [
      { x: 150, n: 6.6, dec: 1, u: '亿', l: '直播电商用户（2025）', s: '经济日报 · 网经社' },
      { x: 700, n: 3880, dec: 0, u: '万', l: '职业主播（2024）', s: '中国网络视听节目服务协会' },
      { x: 1270, n: 3736, dec: 0, u: '亿元', l: '金银珠宝零售额（2025）{p: +12.8%}', s: '国家统计局 · 限额以上单位' }
    ];
    stats.forEach((st, i) => {
      const rl = E(g2, 'rule', { left: st.x, top: 318, width: 460 });
      const rw = E(g2, 'a', { left: st.x, top: 340, display: 'flex', alignItems: 'baseline', gap: '10px' });
      const num = E(rw, 'bignum', { fontSize: 150 }, '0');
      const un = E(rw, 'disp', { fontSize: 66 }, st.u);
      const lb = T(g2, st.x, 560, 'sans7', st.l, { fontSize: 32 }, false);
      const sr = T(g2, st.x, 616, 'src', '来源 · ' + st.s, null, false);
      const at = 4.7 + i * .45;
      c.grow(rl, at, 1.1);
      c.fade(rw, at + .1, { y: 40, d: 1 });
      c.fade([lb, sr], at + .4, { y: 14, st: .12 });
      c.hook(at + .1, lt => {
        const v = st.n * E_.outExpo(clamp(lt / 1.6));
        num.textContent = st.dec ? v.toFixed(st.dec) : fmtInt(v);
      });
    });
    const note = T(g2, 150, 760, 'sans c-mute', '舞台足够大：直播电商已经是网络零售里最大的增量。', { fontSize: 34 }, false);
    c.fade(note, 6.6, { y: 12 });
    c.out(g2, 8.5, { y: -24, d: .5 });
    // beat 3 — 八成以上
    const g3 = E(root, 'a', { left: 0, top: 0 });
    const sv3 = svgLayer(g3);
    const dots = [];
    for (let i = 0; i < 100; i++) dots.push(S(sv3, 'circle', { cx: 212 + (i % 10) * 52, cy: 322 + Math.floor(i / 10) * 52, r: 15, fill: '#D8BC80' }));
    const order = dots.map((d, i) => [hash(i * 3.1), i]).sort((a, b) => a[0] - b[0]).map(x => dots[x[1]]);
    c.tl.fromTo(dots, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .5, ease: 'back.out(2)', stagger: { each: .006, from: 'center', grid: [10, 10] } }, c.at(8.9));
    c.tl.to(order.slice(0, 80), { opacity: .16, duration: .35, stagger: .012, ease: 'power1.out' }, c.at(10.1));
    const b1 = T(g3, 830, 300, 'disp', '八成以上', { fontSize: 150 });
    const b2 = T(g3, 836, 486, 'sans', '职业主播月收入不到 {g:8,000} 元', { fontSize: 50 }, false);
    const b3 = T(g3, 836, 568, 'sans c-mute', '同时，直播人才缺口预计达 {g:1,941.5 万}', { fontSize: 36 }, false);
    const b4 = T(g3, 836, 650, 'src', '来源 · 中国演出行业协会网络表演（直播）分会、快手《网络主播新职业发展报告》2024-11', null, false);
    c.chars(b1, 9.4, { st: .07, blur: 12 });
    c.fade([b2, b3, b4], 10.4, { y: 16, st: .25 });
    c.out(g3, 12.9, { d: .5 });
    // beat 4 — 人不缺，会卖的人缺
    const k1 = T(root, 960, 330, 'disp ctr', '人不缺。', { fontSize: 150 });
    const k2 = T(root, 960, 530, 'disp ctr c-gold', '会卖的人缺。', { fontSize: 150 });
    c.chars(k1, 13.2, { st: .08, blur: 14 });
    c.chars(k2, 13.9, { st: .08, blur: 14 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     C2 · three failures
     ============================================================ */
  function bigNo(c, root, no, x) {
    const el = T(root, 110, 236, 'bignum', no, { fontSize: 250, color: 'rgba(216,188,128,.35)' }, false);
    c.fade(el, x, { x: -40, d: 1 });
    return el;
  }
  function fail1(c, x0) {
    const root = E(c.root, 'a', { left: 0, top: 0 });
    const x = v => x0 + v;
    bigNo(c, root, '01', x(0));
    const h = T(root, 520, 258, 'disp', '有经验的主播，试训半天就走了', { fontSize: 62 });
    const f = T(root, 522, 350, 'sans c-mute', '3 年直播经验 · 卖过玉 · 自己就是用户 · 语速快', { fontSize: 30 }, false);
    c.chars(h, x(.1), { st: .03 });
    c.fade(f, x(.6), { y: 12 });
    const sv = svgLayer(root);
    const line = S(sv, 'line', { x1: 560, y1: 470, x2: 1400, y2: 470, stroke: 'rgba(243,238,228,.25)', 'stroke-width': 2 });
    const nodes = [[560, '面试', '简单聊过'], [980, '试训', '没谈条件 · 没收资料'], [1400, '离开', '半天后，没再回来']];
    const labs = [];
    nodes.forEach(([nx, a, b], i) => {
      S(sv, 'circle', { cx: nx, cy: 470, r: 9, fill: i === 2 ? '#5F5D6D' : '#D8BC80' });
      labs.push(T(root, nx, 404, 'sans7 ctr', a, { fontSize: 28 }, false));
      labs.push(T(root, nx, 500, 'sans ctr c-mute', b, { fontSize: 24 }, false));
    });
    const who = S(sv, 'circle', { cx: 560, cy: 470, r: 14, fill: '#F3EEE4' });
    const half = T(root, 1190, 432, 'mono ctr c-alarm', '半天', { fontSize: 18 }, false);
    c.fade(sv, x(.8), { d: .6 });
    c.fade(labs, x(1.0), { y: 10, st: .08 });
    c.hook(x(1.2), lt => {
      const p = E_.inOut(clamp(lt / 2.2));
      who.setAttribute('cx', lerp(560, 1400, p));
      const fadeOut = clamp((p - .6) / .4);
      who.setAttribute('fill', fadeOut > .5 ? '#5F5D6D' : '#F3EEE4');
      who.setAttribute('opacity', 1 - .6 * fadeOut);
    });
    c.fade(half, x(2.4), { y: 8 });
    const k1 = chip(root, 520, 590, '{g:走的成本是零} · 没谈条件、没收资料', { fontSize: 28 });
    const k2 = chip(root, 520, 660, '{g:先看到的是差距} · 还没自己讲过一轮，先看了头部回放', { fontSize: 28 });
    c.fade([k1, k2], x(3.2), { x: -20, st: .35 });
    const s1 = so(root, 520, 770, '先筛后教；先自己讲一轮，再看高手。', 42);
    c.fade(s1, x(4.4), { y: 16 });
    c.out(root, x(6.0), { y: -20, d: .45 });
    return root;
  }
  function fail2(c, x0, compact) {
    const root = E(c.root, 'a', { left: 0, top: 0 });
    const x = v => x0 + v;
    if (!compact) bigNo(c, root, '02', x(0));
    const X0 = compact ? 200 : 520;
    const h = T(root, X0, 258, 'disp', compact ? '同一个主播：19 场里只有 4 场达标' : '19 场直播，只有 4 场达标', { fontSize: 62 });
    const f = T(root, X0 + 2, 350, 'sans c-mute', '主播A · 视频号 · 7/24–8/26 · 目标 4 小时 3,000 元（后调 2,800）', { fontSize: 28 }, false);
    c.chars(h, x(.1), { st: .03 });
    c.fade(f, x(.6), { y: 12 });
    // bar chart
    const chartG = E(root, 'a', { left: 0, top: 0 });
    const sv = svgLayer(chartG);
    const base = 780, HGT = 360, step = compact ? 80 : 67, bw = compact ? 48 : 42;
    const bars = [], labels = [];
    SESS.forEach((s, i) => {
      const bx = X0 + i * step;
      const hit = s[2] && s[1] >= s[2];
      bars.push(S(sv, 'rect', { x: bx, y: base, width: bw, height: 0, rx: 3, fill: hit ? '#D8BC80' : 'rgba(243,238,228,.34)' }));
      const tl = T(chartG, bx + bw / 2, base + 12, 'mono ctr c-dim', s[0], { fontSize: 13 }, false);
      labels.push(tl);
    });
    const tgt = S(sv, 'line', { x1: X0 - 10, x2: X0 + 19 * step, y1: 0, y2: 0, stroke: '#D8BC80', 'stroke-width': 2, 'stroke-dasharray': '8 8' });
    const tgtL = T(chartG, X0 + 19 * step + 6, 0, 'mono c-gold', '目标 3,000', { fontSize: 16 }, false);
    const maxL = T(chartG, 0, 0, 'bod c-gold', '10,433', { fontSize: 44 }, false);
    const minL = T(chartG, 0, 0, 'bod c-mute', '197', { fontSize: 30 }, false);
    const hits = T(chartG, X0, 846, 'sans', '达标 {g:4} 场 · 最低 {m:197} 元 · 最高 {g:10,433} 元 · 相差 {g:53} 倍', { fontSize: 30 }, false);
    c.fade(sv, x(.9), { d: .4 });
    c.fade(labels, x(.9), { st: .02, d: .4 });
    const g0 = 1.0;
    c.hook(x(g0), lt => {
      const mx = lerp(4000, 11200, E_.inOut(clamp((lt - 3.2) / 1.2)));
      SESS.forEach((s, i) => {
        const p = E_.outCubic(clamp((lt - i * .13) / .6));
        const v = Math.min(s[1], mx) * p;
        const hh = v / mx * HGT;
        bars[i].setAttribute('y', base - hh); bars[i].setAttribute('height', Math.max(0, hh));
      });
      const ty = base - 3000 / mx * HGT;
      tgt.setAttribute('y1', ty); tgt.setAttribute('y2', ty); tgtL.style.top = (ty - 26) + 'px';
      tgt.setAttribute('opacity', clamp(lt / .5));
      tgtL.style.opacity = clamp(lt / .5);
      const top = base - Math.min(10433.1, mx) * E_.outCubic(clamp((lt - 18 * .13) / .6)) / mx * HGT;
      maxL.style.left = (X0 + 18 * step + bw / 2 - 60) + 'px'; maxL.style.top = (top - 58) + 'px';
      maxL.style.opacity = clamp((lt - 3.8) / .5);
      const h16 = 197 / mx * HGT;
      minL.style.left = (X0 + 16 * step + bw / 2 - 22) + 'px'; minL.style.top = (base - h16 - 40) + 'px';
      minL.style.opacity = clamp((lt - 2.9) / .5);
    });
    c.fade(hits, x(g0 + 4.4), { y: 12 });
    if (compact) return root;
    c.out(chartG, x(6.3), { d: .45 });
    // her words
    const w0 = T(root, 520, 430, 'mono c-mute', '她自己的复盘里，出现最多的是', { fontSize: 16, letterSpacing: '.3em' }, false);
    const cs = [['流量小、不精准', '12+'], ['反复重开', '10+'], ['没人点讲解', '8+'], ['话术格式化', '5']];
    const chipsEl = cs.map((k, i) => chip(root, 520 + [0, 330, 590, 860][i], 470, k[0] + ' {g:' + k[1] + '}', { fontSize: 28 }));
    const qt = T(root, 520, 568, 'disp', '主管：「销售的感觉太强了，太格式化了。」', { fontSize: 48 });
    const nt = T(root, 522, 650, 'sans c-mute', '8/26 爆发那天：货对了（珊瑚海），人准了。同一个主播，5.5 小时 10,433 元。', { fontSize: 30 }, false);
    c.fade(w0, x(6.7), { y: 10 });
    c.fade(chipsEl, x(6.9), { y: 16, st: .15 });
    c.chars(qt, x(7.8), { st: .025, d: .7 });
    c.fade(nt, x(8.6), { y: 12 });
    const s2 = so(root, 520, 750, '骨架统一，血肉自己长；分清流量问题和承接问题。', 42);
    c.fade(s2, x(9.1), { y: 16 });
    c.out(root, x(10.9), { y: -20, d: .45 });
    return root;
  }
  function fail3(c, x0, compact) {
    const root = E(c.root, 'a', { left: 0, top: 0 });
    const x = v => x0 + v;
    const X0 = compact ? 200 : 520;
    if (!compact) bigNo(c, root, '03', x(0));
    const h = T(root, X0, 258, 'disp', '14 张头部打法卡，8 张一次没命中', { fontSize: 62 });
    c.chars(h, x(.1), { st: .03 });
    const cw = compact ? 216 : 170, gap = 16;
    const cards = CARDS.map((k, i) => {
      const col = i % 7, rowi = Math.floor(i / 7);
      const el = E(root, 'card', { left: X0 + col * (cw + gap), top: 350 + rowi * 122, width: cw, height: 104 });
      el.innerHTML = `<div style="position:absolute;left:16px;top:16px;font-size:23px" class="sans7">${k[0]}</div>` +
        `<div style="position:absolute;left:16px;top:58px;font-size:12px" class="mono c-dim">${k[1]}</div>` +
        `<div class="res mono" style="position:absolute;right:12px;top:60px;font-size:12px;letter-spacing:.14em;opacity:0"></div>`;
      el.k = k[2];
      return el;
    });
    c.fade(cards, x(.6), { y: 20, st: .05, d: .6 });
    cards.forEach((el, i) => {
      const at = c.at(x(2.2 + i * .09)), res = el.querySelector('.res'), nm = el.firstChild;
      if (el.k === 1) {
        res.textContent = '命中'; res.style.color = '#D8BC80';
        c.tl.to(el, { borderColor: 'rgba(216,188,128,.9)', boxShadow: '0 0 24px rgba(216,188,128,.25)', duration: .4 }, at);
        c.tl.to(nm, { color: '#D8BC80', duration: .4 }, at);
      } else if (el.k === 0) {
        res.textContent = '未命中'; res.style.color = '#5F5D6D';
        c.tl.to(el, { opacity: .38, duration: .4 }, at);
        c.tl.to(nm, { textDecoration: 'line-through', duration: 0 }, at);
      } else {
        res.textContent = '未测'; res.style.color = '#A3A0AE';
        c.tl.to(el, { borderStyle: 'dashed', opacity: .6, duration: .4 }, at);
      }
      c.tl.to(res, { opacity: 1, duration: .3 }, at + .1);
    });
    const cap = T(root, X0, 614, 'sans c-mute', '峰值在线 7–22 人的直播间：没有货盘梯队、不投千川、没有剪辑团队。', { fontSize: 30 }, false);
    c.fade(cap, x(3.9), { y: 12 });
    if (compact) return root;
    const s3 = so(root, 520, 700, '底层逻辑照搬，打法按量级重建。', 42);
    c.fade(s3, x(4.6), { y: 16 });
    return root;
  }
  function bFailures(c) {
    const { root } = c;
    slate(c, '02', '三次失败', 'FAILURES');
    const i1 = T(root, 960, 400, 'disp ctr', '先讲失败。', { fontSize: 120 });
    const i2 = T(root, 960, 580, 'sans ctr c-mute', '每一次失败，都变成了体系里的一条理由。', { fontSize: 42 }, false);
    c.chars(i1, .3, { st: .08, blur: 14 });
    c.fade(i2, 1.0, { y: 14 });
    c.out([i1, i2], 2.0, { y: -20, d: .4 });
    fail1(c, 2.3);
    fail2(c, 8.7);
    fail3(c, 19.9);
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     C3 · the equation
     ============================================================ */
  function bEquation(c) {
    const { root } = c;
    slate(c, '03', '底层方程', 'THE EQUATION');
    c.pt('gemA', 0, 0, .5);
    const g1 = E(root, 'a', { left: 0, top: 0 });
    const eb = T(g1, 960, 290, 'sans ctr c-mute', '直播只有两个字', { fontSize: 34, letterSpacing: '.4em' }, false);
    const a = T(g1, 620, 360, 'disp ctr', '拉新', { fontSize: 230 });
    const b = T(g1, 1300, 360, 'disp ctr c-gold', '逼单', { fontSize: 230 });
    const div = E(g1, 'rule', { left: 959, top: 390, width: 1, height: 240, transformOrigin: '50% 0', background: 'rgba(216,188,128,.5)' });
    const la = T(g1, 620, 650, 'sans ctr c-mute', '第一个字 · 把对的人拉进来、留下来', { fontSize: 28 }, false);
    const lb = T(g1, 1300, 650, 'sans ctr c-mute', '第二个字 · 让留下来的人下单', { fontSize: 28 }, false);
    c.fade(eb, .3, { y: 12 });
    c.chars(a, .7, { st: .12, blur: 18, y: 60, d: 1.1 });
    c.chars(b, 1.3, { st: .12, blur: 18, y: 60, d: 1.1 });
    c.tl.fromTo(div, { scaleY: 0 }, { scaleY: 1, duration: 1, ease: 'expo.out' }, c.at(1.1));
    c.fade([la, lb], 2.0, { y: 12, st: .2 });
    const sv = svgLayer(g1);
    const ar = S(sv, 'path', { d: 'M 640 350 C 760 210, 1160 210, 1280 350', fill: 'none', stroke: '#D8BC80', 'stroke-width': 3, 'stroke-dasharray': 900, 'stroke-dashoffset': 900 });
    const ah = S(sv, 'path', { d: 'M 1262 330 L 1282 352 L 1252 356', fill: 'none', stroke: '#D8BC80', 'stroke-width': 3, opacity: 0 });
    c.tl.to(ar, { attr: { 'stroke-dashoffset': 0 }, duration: 1.1, ease: 'power2.inOut' }, c.at(4.1));
    c.tl.to(ah, { opacity: 1, duration: .2 }, c.at(5.1));
    const m1 = T(g1, 960, 745, 'disp ctr', '拉新，也是为了卖东西。', { fontSize: 64 });
    const m2 = T(g1, 960, 850, 'sans ctr c-mute', '平台按成交分配流量：卖得好，平台才给你更多人。', { fontSize: 32 }, false);
    c.chars(m1, 4.6, { st: .04 });
    c.fade(m2, 5.6, { y: 12 });
    c.out(g1, 7.5, { y: -20, d: .45 });
    // equation
    const g2 = E(root, 'a', { left: 0, top: 0 });
    const eq = E(g2, 'a', { left: 960, top: 300, display: 'flex', alignItems: 'baseline', gap: '34px', transform: 'translateX(-50%)' });
    const parts = [
      E(eq, 'bod', { fontSize: 170 }, 'GMV'),
      E(eq, 'mono c-gold', { fontSize: 90 }, '='),
      E(eq, 'bod', { fontSize: 170 }, 'UV'),
      E(eq, 'mono c-gold', { fontSize: 90 }, '×'),
      E(eq, '', { display: 'inline-flex', alignItems: 'baseline' }, '<span class="bod" style="font-size:170px">UV</span><span class="disp" style="font-size:118px;margin-left:6px">价值</span>')
    ];
    c.fade(parts, 7.9, { y: 50, blur: 14, st: .18, d: .9 });
    const l1 = T(g2, 0, 560, 'sans', '{g:拉新}：把对的人留下来', { fontSize: 32 }, false);
    const l2 = T(g2, 0, 560, 'sans', '{g:逼单}：让留下来的人下单', { fontSize: 32 }, false);
    const svq = svgLayer(g2);
    const br1 = S(svq, 'path', { d: '', fill: 'none', stroke: 'rgba(216,188,128,.7)', 'stroke-width': 2 });
    const br2 = S(svq, 'path', { d: '', fill: 'none', stroke: 'rgba(216,188,128,.7)', 'stroke-width': 2 });
    // position labels under the UV parts once layout is known
    c.hook(0, () => {
      if (l1._placed) return;
      const off = eq.offsetLeft - eq.offsetWidth / 2;
      const p2 = parts[2], p4 = parts[4];
      const c2 = off + p2.offsetLeft + p2.offsetWidth / 2, c4 = off + p4.offsetLeft + p4.offsetWidth / 2;
      if (!p2.offsetWidth) return;
      l1.style.left = (c2 - 170) + 'px'; l2.style.left = (c4 - 190) + 'px';
      br1.setAttribute('d', `M ${c2 - 60} 500 L ${c2 - 60} 518 L ${c2 + 60} 518 L ${c2 + 60} 500`);
      br2.setAttribute('d', `M ${c4 - 120} 500 L ${c4 - 120} 518 L ${c4 + 120} 518 L ${c4 + 120} 500`);
      l1._placed = true;
    });
    c.fade([svq, l1, l2], 9.3, { y: 12, st: .25 });
    const l3 = T(g2, 960, 660, 'sans ctr c-mute', 'UV价值 = 商品点击率 × 点击成交转化率 × 客单价', { fontSize: 38 }, false);
    const l4 = T(g2, 960, 740, 'src ctr', 'SPM 宪法第 1 律 · 价值恒等式', null, false);
    c.fade([l3, l4], 10.5, { y: 12, st: .2 });
    c.out(g2, 12.2, { y: -20, d: .45 });
    // 人货场
    const g3 = E(root, 'a', { left: 0, top: 0 });
    const sv3 = svgLayer(g3);
    const N = [[520, 380, '货', '对的款'], [300, 700, '人', '主播'], [740, 700, '场', '对的人群 · 对的时机']];
    const lines = [[0, 1], [1, 2], [2, 0]].map(([p, q]) => S(sv3, 'line', { x1: N[p][0], y1: N[p][1], x2: N[q][0], y2: N[q][1], stroke: 'rgba(216,188,128,.55)', 'stroke-width': 2 }));
    const circ = N.map(n => S(sv3, 'circle', { cx: n[0], cy: n[1], r: 86, fill: '#10131E', stroke: '#D8BC80', 'stroke-width': 2 }));
    const nl = N.map(n => T(g3, n[0], n[1] - 50, 'disp ctr', n[2], { fontSize: 78 }, false));
    const ns = N.map((n, i) => T(g3, n[0], n[1] + (i === 0 ? -150 : 104), 'sans ctr c-mute', n[3], { fontSize: 26 }, false));
    c.fade(lines, 12.6, { st: .15, d: .6 });
    c.tl.fromTo(circ, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .7, ease: 'back.out(1.8)', stagger: .15 }, c.at(12.5));
    c.fade(nl, 12.8, { sc: .6, st: .15 });
    c.fade(ns, 13.1, { y: 10, st: .12 });
    const cd = E(g3, 'card', { left: 980, top: 330, width: 820, height: 410 });
    const d1 = T(g3, 1030, 356, 'bignum c-gold', '8/26', { fontSize: 120 }, false);
    const d2 = T(g3, 1034, 500, 'sans', '货对了：珊瑚海跑起来', { fontSize: 34 }, false);
    const d3 = T(g3, 1034, 556, 'sans', '人准了：平均在线 10 人，峰值 22 人', { fontSize: 34 }, false);
    const d4 = T(g3, 1034, 624, 'sans7', '同一个主播，5.5 小时 {g:10,433} 元', { fontSize: 38 }, false);
    c.fade(cd, 13.0, { x: 30 });
    c.fade([d1, d2, d3, d4], 13.2, { y: 14, st: .2 });
    const k = T(g3, 960, 830, 'disp ctr', '货和人群对上，主播才有得卖。', { fontSize: 56 });
    c.chars(k, 14.2, { st: .04 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     C4 · five gates
     ============================================================ */
  function gatesDiagram(c, root, x0, opts) {
    opts = opts || {};
    const gx = i => 120 + i * 262;
    const gemX = 1650, gemY = 560;
    // beam geometry for this reel
    const set = GATES.map((g, i) => {
      const sx = gx(i) + 118, sy = 860;
      return [sx, sy, (sx + gemX) / 2, 1010, gemX, gemY];
    });
    const setIdx = c.reel.beamSets.push(set) - 1;
    c.pset('beamSet', setIdx, x0);
    c.pset('beamA', 1, x0);
    ['b0', 'b1', 'b2', 'b3', 'b4', 'bOut'].forEach(k => c.pset(k, 0, x0));
    c.pset('gemX', gemX, x0); c.pset('gemY', gemY, x0); c.pset('gemR', 150, x0); c.pset('gemCut', 6, x0);
    c.pset('gemLine', 1, x0); c.pset('gemFill', 1, x0);
    c.pt('gemA', 1, x0 + .3, .8); c.pt('gemFire', .3, x0 + .3, .8); c.pt('gemRays', 0, x0, .5);
    const els = GATES.map((g, i) => {
      const el = E(root, 'card gate', { left: gx(i) });
      el.style.color = g.col;
      el.innerHTML = `<div class="glow"></div><div class="gn">0${i + 1}</div><div class="gt">${g.n}</div>` +
        `<div class="gq">“${g.q}”</div><div class="gl">你要做</div><div class="ga">${g.act}</div>` +
        `<div class="gw">她的顾虑</div><div class="gv c-mute">${g.worry}</div>`;
      return el;
    });
    c.fade(els, x0 + .6, { y: 30, st: .1, d: .8 });
    const per = opts.per || 1.9;
    els.forEach((el, i) => {
      const at = c.at(x0 + 1.6 + i * per);
      const col = GATES[i].col;
      c.tl.to(el.querySelector('.glow'), { opacity: 1, duration: .5, ease: 'power2.out' }, at);
      c.tl.to([el.querySelector('.gt'), el.querySelector('.gn')], { color: col, duration: .5 }, at);
      c.tl.to(el, { y: -12, boxShadow: `0 20px 60px ${col}33`, duration: .6, ease: 'power3.out' }, at);
      c.tl.fromTo(el.querySelectorAll('.gq,.ga,.gv'), { opacity: .35 }, { opacity: 1, duration: .5, stagger: .1 }, at);
      c.pt('b' + i, 1, x0 + 1.9 + i * per, 1.2, 'power2.inOut');
    });
    const done = x0 + 1.9 + 4 * per + 1.3;
    c.pt('flash', .35, done, .1, 'none'); c.pt('flash', 0, done + .1, .9);
    c.pt('gemFire', 1, done, .6); c.pt('gemRays', .8, done, 1); c.pt('bOut', 1, done + .05, .9, 'power2.out');
    c.pt('beamFlow', 1, done, .5);
    const ok = T(root, gemX, gemY + 190, 'disp ctr c-gold', '成交', { fontSize: 64 });
    const ok2 = T(root, gemX, gemY + 280, 'mono ctr c-mute', '五道门全开', { fontSize: 16, letterSpacing: '.3em' }, false);
    c.chars(ok, done + .1, { st: .1, sc: 1.6, blur: 10 });
    c.fade(ok2, done + .5, { y: 8 });
    return { els, done };
  }
  function bGates(c) {
    const { root } = c;
    slate(c, '04', '五道门', 'FIVE GATES');
    const h = T(root, 120, 234, 'disp', '她心里要依次过五道门。{m:一道没开，她就走。}', { fontSize: 46 });
    c.chars(h, .3, { st: .025 });
    const { done } = gatesDiagram(c, root, 0);
    const q = T(root, 780, 930, 'disp ctr', '顾客走了，问一句：{g:她卡在哪道门？}', { fontSize: 46 });
    c.chars(q, done + 1.6, { st: .035 });
    c.pt('beamA', 0, c.d - .7, .6); c.pt('gemA', 0, c.d - .7, .6); c.pt('beamFlow', 0, c.d - .7, .6);
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     C5 · six-step pitch (cutting the gem)
     ============================================================ */
  function bPitch(c) {
    const { root } = c;
    slate(c, '05', '讲品六步', 'THE PITCH');
    const h = T(root, 120, 234, 'disp', '塑品：给宝石切出{g:火彩}。', { fontSize: 50 });
    c.chars(h, .3, { st: .035 });
    c.pset('gemX', 560, 0); c.pset('gemY', 560, 0); c.pset('gemR', 230, 0); c.pset('gemCut', 0, 0);
    c.pset('gemLine', 1, 0); c.pset('gemFill', 1, 0); c.pset('beamA', 0, 0);
    c.pt('gemA', 1, .2, .8); c.pt('gemFire', .15, .2, .8); c.pt('gemRays', 0, 0, .3);
    const rows = STEPS.map((s, i) => {
      const el = E(root, 'a step', { top: 300 + i * 96 });
      el.innerHTML = `<div class="sn">${i + 1}</div><div class="st">${s.n}</div><div class="sd">${s.d}</div><div class="sg"></div>`;
      return el;
    });
    c.fade(rows, .6, { x: 30, st: .08 });
    const cap = E(root, 'a caption', null, '<span class="who">示例话术 · 活动与库存以店铺真实为准</span><span class="txt"></span>');
    c.fade(cap, 1.4, { y: 16 });
    const txt = cap.querySelector('.txt');
    const lines = STEPS.map(s => { const sp = E(txt, 'a', { left: 0, top: 0, position: 'relative', whiteSpace: 'normal' }); sp.innerHTML = R.rich(s.line); sp.style.display = 'none'; return sp; });
    STEPS.forEach((s, i) => {
      const at = 1.8 + i * 1.95, col = GATES[s.g].col, el = rows[i];
      c.tl.to(el.querySelector('.st'), { color: col, duration: .4 }, c.at(at));
      c.tl.to(el.querySelector('.sn'), { color: col, duration: .4 }, c.at(at));
      c.tl.to(el.querySelector('.sd'), { color: '#F3EEE4', duration: .4 }, c.at(at));
      c.tl.fromTo(el.querySelector('.sg'), { width: 0, background: col }, { width: 150, duration: .8, ease: 'expo.out' }, c.at(at));
      c.pt('gemCut', i + 1, at, .55, 'power2.out');
      c.pt('flash', .1, at + .3, .08, 'none'); c.pt('flash', 0, at + .38, .5);
      // caption swap
      c.tl.set(lines, { display: 'none' }, c.at(at));
      c.tl.set(lines[i], { display: 'block' }, c.at(at));
      c.tl.fromTo(lines[i].querySelectorAll('.ch'), { opacity: 0 }, { opacity: 1, duration: .05, stagger: .028 }, c.at(at + .05));
    });
    c.pt('gemFire', 1, 12.2, 1); c.pt('gemRays', .6, 12.2, 1);
    c.out(rows, 13.3, { x: 30, st: .04, d: .4 }); c.out(cap, 13.3, { d: .4 });
    // why buy / why not
    const wb = T(root, 1010, 300, 'disp c-gold', '你为什么买它', { fontSize: 46 });
    const wn = T(root, 1440, 300, 'disp c-mute', '你为什么不买它', { fontSize: 46 });
    const buys = ['看得见的颜色和光泽', '摸得着的做工和分量', '想得到的场合和体面'].map((s, i) => T(root, 1012, 390 + i * 60, 'sans', s, { fontSize: 30 }, false));
    const nots = ['贵', '怕假', '怕掉色', '撞款', '不会搭'].map((s, i) => T(root, 1442, 390 + i * 60, 'sans c-mute', s, { fontSize: 30 }, false));
    const ticks = nots.map((n, i) => T(root, 1560, 392 + i * 60, 'mono c-perk', '✓ 一句回应', { fontSize: 18 }, false));
    c.chars(wb, 13.6, { st: .05 }); c.chars(wn, 13.9, { st: .05 });
    c.fade(buys, 14.2, { x: -16, st: .15 }); c.fade(nots, 14.5, { x: -16, st: .12 });
    c.fade(ticks, 15.3, { x: -10, st: .18 });
    const f5 = T(root, 1012, 720, 'sans7', '被挑刺，5 秒内接回来。', { fontSize: 34 }, false);
    c.fade(f5, 16.4, { y: 10 });
    const bl = T(root, 960, 880, 'disp ctr', '两三分钟，{g:句句落在一道门上}。', { fontSize: 50 });
    c.chars(bl, 17.2, { st: .035 });
    c.pt('gemA', 0, c.d - .7, .6);
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     C6 · rhythm + four closing elements (live room sim)
     ============================================================ */
  const ONL = m => { // online viewers over one 22-minute round
    if (m < 7) return 3 + 13 * E_.inOut(m / 7) + .6 * Math.sin(m * 2.1);
    if (m < 8) return lerp(16, 13, (m - 7));
    if (m < 18) return 13 - .2 * (m - 8) + 1.3 * Math.sin(m * 1.4);
    if (m < 21) return lerp(11, 12.6, (m - 18) / 3) + .5 * Math.sin(m * 2);
    return lerp(12.6, 15.5, (m - 21));
  };
  const ORDERS = [7.15, 7.4, 7.75, 10.1, 12.1, 14.15, 16.1, 18.2, 19.4, 20.3, 20.8];
  const CMTS = [[.4, '主播好'], [1.5, '这个多少钱'], [3, '会掉色吗？'], [4.4, '想看蓝色那款'], [5.8, '扣1'], [6.4, '扣1'], [7.05, '3号'],
    [9, '送人合适吗'], [10.9, '有礼盒吗'], [12.8, '怎么保养'], [14.9, '扣1'], [16.6, '已拍'], [18.9, '套装划算'], [21.2, '下一款是什么？'],
    [23, '扣1'], [24.2, '已拍'], [25.4, '有同款项链吗'], [26.6, '扣1'], [27.8, '已拍']];
  function phone(root, x, y) {
    const ph = E(root, 'a phone', { left: x, top: y, width: 420, height: 748 });
    ph.innerHTML = `<div class="scr">
      <div class="pill"><i></i><span class="sans7">饰品直播间</span></div>
      <div class="live">LIVE</div><div class="online">在线 3</div>
      <div class="gemglow" style="position:absolute;left:50%;top:40%;width:260px;height:260px;margin:-130px 0 0 -130px;border-radius:50%;background:radial-gradient(circle,#8fb6ff55 0%,#3a67d822 45%,transparent 70%)"></div>
      <div class="cmts"></div>
      <div class="pcard"><div class="th"></div><div><div class="pn">3号 · 蓝色耳饰</div><div class="pp">¥—</div></div><div class="bt">去购买</div></div>
      <div class="toast" style="opacity:0">刚刚有人下单</div></div>`;
    const cm = ph.querySelector('.cmts');
    const items = CMTS.map(([m, s], i) => { const el = E(cm, 'cmt', { top: 0, opacity: 0 }); el.innerHTML = `<b>${['小芬', '王姐', '陈姐', '小丽', '张姨', '周姐'][i % 6]}</b>${s}`; return el; });
    return {
      el: ph, online: ph.querySelector('.online'), price: ph.querySelector('.pp'), toast: ph.querySelector('.toast'), glow: ph.querySelector('.gemglow'),
      update(m) {
        this.online.textContent = '在线 ' + Math.max(1, Math.round(ONL(Math.min(m, 22)) + (m > 22 ? 1.5 * Math.sin(m * 1.7) : 0)));
        this.price.textContent = m >= 7 ? '¥168' : '¥—';
        const vis = CMTS.map((cmt, i) => [cmt[0], i]).filter(q => q[0] <= m).slice(-5);
        items.forEach(el => { el.style.opacity = 0; });
        vis.forEach(([mm, i], k) => {
          const el = items[i], age = m - mm;
          el.style.opacity = String(clamp(age / .25) * (k === 0 && vis.length === 5 ? .55 : 1));
          el.style.top = (210 - (vis.length - 1 - k) * 50 + (1 - clamp(age / .3)) * 20) + 'px';
        });
        let ta = 0;
        for (const o of ORDERS.concat([23.1, 24.3, 26.7, 27.9])) { const d = m - o; if (d >= 0 && d < .7) ta = Math.max(ta, 1 - d / .7); }
        this.toast.style.opacity = String(ta);
        this.glow.style.opacity = String(.6 + .4 * Math.sin(m * 3));
      }
    };
  }
  function bRhythm(c) {
    const { root } = c;
    slate(c, '06', '节奏与逼单', 'RHYTHM');
    c.pset('gemA', 0, 0); c.pset('beamA', 0, 0);
    const P1 = phone(root, 150, 236);
    c.fade(P1.el, .3, { x: -40, d: 1 });
    // flow chips
    const flow = E(root, 'a flow', { left: 660, top: 238 });
    const fl = ['钩子留人', '憋', '放', '逼', '预告'];
    const fns = [];
    fl.forEach((s, i) => { if (i) E(flow, 'fa', null, '→'); fns.push(E(flow, 'fn', null, s)); });
    c.fade(flow, .5, { y: 14 });
    // chart
    const sv = svgLayer(root);
    const X0 = 660, X1 = 1800, Y0 = 380, Y1 = 760;
    const mx = m => X0 + (X1 - X0) * m / 22, my = v => Y1 - (Y1 - Y0) * v / 20;
    const bands = [[0, 7, '#FFB443', '钩子 · 憋单 6–8 分钟'], [7, 8, '#2FD9B0', '放'], [8, 18, '#F3EEE4', '讲六步 · 约 10 分钟'], [18, 21, '#2FD9B0', '套装 3 分钟'], [21, 22, '#AE7BFF', '预告']];
    bands.forEach(([a, b, col, lab]) => {
      S(sv, 'rect', { x: mx(a), y: Y0, width: mx(b) - mx(a), height: Y1 - Y0, fill: col, opacity: col === '#F3EEE4' ? .035 : .09 });
      const t = T(root, mx(a) + 8, Y0 + 8, 'mono', lab, { fontSize: 14, color: col, opacity: .9 }, false);
      t.classList.add('band-l');
    });
    S(sv, 'line', { x1: X0, y1: Y1, x2: X1, y2: Y1, stroke: 'rgba(243,238,228,.3)', 'stroke-width': 1 });
    for (let m = 0; m <= 22; m += 2) T(root, mx(m), Y1 + 10, 'mono ctr c-dim', m + '′', { fontSize: 13 }, false).classList.add('band-l');
    const curve = S(sv, 'path', { d: '', fill: 'none', stroke: '#F3EEE4', 'stroke-width': 3 });
    const area = S(sv, 'path', { d: '', fill: 'rgba(216,188,128,.10)' });
    const head = S(sv, 'circle', { cx: X0, cy: Y1, r: 7, fill: '#F3EEE4' });
    const ph = S(sv, 'line', { x1: X0, y1: Y0, x2: X0, y2: Y1 + 60, stroke: 'rgba(216,188,128,.6)', 'stroke-width': 1 });
    const bi = [10, 12, 14, 16, 18].map(m => {
      const g = S(sv, 'g', { opacity: 0 });
      S(g, 'line', { x1: mx(m), y1: Y1 - 14, x2: mx(m), y2: Y1 + 34, stroke: '#D8BC80', 'stroke-width': 2 });
      const tx = S(g, 'text', { x: mx(m), y: Y1 + 58, fill: '#D8BC80', 'font-size': 18, 'text-anchor': 'middle', 'font-family': 'ReelSerif' });
      tx.textContent = '逼';
      return [m, g];
    });
    const od = ORDERS.map(m => [m, S(sv, 'circle', { cx: mx(m), cy: Y1 + 86, r: 7, fill: '#2FD9B0', opacity: 0 })]);
    const ordL = T(root, X0, Y1 + 104, 'mono c-mute', '成交 ●   逼单 ▏每 2 分钟一次', { fontSize: 14 }, false);
    ordL.classList.add('band-l');
    const warn = T(root, 1020, 318, 'sans c-alarm', '红线：憋单期间在线掉超 20% = 憋太久', { fontSize: 24 }, false);
    c.fade([sv, root.querySelectorAll('.band-l')], .8, { d: .6 });
    c.fade(warn, 4.2, { y: 8 });
    const M = lt => clamp((lt - 1.8) / 10) * 22 + Math.max(0, lt - 11.8) * 1.2;
    c.hook(0, lt => {
      const m = M(lt);
      P1.update(m);
      const mm = Math.min(m, 22);
      let d = '', a = '';
      const N = Math.max(1, Math.round(mm * 6));
      for (let k = 0; k <= N; k++) {
        const u = mm * k / N, px = mx(u), py = my(ONL(u));
        d += (k ? ' L ' : 'M ') + px.toFixed(1) + ' ' + py.toFixed(1);
      }
      a = d + ` L ${mx(mm).toFixed(1)} ${Y1} L ${X0} ${Y1} Z`;
      curve.setAttribute('d', d); area.setAttribute('d', a);
      head.setAttribute('cx', mx(mm)); head.setAttribute('cy', my(ONL(mm)));
      ph.setAttribute('x1', mx(mm)); ph.setAttribute('x2', mx(mm));
      bi.forEach(([bm, g]) => g.setAttribute('opacity', mm >= bm ? 1 : 0));
      od.forEach(([om, el]) => el.setAttribute('opacity', mm >= om ? 1 : 0));
      const phase = mm < 1.5 ? 0 : mm < 7 ? 1 : mm < 8 ? 2 : mm < 21 ? 3 : 4;
      fns.forEach((f, i) => { f.style.borderColor = i === phase ? '#D8BC80' : 'rgba(243,238,228,.18)'; f.style.color = i === phase ? '#D8BC80' : '#F3EEE4'; });
    });
    c.out([sv, flow, warn, root.querySelectorAll('.band-l')], 12.3, { d: .45 });
    // four elements
    const t4 = T(root, 660, 236, 'disp', '逼单四要素', { fontSize: 56 });
    const s4 = T(root, 662, 318, 'sans c-mute', '只要产品没问题，练好这四个，一定卖得动。', { fontSize: 30 }, false);
    c.chars(t4, 12.6, { st: .06 }); c.fade(s4, 13.0, { y: 10 });
    const pil = FOUR.map((f, i) => {
      const el = E(root, 'card pillar', { left: 660 + i * 288, top: 390, width: 268, height: 330 });
      el.innerHTML = `<div class="pk" style="color:${f.c};font-size:64px">${f.n}</div><div class="pd" style="font-size:24px">${f.d}</div><div class="pr">${f.r}</div>`;
      return el;
    });
    pil.forEach((el, i) => {
      c.fade(el, 13.2 + i * .45, { y: 50, d: .8, ease: 'expo.out' });
      c.tl.to(el, { borderColor: FOUR[i].c + 'aa', boxShadow: `0 0 36px ${FOUR[i].c}22`, duration: .5 }, c.at(13.5 + i * .45));
    });
    const sv2 = svgLayer(root);
    S(sv2, 'circle', { cx: 710, cy: 832, r: 44, fill: 'none', stroke: 'rgba(243,238,228,.15)', 'stroke-width': 6 });
    const ring = S(sv2, 'circle', { cx: 710, cy: 832, r: 44, fill: 'none', stroke: '#D8BC80', 'stroke-width': 6, 'stroke-dasharray': 276.5, 'stroke-dashoffset': 276.5, transform: 'rotate(-90 710 832)' });
    const rl = T(root, 710, 812, 'mono ctr c-gold', '2′', { fontSize: 26 }, false);
    const r1 = T(root, 790, 790, 'disp', '两分钟逼一次单', { fontSize: 44 });
    const r2 = T(root, 792, 858, 'sans c-mute', '每一次：一个具体动作 + 一个要素', { fontSize: 28 }, false);
    c.fade([sv2, rl], 15.4, { d: .5 });
    c.chars(r1, 15.5, { st: .05 }); c.fade(r2, 16.1, { y: 10 });
    c.hook(15.5, lt => { const u = Math.max(0, lt) % 1.5 / 1.5; ring.setAttribute('stroke-dashoffset', 276.5 * (1 - u)); });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     C7 · data changes content
     ============================================================ */
  function bData(c) {
    const { root } = c;
    slate(c, '07', '数据', 'DATA LOOP');
    const h = T(root, 120, 234, 'disp', '运营不改人，改{g:那一句话}。', { fontSize: 50 });
    c.chars(h, .3, { st: .04 });
    const cells = [['憋单时长', '7′10″'], ['憋单期间在线变化', '<span class="op">−</span>24%'], ['开链接后 3 分钟成交', '5<span class="sans" style="font-style:normal;font-size:34px;margin-left:8px">笔</span>'], ['讲品时长', '9′20″'], ['逼单次数', '2<span class="sans" style="font-style:normal;font-size:34px;margin-left:8px">次</span>']];
    const tag = T(root, 1640, 238, 'tag', '示例数据', null, false);
    const cellEls = cells.map((k, i) => {
      const el = E(root, 'card', { left: 120 + i * 340, top: 330, width: 320, height: 166 });
      el.innerHTML = `<div class="sans c-mute" style="position:absolute;left:24px;top:20px;font-size:24px">${k[0]}</div><div class="bignum" style="position:absolute;left:24px;top:64px;font-size:80px">${k[1]}</div>`;
      return el;
    });
    const lab = T(root, 120, 510, 'mono c-gold', '每一轮记五个数 · 按轮次记，不看整场汇总', { fontSize: 16, letterSpacing: '.24em' }, false);
    c.fade(cellEls, .7, { y: 30, st: .1 }); c.fade([tag, lab], 1.2, { y: 8 });
    const rules = [
      ['憋单期间在线掉超 20%', '憋太久', '先砍到 5 分钟', 1],
      ['在线涨，开链接后转化低', '钩子和品不匹配', '换钩子，或加大价格反差', 2],
      ['讲品时长够，点击率低', '价值塑造不到位', '回到试岗第 2 天重练', 3],
      ['点击高，转化低', '逼单软或信任不够', '改逼单和赠品，不改讲品', 4]
    ];
    const rEls = rules.map((r, i) => {
      const el = E(root, 'a', { left: 120, top: 574 + i * 78, width: 1680, height: 64 });
      el.innerHTML = `<span class="sans" style="position:absolute;left:0;top:10px;font-size:30px">${r[0]}</span>` +
        `<span class="mono c-gold" style="position:absolute;left:560px;top:14px;font-size:22px">→</span>` +
        `<span class="sans7 c-gold" style="position:absolute;left:620px;top:10px;font-size:30px">${r[1]}</span>` +
        `<span class="mono c-gold" style="position:absolute;left:1020px;top:14px;font-size:22px">→</span>` +
        `<span class="sans" style="position:absolute;left:1080px;top:10px;font-size:30px">${r[2]}</span>`;
      return el;
    });
    rEls.forEach((el, i) => {
      const at = 2.6 + i * 1.05;
      c.fade(el, at, { x: -24, d: .6 });
      const cell = cellEls[rules[i][3]];
      c.tl.to(cell, { borderColor: 'rgba(255,90,103,.9)', boxShadow: '0 0 30px rgba(255,90,103,.25)', duration: .3 }, c.at(at));
      c.tl.to(cell, { borderColor: 'rgba(243,238,228,.14)', boxShadow: '0 0 0 rgba(0,0,0,0)', duration: .4 }, c.at(at + .9));
    });
    c.out([cellEls, rEls, tag, lab], 7.4, { d: .45 });
    // control chart (schematic)
    const g2 = E(root, 'a', { left: 0, top: 0 });
    const sv = svgLayer(g2);
    const X0 = 120, X1 = 1160, cy = 560, ucl = 430, lcl = 690;
    S(sv, 'rect', { x: X0, y: ucl, width: X1 - X0, height: lcl - ucl, fill: 'rgba(216,188,128,.07)' });
    [ucl, lcl].forEach(y => S(sv, 'line', { x1: X0, x2: X1, y1: y, y2: y, stroke: 'rgba(243,238,228,.28)', 'stroke-dasharray': '6 8' }));
    S(sv, 'line', { x1: X0, x2: X1, y1: cy, y2: cy, stroke: 'rgba(216,188,128,.55)', 'stroke-dasharray': '10 8' });
    const vals = [.2, -.3, .5, -.1, .7, -.4, .1, -.55, .35, .0, -1.35, .15, -.2, .6, -.05, .3, -.35, .1];
    const pts = vals.map((v, i) => [X0 + 30 + i * 58, cy - v * 118]);
    const pl = S(sv, 'polyline', { points: '', fill: 'none', stroke: 'rgba(243,238,228,.45)', 'stroke-width': 2 });
    const pc = pts.map((p, i) => S(sv, 'circle', { cx: p[0], cy: p[1], r: i === 10 ? 11 : 7, fill: i === 10 ? '#FF5A67' : '#F3EEE4', opacity: 0 }));
    const la = T(g2, X1 - 250, ucl + 14, 'mono c-mute', '带内起伏 · 不追问', { fontSize: 16 }, false);
    const lb = T(g2, pts[10][0] - 70, pts[10][1] + 20, 'mono c-alarm', '越线 · 该查', { fontSize: 18 }, false);
    const lt0 = T(g2, X0, 360, 'tag', '示意 · 个人控制图', null, false);
    c.fade([sv, lt0], 7.8, { d: .5 });
    c.hook(8.0, lt => {
      const n = clamp(lt / 2.2) * pts.length;
      pc.forEach((el, i) => el.setAttribute('opacity', i < n ? 1 : 0));
      pl.setAttribute('points', pts.slice(0, Math.max(1, Math.floor(n))).map(p => p.join(',')).join(' '));
    });
    c.fade(la, 9.2, { y: 8 }); c.fade(lb, 10.2, { y: 8, sc: .8 });
    const rules2 = ['每场只改一个问题', '看 7 日均值，不看单场', '能算的算，算不出的问', '达标那天只给心法'];
    const lis = rules2.map((s, i) => {
      const el = E(g2, 'a li', { left: 1280, top: 400 + i * 78 });
      el.innerHTML = `<span class="dot" style="background:${['#FFB443', '#2FD9B0', '#5B85FF', '#AE7BFF'][i]}"></span><span>${s}</span>`;
      return el;
    });
    c.fade(lis, 9.0, { x: 20, st: .35 });
    const bl = T(root, 960, 870, 'disp ctr', '数据告诉你哪一环掉了；{g:为什么掉，去问。}', { fontSize: 46 });
    c.chars(bl, 12.6, { st: .03 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     C8 · your style
     ============================================================ */
  function bStyle(c) {
    const { root } = c;
    slate(c, '08', '你的播法', 'YOUR STYLE');
    const h = T(root, 120, 234, 'disp', '没有标准主播，只有{g:标准骨架}。', { fontSize: 50 });
    c.chars(h, .3, { st: .04 });
    const sv = svgLayer(root);
    const ax1 = S(sv, 'line', { x1: 220, y1: 604, x2: 1160, y2: 604, stroke: 'rgba(216,188,128,.5)', 'stroke-width': 1.5 });
    const ax2 = S(sv, 'line', { x1: 690, y1: 330, x2: 690, y2: 880, stroke: 'rgba(216,188,128,.5)', 'stroke-width': 1.5 });
    c.fade(sv, .6, { d: .6 });
    const axl = [T(root, 206, 590, 'mono c-gold', '感性', { fontSize: 16, transform: 'translateX(-100%)' }, false), T(root, 1172, 590, 'mono c-gold', '理性', { fontSize: 16 }, false),
      T(root, 700, 316, 'mono c-gold', '节奏快', { fontSize: 16 }, false), T(root, 700, 872, 'mono c-gold', '节奏稳', { fontSize: 16 }, false)];
    c.fade(axl, .8, { st: .1 });
    const Q = [
      [240, 360, '能量带动型', '主负责：憋单、逼单段<br>补短板：讲品用逐字稿控速'],
      [710, 360, '控场主导型', '主负责：人多时段、接播、开价<br>补短板：讲品放慢，多讲人话'],
      [240, 624, '审美种草型', '主负责：成套搭配，“我自己会怎么戴”<br>补短板：逼单背固定三句'],
      [710, 624, '专业讲解型', '主负责：利润款讲解、信任段<br>补短板：憋单段由场控补气氛']
    ];
    const qs = Q.map(q => { const el = E(root, 'card quad', { left: q[0], top: q[1], width: 430, height: 230 }); el.innerHTML = `<div class="qt">${q[2]}</div><div class="qd">${q[3]}</div>`; return el; });
    c.fade(qs, 1.0, { sc: .92, st: .12, d: .7 });
    const you = E(root, 'a', { left: 0, top: 0, width: 26, height: 26, borderRadius: '50%', background: '#D8BC80', boxShadow: '0 0 0 8px rgba(216,188,128,.25), 0 0 40px rgba(216,188,128,.6)' });
    const youL = T(root, 0, 0, 'mono c-gold', '你', { fontSize: 18 }, false);
    c.fade([you, youL], 2.2, { sc: .2, d: .5 });
    c.hook(2.2, lt => {
      const p = E_.inOut(clamp(lt / 3.2));
      const wob = (1 - p);
      const x = lerp(690, 455, p) + Math.sin(lt * 3.1) * 90 * wob, y = lerp(604, 740, p) + Math.cos(lt * 2.3) * 70 * wob;
      you.style.left = (x - 13) + 'px'; you.style.top = (y - 13) + 'px';
      youL.style.left = (x + 22) + 'px'; youL.style.top = (y - 34) + 'px';
      qs[2].style.borderColor = p > .98 ? 'rgba(216,188,128,.9)' : 'rgba(243,238,228,.14)';
    });
    const cap = T(root, 240, 898, 'sans c-mute', '前 3 场真播 + 六力打分，定出你的类型', { fontSize: 26 }, false);
    c.fade(cap, 3.2, { y: 8 });
    const s1 = T(root, 1260, 380, 'disp c-gold', '强项放大', { fontSize: 62 });
    const b1 = E(root, 'a', { left: 1260, top: 480, width: 540, height: 14, borderRadius: '8px', background: 'rgba(243,238,228,.08)' });
    const f1 = E(b1, '', { position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', borderRadius: '8px', background: '#D8BC80', transformOrigin: '0 50%' });
    const s2 = T(root, 1260, 540, 'disp', '弱项补到及格', { fontSize: 50 });
    const b2 = E(root, 'a', { left: 1260, top: 626, width: 540, height: 14, borderRadius: '8px', background: 'rgba(243,238,228,.08)' });
    const f2 = E(b2, '', { position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%', borderRadius: '8px', background: '#F3EEE4', transformOrigin: '0 50%' });
    const mk = T(root, 1260 + 324, 648, 'mono c-mute', '及格', { fontSize: 15, transform: 'translateX(-50%)' }, false);
    c.chars(s1, 3.6, { st: .07 }); c.grow(f1, 4.0, 1.2);
    c.chars(s2, 4.6, { st: .06 }); c.grow(f2, 5.0, 1.0); c.fade(mk, 5.6, {});
    c.out([s1, b1, s2, b2, mk], 7.6, { d: .4 });
    const qq = T(root, 1260, 380, 'disp c-mute', '「销售的感觉太强了，\n太格式化了。」', { fontSize: 44 });
    const qw = T(root, 1262, 500, 'mono c-dim', '主管对主播A 的点评', { fontSize: 15, letterSpacing: '.2em' }, false);
    const q2 = T(root, 1262, 580, 'sans7', '框架是骨架，话用你自己的。', { fontSize: 36 }, false);
    const q3 = T(root, 1256, 650, 'disp c-gold', '讲人话。', { fontSize: 120 });
    c.chars(qq, 8.0, { st: .03 }); c.fade(qw, 8.8, {});
    c.fade(q2, 9.6, { y: 10 }); c.chars(q3, 10.6, { st: .12, blur: 16, sc: 1.3 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     C9 · decode top rooms
     ============================================================ */
  function bDecode(c) {
    const { root } = c;
    slate(c, '09', '拆解头部', 'DECODE');
    const h = T(root, 120, 234, 'disp', '学头部：{g:抄结构}，不抄运气。', { fontSize: 50 });
    c.chars(h, .3, { st: .04 });
    const L = ['颜值与人设 IP', '定制货、独家款', '需求大于供给', '没有同款和仿品竞争', '投流预算', '场控、剪辑、私域团队'];
    const Rr = ['憋单结构', '逼单节奏', '五道门的顺序', '信任动作：验货、拆盒、实测', '场控配合', '复盘机制'];
    const hl = T(root, 120, 330, 'mono c-dim', '学不来 · 护城河（靠时间和资源攒）', { fontSize: 17, letterSpacing: '.24em' }, false);
    const hr = T(root, 1000, 330, 'mono c-gold', '学得来 · 方法', { fontSize: 17, letterSpacing: '.24em' }, false);
    const li = L.map((s, i) => { const el = E(root, 'a li c-dim', { left: 120, top: 390 + i * 66 }); el.innerHTML = `<span class="dot" style="background:transparent;border:1.5px solid #5F5D6D"></span><span>${s}</span>`; return el; });
    const ri = Rr.map((s, i) => { const el = E(root, 'a li', { left: 1000, top: 390 + i * 66 }); el.innerHTML = `<span class="dot" style="background:#D8BC80"></span><span>${s}</span>`; return el; });
    const dv = E(root, 'rule', { left: 940, top: 330, width: 1, height: 440, background: 'rgba(216,188,128,.35)', transformOrigin: '50% 0' });
    c.fade([hl, hr], .7, { y: 8 });
    c.fade(li, 1.0, { x: -20, st: .14 });
    c.fade(ri, 1.6, { x: 20, st: .14 });
    c.tl.fromTo(dv, { scaleY: 0 }, { scaleY: 1, duration: 1.2 }, c.at(.9));
    const note = T(root, 120, 810, 'sans c-mute', '头部卖得动，通常是几件“学不来”叠在一起。拆开看，才知道自己该补哪一块。', { fontSize: 30 }, false);
    c.fade(note, 3.6, { y: 10 });
    c.out([hl, hr, li, ri, dv, note], 6.9, { d: .45 });
    const t2 = T(root, 960, 300, 'disp ctr', '拆解一个顶尖直播间：七步', { fontSize: 50 });
    const flow = E(root, 'a flow', { left: 960, top: 420, transform: 'translateX(-50%)' });
    const steps = ['录屏一整轮', '转逐字稿', '按分钟标动作', '对齐在线曲线', '找峰值前 30 秒', '映射到五道门', '分成两类'];
    const nodes = [];
    steps.forEach((s, i) => { if (i) nodes.push(E(flow, 'fa', null, '→')); nodes.push(E(flow, 'fn', null, `<span class="mono c-gold" style="font-size:15px;margin-right:8px">${i + 1}</span>${s}`)); });
    c.chars(t2, 7.2, { st: .04 });
    c.fade(nodes, 7.6, { y: 16, st: .12 });
    const t3 = T(root, 960, 560, 'sans ctr c-mute', '顺序：先自己讲一轮，带着自己的 3 个问题去看回放。', { fontSize: 34 }, false);
    c.fade(t3, 9.4, { y: 10 });
    c.out([t2, flow, t3], 11.2, { d: .45 });
    const e1 = T(root, 960, 320, 'sans ctr c-mute', '14 张头部打法卡 · 峰值在线 7–22 人的直播间', { fontSize: 34 }, false);
    const e2 = T(root, 960, 400, 'disp ctr', '{g:5} 张命中　{d:8} 张一次没命中', { fontSize: 100 });
    const e3 = T(root, 960, 610, 'disp ctr c-gold', '底层逻辑照搬，打法按量级重建。', { fontSize: 60 });
    c.fade(e1, 11.5, { y: 10 }); c.chars(e2, 11.9, { st: .06, blur: 12 }); c.chars(e3, 13.3, { st: .04 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     C10 · economic value
     ============================================================ */
  function bValue(c) {
    const { root } = c;
    slate(c, '10', '经济价值', 'THE VALUE');
    const h = T(root, 120, 234, 'disp', '同样 360 个人，多成交 {g:6} 个。', { fontSize: 50 });
    c.chars(h, .3, { st: .04 });
    const g1 = E(root, 'a', { left: 0, top: 0 });
    const led = [['360', '人进场'], ['12', '人成交'], ['¥2,032', 'GMV'], ['¥5.64', 'UV价值']];
    const ledX = [120, 390, 620, 1010];
    const ledEls = led.map((l, i) => { const el = E(g1, 'a', { left: ledX[i], top: 320 }); el.innerHTML = `<div class="bignum" style="font-size:92px">${l[0]}</div><div class="sans c-mute" style="font-size:26px;margin-top:8px">${l[1]}</div>`; return el; });
    const lt = T(g1, 1340, 350, 'tag', '7/30 真实数据 · 4 小时', null, false);
    c.fade(ledEls, .8, { y: 30, st: .15 }); c.fade(lt, 1.4, {});
    const sv = svgLayer(g1);
    const dots = [];
    for (let i = 0; i < 360; i++) dots.push(S(sv, 'circle', { cx: 140 + (i % 24) * 28, cy: 510 + Math.floor(i / 24) * 28, r: 8, fill: 'rgba(243,238,228,.16)' }));
    const pick = dots.map((d, i) => [hash(i * 7.7 + 1), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    c.tl.fromTo(dots, { opacity: 0 }, { opacity: 1, duration: .25, stagger: { each: .003, grid: [15, 24], from: 'start' } }, c.at(2.0));
    pick.slice(0, 12).forEach((idx, k) => c.tl.to(dots[idx], { attr: { fill: '#D8BC80', r: 10 }, duration: .3 }, c.at(3.4 + k * .06)));
    pick.slice(12, 18).forEach((idx, k) => c.tl.to(dots[idx], { attr: { fill: '#2FD9B0', r: 11 }, duration: .35, ease: 'back.out(3)' }, c.at(5.4 + k * .16)));
    const r1 = T(g1, 900, 510, 'sans c-mute', '要到 3,000 元目标：', { fontSize: 34 }, false);
    const r2 = T(g1, 900, 566, 'disp', '转化率 {g:3.3%} → {p:4.9%}', { fontSize: 76 });
    const r3 = T(g1, 900, 700, 'disp', '不需要流量翻倍，', { fontSize: 46 });
    const r4 = T(g1, 900, 768, 'disp c-gold', '只要 4 小时里多说服 6 个人。', { fontSize: 46 });
    c.fade(r1, 3.8, { y: 10 }); c.chars(r2, 4.2, { st: .04 });
    c.chars(r3, 5.6, { st: .05 }); c.chars(r4, 6.3, { st: .05 });
    c.out(g1, 8.4, { d: .45 });
    // lever ladder
    const g2 = E(root, 'a', { left: 0, top: 0 });
    const lad = [
      ['sans7', '{o:+}1 个百分点转化率', 38, '#F3EEE4'],
      ['disp', '{o:≈} 每场 {o:+}{B:¥610}', 56, '#F3EEE4'],
      ['sans', '{o:×} 每人每月 26 场', 32, '#A3A0AE'],
      ['disp', '{o:≈} 每人每月 {o:+}{B:¥1.6} 万', 56, '#F3EEE4'],
      ['sans', '{o:×} 10–30 位主播', 32, '#A3A0AE'],
      ['disp', '{o:≈} 每月 {o:+}{B:¥16}{o:–}{B:48} 万 GMV', 68, '#D8BC80']
    ];
    let y = 320;
    const ladEls = lad.map(l => { const el = T(g2, 120, y, l[0], l[1], { fontSize: l[2], color: l[3] }, false); y += l[2] * 1.45 + 6; return el; });
    const ltag = T(g2, 120, 886, 'src', '推算 · 按 7/30 口径（约 360 人进场，客单约 169 元）· 假设每人每月 26 场 · 不是承诺', null, false);
    ladEls.forEach((el, i) => c.fade(el, 8.8 + i * .5, { x: -24, d: .7 }));
    c.fade(ltag, 11.8, { y: 8 });
    const p1 = T(g2, 1060, 320, 'disp', '我们卖的不是一个主播，', { fontSize: 46 });
    const p2 = T(g2, 1060, 386, 'disp c-gold', '是一条主播生产线。', { fontSize: 46 });
    c.chars(p1, 11.4, { st: .035 }); c.chars(p2, 12.1, { st: .04 });
    const line = ['筛选：两道门 + 回家作业', '试岗 3 天：产品 · 塑品 · 搭配', '七层训练：方程 → 播法', '每轮五个数', '每场只改一处'];
    const pl = line.map((s, i) => { const el = E(g2, 'a', { left: 1060, top: 480 + i * 64 }); el.innerHTML = `<span class="mono c-gold" style="font-size:16px;margin-right:14px">${i + 1}</span><span class="sans" style="font-size:30px">${s}</span>`; return el; });
    const loop = T(g2, 1060, 810, 'mono c-mute', '↺ 数据回到第 3 步 · SPM 操盘系统（对事）+ 复盘教练台（对人）', { fontSize: 16 }, false);
    c.fade(pl, 12.6, { x: 20, st: .18 });
    c.fade(loop, 13.8, { y: 8 });
    c.out(g2, 15.3, { d: .45 });
    const hn = T(root, 960, 430, 'disp ctr', 'n = 1', { fontSize: 110 });
    const hn2 = T(root, 960, 590, 'sans ctr c-mute', '以上主播数据来自 1 位主播 · 19 场 · 约 1 个月。够起步，不够定型；训练效果待对照验证。', { fontSize: 32 }, false);
    const hn3 = T(root, 960, 660, 'mono ctr c-gold', '诚实边界', { fontSize: 16, letterSpacing: '.4em' }, false);
    c.chars(hn, 15.6, { st: .08 }); c.fade([hn2, hn3], 16.0, { y: 10, st: .2 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     C11 · outro
     ============================================================ */
  function bOutro(c, short) {
    const { root } = c;
    const set = [0, 1, 2, 3, 4].map(i => { const sy = 260 + i * 140; return [-40, sy, 480, (sy + 430) / 2, 960, 430]; });
    const si = c.reel.beamSets.push(set) - 1;
    c.pset('beamSet', si, 0); c.pset('beamA', 1, 0); c.pset('beamFlow', 0, 0);
    ['b0', 'b1', 'b2', 'b3', 'b4', 'bOut'].forEach(k => c.pset(k, 0, 0));
    c.pset('gemX', 960, 0); c.pset('gemY', 430, 0); c.pset('gemR', 190, 0); c.pset('gemCut', 6, 0); c.pset('gemLine', 1, 0); c.pset('gemFill', 1, 0);
    c.pt('gemA', 1, .1, .8); c.pt('gemFire', 1, .1, 1); c.pt('gemRays', 1, .4, 1.4); c.pt('dustA', 1, 0, 1);
    for (let i = 0; i < 5; i++) c.pt('b' + i, 1, .3 + i * .22, .9, 'power2.inOut');
    c.pt('flash', .22, 1.75, .1, 'none'); c.pt('flash', 0, 1.85, 1);
    c.pt('bOut', 1, 1.8, .8, 'power2.out'); c.pt('beamFlow', 1, 1.8, .4);
    const o1 = T(root, 960, 690, 'disp ctr', '讲到你自己都想买，', { fontSize: 72 });
    const o2 = T(root, 960, 792, 'disp ctr', '你就{g:讲对了}。', { fontSize: 72 });
    const x1 = short ? 1.4 : 2.2;
    c.chars(o1, x1, { st: .06, blur: 12 }); c.chars(o2, x1 + .8, { st: .08, blur: 12 });
    const x2 = short ? 4.0 : 5.3;
    c.out([o1, o2], x2, { y: -20, d: .5 });
    c.pt('beamA', 0, x2, .8); c.pt('gemY', 330, x2, 1.2, 'power3.inOut'); c.pt('gemR', 130, x2, 1.2, 'power3.inOut');
    const lg = T(root, 960, 490, 'disp ctr', '成交方程式', { fontSize: 130, letterSpacing: '.06em' });
    const en = T(root, 960, 670, 'bod ctr c-gold', 'The Closing Equation', { fontSize: 52 }, false);
    const five = E(root, 'a ctr sans7', { left: 960, top: 764, fontSize: 32, letterSpacing: '.12em' });
    five.innerHTML = GATES.map(g => `<span style="color:${g.col}">${g.n}</span>`).join('<span class="c-dim"> · </span>');
    const vv = T(root, 960, 842, 'mono ctr c-mute', '主播训练体系 v1.0  ·  2026', { fontSize: 16, letterSpacing: '.3em' }, false);
    c.chars(lg, x2 + .5, { st: .09, blur: 16, sc: 1.2 });
    c.fade(en, x2 + 1.1, { y: 12 }); c.fade(five.children, x2 + 1.4, { y: 10, st: .08 }); c.fade(vv, x2 + 1.9, {});
    c.pt('fade', 1, c.d - 1.0, .95, 'power1.in');
  }

  /* ============================================================
     reels
     ============================================================ */
  function addChapter(reel, s, d, build, title, gist) { return R.scene(reel, s, d, build, title ? { title, gist } : null); }

  R.buildFull = function () {
    const r = R.makeReel('full', { dur: 202, audio: 'audio/reel-full.mp3', label: '完整版', hud: true });
    const seq = [
      [0, 12, bOpen, null],
      [12, 16, bMarket, ['市场', '5 万亿的舞台，缺的是会卖的人']],
      [28, 26, bFailures, ['三次失败', '每一次失败，都变成体系里的一条理由']],
      [54, 16, bEquation, ['底层方程', '拉新、逼单；GMV = UV × UV价值']],
      [70, 18, bGates, ['五道门', '需求 → 价值 → 福利 → 信任 → 稀缺']],
      [88, 20, bPitch, ['讲品六步', '痛点 → 卖点 → 场景 → 福利 → 质保 → 逼单']],
      [108, 20, bRhythm, ['节奏与逼单', '憋单框架；价值 · 比价 · 保障 · 稀缺']],
      [128, 16, bData, ['数据', '每轮五个数，每场只改一处']],
      [144, 14, bStyle, ['你的播法', '强项放大，弱项补到及格；讲人话']],
      [158, 16, bDecode, ['拆解头部', '抄结构，不抄运气']],
      [174, 18, bValue, ['经济价值', '同样 360 人，多成交 6 个']],
      [192, 10, bOutro, null]
    ];
    seq.forEach(([s, d, b, ch]) => addChapter(r, s, d, b, ch && ch[0], ch && ch[1]));
    R.hud(r, 11.8, 191.6, 'SHOWREEL 2026');
    return r;
  };

  // investor cut (~86 s)
  function bSystem(c) {
    const { root } = c;
    slate(c, '05', '七层体系', 'THE SYSTEM');
    const h = T(root, 120, 234, 'disp', '一套能教会、能验证、能复制的体系。', { fontSize: 50 });
    c.chars(h, .3, { st: .035 });
    const L = [['底层方程', 'GMV = UV × UV价值'], ['五道门', '需求 → 价值 → 福利 → 信任 → 稀缺'], ['讲品六步', '痛点 → 卖点 → 场景 → 福利 → 质保 → 逼单'],
      ['逼单四要素', '价值 · 比价 · 保障 · 稀缺'], ['节奏', '钩子留人 → 憋 → 放 → 逼 → 预告'], ['数据', '每轮五个数，每场只改一处'], ['播法', '强项放大，弱项补到及格']];
    const els = L.map((l, i) => {
      const el = E(root, 'card', { left: 120 + i * 30, top: 320 + i * 82, width: 1100, height: 70 });
      el.innerHTML = `<span class="bod c-gold" style="position:absolute;left:22px;top:6px;font-size:40px">${i + 1}</span><span class="disp" style="position:absolute;left:80px;top:14px;font-size:34px">${l[0]}</span><span class="sans c-mute" style="position:absolute;left:330px;top:18px;font-size:28px">${l[1]}</span>`;
      return el;
    });
    c.fade(els, .8, { x: -40, st: .22, d: .7 });
    const side = T(root, 1330, 440, 'sans', '外加两个贯穿模块：\n{g:拆解顶尖直播间} · {g:合规红线}\n\n配套系统：\nSPM 操盘系统（对事）\n复盘教练台（对人）', { fontSize: 30, lineHeight: 1.6 }, false);
    c.fade(side, 3.2, { x: 20 });
    c.exit(); c.sweep(c.d - .4);
  }
  function bEvidence(c) {
    const { root } = c;
    slate(c, '02', '真实数据', 'EVIDENCE');
    fail2(c, .2, true);
    c.exit(); c.sweep(c.d - .4);
  }
  R.buildInvestor = function () {
    const r = R.makeReel('investor', { dur: 96, audio: 'audio/reel-investor.mp3', label: '投资人版', hud: true });
    const seq = [
      [0, 7, c => bOpen(c, true), null],
      [7, 16, bMarket, ['市场', '5 万亿的舞台，缺的是会卖的人']],
      [23, 9, bEvidence, ['真实数据', '19 场只有 4 场达标，波动 53 倍']],
      [32, 16, bEquation, ['底层方程', '同一个主播：货对、人准就能卖']],
      [48, 10, bSystem, ['七层体系', '能教会、能验证、能复制']],
      [58, 18, bValue, ['经济价值', '同样 360 人，多成交 6 个']],
      [76, 12, bDecode2, ['为什么能复制', '底层逻辑照搬，打法按量级重建']],
      [88, 8, c => bOutro(c, true), null]
    ];
    seq.forEach(([s, d, b, ch]) => addChapter(r, s, d, b, ch && ch[0], ch && ch[1]));
    R.hud(r, 6.6, 87.6, 'INVESTOR CUT 2026');
    return r;
  };
  function bDecode2(c) {
    const { root } = c;
    slate(c, '07', '为什么能复制', 'WHY IT SCALES');
    fail3(c, .2, true);
    const e3 = T(root, 200, 720, 'disp c-gold', '底层逻辑照搬，打法按量级重建。', { fontSize: 56 });
    const e4 = T(root, 202, 810, 'sans c-mute', '所以我们复制的是方法和数据闭环，不是某一个人的运气。', { fontSize: 32 }, false);
    c.chars(e3, 5.0, { st: .04 }); c.fade(e4, 6.4, { y: 10 });
    c.exit(); c.sweep(c.d - .4);
  }

  /* ============================================================
     15-second teaser — hard cuts on the beat (120 BPM)
     ============================================================ */
  R.buildTeaser = function () {
    const r = R.makeReel('teaser', { dur: 15, audio: 'audio/reel-teaser.mp3', label: '15 秒版', hud: false });
    R.scene(r, 0, 15, c => {
      const { root } = c;
      const cut = (els, a, b) => { c.tl.set(els, { autoAlpha: 1 }, c.at(a)); c.tl.set(els, { autoAlpha: 0 }, c.at(b)); };
      const hide = els => { [].concat(els).forEach(e => { e.style.visibility = 'hidden'; e.style.opacity = 0; }); };
      // 0–1.5 gem + line
      c.pset('gemX', 960, 0); c.pset('gemY', 400, 0); c.pset('gemR', 200, 0); c.pset('gemCut', 6, 0);
      c.pt('gemA', 1, 0, .2); c.pt('gemLine', 1, .05, .55, 'power2.inOut'); c.pt('gemFill', 1, .5, .4); c.pt('gemFire', 1, .6, .4);
      c.pt('flash', .3, .95, .05, 'none'); c.pt('flash', 0, 1.0, .5); c.pt('dustA', 1, .5, 1); c.pt('gemRays', 1, 1, .5);
      const a1 = T(root, 960, 700, 'disp ctr', '讲到你自己{g:都想买}', { fontSize: 120 }); hide(a1);
      cut(a1, .98, 1.5); c.chars(a1, .98, { st: .03, d: .35, sc: 1.4, y: 0 });
      c.pt('gemA', 0, 1.5, .01, 'none');
      // 1.5–3.0 拉新 / 逼单 / equation
      const w1 = T(root, 560, 340, 'disp ctr', '拉新', { fontSize: 300 }); hide(w1); cut(w1, 1.5, 2.5);
      const w2 = T(root, 1360, 340, 'disp ctr c-gold', '逼单', { fontSize: 300 }); hide(w2); cut(w2, 2.0, 2.5);
      c.fade(w1, 1.5, { sc: 1.3, d: .3 }); c.fade(w2, 2.0, { sc: 1.3, d: .3 });
      const eq = E(root, 'a ctr', { left: 960, top: 390, fontSize: 170 }, '<span class="bnum">GMV</span> <span class="op c-gold" style="font-size:110px">=</span> <span class="bnum">UV</span> <span class="op c-gold" style="font-size:110px">×</span> <span class="bnum">UV</span><span class="disp c-gold" style="font-size:130px">价值</span>'); hide(eq); cut(eq, 2.5, 3.0);
      c.fade(eq, 2.5, { sc: .8, d: .3 });
      // 3.0–5.5 five gates + beams
      const set = [0, 1, 2, 3, 4].map(i => [560, 250 + i * 150, 1100, 250 + i * 150, 1500, 520]);
      const si = r.beamSets.push(set) - 1;
      c.pset('beamSet', si, 3.0); c.pset('beamA', 1, 3.0); c.pset('gemX', 1500, 3.0); c.pset('gemY', 520, 3.0); c.pset('gemR', 150, 3.0);
      c.pt('gemA', 1, 3.0, .2);
      const gw = GATES.map((g, i) => { const el = T(root, 180, 196 + i * 150, 'disp', g.n, { fontSize: 104, color: g.col }); hide(el); cut(el, 3.0 + i * .5, 5.5); c.fade(el, 3.0 + i * .5, { x: -60, d: .35 }); c.pt('b' + i, 1, 3.0 + i * .5, .45, 'power2.out'); return el; });
      c.pt('flash', .25, 5.4, .05, 'none'); c.pt('flash', 0, 5.45, .4); c.pt('bOut', 1, 5.25, .3);
      const ok = T(root, 1500, 700, 'disp ctr c-gold', '成交', { fontSize: 90 }); hide(ok); cut(ok, 5.2, 5.5);
      c.pt('beamA', 0, 5.5, .01, 'none'); c.pt('gemA', 0, 5.5, .01, 'none');
      // 5.5–7.5 four elements
      const fe = FOUR.map((f, i) => { const el = T(root, 150 + i * 420, 360, 'disp', f.n, { fontSize: 170, color: f.c }); hide(el); cut(el, 5.5 + i * .5, 7.5); c.fade(el, 5.5 + i * .5, { y: 80, d: .3, ease: 'back.out(2)' }); return el; });
      const fs = T(root, 960, 640, 'sans ctr c-mute', '逼单四要素', { fontSize: 44, letterSpacing: '.5em' }, false); hide(fs); cut(fs, 7.0, 7.5);
      // 7.5–9.0 two minutes
      const sv = svgLayer(root); hide(sv); cut(sv, 7.5, 9.0);
      const path = S(sv, 'path', { d: '', fill: 'none', stroke: '#F3EEE4', 'stroke-width': 4 });
      const tm = T(root, 960, 700, 'disp ctr', '两分钟{g:逼一次单}', { fontSize: 110 }); hide(tm); cut(tm, 7.75, 9.0);
      c.hook(7.5, lt => {
        const p = clamp(lt / 1.2); let d = '';
        for (let k = 0; k <= 80 * p; k++) { const m = k / 80 * 22; d += (k ? ' L ' : 'M ') + (260 + m / 22 * 1400) + ' ' + (620 - ONL(m) * 22); }
        path.setAttribute('d', d);
      });
      // 9.0–11.0 market
      const m1 = E(root, 'a ctr', { left: 960, top: 230 }, '<span class="bignum" style="font-size:300px">5</span><span class="disp" style="font-size:130px">万亿</span><span class="bnum c-gold" style="font-size:170px">+</span>'); hide(m1); cut(m1, 9.0, 11.0);
      const m2 = T(root, 960, 560, 'sans7 ctr', '2025 直播电商 GMV', { fontSize: 46 }, false); hide(m2); cut(m2, 9.2, 11.0);
      const m3 = T(root, 960, 660, 'sans ctr c-mute', '3,880 万职业主播 · 八成月收入不到 8,000 元', { fontSize: 40 }, false); hide(m3); cut(m3, 10.0, 11.0);
      const m4 = T(root, 960, 760, 'disp ctr c-gold', '会卖的人，才稀缺。', { fontSize: 64 }); hide(m4); cut(m4, 10.5, 11.0);
      c.fade(m1, 9.0, { sc: 1.3, d: .35 });
      // 11–13 six more
      const sv2 = svgLayer(root); hide(sv2); cut(sv2, 11.0, 13.0);
      const dots = [];
      for (let i = 0; i < 360; i++) dots.push(S(sv2, 'circle', { cx: 330 + (i % 36) * 36, cy: 250 + Math.floor(i / 36) * 36, r: 10, fill: 'rgba(243,238,228,.16)' }));
      const pick = dots.map((d, i) => [hash(i * 5.3), i]).sort((a, b) => a[0] - b[0]).map(q => q[1]);
      pick.slice(0, 12).forEach((idx, k) => c.tl.to(dots[idx], { attr: { fill: '#D8BC80', r: 12 }, duration: .15 }, c.at(11.1 + k * .02)));
      pick.slice(12, 18).forEach((idx, k) => c.tl.to(dots[idx], { attr: { fill: '#2FD9B0', r: 14 }, duration: .2 }, c.at(11.6 + k * .1)));
      const s6 = T(root, 960, 700, 'disp ctr', '同样 360 人，多成交 {g:6} 个。', { fontSize: 84 }); hide(s6); cut(s6, 12.0, 13.0);
      // 13–15 logo
      c.pset('gemX', 960, 13.0); c.pset('gemY', 330, 13.0); c.pset('gemR', 130, 13.0);
      c.pt('gemA', 1, 13.0, .3); c.pt('flash', .25, 13.0, .05, 'none'); c.pt('flash', 0, 13.05, .6);
      const lg = T(root, 960, 490, 'disp ctr', '成交方程式', { fontSize: 140 }); hide(lg); cut(lg, 13.0, 15.0);
      const lt = T(root, 960, 690, 'sans ctr c-mute', '讲到你自己都想买，你就讲对了。', { fontSize: 38, letterSpacing: '.1em' }, false); hide(lt); cut(lt, 13.4, 15.0);
      c.chars(lg, 13.0, { st: .05, sc: 1.3, d: .5 }); c.fade(lt, 13.4, { y: 10 });
      c.pt('fade', 1, 14.4, .55, 'power1.in');
    });
    return r;
  };

  R.builders = { bOpen, bMarket, bFailures, bEquation, bGates, bPitch, bRhythm, bData, bStyle, bDecode, bValue, bOutro, gatesDiagram, phone, fail1, fail2, fail3 };
})();
