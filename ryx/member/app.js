/* 瑞妍熙 · 会员移动端 —— 纯静态交互原型 */
(function () {
  'use strict';

  /* ---------------- 图标 ---------------- */
  const P = {
    home: '<path d="M3 10l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 21v-7h6v7"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0116 0v1"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1116 0z"/><circle cx="12" cy="10" r="2.5"/>',
    bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    right: '<path d="M9 18l6-6-6-6"/>',
    left: '<path d="M15 18l-6-6 6-6"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8H7.5a2.5 2.5 0 010-5C11 3 12 8 12 8zM12 8h4.5a2.5 2.5 0 000-5C13 3 12 8 12 8z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 000-7.8z"/>',
    check: '<path d="M5 12l4 4L19 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 19h2v2h-2M14 19h2v2h-2M19 14h2v3h-2"/>',
    star: '<path d="M12 2l3 6.3 6.9 1-5 4.8 1.2 6.9L12 17.8 5.9 21l1.2-6.9-5-4.8 6.9-1z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2v.2a2 2 0 01-4 0v-.1a1.7 1.7 0 00-2.9-1.2l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00-1.2-2.9H3a2 2 0 010-4h.1a1.7 1.7 0 001.2-2.9l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 002.9-1.2V3a2 2 0 014 0v.1a1.7 1.7 0 002.9 1.2l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 001.2 2.9h.2a2 2 0 010 4h-.1a1.7 1.7 0 00-1.6 1z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    edit: '<path d="M11 4H5a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-6"/><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z"/>',
    shop: '<path d="M3 9l1-5h16l1 5M4 9v11h16V9M9 20v-6h6v6"/>'
  };
  const ic = (n, s, c) => `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="${c || 'currentColor'}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;
  const money = n => '¥' + Number(n).toLocaleString('zh-CN');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- 数据 ---------------- */
  const MEMBER = { name: '林晚', level: '铂金会员', id: 'RY 0086 0086', balance: 6820, points: 2480, visits: 42, total: 48600, times: 8 };
  const PROJECTS = [
    { id: 'p1', name: '水光补水护理', dur: 90, price: 680, desc: '深层补水 · 提亮肤色 · 适合换季干燥', bg: 'linear-gradient(135deg,#D9BE96,#B99A6C)', label: 'HYDRA' },
    { id: 'p3', name: '抗衰紧致疗程', dur: 120, price: 1280, desc: '胶原再生 · 轮廓提升 · 专属技师跟诊', bg: 'linear-gradient(135deg,#C7AFA8,#9E7F79)', label: 'LIFT' },
    { id: 'p5', name: '光子嫩肤', dur: 60, price: 980, desc: '均匀肤色 · 淡化色沉 · 光电美肤', bg: 'linear-gradient(135deg,#A9BDBA,#7C9A96)', label: 'PHOTO' },
    { id: 'p2', name: '深层清洁管理', dur: 60, price: 398, desc: '温和净澈 · 疏通毛孔 · 控油平衡', bg: 'linear-gradient(135deg,#C6C0D4,#9B93B4)', label: 'CLEAN' },
    { id: 'p4', name: '肩颈舒缓 SPA', dur: 75, price: 528, desc: '舒缓僵硬 · 精油开背 · 放松减压', bg: 'linear-gradient(135deg,#E4BDB2,#C68F83)', label: 'RELAX' }
  ];
  const STAFF = [
    { name: '林悦', star: 5, title: '高级美容师', skill: '擅长 水光补水 · 抗衰紧致', tag: '会员常选', color: 'linear-gradient(145deg,#D9BE96,#B99A6C)' },
    { name: '苏晴', star: 5, title: '资深美容顾问', skill: '擅长 深层清洁 · 光子嫩肤', tag: '今日可约', color: 'linear-gradient(145deg,#E4BDB2,#C68F83)' },
    { name: '陈曦', star: 4, title: '美容师', skill: '擅长 肩颈舒缓 · 身体 SPA', tag: '今日可约', color: 'linear-gradient(145deg,#A9BDBA,#7C9A96)' },
    { name: '王曼', star: 4, title: '美容师', skill: '擅长 面部护理 · 皮肤检测', tag: '明日可约', color: 'linear-gradient(145deg,#C6C0D4,#9B93B4)' }
  ];
  const WALLETS = [
    { key: 'w1', name: '臻享储值卡', type: '储值卡', val: money(6820), unit: '可用余额', sub: '全店项目 8 折 · 有效期至 2027.06.30', pct: 68, exp: '2027.06.30', bg: 'linear-gradient(125deg,#3B4C42,#2C3632 60%,#4A5546)', used: false },
    { key: 'w2', name: '抗衰紧致 12 次疗程', type: '疗程卡', val: '8', unit: '剩余次数 / 共 12 次', sub: '专属技师林悦跟诊 · 每次 120 分钟', pct: 67, exp: '2027.03.15', bg: 'linear-gradient(125deg,#B99A6C,#96774E 60%,#C4AC82)', used: false },
    { key: 'w3', name: '水光补水 10 次卡', type: '次卡', val: '3', unit: '剩余次数 / 共 10 次', sub: '单次均价 ¥580 · 可赠亲友 2 次', pct: 30, exp: '2026.12.20', bg: 'linear-gradient(125deg,#C68F83,#A96E63 60%,#D8ADA3)', used: false },
    { key: 'w4', name: '深层清洁 10 次卡', type: '次卡', val: '0', unit: '已全部使用', sub: '已于 2026.08 用完 · 可续卡', pct: 0, exp: '已到期', bg: 'linear-gradient(125deg,#A8A29A,#8B857D)', used: true }
  ];
  const RECORDS = [
    { m: '2026年11月', items: [
      { t: '抗衰紧致疗程', d: '11-03 10:00 · 静安旗舰店 · 林悦技师', v: '次卡核销', kind: 'card' },
      { t: '臻萃修护精华液', d: '11-03 11:20 · 门店零售', v: '- ¥380', kind: 'pay' }
    ] },
    { m: '2026年10月', items: [
      { t: '水光补水护理', d: '10-28 14:00 · 静安旗舰店 · 林悦技师', v: '- ¥680', kind: 'pay' },
      { t: '深层清洁管理', d: '10-21 15:30 · 徐汇店 · 苏晴技师', v: '次卡核销', kind: 'card' },
      { t: '储值卡充值', d: '10-12 11:05 · 微信支付', v: '+ ¥5,000', kind: 'in' }
    ] }
  ];
  const COUPONS = [
    { amt: 200, nm: '新客体验券', ds: '满 ¥800 可用 · 12.31 到期' },
    { amt: 300, nm: '老带新礼遇', ds: '疗程套餐可用 · 12.31 到期' },
    { amt: 500, nm: '年末焕新券', ds: '满 ¥5,000 可用 · 11.30 到期' }
  ];
  const APPTS_INIT = [
    { id: 'a1', date: '11/06', wd: '明天', time: '10:30', name: '水光补水护理', staff: '林悦', store: '静安旗舰店 · 3 号护理室', color: 'linear-gradient(135deg,#D9BE96,#B99A6C)', label: 'HYDRA', status: 'upcoming' },
    { id: 'a2', date: '11/12', wd: '周四', time: '14:00', name: '抗衰紧致疗程', staff: '林悦', store: '静安旗舰店 · 2 号护理室', color: 'linear-gradient(135deg,#C7AFA8,#9E7F79)', label: 'LIFT', status: 'upcoming' },
    { id: 'a3', date: '11/03', wd: '周二', time: '10:00', name: '抗衰紧致疗程', staff: '林悦', store: '静安旗舰店', color: 'linear-gradient(135deg,#C7AFA8,#9E7F79)', label: 'LIFT', status: 'done' },
    { id: 'a4', date: '10/28', wd: '周三', time: '14:00', name: '水光补水护理', staff: '林悦', store: '静安旗舰店', color: 'linear-gradient(135deg,#D9BE96,#B99A6C)', label: 'HYDRA', status: 'done' },
    { id: 'a5', date: '10/21', wd: '周三', time: '15:30', name: '深层清洁管理', staff: '苏晴', store: '徐汇店', color: 'linear-gradient(135deg,#C6C0D4,#9B93B4)', label: 'CLEAN', status: 'done' }
  ];

  const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dateAt = i => { const d = new Date(TODAY); d.setDate(d.getDate() + i); return d; };
  const md = d => `${d.getMonth() + 1}/${d.getDate()}`;

  /* ---------------- 状态 ---------------- */
  const state = {
    page: 'home', step: 1, walletTab: 'usable', apptTab: 'upcoming', qrSeed: 7,
    booking: { project: null, staff: null, day: 1, time: null, note: '' },
    appts: APPTS_INIT.slice()
  };
  const $view = document.getElementById('view');
  const $overlay = document.getElementById('overlay');
  const $tabbar = document.getElementById('tabbar');

  /* ---------------- 页面元信息 ---------------- */
  const PAGES = [
    { id: 'home', name: '品牌首页', icon: 'home', desc: '会员登录后看到的第一个页面，集中呈现品牌、会员资产与最常用入口。',
      acts: ['点击 4 个快捷入口跳转对应页面', '横向滑动查看推荐项目', '点击「近期预约」进入我的预约', '点击右上角铃铛查看消息'],
      link: '首页的储值余额 ¥6,820、剩余疗程 8 次，与管理端「会员管理 → 林晚」档案完全一致。' },
    { id: 'booking', name: '在线预约', icon: 'calendar', desc: '四步完成一次预约：选项目 → 选技师 → 选日期时段 → 确认提交。',
      acts: ['逐项选择项目与技师', '横向滑动选择未来 7 天日期', '选择可预约时段（灰色为已约满）', '填写护理备注并提交预约', '成功后到「我的预约」查看'],
      link: '提交成功后，新预约会出现在管理端「预约管理」的周视图日历中，并占用对应技师时段。' },
    { id: 'cards', name: '我的卡包', icon: 'card', desc: '查看储值卡、次卡与疗程卡余额、剩余次数和有效期。',
      acts: ['切换「可用 / 已用完」标签', '点击「出示核销码」弹出二维码', '在弹层里刷新二维码', '查看最近使用记录'],
      link: '卡项类型、剩余次数与管理端「卡项管理」的核销记录一一对应，前台扫码即可完成核销。' },
    { id: 'records', name: '消费与积分', icon: 'list', desc: '按月查看消费明细、卡项核销与积分余额。',
      acts: ['查看按月分组的消费流水', '点击积分兑换入口', '区分现金消费与次卡核销'],
      link: '消费明细对应管理端「开单收银」生成的订单与「卡项管理」的核销流水。' },
    { id: 'profile', name: '个人中心', icon: 'user', desc: '会员资料、等级成长进度、优惠券与常用功能入口。',
      acts: ['横向滑动查看 3 张优惠券', '点击菜单进入我的预约 / 消费记录', '查看等级成长进度', '点击设置与客服入口'],
      link: '会员等级（铂金）、累计消费 ¥48,600、到店 42 次与管理端会员档案口径一致。' },
    { id: 'appointments', name: '我的预约', icon: 'clock', desc: '管理即将到来的预约与历史到店记录。',
      acts: ['切换「即将到来 / 历史记录」', '点击「取消预约」并确认', '点击「再次预约」直接跳转预约流程'],
      link: '取消预约后，管理端「预约管理」中该时段状态会同步变为「已取消」并释放技师档期。' }
  ];
  const pageMeta = id => PAGES.find(p => p.id === id) || PAGES[0];
  const TABS = [
    { id: 'home', name: '首页', icon: 'home' },
    { id: 'booking', name: '预约', icon: 'calendar' },
    { id: 'cards', name: '卡包', icon: 'card' },
    { id: 'profile', name: '我的', icon: 'user' }
  ];
  const tabOf = page => page === 'records' || page === 'appointments' ? 'profile' : page;

  /* ---------------- 通用 UI ---------------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast-m'; t.textContent = msg;
    document.querySelector('.screen').appendChild(t);
    setTimeout(() => { t.style.transition = '.3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 1900);
  }
  function sheet(title, sub, body) {
    $overlay.innerHTML = `<div class="overlay-mask" data-act="mask"><div class="sheet">
      <div class="sheet-bar"></div><div class="sheet-title">${title}</div>${sub ? `<div class="sheet-sub">${sub}</div>` : ''}
      ${body}</div></div>`;
  }
  function dialog(title, text, okText, okAct, okData, danger) {
    $overlay.innerHTML = `<div class="center-mask" data-act="mask"><div class="dialog">
      <h4>${title}</h4><p>${text}</p><div class="dialog-btns">
      <button class="d-cancel" data-act="close">再想想</button>
      <button class="${danger ? 'd-ok' : 'd-cancel'}" style="${danger ? '' : 'background:var(--dark);color:#F5EDE2'}" data-act="${okAct}" ${okData || ''}>${okText}</button>
      </div></div></div>`;
  }
  const close = () => { $overlay.innerHTML = ''; };
  function header(title, sub, back, right) {
    return `<div class="m-header"><div style="display:flex;align-items:center;gap:10px">
      ${back ? `<button class="m-back" data-act="go" data-page="${back}">${ic('left', 15)}</button>` : ''}
      <div><div class="mh-title">${title}</div>${sub ? `<div class="mh-sub">${sub}</div>` : ''}</div></div>
      ${right || ''}</div>`;
  }

  /* 二维码生成（确定性伪随机，含三个定位角） */
  function qr(seed) {
    const rnd = i => { const x = Math.sin(i * 12.9898 + seed * 7.13) * 43758.5453; return x - Math.floor(x); };
    let cells = '';
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
      const inF = (cx, cy) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
      if (inF(0, 0) || inF(14, 0) || inF(0, 14)) {
        const cx = x >= 14 ? 14 : 0, cy = y >= 14 ? 14 : 0, lx = x - cx, ly = y - cy;
        if (lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4))
          cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
        continue;
      }
      if (rnd(y * 21 + x) > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return `<svg viewBox="0 0 21 21" width="168" height="168" fill="#2C3632" shape-rendering="crispEdges">${cells}</svg>`;
  }

  /* ---------------- 首页 ---------------- */
  function pageHome() {
    const next = state.appts.find(a => a.status === 'upcoming');
    return `<div class="m-page">
      <div class="home-top"><div class="loc">${ic('pin', 14, 'var(--gold-deep)')}
        <div>瑞妍熙 · 静安旗舰店 <span style="font-size:10px;color:var(--ink3)">⌄</span><small>距您 1.2km · 营业至 21:00</small></div></div>
        <button class="bell" data-act="notice">${ic('bell', 16)}<i></i></button></div>
      <div class="greeting"><div><h1>下午好，${MEMBER.name}</h1><p>愿你今天也被温柔以待 ✦</p></div>
        <span class="pill p-gold">${ic('star', 11)} ${MEMBER.level}</span></div>
      <div class="vip-card"><div class="vip-top"><span class="vip-brand">RUIYANXI　会员卡</span><span class="vip-level">${MEMBER.id}</span></div>
        <div class="vip-balance"><span>储值余额（元）</span><b>${money(MEMBER.balance)}</b></div>
        <div class="vip-foot"><div><div class="vf-l">剩余疗程</div><div class="vf-v">${MEMBER.times} 次</div></div>
          <div><div class="vf-l">可用积分</div><div class="vf-v">${MEMBER.points.toLocaleString()}</div></div>
          <div><div class="vf-l">累计到店</div><div class="vf-v">${MEMBER.visits} 次</div></div></div></div>
      <div class="quick">
        ${[['booking', 'calendar', '在线预约'], ['cards', 'card', '我的卡包'], ['records', 'list', '消费记录'], ['store', 'phone', '联系门店']].map(q =>
          `<button class="quick-item" data-act="${q[0] === 'store' ? 'store' : 'go'}" ${q[0] === 'store' ? '' : `data-page="${q[0]}"`}>
            <span class="quick-ic">${ic(q[1], 20)}</span>${q[2]}</button>`).join('')}
      </div>
      <div class="sec"><div class="sec-head"><h3>为你推荐</h3><span class="more" data-act="go" data-page="booking">全部项目 ›</span></div></div>
      <div class="proj-scroll">${PROJECTS.slice(0, 4).map(p => `<button class="proj-card" data-act="quickBook" data-id="${p.id}">
        <div class="proj-img" style="background:${p.bg}"><span>${p.label}</span></div>
        <div class="proj-body"><div class="proj-name">${p.name}</div><div class="proj-meta">${p.dur} 分钟 · ${p.desc.split(' · ')[0]}</div>
        <div class="proj-price">${money(p.price)}<small>起 / 次</small></div></div></button>`).join('')}</div>
      <button class="banner" data-act="promo" style="width:calc(100% - 40px);text-align:left;display:block">
        <div class="bt">年末焕新 · 储值赠礼</div><div class="bd">充 10,000 赠 1,500，另享全店项目 8.5 折与生日双倍积分</div>
        <span class="bbtn">查看活动 ›</span></button>
      ${next ? `<div class="sec" style="margin-top:20px"><div class="sec-head"><h3>近期预约</h3><span class="more" data-act="go" data-page="appointments">全部 ›</span></div></div>
      <button class="notice-card" style="width:calc(100% - 40px);text-align:left" data-act="go" data-page="appointments">
        <div class="notice-date"><b>${next.date.split('/')[1]}</b><span>${next.date.split('/')[0]} 月</span></div>
        <div class="notice-main"><div class="nt">${next.name} · ${next.time}</div>
          <div class="nd">${next.wd} · ${next.staff} 技师 · ${next.store.split(' · ')[0]}</div></div>${ic('right', 15, 'var(--ink3)')}</button>` : ''}
    </div>`;
  }

  /* ---------------- 在线预约 ---------------- */
  const STEPS = ['选项目', '选技师', '选时间', '确认', '完成'];
  function stepBar() {
    return `<div class="step-bar">${STEPS.map((s, i) => {
      const n = i + 1, cls = n === state.step ? 'on' : n < state.step ? 'done' : '';
      return `<div class="step ${cls}"><i>${n < state.step ? '✓' : n}</i><span>${s}</span></div>`;
    }).join('')}</div>`;
  }
  function pageBooking() {
    if (state.step === 5) return pageBookingSuccess();
    const b = state.booking;
    const titles = ['选择护理项目', '选择服务技师', '选择到店时间', '确认预约信息'];
    let body = '';
    if (state.step === 1) {
      body = `<div class="opt-list">${PROJECTS.map(p => `<button class="opt ${b.project === p.id ? 'on' : ''}" data-act="bProject" data-id="${p.id}">
        <span class="opt-ic" style="background:${p.bg};font-size:9px;letter-spacing:1px">${p.label.slice(0, 2)}</span>
        <span class="opt-main"><span class="opt-name">${p.name}</span><span class="opt-sub" style="display:block">${p.dur} 分钟 · ${p.desc}</span></span>
        <span class="opt-right"><span class="opt-price">${money(p.price)}</span><span class="opt-check">✓</span></span></button>`).join('')}</div>`;
    } else if (state.step === 2) {
      body = `<div class="opt-list">${STAFF.map(s => `<button class="opt ${b.staff === s.name ? 'on' : ''}" data-act="bStaff" data-name="${s.name}">
        <span class="opt-ic" style="background:${s.color};font-size:15px">${s.name[0]}</span>
        <span class="opt-main"><span class="opt-name">${s.name} <span style="font-size:9.5px;color:var(--gold-deep);font-weight:400">${'★'.repeat(s.star)}</span></span>
        <span class="opt-sub" style="display:block">${s.title} · ${s.skill}</span></span>
        <span class="opt-right"><span class="pill p-green">${s.tag}</span><span class="opt-check">✓</span></span></button>`).join('')}</div>
      <div style="padding:14px 20px 0;font-size:10px;color:var(--ink3);line-height:1.7">${ic('sparkle', 12)} 系统将根据您选择的项目自动推荐擅长该项目的技师</div>`;
    } else if (state.step === 3) {
      const days = Array.from({ length: 7 }, (_, i) => i + 1);
      const times = ['10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
      body = `<div class="sec" style="margin-top:4px"><div class="sec-head"><h3 style="font-size:12px">选择日期</h3><span class="more">未来 7 天可约</span></div></div>
        <div class="date-scroll">${days.map(i => { const d = dateAt(i);
          return `<button class="date-chip ${b.day === i ? 'on' : ''}" data-act="bDay" data-day="${i}">
            <div class="dw">${i === 1 ? '明天' : WD[d.getDay()]}</div><div class="dd">${d.getDate()}</div></button>`; }).join('')}</div>
        <div class="sec"><div class="sec-head"><h3 style="font-size:12px">选择时段</h3><span class="more">灰色为已约满</span></div></div>
        <div class="time-grid">${times.map((t, i) => { const dis = (i + b.day * 3) % 5 === 0;
          return `<button class="time-chip ${b.time === t ? 'on' : ''} ${dis ? 'disabled' : ''}" ${dis ? 'disabled' : ''} data-act="bTime" data-time="${t}">${t}</button>`; }).join('')}</div>
        <div class="m-field"><label>护理备注（选填）</label><input class="m-input" data-input="note" placeholder="如：皮肤敏感、指定护理室…" value="${esc(b.note)}"></div>`;
    } else {
      const p = PROJECTS.find(x => x.id === b.project), s = STAFF.find(x => x.name === b.staff), d = dateAt(b.day);
      body = `<div class="summary">
        <div class="sm-row"><span>服务项目</span><b>${p ? p.name : '—'}</b></div>
        <div class="sm-row"><span>服务技师</span><b>${s ? s.name : '—'}</b></div>
        <div class="sm-row"><span>到店时间</span><b>${md(d)} ${WD[d.getDay()]} ${b.time || '—'}</b></div>
        <div class="sm-row"><span>门店 / 护理室</span><b>静安旗舰店 · 3 号</b></div>
        <div class="sm-row"><span>预计时长</span><b>${p ? p.dur : 0} 分钟</b></div>
        <div class="sm-row"><span>可用权益</span><b style="color:var(--gold-deep)">疗程卡剩余 ${MEMBER.times} 次</b></div>
        <div class="sm-row hi"><span>预计费用</span><b>${b.project === 'p3' ? '次卡核销' : money(p ? p.price * 0.8 : 0) + '（铂金 8 折）'}</b></div></div>
        <div style="margin:14px 20px 0;padding:12px 14px;background:var(--gold-soft);border-radius:11px;font-size:10.5px;color:var(--gold-deep);line-height:1.8">
          ${ic('clock', 12)} 请提前 10 分钟到店；如需改期请于到店前 2 小时操作。</div>
        <div class="m-field"><label>预约手机号</label><input class="m-input" value="138 **** 6208" readonly></div>`;
    }
    const canNext = state.step === 1 ? !!b.project : state.step === 2 ? !!b.staff : state.step === 3 ? !!b.time : true;
    return `<div class="m-page">${header(titles[state.step - 1], `第 ${state.step} / 4 步 · 约需 1 分钟`, state.step === 1 ? 'home' : null)}
      ${state.step <= 4 ? stepBar() : ''}${body}
      <div class="bottom-bar"><button class="btn-m" data-act="bookingNext" ${canNext ? '' : 'disabled'}>
        ${state.step === 4 ? '确认预约' : '下一步'}</button></div></div>`;
  }
  function pageBookingSuccess() {
    const b = state.booking, p = PROJECTS.find(x => x.id === b.project), d = dateAt(b.day);
    return `<div class="m-page"><div class="success-wrap">
      <div class="success-ic">${ic('check', 36)}</div><h2>预约成功</h2>
      <p>已为你锁定 ${b.staff} 技师的档期<br>服务通知已发送至微信，请准时到店</p></div>
      <div class="summary" style="margin-top:32px">
        <div class="sm-row"><span>项目</span><b>${p ? p.name : ''}</b></div>
        <div class="sm-row"><span>技师</span><b>${b.staff}</b></div>
        <div class="sm-row"><span>时间</span><b>${md(d)} ${b.time}</b></div>
        <div class="sm-row"><span>门店</span><b>瑞妍熙 · 静安旗舰店</b></div>
        ${b.note ? `<div class="sm-row"><span>备注</span><b>${esc(b.note)}</b></div>` : ''}
      </div>
      <div style="padding:24px 20px 0;display:flex;gap:10px">
        <button class="btn-m ghost" style="flex:1" data-act="go" data-page="home">返回首页</button>
        <button class="btn-m dark" style="flex:1" data-act="go" data-page="appointments">查看预约</button></div>
    </div>`;
  }

  /* ---------------- 我的卡包 ---------------- */
  function pageCards() {
    const list = WALLETS.filter(w => state.walletTab === 'usable' ? !w.used : w.used);
    return `<div class="m-page">${header('我的卡包', '储值 · 次卡 · 疗程统一管理', null,
      `<button class="icon-round" data-act="cardHelp">${ic('sparkle', 15)}</button>`)}
      <div class="m-tabs"><button class="m-tab ${state.walletTab === 'usable' ? 'on' : ''}" data-act="walletTab" data-tab="usable">可用卡项 ${WALLETS.filter(w => !w.used).length}</button>
        <button class="m-tab ${state.walletTab === 'history' ? 'on' : ''}" data-act="walletTab" data-tab="history">已用完 ${WALLETS.filter(w => w.used).length}</button></div>
      <div style="padding:16px 20px 0;display:flex;flex-direction:column;gap:13px">
        ${list.length ? list.map(w => `<div class="wallet" style="background:${w.bg}">
          <div class="wallet-top"><span class="wallet-name">${w.name}</span><span class="wallet-type">${w.type}</span></div>
          <div class="wallet-val">${w.val}<small> ${w.type === '储值卡' ? '元' : w.type === '疗程卡' ? '次' : '次'}</small></div>
          <div class="wallet-sub">${w.unit}</div>
          <div class="progress"><i style="width:${w.pct}%"></i></div>
          <div class="wallet-foot"><span>${w.sub}<br>有效期至 ${w.exp}</span>
            ${w.used ? `<span class="pill p-gray">已用完</span>` : `<button class="wallet-btn" data-act="qr" data-key="${w.key}">${ic('qr', 12)} 出示核销码</button>`}</div>
        </div>`).join('') : `<div style="text-align:center;padding:50px 0;color:var(--ink3);font-size:11px">暂无卡项</div>`}
      </div>
      <div class="sec"><div class="sec-head"><h3>最近使用记录</h3><span class="more" data-act="go" data-page="records">全部 ›</span></div></div>
      <div class="sec" style="margin-top:0"><div class="m-card" style="padding:2px 14px">
        ${[['抗衰紧致 12 次疗程', '11-03 · 第 4 次核销 · 林悦技师'], ['臻享储值卡', '11-03 · 消费 ¥380 · 静安店'],
           ['水光补水 10 次卡', '10-28 · 第 7 次核销 · 林悦技师']].map(r => `<div class="record-item">
          <span class="record-ic">${ic('card', 16)}</span><span class="record-main"><div class="record-t">${r[0]}</div><div class="record-d">${r[1]}</div></span>
          ${ic('right', 14, 'var(--ink3)')}</div>`).join('')}</div></div>
      <div class="sec"><button class="btn-m ghost" data-act="go" data-page="booking">使用卡项预约一次护理</button></div>
    </div>`;
  }

  /* ---------------- 消费与积分 ---------------- */
  function pageRecords() {
    return `<div class="m-page">${header('消费与积分', '每一笔都清晰可查', 'profile')}
      <div class="sec" style="margin-top:4px"><div class="m-card" style="padding:18px;background:linear-gradient(120deg,#FBF3E8,#F7EADB);border-color:#F0E2D0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:10.5px;color:var(--gold-deep)">我的可用积分</div>
            <div style="font-size:28px;font-weight:600;margin-top:7px" class="mono">${MEMBER.points.toLocaleString()}</div>
            <div style="font-size:9.5px;color:var(--ink3);margin-top:6px">每消费 1 元累积 1 积分 · 铂金 1.2 倍</div></div>
          <button class="wallet-btn" style="background:#C8A87C;color:#fff" data-act="exchange">去兑换 ›</button></div></div></div>
      ${RECORDS.map(g => `<div class="sec"><div class="sec-head"><h3>${g.m}</h3><span class="more">${g.items.length} 笔</span></div>
        <div class="m-card" style="padding:2px 14px">${g.items.map(r => `<div class="record-item">
          <span class="record-ic">${ic(r.kind === 'card' ? 'card' : r.kind === 'in' ? 'plus' : 'list', 15)}</span>
          <span class="record-main"><div class="record-t">${r.t}</div><div class="record-d">${r.d}</div></span>
          <span class="record-v" style="color:${r.kind === 'in' ? 'var(--green)' : 'var(--ink)'}">${r.v}</span></div>`).join('')}</div></div>`).join('')}
      <div style="text-align:center;font-size:10px;color:var(--ink3);padding:8px 0 4px">— 仅展示近 2 个月示例记录 —</div>
    </div>`;
  }

  /* ---------------- 个人中心 ---------------- */
  function pageProfile() {
    const menus = [
      ['appointments', 'calendar', '我的预约', '2 个即将到来'],
      ['records', 'list', '消费记录', ''],
      ['coupons', 'gift', '我的优惠券', '3 张可用'],
      ['fav', 'heart', '我的收藏', ''],
      ['store', 'shop', '门店信息', '静安旗舰店'],
      ['service', 'phone', '联系客服', ''],
      ['settings', 'settings', '设置', '']
    ];
    return `<div class="m-page">${header('我的', null, null, `<button class="icon-round" data-act="notice">${ic('bell', 15)}</button>`)}
      <div class="profile-head"><div class="profile-av">林</div>
        <div><div class="profile-name">${MEMBER.name} <span class="pill p-gold" style="margin-left:4px">${ic('star', 10)} 铂金</span></div>
          <div class="profile-id">会员号 ${MEMBER.id} · 入会 2024.03</div></div>
        <button style="margin-left:auto" data-act="editProfile">${ic('right', 16, 'var(--ink3)')}</button></div>
      <div class="level-box"><div class="level-top"><span>当前等级 <b>铂金会员</b></span><span style="font-size:10px;color:var(--ink3)">距钻石会员</span></div>
        <div class="progress" style="background:#F1ECE3;margin-top:12px"><i style="width:72%;background:linear-gradient(90deg,#C8A87C,#E0C7A3)"></i></div>
        <div class="level-tip">累计消费 ${money(MEMBER.total)} / ¥60,000　·　再消费 ${money(60000 - MEMBER.total)} 即可升级</div></div>
      <div class="stat-row"><div><b>${MEMBER.visits}</b><span>累计到店</span></div>
        <div><b>${(MEMBER.total / 10000).toFixed(2)}万</b><span>累计消费</span></div>
        <div><b>${MEMBER.points.toLocaleString()}</b><span>可用积分</span></div></div>
      <div class="sec"><div class="sec-head"><h3>我的优惠券</h3><span class="more" data-act="coupons">全部 3 张 ›</span></div></div>
      <div class="coupon-scroll">${COUPONS.map(c => `<button class="cpn" style="text-align:left" data-act="couponUse" data-name="${c.nm}">
        <div class="amt"><small>¥</small>${c.amt}</div><div class="nm">${c.nm}</div><div class="ds">${c.ds}</div>
        <div style="font-size:9px;color:var(--gold-deep);margin-top:9px">立即使用 ›</div></button>`).join('')}</div>
      <div class="menu-list">${menus.map(m => `<button class="menu-row" style="width:100%;text-align:left" data-act="${['appointments', 'records', 'store'].includes(m[0]) ? (m[0] === 'store' ? 'store' : 'go') : m[0]}" ${['appointments', 'records'].includes(m[0]) ? `data-page="${m[0]}"` : ''}>
        <span class="menu-ic">${ic(m[1], 15)}</span><span class="menu-t">${m[2]}</span>
        <span style="font-size:10px;color:var(--ink3)">${m[3]}</span><span class="menu-arrow">›</span></button>`).join('')}</div>
      <div class="sec"><div style="text-align:center;font-size:9.5px;color:var(--ink3);line-height:1.9;padding-top:6px">
        瑞妍熙 RUIYANXI　·　会员服务协议与隐私政策<br>版本 v1.0.0</div></div>
    </div>`;
  }

  /* ---------------- 我的预约 ---------------- */
  function pageAppointments() {
    const up = state.appts.filter(a => a.status === 'upcoming');
    const his = state.appts.filter(a => a.status !== 'upcoming');
    const list = state.apptTab === 'upcoming' ? up : his;
    return `<div class="m-page">${header('我的预约', '到店前 2 小时可免费改期', 'profile')}
      <div class="m-tabs"><button class="m-tab ${state.apptTab === 'upcoming' ? 'on' : ''}" data-act="apptTab" data-tab="upcoming">即将到来 ${up.length}</button>
        <button class="m-tab ${state.apptTab === 'history' ? 'on' : ''}" data-act="apptTab" data-tab="history">历史记录 ${his.length}</button></div>
      <div style="padding-top:16px">
        ${list.length ? list.map(a => `<div class="appt-card">
          <div class="appt-top"><span class="appt-date">${a.date} <span>${a.wd} ${a.time}</span></span>
            ${a.status === 'upcoming' ? '<span class="pill p-gold">待到店</span>' : a.status === 'canceled' ? '<span class="pill p-gray">已取消</span>' : '<span class="pill p-green">已完成</span>'}</div>
          <div class="appt-body"><div class="appt-thumb" style="background:${a.color}">${a.label.slice(0, 2)}</div>
            <div class="appt-info"><div class="appt-name">${a.name}</div>
              <div class="appt-meta">${a.staff} 技师<br>${a.store}</div></div></div>
          ${a.status === 'upcoming' ? `<div class="appt-actions">
            <button class="mini-btn danger" data-act="cancelAppt" data-id="${a.id}">取消预约</button>
            <button class="mini-btn" data-act="reschedule" data-id="${a.id}">改期</button>
            <button class="mini-btn primary" data-act="apptDetail" data-id="${a.id}">查看详情</button></div>`
            : `<div class="appt-actions"><button class="mini-btn" data-act="go" data-page="booking">再次预约</button>
               ${a.status === 'done' ? '<button class="mini-btn primary" data-act="review">评价服务</button>' : ''}</div>`}
        </div>`).join('') : `<div style="text-align:center;padding:60px 20px;color:var(--ink3);font-size:11px;line-height:2">
          ${ic('calendar', 30)}<div style="margin-top:12px">暂无预约记录</div>
          <button class="mini-btn primary" style="margin-top:14px" data-act="go" data-page="booking">立即预约</button></div>`}
      </div>
      <div class="sec"><button class="btn-m" data-act="go" data-page="booking">+ 预约新的护理</button></div>
    </div>`;
  }

  /* ---------------- 渲染 ---------------- */
  const VIEWS = { home: pageHome, booking: pageBooking, cards: pageCards, records: pageRecords, profile: pageProfile, appointments: pageAppointments };
  function render() {
    $view.innerHTML = (VIEWS[state.page] || pageHome)();
    $view.scrollTop = 0;
    const active = tabOf(state.page);
    $tabbar.innerHTML = TABS.map(t => `<button class="tab ${active === t.id ? 'on' : ''}" data-act="tab" data-tab="${t.id}">${ic(t.icon, 21)}<span>${t.name}</span></button>`).join('');
    document.getElementById('pageNav').innerHTML = PAGES.map(p => `<button class="nav-item ${state.page === p.id ? 'on' : ''}" data-act="go" data-page="${p.id}">
      <span class="ni">${ic(p.icon, 12)}</span>${p.name}</button>`).join('');
    const m = pageMeta(state.page);
    document.getElementById('infoName').textContent = m.name;
    document.getElementById('infoDesc').textContent = m.desc;
    document.getElementById('infoList').innerHTML = m.acts.map(a => `<li>${a}</li>`).join('');
    document.getElementById('infoLink').textContent = m.link;
  }
  function clockTick() {
    const d = new Date();
    document.getElementById('clock').textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  clockTick(); setInterval(clockTick, 30000);

  /* ---------------- 事件委托 ---------------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const a = el.dataset.act;

    if (a === 'mask') { if (e.target === el) close(); return; }
    if (a === 'close') { close(); return; }
    if (a === 'go') { close(); state.page = el.dataset.page; if (state.page === 'booking' && state.step === 5) resetBooking(); render(); return; }
    if (a === 'tab') { close(); state.page = el.dataset.tab; if (state.page === 'booking' && state.step === 5) resetBooking(); render(); return; }
    if (a === 'notice') { sheet('消息通知', '共 3 条未读',
      [['预约提醒', '您预约的 11/06 10:30 水光补水护理，请提前 10 分钟到店。', '刚刚'],
       ['卡项到期提醒', '水光补水 10 次卡将在 45 天后到期，剩余 3 次。', '昨天'],
       ['专属礼遇', '铂金会员生日月双倍积分已生效，本月消费享 2 倍积分。', '3 天前']].map(n =>
      `<div class="record-item"><span class="record-ic">${ic('bell', 15)}</span><span class="record-main">
        <div class="record-t">${n[0]}</div><div class="record-d">${n[1]}</div>
        <div style="font-size:9px;color:var(--ink3);margin-top:5px">${n[2]}</div></span></div>`).join('') +
      `<button class="btn-m ghost" style="margin-top:16px" data-act="close">知道了</button>`); return; }
    if (a === 'store') { dialog('联系门店', '瑞妍熙 · 静安旗舰店<br>上海市静安区南京西路 1266 号 3F<br>营业时间 10:00 - 21:00<br><br>预约热线 021-6288 0086', '拨打门店电话', 'toast', 'data-msg="正在呼叫 021-6288 0086"'); return; }
    if (a === 'promo') { sheet('年末焕新 · 储值赠礼', '活动期 11.01 - 12.31',
      `<div style="font-size:11.5px;color:var(--ink2);line-height:2;padding:6px 0 4px">
        · 充值 ¥10,000 赠 ¥1,500，全店项目享 8.5 折<br>· 充值 ¥20,000 赠 ¥3,600，另赠 4 次皮肤检测<br>· 铂金会员生日月消费享双倍积分<br>· 老带新成交，双方各得 ¥300 礼遇券</div>
      <button class="btn-m" style="margin-top:14px" data-act="toast" data-msg="已为您预约顾问回电介绍活动">预约顾问了解</button>
      <button class="btn-m ghost" style="margin-top:9px" data-act="close">稍后再说</button>`); return; }
    if (a === 'toast') { close(); toast(el.dataset.msg || '操作成功'); return; }
    if (a === 'editProfile' || a === 'cardHelp' || a === 'settings' || a === 'service' || a === 'fav' || a === 'review' || a === 'exchange') {
      const map = { editProfile: '编辑资料（原型演示）', cardHelp: '卡项说明：到店后向前台出示核销码即可使用', settings: '设置（原型演示）', service: '客服将在 1 分钟内接入', fav: '我的收藏（原型演示）', review: '感谢您的评价入口（原型演示）', exchange: '积分兑换商城（原型演示）' };
      toast(map[a]); return; }
    if (a === 'coupons') { $view.scrollTop = 0; toast('已为您展示全部 3 张可用优惠券'); return; }
    if (a === 'couponUse') { toast(`「${el.dataset.name}」已选中，预约时自动抵扣`); return; }

    /* 预约流程 */
    if (a === 'quickBook') { state.booking.project = el.dataset.id; state.booking.staff = null; state.booking.time = null; state.step = 1; state.page = 'booking'; render(); return; }
    if (a === 'bProject') { state.booking.project = el.dataset.id; render(); return; }
    if (a === 'bStaff') { state.booking.staff = el.dataset.name; render(); return; }
    if (a === 'bDay') { state.booking.day = +el.dataset.day; state.booking.time = null; render(); return; }
    if (a === 'bTime') { state.booking.time = el.dataset.time; render(); return; }
    if (a === 'bookingNext') {
      const b = state.booking;
      if (state.step === 1 && !b.project) { toast('请先选择护理项目'); return; }
      if (state.step === 2 && !b.staff) { toast('请先选择服务技师'); return; }
      if (state.step === 3 && !b.time) { toast('请选择到店时段'); return; }
      if (state.step < 4) { state.step++; render(); return; }
      const p = PROJECTS.find(x => x.id === b.project), d = dateAt(b.day);
      state.appts.unshift({ id: 'n' + Date.now(), date: md(d), wd: b.day === 1 ? '明天' : WD[d.getDay()], time: b.time,
        name: p.name, staff: b.staff, store: '静安旗舰店 · 3 号护理室', color: p.bg, label: p.label, status: 'upcoming' });
      state.step = 5; render(); return;
    }

    /* 卡包 */
    if (a === 'walletTab') { state.walletTab = el.dataset.tab; render(); return; }
    if (a === 'qr') {
      const w = WALLETS.find(x => x.key === el.dataset.key); if (!w) return;
      sheet('会员核销码', w.name, `<div class="qr-box">${qr(state.qrSeed)}</div>
        <div class="qr-tip">请向前台出示此二维码完成核销<br>卡号 ${MEMBER.id}　·　${w.unit}<br>二维码 60 秒自动刷新，请勿截图转发</div>
        <button class="btn-m" style="margin-top:18px" data-act="refreshQr">刷新二维码</button>
        <button class="btn-m ghost" style="margin-top:9px" data-act="close">关闭</button>`); return; }
    if (a === 'refreshQr') {
      state.qrSeed += 3;
      const box = document.querySelector('.qr-box');
      if (box) box.innerHTML = qr(state.qrSeed);
      toast('二维码已刷新'); return;
    }
    if (a === 'apptDetail') {
      const x = state.appts.find(v => v.id === el.dataset.id);
      if (!x) return;
      sheet('预约详情', `${x.date} ${x.wd} ${x.time}`,
        `<div class="summary" style="margin:16px 0 0">
          <div class="sm-row"><span>服务项目</span><b>${x.name}</b></div>
          <div class="sm-row"><span>服务技师</span><b>${x.staff}</b></div>
          <div class="sm-row"><span>到店时间</span><b>${x.date} ${x.time}</b></div>
          <div class="sm-row"><span>门店 / 护理室</span><b>${x.store}</b></div>
          <div class="sm-row"><span>预约状态</span><b>待到店</b></div>
        </div><button class="btn-m ghost" style="margin-top:16px" data-act="close">关闭</button>`); return;
    }

    /* 我的预约 */
    if (a === 'apptTab') { state.apptTab = el.dataset.tab; render(); return; }
    if (a === 'cancelAppt') { dialog('取消这次预约？', '取消后该时段将释放给其他会员，已占用的卡项次数会自动退回。', '确认取消', 'confirmCancel', `data-id="${el.dataset.id}"`, true); return; }
    if (a === 'confirmCancel') {
      const x = state.appts.find(a2 => a2.id === el.dataset.id); if (x) x.status = 'canceled';
      close(); render(); toast('预约已取消，卡项次数已退回'); return; }
    if (a === 'reschedule') { close(); resetBooking(); state.page = 'booking'; render(); toast('请重新选择到店时间'); return; }
  });

  document.addEventListener('input', e => {
    if (e.target.dataset.input === 'note') state.booking.note = e.target.value;
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  function resetBooking() { state.step = 1; state.booking = { project: null, staff: null, day: 1, time: null, note: '' }; }

  render();
})();
