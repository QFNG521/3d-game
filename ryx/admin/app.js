/* 瑞妍熙 · 店务管理端 —— 纯静态交互原型 */
(function () {
  'use strict';

  /* ---------------- 图标 ---------------- */
  const P = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    cash: '<path d="M3 6h18v12H3z"/><circle cx="12" cy="12" r="2.5"/><path d="M7 12h.01M17 12h.01"/>',
    staff: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1M17 11l2 2 3-4"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>',
    chart: '<path d="M3 3v18h18M7 15l4-5 3 3 5-7"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M9 9h4a2 2 0 010 4H9m0 0h4.5"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 000-7.8z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    left: '<path d="M15 18l-6-6 6-6"/>',
    right: '<path d="M9 18l6-6-6-6"/>',
    bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    check: '<path d="M5 12l4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8H7.5a2.5 2.5 0 010-5C11 3 12 8 12 8zM12 8h4.5a2.5 2.5 0 000-5C13 3 12 8 12 8z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 2 .3-.7.7-.3-2-.7z"/>'
  };
  const ic = (n, s) => `<svg viewBox="0 0 24 24" width="${s || 16}" height="${s || 16}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;
  const money = n => '¥' + Number(n).toLocaleString('zh-CN');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- 示例数据 ---------------- */
  const STAFF = [
    { name: '林悦', color: '#C8A87C', star: 5, level: '高级美容师', skill: '水光补水 · 抗衰紧致', orders: 86, perf: 58240, commission: 8736 },
    { name: '苏晴', color: '#E8A9A0', star: 5, level: '资深美容顾问', skill: '深层清洁 · 光子嫩肤', orders: 74, perf: 51360, commission: 7704 },
    { name: '陈曦', color: '#8FA3A6', star: 4, level: '美容师', skill: '肩颈舒缓 · 身体 SPA', orders: 61, perf: 38920, commission: 5838 },
    { name: '王曼', color: '#B0A1C0', star: 4, level: '美容师', skill: '面部护理 · 皮肤检测', orders: 52, perf: 32680, commission: 4902 }
  ];
  const PROJECTS = [
    { id: 'p1', name: '水光补水护理', cat: '面部护理', dur: 90, price: 680, on: true },
    { id: 'p2', name: '深层清洁管理', cat: '清洁管理', dur: 60, price: 398, on: true },
    { id: 'p3', name: '抗衰紧致疗程', cat: '抗衰疗程', dur: 120, price: 1280, on: true },
    { id: 'p4', name: '肩颈舒缓 SPA', cat: '身体护理', dur: 75, price: 528, on: true },
    { id: 'p5', name: '光子嫩肤', cat: '光电项目', dur: 60, price: 980, on: true },
    { id: 'p6', name: '头皮养护护理', cat: '身体护理', dur: 60, price: 458, on: false }
  ];
  const PRODUCTS = [
    { name: '臻萃修护精华液', spec: '30ml / 瓶', stock: 42, safe: 15 },
    { name: '水润保湿面膜', spec: '5 片 / 盒', stock: 8, safe: 12 },
    { name: '舒缓修复面霜', spec: '50g / 瓶', stock: 26, safe: 10 },
    { name: '防晒隔离乳 SPF50', spec: '40ml / 支', stock: 5, safe: 10 },
    { name: '玫瑰复方精油', spec: '10ml / 瓶', stock: 33, safe: 8 }
  ];
  const MEMBERS = [
    { id: 'M10086', name: '林晚', phone: '138****6208', level: '铂金', balance: 6820, times: 8, total: 48600, last: '11-03', tags: ['抗衰', '高活跃'], color: '#C8A87C' },
    { id: 'M10087', name: '周静怡', phone: '139****3156', level: '铂金', balance: 12400, times: 12, total: 62380, last: '11-04', tags: ['光电项目'], color: '#E8A9A0' },
    { id: 'M10088', name: '陈可欣', phone: '186****7742', level: '金卡', balance: 3200, times: 5, total: 28900, last: '11-02', tags: ['补水'], color: '#A6B4A2' },
    { id: 'M10089', name: '赵一诺', phone: '135****9081', level: '金卡', balance: 1860, times: 3, total: 21460, last: '10-29', tags: ['新客'], color: '#B0A1C0' },
    { id: 'M10090', name: '孙蔓', phone: '158****4417', level: '银卡', balance: 980, times: 2, total: 12680, last: '10-26', tags: ['肩颈'], color: '#C3A98B' },
    { id: 'M10091', name: '吴雨桐', phone: '137****5523', level: '银卡', balance: 1500, times: 4, total: 15320, last: '11-01', tags: ['清洁'], color: '#9FB2BE' },
    { id: 'M10092', name: '郑思琪', phone: '188****2279', level: '普通', balance: 0, times: 0, total: 3980, last: '10-22', tags: ['待激活'], color: '#BDB5AB' },
    { id: 'M10093', name: '何嘉宁', phone: '133****6610', level: '金卡', balance: 4560, times: 6, total: 33740, last: '11-04', tags: ['抗衰', '储值'], color: '#D0AFA0' }
  ];
  const LEVEL_BADGE = { '铂金': 'b-gold', '金卡': 'b-rose', '银卡': 'b-blue', '普通': 'b-gray' };
  const APPTS = [
    { day: 0, time: '10:00', member: '林晚', project: '水光补水护理', staff: '林悦', status: 'done' },
    { day: 0, time: '14:30', member: '陈可欣', project: '深层清洁管理', staff: '苏晴', status: 'done' },
    { day: 1, time: '11:00', member: '周静怡', project: '光子嫩肤', staff: '苏晴', status: 'done' },
    { day: 1, time: '15:00', member: '吴雨桐', project: '肩颈舒缓 SPA', staff: '陈曦', status: 'canceled' },
    { day: 2, time: '09:30', member: '何嘉宁', project: '抗衰紧致疗程', staff: '林悦', status: 'done' },
    { day: 2, time: '13:00', member: '赵一诺', project: '水光补水护理', staff: '王曼', status: 'done' },
    { day: 3, time: '10:00', member: '林晚', project: '抗衰紧致疗程', staff: '林悦', status: 'done' },
    { day: 3, time: '11:30', member: '陈可欣', project: '水光补水护理', staff: '王曼', status: 'booked' },
    { day: 3, time: '14:00', member: '周静怡', project: '深层清洁管理', staff: '苏晴', status: 'booked' },
    { day: 3, time: '15:30', member: '孙蔓', project: '肩颈舒缓 SPA', staff: '陈曦', status: 'booked' },
    { day: 3, time: '17:00', member: '何嘉宁', project: '光子嫩肤', staff: '苏晴', status: 'booked' },
    { day: 4, time: '10:30', member: '吴雨桐', project: '深层清洁管理', staff: '苏晴', status: 'booked' },
    { day: 4, time: '13:30', member: '郑思琪', project: '水光补水护理', staff: '林悦', status: 'booked' },
    { day: 4, time: '16:00', member: '赵一诺', project: '肩颈舒缓 SPA', staff: '陈曦', status: 'booked' },
    { day: 5, time: '09:30', member: '林晚', project: '水光补水护理', staff: '林悦', status: 'booked' },
    { day: 5, time: '11:00', member: '何嘉宁', project: '抗衰紧致疗程', staff: '林悦', status: 'booked' },
    { day: 5, time: '14:30', member: '周静怡', project: '光子嫩肤', staff: '苏晴', status: 'booked' },
    { day: 6, time: '10:00', member: '陈可欣', project: '深层清洁管理', staff: '王曼', status: 'booked' },
    { day: 6, time: '15:00', member: '孙蔓', project: '水光补水护理', staff: '林悦', status: 'booked' }
  ];
  const PLANS = [
    { type: '储值卡', theme: 'dark', name: '臻享储值卡 · 至尊', price: 20000, sub: '充 20,000 赠 3,600', perks: ['全店项目 8 折', '专属美容顾问', '生日双倍积分', '免费皮肤检测 4 次'], sold: 38 },
    { type: '储值卡', theme: '', name: '悦享储值卡 · 金卡', price: 10000, sub: '充 10,000 赠 1,500', perks: ['全店项目 8.5 折', '积分 1.2 倍', '生日礼遇'], sold: 126 },
    { type: '储值卡', theme: '', name: '新人储值卡', price: 5000, sub: '充 5,000 赠 600', perks: ['全店项目 9 折', '新客专属礼'], sold: 214 },
    { type: '次卡', theme: 'rose', name: '水光补水 10 次卡', price: 5800, sub: '有效期 12 个月', perks: ['单次均价 ¥580', '可赠送亲友 2 次', '免费头皮检测'], sold: 92 },
    { type: '次卡', theme: 'rose', name: '深层清洁 10 次卡', price: 3280, sub: '有效期 12 个月', perks: ['单次均价 ¥328', '含 2 次敷膜', '可升级项目补差'], sold: 148 },
    { type: '疗程套餐', theme: '', name: '抗衰紧致 12 次疗程', price: 13800, sub: '定制化疗程 · 6 个月', perks: ['专属技师跟诊', '3 次 VISIA 检测', '居家护理套装'], sold: 46 },
    { type: '疗程套餐', theme: '', name: '四季焕肤年卡', price: 19800, sub: '不限次数 · 12 个月', perks: ['全年 24 次护理', '换季定制方案', '优先预约权益'], sold: 27 }
  ];
  const REDEEMS = [
    { member: '林晚', plan: '抗衰紧致 12 次疗程', item: '第 4 次 / 共 12 次', staff: '林悦', time: '11-03 10:00' },
    { member: '周静怡', plan: '臻享储值卡', item: money(1280), staff: '苏晴', time: '11-03 11:00' },
    { member: '陈可欣', plan: '水光补水 10 次卡', item: '第 3 次 / 共 10 次', staff: '王曼', time: '11-02 14:30' },
    { member: '何嘉宁', plan: '四季焕肤年卡', item: '第 11 次 / 共 24 次', staff: '林悦', time: '11-02 09:30' },
    { member: '吴雨桐', plan: '深层清洁 10 次卡', item: '第 6 次 / 共 10 次', staff: '苏晴', time: '11-01 15:00' }
  ];
  const COUPONS = [
    { amt: 200, name: '新客体验券', desc: '首次到店任意项目立减，不与其他优惠同享', used: 186, left: 314, status: '进行中' },
    { amt: 300, name: '老带新礼遇券', desc: '老会员推荐新客成交，双方各得一张', used: 92, left: 208, status: '进行中' },
    { amt: 500, name: '双 11 拼团券', desc: '3 人成团购买疗程套餐可用', used: 45, left: 55, status: '即将结束' }
  ];

  /* ---------------- 导航 ---------------- */
  const NAV = [
    { id: 'dashboard', name: '经营概览', icon: 'grid', crumb: '首页 / 经营概览' },
    { id: 'appointments', name: '预约管理', icon: 'calendar', crumb: '门店运营 / 预约管理' },
    { id: 'members', name: '会员管理', icon: 'users', crumb: '会员中心 / 会员管理' },
    { id: 'cards', name: '卡项管理', icon: 'card', crumb: '会员中心 / 卡项管理' },
    { sep: true },
    { id: 'checkout', name: '开单收银', icon: 'cash', crumb: '收银台 / 开单收银' },
    { id: 'staff', name: '员工排班', icon: 'staff', crumb: '门店运营 / 员工排班' },
    { id: 'catalog', name: '项目与库存', icon: 'box', crumb: '门店运营 / 项目与库存' },
    { id: 'marketing', name: '营销与报表', icon: 'chart', crumb: '数据中心 / 营销与报表' }
  ];
  const TITLES = Object.fromEntries(NAV.filter(n => n.id).map(n => [n.id, { name: n.name, crumb: n.crumb }]));

  /* ---------------- 日期 ---------------- */
  const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  const WD = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const todayIdx = (TODAY.getDay() + 6) % 7;
  const fmtCN = d => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]}`;
  const mmdd = d => `${d.getMonth() + 1}/${d.getDate()}`;
  function weekStart(offset) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - todayIdx + offset * 7);
    return d;
  }

  /* ---------------- 状态 ---------------- */
  const state = {
    view: 'dashboard', level: '全部', cardTab: '全部', week: 0, search: '',
    order: [], pay: '储值卡', payStaff: '林悦', payMember: '林晚', discount: 0.9,
    appts: APPTS.slice(), catalogOn: Object.fromEntries(PROJECTS.map(p => [p.id, p.on])),
    plans: PLANS.slice()
  };

  /* ---------------- 通用 UI ---------------- */
  const $view = document.getElementById('view');
  const $modal = document.getElementById('modal-root');
  function toast(msg) {
    const box = document.createElement('div');
    box.className = 'toast';
    box.innerHTML = `<span class="tick">✓</span>${esc(msg)}`;
    document.getElementById('toast-root').appendChild(box);
    setTimeout(() => { box.style.opacity = '0'; box.style.transition = '.3s'; setTimeout(() => box.remove(), 320); }, 2300);
  }
  function openModal(title, sub, body, foot, size) {
    $modal.innerHTML = `<div class="modal-mask" data-action="maskClose">
      <div class="modal ${size || ''}" data-stop="1">
        <div class="modal-head"><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>
          <button class="modal-close" data-action="closeModal">×</button></div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div></div>`;
  }
  function closeModal() { $modal.innerHTML = ''; }
  const opts = arr => arr.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');

  function badge(text, cls) { return `<span class="badge ${cls || 'b-gray'}">${esc(text)}</span>`; }
  function head(title, sub, actions) {
    return `<div class="page-head"><div><h2>${title}</h2><p>${sub}</p></div><div class="head-actions">${actions || ''}</div></div>`;
  }

  /* ---------------- 1. 经营概览 ---------------- */
  function viewDashboard() {
    const kpis = [
      { label: '今日营业额', val: money(28680), foot: '<span class="trend up">↑ 12.6%</span> 较昨日', icon: 'money', color: 'var(--gold-soft)', fg: 'var(--gold-deep)' },
      { label: '今日预约', val: '32 <small style="font-size:12px;font-weight:400;color:var(--ink3)">单</small>', foot: '<span class="trend up">↑ 3 单</span> 较昨日', icon: 'calendar', color: 'var(--blue-soft)', fg: 'var(--blue)' },
      { label: '到店客流', val: '26 <small style="font-size:12px;font-weight:400;color:var(--ink3)">人</small>', foot: '到店完成率 81.3%', icon: 'users', color: 'var(--green-soft)', fg: 'var(--green)' },
      { label: '新增会员', val: '5 <small style="font-size:12px;font-weight:400;color:var(--ink3)">人</small>', foot: '<span class="trend up">↑ 2 人</span> 本月累计 48 人', icon: 'heart', color: 'var(--rose-soft)', fg: '#C77F77' }
    ];
    const bars = [18620, 22450, 19880, 26140, 23480, 31260, 28680];
    const max = Math.max(...bars);
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(TODAY); d.setDate(d.getDate() - 6 + i); return d; });
    const donutParts = [
      { name: '面部护理', pct: 34, c: '#C8A87C' }, { name: '抗衰疗程', pct: 26, c: '#E8A9A0' },
      { name: '光电项目', pct: 21, c: '#8FA3A6' }, { name: '身体护理', pct: 12, c: '#B0A1C0' }, { name: '产品销售', pct: 7, c: '#D9CDBB' }
    ];
    let acc = 0;
    const grad = donutParts.map(p => { const a = acc; acc += p.pct; return `${p.c} ${a}% ${acc}%`; }).join(',');
    const todayAppts = state.appts.filter(a => a.day === todayIdx).sort((a, b) => a.time.localeCompare(b.time));
    const ranks = STAFF.slice().sort((a, b) => b.perf - a.perf);
    const rmax = ranks[0].perf;

    return head('经营概览', `${fmtCN(TODAY)}　·　瑞妍熙 · 静安旗舰店　·　数据实时更新于 16:40`,
      `<button class="btn btn-ghost btn-sm" data-action="refresh">${ic('chart', 13)} 刷新数据</button><button class="btn btn-gold btn-sm" data-action="go" data-view="checkout">${ic('plus', 13)} 快速开单</button>`) +
      `<div class="grid g4">${kpis.map(k => `<div class="card kpi"><div class="kpi-top"><span class="kpi-label">${k.label}</span>
        <span class="kpi-icon" style="background:${k.color};color:${k.fg}">${ic(k.icon, 16)}</span></div>
        <div class="kpi-val mono">${k.val}</div><div class="kpi-foot">${k.foot}</div></div>`).join('')}</div>

      <div class="grid g-7-5 mt16">
        <div class="card"><div class="card-head"><div><h3>近 7 天营业额</h3><div class="sub">单位：元　·　含项目与产品销售</div></div>
          <span class="badge b-gold">本周累计 ${money(170510)}</span></div>
          <div class="card-body"><div class="chart-bars"><div class="chart-grid"><i></i><i></i><i></i><i></i></div>
          ${bars.map((v, i) => `<div class="bar-col"><div class="bar-val mono">${(v / 1000).toFixed(1)}k</div>
            <div class="bar" style="height:${(v / max * 100).toFixed(0)}%"></div>
            <div class="bar-lbl ${i === 6 ? 'today' : ''}">${i === 6 ? '今天' : mmdd(days[i])}</div></div>`).join('')}</div></div></div>
        <div class="card"><div class="card-head"><div><h3>项目销售占比</h3><div class="sub">本月项目结构</div></div></div>
          <div class="card-body"><div class="donut-wrap"><div class="donut" style="background:conic-gradient(${grad})">
            <div class="donut-center"><b>¥18.6万</b><span>本月项目销售额</span></div></div>
            <div class="legend">${donutParts.map(p => `<div class="legend-item"><i class="dot" style="background:${p.c}"></i>
              <span class="lg-name">${p.name}</span><b>${p.pct}%</b></div>`).join('')}</div></div></div></div>
      </div>

      <div class="grid g-7-5 mt16">
        <div class="card"><div class="card-head"><div><h3>今日预约时间轴</h3><div class="sub">共 ${todayAppts.length} 个已排期预约</div></div>
          <button class="link" data-action="go" data-view="appointments">查看全部 →</button></div>
          <div class="card-body"><div class="timeline">${todayAppts.map(a => `<div class="tl-item">
            <div class="tl-time">${a.time}</div><div class="tl-line"><i></i><em></em></div>
            <div class="tl-main"><div class="tl-name">${esc(a.member)} · ${esc(a.project)}</div>
              <div class="tl-desc">${esc(a.staff)} 技师　·　静安旗舰店 3 号护理室</div></div>
            ${badge(a.status === 'done' ? '已到店' : a.status === 'canceled' ? '已取消' : '待到店', a.status === 'done' ? 'b-green' : a.status === 'canceled' ? 'b-gray' : 'b-gold')}
          </div>`).join('')}</div></div></div>
        <div class="card"><div class="card-head"><div><h3>技师业绩排行</h3><div class="sub">本月服务业绩 Top 4</div></div></div>
          <div class="card-body" style="padding-top:8px">${ranks.map((s, i) => `<div class="rank-item">
            <div class="rank-no ${i === 0 ? 'top' : ''}">${i + 1}</div>
            <div class="rank-info"><div class="rank-name">${s.name} <span class="muted" style="font-size:10px">· ${s.orders} 单</span></div>
              <div class="rank-bar"><i style="width:${(s.perf / rmax * 100).toFixed(0)}%"></i></div></div>
            <div class="rank-val mono">${money(s.perf)}</div></div>`).join('')}</div></div>
      </div>`;
  }

  /* ---------------- 2. 预约管理 ---------------- */
  function apptCard(a, i) {
    const cls = a.status === 'done' ? 'done' : a.status === 'canceled' ? 'cancel' : (i % 4 === 2 ? 'rose' : '');
    return `<div class="appt ${cls}" data-action="apptDetail" data-idx="${i}">
      <div class="appt-time">${a.time}</div><div class="appt-name">${esc(a.member)}</div>
      <div class="appt-desc">${esc(a.project)} · ${esc(a.staff)}</div></div>`;
  }
  function viewAppointments() {
    const ws = weekStart(state.week), we = new Date(ws); we.setDate(we.getDate() + 6);
    const range = `${ws.getFullYear()}/${mmdd(ws)} - ${mmdd(we)}`;
    const todayList = state.appts.filter(a => a.day === todayIdx && a.status !== 'canceled').sort((a, b) => a.time.localeCompare(b.time));
    const weekCount = state.appts.length;
    return head('预约管理', '按周查看排期，支持新增、改期、取消与到店登记',
      `<button class="btn btn-ghost btn-sm" data-action="go" data-view="members">${ic('users', 13)} 会员档案</button>
       <button class="btn btn-gold btn-sm" data-action="addAppt">${ic('plus', 13)} 新增预约</button>`) +
      `<div class="grid g4">`
      + [['本周预约', weekCount + ' 单', 'calendar', 'var(--gold-soft)', 'var(--gold-deep)'],
         ['今日待到店', todayList.filter(a => a.status === 'booked').length + ' 人', 'clock', 'var(--blue-soft)', 'var(--blue)'],
         ['已到店', todayList.filter(a => a.status === 'done').length + ' 人', 'check', 'var(--green-soft)', 'var(--green)'],
         ['到店率', '81.3%', 'chart', 'var(--rose-soft)', '#C77F77']].map(k =>
        `<div class="card mini-stat"><div class="mini-stat-icon" style="background:${k[3]};color:${k[4]}">${ic(k[2], 17)}</div>
         <div><div class="mini-stat-val mono">${k[1]}</div><div class="mini-stat-lbl">${k[0]}</div></div></div>`).join('') + `</div>

      <div class="grid g-7-5 mt16">
        <div class="card"><div class="cal-toolbar"><div class="week-nav">
          <button class="wk-btn" data-action="week" data-delta="-1">${ic('left', 14)}</button>
          <b>${range}</b><button class="wk-btn" data-action="week" data-delta="1">${ic('right', 14)}</button>
          <button class="btn btn-ghost btn-sm" data-action="week" data-delta="0" style="margin-left:6px">回到本周</button></div>
          <div class="legend-inline"><span><i style="background:var(--gold)"></i>待到店</span><span><i style="background:var(--rose)"></i>会员自选</span>
          <span><i style="background:var(--green)"></i>已到店</span><span><i style="background:#CFC7BD"></i>已取消</span></div></div>
          <div class="cal-scroll"><div class="cal-grid">${WD.map((w, i) => {
            const d = new Date(ws); d.setDate(d.getDate() + i);
            return `<div class="cal-head ${i === todayIdx && state.week === 0 ? 'today' : ''}"><div class="wd">${w}</div><div class="dd">${d.getDate()}</div></div>`;
          }).join('')}
          ${WD.map((w, di) => `<div class="cal-cell ${di === todayIdx && state.week === 0 ? 'today' : ''}">
            ${state.appts.map((a, i) => a.day === di ? apptCard(a, i) : '').join('') || '<div class="muted" style="font-size:10.5px;text-align:center;padding-top:26px">暂无排期</div>'}</div>`).join('')}
          </div></div></div>
        <div class="card"><div class="card-head"><div><h3>今日预约</h3><div class="sub">${fmtCN(TODAY)} · ${todayList.length} 位会员</div></div>
          <span class="badge b-gold">按时间排序</span></div>
          <div class="card-body" style="padding-top:8px">${todayList.map(a => `<div class="appt-list-item">
            <div class="appt-list-time">${a.time}</div>
            <div class="appt-list-main"><div class="appt-list-name">${esc(a.member)}</div>
              <div class="appt-list-sub">${esc(a.project)} · ${esc(a.staff)} 技师</div></div>
            ${badge(a.status === 'done' ? '已到店' : '待到店', a.status === 'done' ? 'b-green' : 'b-gold')}</div>`).join('')}
            <button class="btn btn-ghost btn-block btn-sm" style="margin-top:16px" data-action="addAppt">+ 为该时段添加预约</button>
          </div></div>
      </div>`;
  }

  /* ---------------- 3. 会员管理 ---------------- */
  function memberRows() {
    const list = MEMBERS.filter(m => (state.level === '全部' || m.level === state.level) &&
      (!state.search || m.name.includes(state.search) || m.id.includes(state.search) || m.phone.includes(state.search)));
    if (!list.length) return `<tr><td colspan="8"><div class="empty-cart">没有找到匹配的会员</div></td></tr>`;
    return list.map(m => `<tr>
      <td><div class="cell-main"><div class="av" style="background:${m.color}">${m.name[0]}</div>
        <div><div class="cell-name">${m.name}</div><div class="cell-sub">${m.id}</div></div></div></td>
      <td class="muted">${m.phone}</td><td>${badge(m.level, LEVEL_BADGE[m.level])}</td>
      <td class="mono"><b>${money(m.balance)}</b></td><td class="mono">${m.times} 次</td>
      <td class="mono">${money(m.total)}</td><td class="muted">${m.last}</td>
      <td>${m.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        <button class="link" style="margin-left:6px" data-action="memberDetail" data-id="${m.id}">详情</button></td></tr>`).join('');
  }
  function viewMembers() {
    return head('会员管理', '共 1,286 位会员　·　本月新增 48 位　·　活跃率 68.4%',
      `<button class="btn btn-ghost btn-sm" data-action="export">导出名单</button>
       <button class="btn btn-gold btn-sm" data-action="addMember">${ic('plus', 13)} 新增会员</button>`) +
      `<div class="grid g4">`
      + [['总会员数', '1,286', 'users', 'var(--gold-soft)', 'var(--gold-deep)'],
         ['本月新增', '48', 'plus', 'var(--blue-soft)', 'var(--blue)'],
         ['铂金会员', '92', 'sparkle', 'var(--rose-soft)', '#C77F77'],
         ['储值余额合计', '¥ 86.4万', 'money', 'var(--green-soft)', 'var(--green)']].map(k =>
        `<div class="card mini-stat"><div class="mini-stat-icon" style="background:${k[3]};color:${k[4]}">${ic(k[2], 17)}</div>
         <div><div class="mini-stat-val mono">${k[1]}</div><div class="mini-stat-lbl">${k[0]}</div></div></div>`).join('') + `</div>

      <div class="card mt16"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:16px 20px;border-bottom:1px solid var(--line)">
        <div class="filters">${['全部', '铂金', '金卡', '银卡', '普通'].map(l => `<button class="fchip ${state.level === l ? 'on' : ''}" data-action="level" data-level="${l}">${l}</button>`).join('')}</div>
        <div class="search">${ic('search', 14)}<input class="input" id="memberSearch" data-input="search" placeholder="搜索姓名 / 手机号 / 会员号" value="${esc(state.search)}"></div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>会员</th><th>手机号</th><th>等级</th><th>储值余额</th><th>剩余次卡</th><th>累计消费</th><th>最近到店</th><th>标签 / 操作</th></tr></thead>
      <tbody id="memberRows">${memberRows()}</tbody></table></div>
      <div style="padding:13px 20px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--ink3)">
        <span>显示 ${MEMBERS.filter(m => state.level === '全部' || m.level === state.level).length} 条示例记录（共 1,286 条）</span>
        <span>‹ 1 2 3 … 129 ›</span></div></div>`;
  }

  /* ---------------- 4. 卡项管理 ---------------- */
  function viewCards() {
    const list = state.plans.filter(p => state.cardTab === '全部' || p.type === state.cardTab);
    return head('卡项管理', '储值卡 / 次卡 / 疗程套餐统一配置，支持核销追踪',
      `<button class="btn btn-ghost btn-sm" data-action="go" data-view="members">查看会员卡包</button>
       <button class="btn btn-gold btn-sm" data-action="addPlan">${ic('plus', 13)} 新建卡项</button>`) +
      `<div class="filters" style="margin-bottom:16px">${['全部', '储值卡', '次卡', '疗程套餐'].map(t =>
        `<button class="fchip ${state.cardTab === t ? 'on' : ''}" data-action="cardTab" data-tab="${t}">${t}</button>`).join('')}</div>
      <div class="grid g3">${list.map(p => `<div class="plan-card ${p.theme}">
        <div class="plan-top"><div class="plan-icon">${ic(p.type === '储值卡' ? 'card' : p.type === '次卡' ? 'calendar' : 'sparkle', 19)}</div>
          ${badge(p.type, p.theme === 'dark' ? 'b-gold' : 'b-gray')}</div>
        <div class="plan-name">${p.name}</div><div class="plan-sub">${p.sub}</div>
        <div class="plan-price mono">${money(p.price)}<small>起</small></div>
        <ul class="plan-perks">${p.perks.map(x => `<li>${x}</li>`).join('')}</ul>
        <div class="plan-foot"><span>累计售出 ${p.sold} 张</span><button class="link" data-action="planDetail" data-name="${esc(p.name)}">查看详情 →</button></div>
      </div>`).join('')}</div>
      <div class="card mt16"><div class="card-head"><div><h3>最近核销记录</h3><div class="sub">卡项使用与余额扣减流水</div></div>
        <button class="link" data-action="export">导出流水 →</button></div>
        <div class="card-body" style="padding:0 0 4px"><div class="table-wrap"><table><thead><tr><th>会员</th><th>使用卡项</th><th>核销内容</th><th>服务技师</th><th>时间</th><th>状态</th></tr></thead>
        <tbody>${REDEEMS.map(r => `<tr><td><b>${r.member}</b></td><td>${r.plan}</td><td class="mono">${r.item}</td>
          <td class="muted">${r.staff}</td><td class="muted">${r.time}</td><td>${badge('已核销', 'b-green')}</td></tr>`).join('')}</tbody></table></div></div></div>`;
  }

  /* ---------------- 5. 开单收银 ---------------- */
  function orderCalc() {
    const sub = state.order.reduce((s, x) => s + x.price, 0);
    const disc = Math.round(sub * (1 - state.discount));
    return { sub, disc, total: sub - disc };
  }
  function checkoutRight() {
    const c = orderCalc();
    return `<div class="order-lines">${state.order.length ? state.order.map((o, i) => `<div class="order-line">
      <span class="ol-name">${esc(o.name)} <span class="muted" style="font-size:10px">${o.type === 'product' ? '产品' : '项目'}</span></span>
      <span class="ol-price mono">${money(o.price)}</span>
      <button class="order-del" data-action="delOrder" data-idx="${i}">×</button></div>`).join('')
      : `<div class="empty-cart">${ic('cash', 28)}<br>还没有选择项目<br>点击左侧项目或产品加入订单</div>`}</div>
      <div class="order-total"><div class="order-row"><span>小计</span><span class="mono">${money(c.sub)}</span></div>
        <div class="order-row"><span>会员折扣（${(state.discount * 10).toFixed(1)} 折）</span><span class="mono">-${money(c.disc)}</span></div>
        <div class="order-row big"><span>应付金额</span><b class="mono">${money(c.total)}</b></div></div>`;
  }
  function viewCheckout() {
    const sel = id => state.order.some(o => o.id === id);
    return head('开单收银', '选择项目与产品 → 指定服务技师 → 选择结算方式完成收款',
      `<button class="btn btn-ghost btn-sm" data-action="clearOrder">清空订单</button>
       <button class="btn btn-gold btn-sm" data-action="submitPay">${ic('check', 13)} 确认收款</button>`) +
      `<div class="grid g-7-5">
        <div class="grid" style="gap:16px;align-content:start">
          <div class="card"><div class="card-head"><div><h3>选择会员与技师</h3><div class="sub">关联会员可自动带出等级折扣</div></div></div>
            <div class="card-body"><div class="form-row">
              <div class="field" style="margin-bottom:0"><label>会员</label><select class="select" data-change="payMember">${opts(MEMBERS.map(m => `${m.name} · ${m.level}`))}</select></div>
              <div class="field" style="margin-bottom:0"><label>服务技师</label><select class="select" data-change="payStaff">${opts(STAFF.map(s => s.name))}</select></div>
            </div></div></div>
          <div class="card"><div class="card-head"><div><h3>服务项目</h3><div class="sub">点击加入订单</div></div><span class="badge b-gold">${PROJECTS.filter(p => state.catalogOn[p.id]).length} 个在售</span></div>
            <div class="card-body"><div class="pick-list">${PROJECTS.filter(p => state.catalogOn[p.id]).map(p => `<div class="pick-item ${sel(p.id) ? 'on' : ''}" data-action="pick" data-id="${p.id}">
              <div class="pick-info"><div class="pick-name">${p.name}</div><div class="pick-sub">${p.cat} · ${p.dur} 分钟</div></div>
              <div class="pick-price mono">${money(p.price)}</div><div class="pick-plus">${sel(p.id) ? '✓' : '+'}</div></div>`).join('')}</div></div></div>
          <div class="card"><div class="card-head"><div><h3>家居产品</h3><div class="sub">可随单零售</div></div></div>
            <div class="card-body"><div class="pick-list">${PRODUCTS.map((p, i) => `<div class="pick-item ${sel('pr' + i) ? 'on' : ''}" data-action="pickProduct" data-idx="${i}">
              <div class="pick-info"><div class="pick-name">${p.name}</div><div class="pick-sub">${p.spec} · 库存 ${p.stock}</div></div>
              <div class="pick-price mono">${money(200 + i * 60)}</div><div class="pick-plus">${sel('pr' + i) ? '✓' : '+'}</div></div>`).join('')}</div></div></div>
        </div>
        <div class="grid" style="gap:16px;align-content:start">
          <div class="card"><div class="card-head"><div><h3>订单明细</h3><div class="sub">单号 SO202611050018</div></div><span class="badge b-gold">${state.order.length} 项</span></div>
            <div class="card-body" id="orderBox">${checkoutRight()}</div></div>
          <div class="card"><div class="card-head"><div><h3>结算方式</h3><div class="sub">会员储值余额 ¥6,820</div></div></div>
            <div class="card-body"><div class="pay-methods">${['储值卡', '微信支付', '支付宝', '现金', '银行卡', '次卡核销'].map(m =>
              `<div class="pay-method ${state.pay === m ? 'on' : ''}" data-action="pay" data-method="${m}">${m}</div>`).join('')}</div>
              <div class="field" style="margin-top:14px;margin-bottom:0"><label>会员折扣</label>
                <select class="select" data-change="discount"><option value="1" ${state.discount === 1 ? 'selected' : ''}>无折扣</option>
                <option value="0.9" ${state.discount === 0.9 ? 'selected' : ''}>金卡 9 折</option>
                <option value="0.85" ${state.discount === 0.85 ? 'selected' : ''}>铂金 8.5 折</option>
                <option value="0.8" ${state.discount === 0.8 ? 'selected' : ''}>活动 8 折</option></select></div>
              <button class="btn btn-primary btn-block" style="margin-top:16px" data-action="submitPay">确认收款 · ${money(orderCalc().total)}</button>
            </div></div>
        </div>
      </div>`;
  }

  /* ---------------- 6. 员工排班 ---------------- */
  function viewStaff() {
    const shifts = [['am', 'pm', 'am', 'pm', 'am', 'am', 'off'], ['pm', 'am', 'pm', 'am', 'off', 'pm', 'am'],
                    ['am', 'am', 'off', 'pm', 'pm', 'am', 'pm'], ['off', 'pm', 'am', 'pm', 'am', 'pm', 'pm']];
    return head('员工排班', '本周排班与服务业绩　·　早班 09:00-17:00　·　晚班 13:00-21:00',
      `<button class="btn btn-ghost btn-sm" data-action="export">导出排班</button>
       <button class="btn btn-gold btn-sm" data-action="addStaff">${ic('plus', 13)} 添加员工</button>`) +
      `<div class="grid g4">${STAFF.map(s => `<div class="card staff-card">
        <div class="staff-av" style="background:linear-gradient(145deg,${s.color},${s.color}bb)">${s.name[0]}</div>
        <div class="staff-name">${s.name}</div><div class="staff-star">${'★'.repeat(s.star)}${'☆'.repeat(5 - s.star)}</div>
        <div style="margin-bottom:10px">${badge(s.level, 'b-gold')}</div>
        <div class="staff-skill">${s.skill}</div>
        <div style="display:flex;justify-content:center;gap:18px;margin-top:14px;padding-top:13px;border-top:1px dashed var(--line)">
          <div><div class="mono" style="font-size:14px;font-weight:600">${s.orders}</div><div class="muted" style="font-size:10px;margin-top:3px">本月服务单</div></div>
          <div><div class="mono" style="font-size:14px;font-weight:600">${(s.perf / 10000).toFixed(1)}万</div><div class="muted" style="font-size:10px;margin-top:3px">业绩</div></div></div>
      </div>`).join('')}</div>
      <div class="card mt16"><div class="card-head"><div><h3>本周排班表</h3><div class="sub">${mmdd(weekStart(0))} - ${mmdd(new Date(weekStart(0).getTime() + 6 * 864e5))}</div></div>
        <button class="link" data-action="editSchedule">调整排班 →</button></div>
        <div class="card-body" style="padding:0 0 4px"><div class="table-wrap"><table class="schedule"><thead><tr><th>技师</th>${WD.map(w => `<th>${w}</th>`).join('')}</tr></thead>
        <tbody>${STAFF.map((s, i) => `<tr><td><div class="cell-main"><div class="av" style="background:${s.color}">${s.name[0]}</div><span class="cell-name">${s.name}</span></div></td>
          ${shifts[i].map(sh => `<td><span class="shift ${sh}">${sh === 'am' ? '早班' : sh === 'pm' ? '晚班' : '休息'}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div></div></div>
      <div class="card mt16"><div class="card-head"><div><h3>本月业绩与提成</h3><div class="sub">提成比例统一为业绩的 15%</div></div></div>
        <div class="card-body" style="padding:0 0 4px"><div class="table-wrap"><table><thead><tr><th>技师</th><th>服务单数</th><th>项目业绩</th><th>产品销售</th><th>提成金额</th><th>状态</th></tr></thead>
        <tbody>${STAFF.map(s => `<tr><td><b>${s.name}</b></td><td class="mono">${s.orders} 单</td><td class="mono">${money(s.perf)}</td>
          <td class="mono">${money(Math.round(s.perf * 0.18))}</td><td class="mono"><b style="color:var(--gold-deep)">${money(s.commission)}</b></td>
          <td>${badge('已核算', 'b-green')}</td></tr>`).join('')}</tbody></table></div></div></div>`;
  }

  /* ---------------- 7. 项目与库存 ---------------- */
  function viewCatalog() {
    return head('项目与库存', '管理门店服务项目与零售产品库存，低库存自动预警',
      `<button class="btn btn-ghost btn-sm" data-action="export">导出库存</button>
       <button class="btn btn-gold btn-sm" data-action="addProject">${ic('plus', 13)} 新增项目</button>`) +
      `<div class="grid g4">`
      + [['在售项目', PROJECTS.filter(p => state.catalogOn[p.id]).length + ' 个', 'sparkle', 'var(--gold-soft)', 'var(--gold-deep)'],
         ['产品 SKU', PRODUCTS.length + ' 个', 'box', 'var(--blue-soft)', 'var(--blue)'],
         ['低库存预警', PRODUCTS.filter(p => p.stock < p.safe).length + ' 项', 'bell', 'var(--red-soft)', 'var(--red)'],
         ['库存总值', '¥ 4.86万', 'money', 'var(--green-soft)', 'var(--green)']].map(k =>
        `<div class="card mini-stat"><div class="mini-stat-icon" style="background:${k[3]};color:${k[4]}">${ic(k[2], 17)}</div>
         <div><div class="mini-stat-val mono">${k[1]}</div><div class="mini-stat-lbl">${k[0]}</div></div></div>`).join('') + `</div>

      <div class="card mt16"><div class="card-head"><div><h3>服务项目</h3><div class="sub">控制在会员端与管理端是否可售</div></div>
        <span class="badge b-gray">点击开关切换状态</span></div>
        <div class="card-body" style="padding:0 0 4px"><div class="table-wrap"><table><thead><tr><th>项目名称</th><th>分类</th><th>时长</th><th>标准价</th><th>本月销量</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${PROJECTS.map((p, i) => `<tr><td><div class="cell-main"><div class="av" style="background:${['#C8A87C', '#E8A9A0', '#A6B4A2', '#B0A1C0', '#9FB2BE', '#C3A98B'][i]};border-radius:8px">${ic('sparkle', 14)}</div>
          <span class="cell-name">${p.name}</span></div></td><td>${badge(p.cat, 'b-gray')}</td><td class="mono">${p.dur} 分钟</td>
          <td class="mono"><b>${money(p.price)}</b></td><td class="mono">${[86, 124, 42, 67, 38, 0][i]} 次</td>
          <td><div style="display:flex;align-items:center;gap:8px"><span class="switch ${state.catalogOn[p.id] ? 'on' : ''}" data-action="toggleProject" data-id="${p.id}"></span>
            <span class="muted" style="font-size:11px">${state.catalogOn[p.id] ? '在售' : '已下架'}</span></div></td>
          <td><button class="link" data-action="projectDetail" data-name="${esc(p.name)}">编辑</button></td></tr>`).join('')}</tbody></table></div></div></div>

      <div class="card mt16"><div class="card-head"><div><h3>产品库存</h3><div class="sub">低于安全库存自动标红预警</div></div>
        <button class="btn btn-ghost btn-sm" data-action="restock">＋ 补货登记</button></div>
        <div class="card-body" style="padding:0 0 4px"><div class="table-wrap"><table><thead><tr><th>产品名称</th><th>规格</th><th>当前库存</th><th>安全库存</th><th>库存状态</th><th>操作</th></tr></thead>
        <tbody>${PRODUCTS.map(p => { const low = p.stock < p.safe; return `<tr><td><b>${p.name}</b></td><td class="muted">${p.spec}</td>
          <td><div class="stock-bar ${low ? 'low' : ''}"><i style="width:${Math.min(100, p.stock / 50 * 100)}%"></i></div><span class="mono">${p.stock}</span></td>
          <td class="mono muted">${p.safe}</td><td>${badge(low ? '库存不足' : '库存充足', low ? 'b-red' : 'b-green')}</td>
          <td><button class="link" data-action="restockOne" data-name="${esc(p.name)}">补货</button></td></tr>`; }).join('')}</tbody></table></div></div></div>`;
  }

  /* ---------------- 8. 营销与报表 ---------------- */
  function viewMarketing() {
    const months = [['6 月', 142, 1180, 62, 31], ['7 月', 158, 1240, 64, 38], ['8 月', 151, 1210, 63, 35],
                    ['9 月', 176, 1320, 67, 42], ['10 月', 192, 1380, 71, 46], ['11 月', 186, 1420, 73, 48]];
    const pts = months.map((m, i) => `${40 + i * 108},${160 - (m[1] - 130) * 1.1}`).join(' ');
    const area = `40,170 ${pts} 580,170`;
    return head('营销与报表', '活动运营与月度经营分析　·　数据口径：静安旗舰店',
      `<button class="btn btn-ghost btn-sm" data-action="export">导出报表</button>
       <button class="btn btn-gold btn-sm" data-action="addCoupon">${ic('plus', 13)} 新建活动</button>`) +
      `<div class="grid g4">`
      + [['本月营收', '¥ 18.6万', '+12.6% 同比', 'money'], ['客单价', '¥ 1,420', '+2.9% 同比', 'card'],
         ['会员复购率', '73.0%', '+4.2pt 同比', 'heart'], ['新增会员', '48 人', '+6 人 环比', 'users']].map(k =>
        `<div class="report-kpi"><div class="rl">${k[0]}</div><div class="rv mono">${k[1]}</div><div class="rt">${k[2]}</div></div>`).join('') + `</div>

      <div class="grid g3 mt16">${COUPONS.map(c => `<div class="coupon">
        <div class="coupon-amt mono"><small>¥</small>${c.amt}</div><div class="coupon-name">${c.name}</div>
        <div class="coupon-desc">${c.desc}</div><div class="coupon-foot"><span>已用 ${c.used} / 剩余 ${c.left}</span>
          ${badge(c.status, c.status === '进行中' ? 'b-green' : 'b-red')}</div></div>`).join('')}</div>

      <div class="grid g-7-5 mt16">
        <div class="card"><div class="card-head"><div><h3>月度营收趋势</h3><div class="sub">近 6 个月营业额（单位：千元）</div></div>
          <span class="badge b-gold">持续增长</span></div>
          <div class="card-body"><svg class="line-chart" viewBox="0 0 620 200">
            ${[40, 80, 120, 160].map(y => `<line x1="40" y1="${y}" x2="600" y2="${y}" stroke="#F0EBE3" stroke-dasharray="4 4"/>`).join('')}
            <polygon points="${area}" fill="rgba(200,168,124,.13)"/>
            <polyline points="${pts}" fill="none" stroke="#C8A87C" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
            ${months.map((m, i) => `<circle cx="${40 + i * 108}" cy="${160 - (m[1] - 130) * 1.1}" r="4" fill="#fff" stroke="#C8A87C" stroke-width="2"/>`).join('')}
            ${months.map((m, i) => `<text x="${40 + i * 108}" y="192" text-anchor="middle" font-size="11" fill="#A39B92">${m[0]}</text>`).join('')}
          </svg></div></div>
        <div class="card"><div class="card-head"><div><h3>渠道来源</h3><div class="sub">本月新增会员 48 人</div></div></div>
          <div class="card-body" style="padding-top:8px">${[['老带新推荐', 42, '#C8A87C'], ['小程序自然流量', 27, '#E8A9A0'],
            ['线下到店', 19, '#8FA3A6'], ['团购平台', 12, '#B0A1C0']].map(x => `<div class="rank-item">
            <div class="rank-info"><div class="rank-name" style="font-size:11.5px">${x[0]}</div>
              <div class="rank-bar"><i style="width:${x[1] * 2}%;background:${x[2]}"></i></div></div>
            <div class="rank-val mono">${x[1]}%</div></div>`).join('')}</div></div>
      </div>

      <div class="card mt16"><div class="card-head"><div><h3>近 6 月经营明细</h3><div class="sub">核心经营指标汇总</div></div></div>
        <div class="card-body" style="padding:0 0 4px"><div class="table-wrap"><table><thead><tr><th>月份</th><th>营业额</th><th>客单价</th><th>复购率</th><th>新增会员</th><th>环比</th></tr></thead>
        <tbody>${months.map((m, i) => `<tr><td><b>${m[0]}</b></td><td class="mono">${money(m[1] * 1000)}</td><td class="mono">${money(m[2])}</td>
          <td class="mono">${m[3]}%</td><td class="mono">${m[4]} 人</td><td>${badge(i === 0 ? '—' : (m[1] >= months[i - 1][1] ? '↑ 增长' : '↓ 回落'), i === 0 ? 'b-gray' : (m[1] >= months[i - 1][1] ? 'b-red' : 'b-green'))}</td></tr>`).join('')}</tbody></table></div></div></div>`;
  }

  /* ---------------- 弹窗内容 ---------------- */
  function modalAddAppt() {
    const times = ['09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '18:00', '19:00'];
    const body = `<div class="form-row"><div class="field"><label>预约会员 <span class="req">*</span></label>
        <select class="select" id="fMember">${opts(MEMBERS.map(m => m.name))}</select></div>
      <div class="field"><label>联系电话</label><input class="input" value="138****6208" readonly></div></div>
      <div class="form-row"><div class="field"><label>服务项目 <span class="req">*</span></label>
        <select class="select" id="fProject">${opts(PROJECTS.filter(p => state.catalogOn[p.id]).map(p => p.name))}</select></div>
      <div class="field"><label>服务技师 <span class="req">*</span></label><select class="select" id="fStaff">${opts(STAFF.map(s => s.name))}</select></div></div>
      <div class="form-row"><div class="field"><label>预约日期</label><select class="select" id="fDay">${WD.map((w, i) => `<option value="${i}" ${i === todayIdx ? 'selected' : ''}>本周${w.slice(1)}（${mmdd(new Date(weekStart(0).getTime() + i * 864e5))}）</option>`).join('')}</select></div>
      <div class="field"><label>预约时段</label><select class="select" id="fTime">${opts(times)}</select></div></div>
      <div class="field"><label>护理备注</label><textarea class="textarea" id="fNote" placeholder="如：皮肤敏感，避开光电项目；指定 3 号护理室…"></textarea></div>
      <div style="background:#FBF8F3;border:1px solid var(--line);border-radius:8px;padding:11px 13px;font-size:11px;color:var(--ink2);line-height:1.8">
        ${ic('clock', 13)} 预约成功后将自动向会员推送微信服务通知，并占用该技师对应时段。</div>`;
    openModal('新增预约', '为会员创建一条新的到店排期', body,
      `<button class="btn btn-ghost" data-action="closeModal">取消</button><button class="btn btn-gold" data-action="submitAppt">确认预约</button>`);
  }
  function modalMember(id) {
    const m = MEMBERS.find(x => x.id === id) || MEMBERS[0];
    const body = `<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
      <div class="av" style="width:52px;height:52px;border-radius:14px;font-size:18px;background:${m.color}">${m.name[0]}</div>
      <div><div style="font-size:16px;font-weight:600">${m.name} ${badge(m.level, LEVEL_BADGE[m.level])}</div>
        <div class="muted" style="font-size:11px;margin-top:6px">${m.id}　·　${m.phone}　·　入会 2024.03</div></div></div>
      <div class="grid g3" style="gap:10px;margin-bottom:6px">
        <div class="report-kpi"><div class="rl">储值余额</div><div class="rv mono" style="font-size:17px">${money(m.balance)}</div></div>
        <div class="report-kpi"><div class="rl">剩余次卡</div><div class="rv mono" style="font-size:17px">${m.times} 次</div></div>
        <div class="report-kpi"><div class="rl">累计消费</div><div class="rv mono" style="font-size:17px">${money(m.total)}</div></div></div>
      <div class="section-title">持有卡项</div>
      <div class="detail-grid"><div class="detail-row"><span>抗衰紧致 12 次疗程</span><b>剩 ${m.times} 次</b></div>
        <div class="detail-row"><span>臻享储值卡</span><b>${money(m.balance)}</b></div></div>
      <div class="section-title">最近消费</div>
      <div class="detail-grid"><div class="detail-row"><span>11-03 抗衰紧致疗程</span><b>次卡核销</b></div>
        <div class="detail-row"><span>10-28 水光补水护理</span><b class="mono">${money(680)}</b></div>
        <div class="detail-row"><span>10-21 臻萃修护精华液</span><b class="mono">${money(380)}</b></div>
        <div class="detail-row"><span>10-14 深层清洁管理</span><b class="mono">${money(398)}</b></div></div>
      <div class="section-title">护理备注与标签</div>
      <div>${m.tags.map(t => `<span class="tag">${t}</span>`).join('')}<span class="tag">偏好下午时段</span><span class="tag">轻度敏感肌</span></div>
      <div style="margin-top:12px;background:#FBF8F3;border:1px solid var(--line);border-radius:8px;padding:12px;font-size:11.5px;color:var(--ink2);line-height:1.8">
        护理偏好：偏好林悦技师；换季易敏感，建议避开强清洁项目；每次到店后习惯加购修护面膜。</div>`;
    openModal('会员详情', '会员档案 · 卡项 · 消费记录', body,
      `<button class="btn btn-ghost" data-action="closeModal">关闭</button><button class="btn btn-gold" data-action="go" data-view="checkout">为 TA 开单</button>`, 'wide');
  }
  function modalNotice() {
    const items = [
      ['低库存提醒', '水润保湿面膜当前库存 8 盒，低于安全库存 12 盒，请及时补货。', '10 分钟前'],
      ['新预约待确认', '会员「郑思琪」预约了明天 10:30 水光补水护理。', '32 分钟前'],
      ['卡项即将到期', '3 位会员的次卡将在 30 天内到期，建议安排回访。', '2 小时前'],
      ['今日目标达成', '今日营业额已达 ¥28,680，完成日目标的 114.7%。', '3 小时前']
    ];
    openModal('消息通知', '共 4 条未读消息', items.map(i => `<div class="notice-item"><div class="notice-dot"></div>
      <div><div class="notice-t">${i[0]}</div><div class="notice-d">${i[1]}</div><div class="notice-time">${i[2]}</div></div></div>`).join(''),
      `<button class="btn btn-ghost" data-action="closeModal">关闭</button><button class="btn btn-gold" data-action="readAll">全部标为已读</button>`, 'narrow');
  }
  function modalSimple(title, sub, html) {
    openModal(title, sub, html, `<button class="btn btn-ghost" data-action="closeModal">关闭</button>`, 'narrow');
  }

  /* ---------------- 渲染 ---------------- */
  const VIEWS = { dashboard: viewDashboard, appointments: viewAppointments, members: viewMembers, cards: viewCards, checkout: viewCheckout, staff: viewStaff, catalog: viewCatalog, marketing: viewMarketing };
  function renderNav() {
    document.getElementById('nav').innerHTML = NAV.map(n => n.sep ? '<div class="nav-sep"></div>' :
      `<button class="nav-item ${state.view === n.id ? 'active' : ''}" data-action="go" data-view="${n.id}">${ic(n.icon, 17)}<span>${n.name}</span></button>`).join('');
  }
  function render() {
    renderNav();
    const t = TITLES[state.view] || TITLES.dashboard;
    document.getElementById('pageTitle').textContent = t.name;
    document.getElementById('crumb').textContent = t.crumb;
    $view.innerHTML = (VIEWS[state.view] || viewDashboard)();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.getElementById('topDate').textContent = fmtCN(TODAY);

  /* ---------------- 事件委托 ---------------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;

    if (a === 'maskClose') { if (e.target === el) closeModal(); return; }
    if (a === 'closeModal') { closeModal(); return; }
    if (a === 'go') { closeModal(); state.view = el.dataset.view; render(); return; }
    if (a === 'refresh') { toast('数据已刷新（示例数据）'); return; }
    if (a === 'export') { toast('报表已生成，可在此接入导出接口'); return; }
    if (a === 'switchStore') { modalSimple('切换门店', '当前账号可管理 3 家门店',
      ['瑞妍熙 · 静安旗舰店（当前）', '瑞妍熙 · 徐汇店', '瑞妍熙 · 浦东店'].map(x =>
      `<div class="pick-item" style="margin-bottom:8px"><div class="pick-info"><div class="pick-name">${x}</div></div>${x.includes('当前') ? badge('当前', 'b-gold') : ''}</div>`).join('')); return; }
    if (a === 'showNotice') { modalNotice(); return; }
    if (a === 'readAll') { closeModal(); toast('已将 4 条消息标为已读'); return; }

    /* 预约 */
    if (a === 'week') { const d = +el.dataset.delta; state.week = d === 0 ? 0 : state.week + d; render(); return; }
    if (a === 'addAppt') { modalAddAppt(); return; }
    if (a === 'submitAppt') {
      const g = id => document.getElementById(id);
      if (!g('fMember')) return;
      const item = { day: +g('fDay').value, time: g('fTime').value, member: g('fMember').value, project: g('fProject').value, staff: g('fStaff').value, status: 'booked' };
      if (state.appts.some(x => x.day === item.day && x.time === item.time && x.staff === item.staff)) { toast('该技师此时段已有预约，请更换时段'); return; }
      state.appts.push(item); closeModal(); state.view = 'appointments'; render();
      toast(`已为 ${item.member} 预约 ${item.time} ${item.project}`); return;
    }
    if (a === 'apptDetail') {
      const x = state.appts[+el.dataset.idx]; if (!x) return;
      const body = `<div class="detail-grid">
        <div class="detail-row"><span>会员</span><b>${esc(x.member)}</b></div><div class="detail-row"><span>服务项目</span><b>${esc(x.project)}</b></div>
        <div class="detail-row"><span>服务技师</span><b>${esc(x.staff)}</b></div><div class="detail-row"><span>预约时间</span><b>本周${WD[x.day].slice(1)} ${x.time}</b></div>
        <div class="detail-row"><span>护理室</span><b>3 号护理室</b></div><div class="detail-row"><span>状态</span><b>${x.status === 'done' ? '已到店' : x.status === 'canceled' ? '已取消' : '待到店'}</b></div></div>
        <div style="margin-top:16px;background:#FBF8F3;border:1px solid var(--line);border-radius:8px;padding:12px;font-size:11.5px;color:var(--ink2);line-height:1.8">备注：会员偏好安静护理室，到店后请先做皮肤检测。</div>`;
      openModal('预约详情', '排期编号 AP' + (202611050000 + +el.dataset.idx), body,
        `<button class="btn btn-ghost" data-action="apptCancel" data-idx="${el.dataset.idx}">取消预约</button>
         <button class="btn btn-gold" data-action="apptCheckin" data-idx="${el.dataset.idx}">到店登记</button>`, 'narrow'); return;
    }
    if (a === 'apptCancel') { state.appts[+el.dataset.idx].status = 'canceled'; closeModal(); render(); toast('预约已取消，已通知会员'); return; }
    if (a === 'apptCheckin') { state.appts[+el.dataset.idx].status = 'done'; closeModal(); render(); toast('已登记到店，可前往开单'); return; }

    /* 会员 */
    if (a === 'level') { state.level = el.dataset.level; render(); return; }
    if (a === 'memberDetail') { modalMember(el.dataset.id); return; }
    if (a === 'addMember') { modalSimple('新增会员', '录入到店新客资料', `<div class="field"><label>姓名</label><input class="input" placeholder="请输入会员姓名"></div>
      <div class="form-row"><div class="field"><label>手机号</label><input class="input" placeholder="11 位手机号"></div>
      <div class="field"><label>初始等级</label><select class="select">${opts(['普通', '银卡', '金卡', '铂金'])}</select></div></div>
      <div class="field"><label>护理偏好 / 备注</label><textarea class="textarea" placeholder="选填"></textarea></div>`); return; }

    /* 卡项 */
    if (a === 'cardTab') { state.cardTab = el.dataset.tab; render(); return; }
    if (a === 'planDetail') { modalSimple('卡项详情', el.dataset.name, `<div class="detail-row"><span>卡项类型</span><b>储值 / 次卡 / 疗程</b></div>
      <div class="detail-row"><span>有效期</span><b>自购买日起 12 个月</b></div><div class="detail-row"><span>适用门店</span><b>瑞妍熙全门店通用</b></div>
      <div class="detail-row"><span>核销规则</span><b>每次到店由前台核销</b></div>
      <div style="margin-top:16px;background:#FBF8F3;border-radius:8px;padding:12px;font-size:11.5px;color:var(--ink2);line-height:1.8">支持会员移动端自助查看剩余次数与出示核销二维码。</div>`); return; }
    if (a === 'addPlan') { modalSimple('新建卡项', '配置新的会员卡或疗程套餐', `<div class="field"><label>卡项名称</label><input class="input" placeholder="如：补水焕肤 10 次卡"></div>
      <div class="form-row"><div class="field"><label>卡项类型</label><select class="select">${opts(['储值卡', '次卡', '疗程套餐'])}</select></div>
      <div class="field"><label>售价（元）</label><input class="input" type="number" placeholder="0"></div></div>
      <div class="field"><label>权益说明</label><textarea class="textarea" placeholder="每行一条权益"></textarea></div>`); return; }

    /* 收银 */
    if (a === 'pick') {
      const p = PROJECTS.find(x => x.id === el.dataset.id); if (!p) return;
      const i = state.order.findIndex(x => x.id === p.id);
      if (i >= 0) state.order.splice(i, 1); else state.order.push({ id: p.id, name: p.name, price: p.price, type: 'project' });
      render(); return;
    }
    if (a === 'pickProduct') {
      const i = +el.dataset.idx, p = PRODUCTS[i], id = 'pr' + i;
      const k = state.order.findIndex(x => x.id === id);
      if (k >= 0) state.order.splice(k, 1); else state.order.push({ id, name: p.name, price: 200 + i * 60, type: 'product' });
      render(); return;
    }
    if (a === 'delOrder') { state.order.splice(+el.dataset.idx, 1); render(); return; }
    if (a === 'clearOrder') { state.order = []; render(); toast('订单已清空'); return; }
    if (a === 'pay') { state.pay = el.dataset.method; render(); return; }
    if (a === 'submitPay') {
      if (!state.order.length) { toast('请先选择项目或产品'); return; }
      const c = orderCalc();
      openModal('收款成功', '单号 SO202611050018', `<div style="text-align:center;padding:8px 0 4px">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--green-soft);color:var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">${ic('check', 28)}</div>
        <div style="font-size:26px;font-weight:600" class="mono">${money(c.total)}</div>
        <div class="muted" style="font-size:11.5px;margin-top:8px">${state.pay}　·　${state.payMember.split(' · ')[0]}　·　${state.payStaff} 技师</div>
        <div style="margin-top:20px;background:#FBF8F3;border:1px solid var(--line);border-radius:8px;padding:13px;text-align:left;font-size:11.5px;color:var(--ink2);line-height:1.9">
          ${state.order.map(o => `<div style="display:flex;justify-content:space-between"><span>${esc(o.name)}</span><span class="mono">${money(o.price)}</span></div>`).join('')}
          <div style="display:flex;justify-content:space-between;border-top:1px dashed var(--line);margin-top:8px;padding-top:8px"><span>会员折扣</span><span class="mono">-${money(c.disc)}</span></div></div></div>`,
        `<button class="btn btn-ghost" data-action="closeModal">完成</button><button class="btn btn-gold" data-action="newOrder">继续开单</button>`, 'narrow');
      return;
    }
    if (a === 'newOrder') { state.order = []; closeModal(); render(); toast('已创建新的空订单'); return; }

    /* 员工 / 项目 / 营销 */
    if (a === 'addStaff') { toast('添加员工功能可在此接入表单'); return; }
    if (a === 'editSchedule') { toast('排班编辑模式（原型演示）'); return; }
    if (a === 'toggleProject') { const id = el.dataset.id; state.catalogOn[id] = !state.catalogOn[id]; render(); toast(state.catalogOn[id] ? '项目已上架' : '项目已下架'); return; }
    if (a === 'projectDetail') { modalSimple('编辑项目', el.dataset.name, `<div class="field"><label>项目名称</label><input class="input" value="${esc(el.dataset.name)}"></div>
      <div class="form-row"><div class="field"><label>时长（分钟）</label><input class="input" type="number" value="90"></div>
      <div class="field"><label>标准价（元）</label><input class="input" type="number" value="680"></div></div>`); return; }
    if (a === 'addProject') { toast('新增项目表单（原型演示）'); return; }
    if (a === 'restock' || a === 'restockOne') { toast(a === 'restock' ? '补货登记已打开（原型演示）' : `已为「${el.dataset.name}」创建补货单`); return; }
    if (a === 'addCoupon') { modalSimple('新建营销活动', '配置优惠券规则', `<div class="field"><label>活动名称</label><input class="input" placeholder="如：年末焕新礼遇"></div>
      <div class="form-row"><div class="field"><label>优惠金额（元）</label><input class="input" type="number" placeholder="200"></div>
      <div class="field"><label>发放数量</label><input class="input" type="number" placeholder="500"></div></div>`); return; }
  });

  document.addEventListener('input', e => {
    if (e.target.dataset.input === 'search') {
      state.search = e.target.value.trim();
      const rows = document.getElementById('memberRows');
      if (rows) rows.innerHTML = memberRows();
    }
  });
  document.addEventListener('change', e => {
    const k = e.target.dataset.change;
    if (k === 'payMember') state.payMember = e.target.value;
    if (k === 'payStaff') state.payStaff = e.target.value;
    if (k === 'discount') { state.discount = +e.target.value; render(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  render();
})();
