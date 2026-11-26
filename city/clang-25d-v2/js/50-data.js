/* ========================================================================
 * CLANG! 2.5D — 50 数据：武器 / 机器 / 卡牌 / Boss / 关卡 / 难度 / 事件 / 图鉴
 * 数值与文案取自原作（速度类按 2.5D 场地比例 ×1.3）
 * ====================================================================== */
(function(){
'use strict';
const CL=window.CL;

/* ---------- 武器 ---------- */
const W={
  pistol:{id:'pistol',name:'手枪',en:'PISTOL',auto:false,dmg:35,mag:17,res:Infinity,reload:1.35,rate:5.2,hs:2.5,spread:.012,pellets:1,
    icon:'gun-pistol',tip:'半自动点射 · 备弹无限 · 爆头 ×2.5'},
  rifle:{id:'rifle',name:'冲锋枪',en:'SMG',auto:true,dmg:14,mag:30,res:120,cap:280,reload:1.8,rate:9.5,ramp:3,maxRate:14.5,hs:2,spread:.03,
    icon:'gun-rifle',tip:'全自动 · 持续射击射速爬升'},
  shotgun:{id:'shotgun',name:'霰弹枪',en:'SHOTGUN',auto:false,dmg:9,pellets:14,mag:8,res:18,cap:40,reload:5.25,rate:1.25,hs:1.5,spread:.11,
    icon:'gun-shotgun',tip:'14 颗弹丸 · 近距离一轰 · 泵动'},
  sniper:{id:'sniper',name:'G43',en:'G43',auto:false,dmg:150,mag:7,res:6,cap:30,reload:2.8,rate:1,hs:2.5,spread:.002,pierce:1,ap:1,
    icon:'gun-sniper',tip:'穿甲 · 贯穿 · 一发入魂'},
  dual:{id:'dual',name:'双持手枪',en:'DUAL',auto:false,dmg:35,mag:34,res:84,cap:170,reload:1.35,rate:5.2,hs:2.5,spread:.014,pellets:1,
    icon:'gun-dual',tip:'左右开弓，一点一枪'}
};
const AMMO_PICK={rifle:45,pistol:40,shotgun:7,sniper:6,dual:45};
const ORDER=['pistol','rifle','shotgun','sniper','dual'];

/* ---------- 机器 ---------- */
const K=1.3;
const E={
  ripper:{name:'撕裂者',en:'RIPPER',hp:32,speed:4.8*K,damage:12,interval:.9,windup:.42,range:1.4,cost:1,radius:.42,height:1.1,lunge:1.2,lungeTime:.15,hitReach:1.7,
    tip:'冲上来甩锯刃。小快灵，一枪一个',how:'手枪一两发。冲过来时跳开或滑铲'},
  warden:{name:'枪手',en:'GUNNER',hp:60,speed:3.3*K,damage:6,interval:1.6,windup:.5,range:25,cost:2,radius:.38,height:1.9,shots:3,shotGap:.15,bulletSpeed:7.5*K,preferred:12,minRange:7,
    tip:'保持距离打三连发',how:'横向走位躲点射，或者贴近了打'},
  hauler:{name:'重装机',en:'TANK',hp:300,speed:2*K,damage:28,interval:2,windup:.92,range:2.5,cost:5,radius:.68,height:1.7,armour:.4,weak:.6,
    tip:'正面推土铲减伤，靠近就砸地',how:'绕到背后，或从上面打；熔蚀 / 手雷能掀装甲'},
  spotter:{name:'远射机',en:'SPOTTER',hp:50,speed:3*K,damage:28,interval:4,windup:1.2,range:90,cost:3,radius:.5,height:2.5,bulletSpeed:38*K,
    tip:'远处架枪，激光锁定 1.2 秒后一记重弹',how:'看见激光线就挪窝；它很脆'},
  popper:{name:'爆破机',en:'POPPER',hp:22,speed:5.8*K,damage:40,interval:0,windup:.8,range:3,cost:1.5,radius:.45,height:1.15,blast:4,machineDamage:90,
    tip:'贴身引信 0.8 秒后自爆，会炸到别的机器',how:'远远点掉，或引到机器堆里再打爆'},
  bulwark:{name:'重装枪手',en:'SHIELD GUNNER',hp:95,speed:2.6*K,damage:6,interval:2.2,windup:.5,range:22,cost:3.5,radius:.5,height:1.95,shield:110,shots:3,
    tip:'正面举盾挡子弹',how:'打头、绕背；霰弹近轰和手雷能快速破盾'},
  drone:{name:'无人机',en:'DRONE',hp:38,speed:4.4*K,damage:7,interval:2.4,windup:.55,range:34,cost:2.5,radius:.65,height:1.2,shots:2,shotGap:.16,bulletSpeed:11*K,hover:[5.2,7.6],preferred:7,strafeMin:1.2,strafeMax:2.6,
    tip:'空中悬停点射',how:'抬头打；近战够不着它'},
  husk:{name:'沙骸',en:'SAND HUSK',hp:40,speed:3.2*K,damage:7,interval:2.8,windup:.6,range:19,cost:1.5,radius:.36,height:1.78,plate:45,splash:2.1,preferred:11,minRange:5,strafeMin:1.2,strafeMax:2.6,
    tip:'扔沙罐，胸口钢板挡子弹',how:'打头、打腿 · 喷子近轰或手雷能掀掉钢板 · G43 直接打穿'},
  worm:{name:'沙虫',en:'SANDWORM',hp:85,speed:3.9*K,damage:14,interval:1,windup:.8,range:1.5,cost:2.5,radius:.45,height:.9,
    tip:'只在沙尘暴里出没：在你脚下画沙圈，弧线扑出咬人',how:'走出沙圈；它肚皮朝天时猛打'}
};
const EL={
  eliteRipper:{name:'精英撕裂者',base:'ripper',hp:150,speed:5.1*K,damage:15,range:1.7,cost:4,guard:.15,radius:.58,height:1.5,scale:1.35},
  eliteWarden:{name:'精英枪手',base:'warden',hp:280,speed:3.4*K,damage:8,range:27,cost:7,guard:.2,radius:.52,height:2.6,shots:5,scale:1.35},
  elitePopper:{name:'重型爆破机',base:'popper',hp:90,speed:5.6*K,damage:55,range:3.6,cost:5,guard:.1,radius:.6,height:1.5,blast:5.4,scale:1.35},
  eliteBulwark:{name:'精英盾卫',base:'bulwark',hp:400,speed:2.6*K,damage:7,range:22,cost:11,guard:.2,radius:.66,height:2.65,shield:300,shots:4,scale:1.35}
};
for(const k in EL){const e=EL[k],b=E[e.base];for(const f in b)if(e[f]===undefined)e[f]=b[f];e.id=k}
for(const k in E)E[k].id=k;

/* ---------- 卡牌（原作 39 张） ---------- */
const R={common:'普通',rare:'稀有',legend:'传说'};
const CARDS=[
  {id:'gun-rifle',kind:'weapon',rarity:'common',name:'冲锋枪',flavour:'持续火力，清场利器',target:'rifle',minLevel:2,maxStacks:1},
  {id:'gun-shotgun',kind:'weapon',rarity:'common',name:'霰弹枪',flavour:'贴近，轰开一条路',target:'shotgun',minLevel:2,maxStacks:1},
  {id:'gun-sniper',kind:'weapon',rarity:'common',name:'G43',flavour:'穿甲贯穿，七发快打',target:'sniper',minLevel:4,maxStacks:1},
  {id:'gun-dual',kind:'weapon',rarity:'rare',name:'双持手枪',flavour:'左右开弓，一点一枪',target:'pistol',minLevel:4,maxStacks:1},
  {id:'smg-heavy',kind:'mod',rarity:'common',name:'重型弹头',flavour:'每一发都更有分量',target:'rifle',mods:{dmg:.15,pierce:.12},minLevel:2,maxStacks:2},
  {id:'smg-drum',kind:'mod',rarity:'common',name:'轻量弹鼓',flavour:'多打几发，更快归位',target:'rifle',mods:{mag:.25,reload:-.15},minLevel:2,maxStacks:2},
  {id:'pistol-hammer',kind:'mod',rarity:'common',name:'强化击锤',flavour:'单发扎实，爆头更狠',target:'pistol',mods:{dmg:.15,crit:.2,pierce:.1},minLevel:2,maxStacks:2},
  {id:'pistol-quick',kind:'mod',rarity:'common',name:'快装套件',flavour:'节奏不断，装填更快',target:'pistol',mods:{reload:-.15,mag:.2},minLevel:2,maxStacks:2},
  {id:'sg-buck',kind:'mod',rarity:'common',name:'重型鹿弹',flavour:'一声重击，颗颗有力',target:'shotgun',mods:{dmg:.15,pierce:.12},minLevel:2,maxStacks:2},
  {id:'sg-loader',kind:'mod',rarity:'common',name:'快速装填器',flavour:'多一发，少一分等待',target:'shotgun',mods:{reload:-.15},minLevel:2,maxStacks:2,magAdd:2},
  {id:'g43-barrel',kind:'mod',rarity:'common',name:'高能弹芯',flavour:'重甲也挡不住锋芒',target:'sniper',mods:{dmg:.15},minLevel:4,maxStacks:2},
  {id:'g43-feed',kind:'mod',rarity:'common',name:'快速供弹',flavour:'锁定之后，接上下一枪',target:'sniper',mods:{rate:.15,reload:-.1},minLevel:4,maxStacks:2},
  {id:'smg-melt',kind:'mod',rarity:'rare',name:'熔蚀弹头',flavour:'盯住一处，烧穿它的甲',target:'rifle',minLevel:6,maxStacks:1,effect:'smg-melt',
    head:'连续命中 0.7 秒剥掉护甲',detail:['同一目标被连续命中约 0.7 秒后进入熔蚀 3 秒','重装机正面装甲失效；护盾承伤 +50%']},
  {id:'smg-relay',kind:'mod',rarity:'rare',name:'弹链接力',flavour:'击杀之后，火力接续',target:'rifle',minLevel:6,maxStacks:1,effect:'smg-relay',
    head:'击杀后补 2 发子弹',detail:['直接击杀：从备弹装入 2 发','每 0.8 秒至多一次，不超过弹匣上限']},
  {id:'pistol-ricochet',kind:'mod',rarity:'rare',name:'余势跳弹',flavour:'倒下一个，弹向下一个',target:'pistol',minLevel:6,maxStacks:1,effect:'pistol-ricochet',
    head:'击杀后子弹弹向下一个',detail:['直接击杀：弹向 6 米内另一可见敌人，留下墨线','造成致死子弹伤害的 50%，间隔 0.4 秒']},
  {id:'pistol-bounty',kind:'mod',rarity:'rare',name:'赏金装填',flavour:'每次精准收尾，都有回报',target:'pistol',minLevel:6,maxStacks:1,effect:'pistol-bounty',
    head:'击杀回子弹，爆头更多',detail:['直接击杀装入 2 发，爆头击杀装入 4 发','双持消耗备弹；间隔 0.8 秒']},
  {id:'sg-shards',kind:'mod',rarity:'rare',name:'破片喷射',flavour:'残骸也成为你的武器',target:'shotgun',minLevel:6,maxStacks:1,effect:'sg-shards',
    head:'近距击杀喷出破片',detail:['6 米内直接击杀，向目标身后喷出破片','至多 3 敌各受整枪理论伤害的 20%，每枪一次']},
  {id:'sg-ignite',kind:'mod',rarity:'rare',name:'燃烧鹿弹',flavour:'一点火星，烧穿一片',target:'shotgun',minLevel:6,maxStacks:1,effect:'sg-ignite',
    head:'2 颗弹丸命中就点燃',detail:['同一敌人被 2 颗以上弹丸命中即点燃 4 秒，每秒损失 8% 最大生命','重装机免疫，盾牌挡火；死亡时点燃 3 米内至多 3 敌（蔓延 1 代）']},
  {id:'g43-pierce',kind:'mod',rarity:'rare',name:'增幅贯穿',flavour:'一条线上的敌人，都算目标',target:'sniper',minLevel:6,maxStacks:1,effect:'g43-pierce',
    head:'子弹多穿 3 个敌人',detail:['额外贯穿 3 敌；每穿过一个敌人伤害 +10%（至多 +30%）']},
  {id:'g43-chain',kind:'mod',rarity:'rare',name:'连环狙杀',flavour:'一枪收头，下一枪已上膛',target:'sniper',minLevel:6,maxStacks:1,effect:'g43-chain',
    head:'爆头击杀立刻再开枪',detail:['爆头击杀：立刻可以再次开火','内置冷却 1.5 秒']},
  {id:'smg-ricochet',kind:'mod',rarity:'rare',name:'跳弹弹头',flavour:'打中一个，蹦向下一个',target:'rifle',minLevel:4,maxStacks:1,effect:'smg-ricochet',
    head:'命中有几率弹向下一个',detail:['每发命中有 30% 几率弹向 6 米内另一个敌人','跳弹伤害为这发的 40%，留下墨线']},
  {id:'g43-xray',kind:'mod',rarity:'rare',name:'穿墙标记',flavour:'墙后的东西，也逃不过准星',target:'sniper',minLevel:4,maxStacks:1,effect:'g43-xray',
    head:'开镜看见墙后的敌人',detail:['G43 开镜时，标出 30 米内的敌人','只是标记：子弹依然穿不过墙']},
  {id:'grapple',kind:'general',rarity:'common',name:'钩锁',flavour:'勾到哪里，就飞到哪里',maxStacks:1,effect:'grapple',
    head:'长按 E：飞过去，或把敌人拽过来',detail:['瞄准锚点或平台按住 E：飞过去','瞄准机器按住 E：把它拽过来；钩中残血机器可直接处决']},
  {id:'grapple-plus',kind:'general',rarity:'rare',name:'强化钩锁',flavour:'更远，更久，更狠',requires:'grapple',maxStacks:1,effect:'grapple-plus',
    head:'钩锁更远更久，精英也拽得动',detail:['钩锁距离 +60%，冷却 -40%','精英机器也能拽动']},
  {id:'vault',kind:'general',rarity:'rare',name:'翻越',flavour:'踩着它们的脑袋过去',maxStacks:1,effect:'vault',
    head:'空格翻越敌人，踩头再跳',detail:['踩到机器头顶会弹起，并刷新一次跳跃']},
  {id:'vest',kind:'general',rarity:'common',name:'加固装甲',flavour:'稳稳扛住下一轮交火',maxStacks:2,
    head:'装甲上限 +25',detail:['装甲上限 +25，并立即补满这 25 点']},
  {id:'scavenger',kind:'general',rarity:'common',name:'拾荒本能',flavour:'捡得越勤，打得越顺',maxStacks:1,effect:'scavenger',
    head:'捡取范围翻倍',detail:['补给拾取范围翻倍，掉落更倾向于你缺的弹药']},
  {id:'combat-repair',kind:'general',rarity:'common',name:'战斗修复',flavour:'越战越稳，持续进攻',maxStacks:2,effect:'combat-repair',
    head:'每次击杀回一点血',detail:['每次击杀回复 1 点生命（可叠加）']},
  {id:'combo-ember',kind:'general',rarity:'rare',name:'不熄之火',flavour:'找到下一个目标，继续连杀',maxStacks:1,effect:'combo-ember',
    head:'连杀计时多撑 2 秒',detail:['连杀计时 +2 秒（4 秒 → 6 秒）']},
  {id:'hook-recycle',kind:'general',rarity:'rare',name:'回收绞盘',flavour:'钩中，开枪，再次出发',requires:'grapple',maxStacks:1,effect:'hook-recycle',
    head:'钩中后击杀回能量',detail:['击杀：回复 4% 钩锁能量','钩中目标被击杀：额外回复能量']},
  {id:'grenade-echo',kind:'general',rarity:'rare',name:'余震手雷',flavour:'爆炸之后，再来一声余震',maxStacks:1,effect:'grenade-echo',
    head:'手雷爆炸后再炸一次',detail:['手雷爆炸 0.35 秒后，追加一次余震','半径 70%、伤害 30%，至多 6 敌；无自伤']},
  {id:'awake-smg-melt',kind:'mod',rarity:'legend',name:'觉醒 · 熔毁蔓延',flavour:'烧穿一个，下一个接着熔',target:'rifle',requires:'smg-melt',minLevel:10,maxStacks:1,effect:'awake-smg-melt',
    head:'熔蚀 0.4 秒起效并传递',detail:['熔蚀只需约 0.4 秒连续命中即可起效','熔蚀目标被击杀时，熔蚀转移给 5 米内最近的 1 个敌人']},
  {id:'awake-smg-relay',kind:'mod',rarity:'legend',name:'觉醒 · 超载机匣',flavour:'持续倾泻的钢铁暴雨',target:'rifle',requires:'smg-relay',minLevel:10,maxStacks:1,effect:'awake-smg-relay',
    head:'射速上限更高',detail:['持续射击加速上限 +20% → +35%，更快起转','直接击杀后保持加速 2 秒，换弹亦保留']},
  {id:'awake-pistol-ricochet',kind:'mod',rarity:'legend',name:'觉醒 · 连锁跳弹',flavour:'一发击杀，连弹两个',target:'pistol',requires:'pistol-ricochet',minLevel:10,maxStacks:1,effect:'awake-pistol-ricochet',
    head:'一次击杀连弹两个',detail:['跳弹最多 2 次，第二跳为致死伤害的 25%','两跳都留下可见墨线']},
  {id:'awake-pistol-bounty',kind:'mod',rarity:'legend',name:'觉醒 · 赏金猎手',flavour:'赏金到手，越打越准',target:'pistol',requires:'pistol-bounty',minLevel:10,maxStacks:1,effect:'awake-pistol-bounty',
    head:'爆头后射得更快更狠',detail:['爆头击杀后 4 秒内：射速 +20%、伤害 +15%','再次爆头击杀只刷新时间，不叠加']},
  {id:'awake-sg-ignite',kind:'mod',rarity:'legend',name:'觉醒 · 烈焰风暴',flavour:'火势自己找路',target:'shotgun',requires:'sg-ignite',minLevel:10,maxStacks:1,effect:'awake-sg-ignite',
    head:'火更烈，蔓延更远',detail:['燃烧伤害 ×1.5','蔓延半径 5 米，可蔓延 2 代']},
  {id:'awake-sg-shards',kind:'mod',rarity:'legend',name:'觉醒 · 连环碎裂',flavour:'残骸之后，还有残骸',target:'shotgun',requires:'sg-shards',minLevel:10,maxStacks:1,effect:'awake-sg-shards',
    head:'破片击杀再喷破片',detail:['被破片杀死的敌人再喷一次破片（伤害 50%）','每枪至多追加一次']},
  {id:'awake-g43-pierce',kind:'mod',rarity:'legend',name:'觉醒 · 一线贯杀',flavour:'一线之上，无人幸免',target:'sniper',requires:'g43-pierce',minLevel:10,maxStacks:1,effect:'awake-g43-pierce',
    head:'子弹穿透所有敌人',detail:['贯穿数不再设上限','伤害增幅上限 +30% → +50%']},
  {id:'awake-g43-chain',kind:'mod',rarity:'legend',name:'觉醒 · 猎杀时刻',flavour:'每一次倒下，都是下一枪的信号',target:'sniper',requires:'g43-chain',minLevel:10,maxStacks:1,effect:'awake-g43-chain',
    head:'任何击杀都能连开枪',detail:['任意击杀（不限爆头）即可立刻再次开火','冷却缩短至 1.0 秒']}
];
for(const c of CARDS)c.icon=c.icon||c.id;
const CARD=Object.fromEntries(CARDS.map(c=>[c.id,c]));
const MOD_NAME={dmg:'伤害',pierce:'穿甲',crit:'爆头',mag:'弹匣',reload:'装填',rate:'射速'};

/* ---------- Boss ---------- */
const BOSS=[
  {id:'butcher',name:'屠宰机',en:'THE BUTCHER',level:5,hp:2000,speed:4*K,damage:20,scale:1,h:3.6,
    tag:'把一切锯成废铁的屠宰机',atk:'红线冲撞 · 旋转斩',weak:'背后发动机',base:'ripper',music:'rock',
    tips:['红色长条 = 冲撞路线：往两侧闪开，或跳上平台','它撞到场地边缘会晕：绕到背后打发动机，先打掉护甲条'],
    calls:[{at:.75,units:[['ripper',3]]},{at:.5,units:[['ripper',3]]},{at:.25,units:[['ripper',4]]}]},
  {id:'commander',name:'督军',en:'THE WARLORD',level:10,hp:2900,speed:2.6*K,damage:7,scale:1,h:5.2,
    tag:'整条防线都听它指挥',atk:'扇形弹幕 · 呼叫援军',weak:'头部 · 背后电源',music:'synth',
    tips:['黄光 = 胸口高的弹幕：滑铲 / 下蹲从下面钻过；红光 = 贴地火线：起跳','打完一轮枪管会发亮：趁这时打头，先打掉护甲条'],
    calls:[{at:.75,units:[['popper',3]]},{at:.5,units:[['warden',2],['drone',2]]},{at:.25,units:[['popper',3],['ripper',2]]}]},
  {id:'siege',name:'攻城锤',en:'SIEGE RAM',level:15,hp:4800,speed:2.1*K,damage:20,scale:1,h:5,
    tag:'一锤砸碎整片地面',atk:'砸地 · 冲击波 · 裂地线',weak:'背后散热口',base:'hauler',music:'strike',
    tips:['白圈 = 砸地：冲出圈或起跳；红色细线 = 裂地线：往两侧闪开','先打掉护甲条，正面才吃满伤害；绕到背后打散热口'],
    calls:[{at:.75,units:[['ripper',4]]},{at:.5,units:[['popper',3],['drone',1]]},{at:.25,units:[['ripper',3],['bulwark',1]]}]},
  {id:'carrier',name:'巢母',en:'BROODMOTHER',level:20,hp:6600,speed:2.2*K,damage:8,scale:1,h:5.6,
    tag:'肚子里装满了无人机',atk:'双联机炮 · 放出无人机 · 空袭',weak:'机库 · 散热口',music:'synth',
    tips:['舱门打开会放出无人机：先清无人机，它们会给巢母减伤','白圈 = 空袭落点：横着走出圈；舱门开着时打机库'],
    calls:[{at:.75,units:[['drone',2]]},{at:.5,units:[['drone',2],['ripper',2]]},{at:.25,units:[['drone',3],['ripper',2]]}]},
  {id:'maw',name:'流沙巨口',en:'QUICKSAND MAW',level:25,hp:9000,speed:5.4*K,damage:12,scale:1,h:8,
    tag:'最后一场沙尘暴下面的巨口',atk:'破地冲出 · 沙石弹 · 流沙漩涡',weak:'发光腹甲 · 喉咙',music:'rock',
    tips:['脚下出现大沙圈 = 它要从下面冲出来：马上跑出圈','冒出来时打肚子上发光的地方；它钻回去的坑里扔手雷，伤害翻倍'],
    calls:[{at:.75,units:[['husk',4]]},{at:.5,units:[['worm',2],['husk',3]]},{at:.25,units:[['husk',4],['worm',2]]}]},
  {id:'titan',name:'未完工的机器',en:'THE UNFINISHED',level:30,hp:27000,speed:1.8*K,damage:12,scale:1,h:9.8,
    tag:'还没造完，就已经醒了',atk:'冲击波 · 弹幕 · 炮击 · 光束',weak:'胸口核心 · 散热口',music:'rock',phases:[.66,.4,.2],
    tips:['黄 = 滑铲，红 = 跳，白圈 = 出圈，红色细线 = 侧闪：前面五个 Boss 的招它都会','每过一个阶段会长出新护甲：先打碎；血量见底后它过载，弱点一直亮着'],
    calls:[{at:.8,units:[['ripper',3],['drone',3]]},{at:.6,units:[['ripper',4],['popper',3]]},{at:.4,units:[['warden',2],['bulwark',1],['drone',3]]},{at:.2,units:[['ripper',4],['popper',3],['drone',4]]}]}
];
for(const b of BOSS){b.phases=b.phases||[.66,.33];b.armour=.25}

/* ---------- 关卡 ---------- */
const LEVELS={total:30,chapters:6,bossEvery:5,
  budgetBase:7,budgetPerLevel:3.5,budgetPerLevelLate:2,lateFrom:10,lateGrowth:.35,growthCap:20,hpPerLevel:.05,damagePerLevel:.025,
  fieldBase:5,fieldMax:9,spawnGap:.7,clearedPause:1.6,bossClearedPause:3.2,scorePerCost:100,clearBase:200,clearPerLevel:50,
  unlock:{ripper:1,warden:1,popper:2,spotter:3,hauler:4,bulwark:6,husk:6,worm:6,drone:7,eliteRipper:8,eliteWarden:10,elitePopper:12,eliteBulwark:14},
  weight:{ripper:1,warden:1.1,popper:.8,spotter:.45,hauler:.5,bulwark:.55,drone:.5,husk:1.7,worm:.65,eliteRipper:.2,eliteWarden:.18,elitePopper:.16,eliteBulwark:.13},
  cap:{spotter:[1,4],hauler:[1,4],bulwark:[1,3],drone:[1,4],husk:[3,3],worm:[1,5],eliteRipper:[1,6],eliteWarden:[1,6],elitePopper:[1,6],eliteBulwark:[1,8]},
  shiftFrom:4,shift:.06,haulerFrom:5,haulerEvery:2,
  cards:{from:2,every:2,awaken:[10,20],reveal:3,rerolls:2},
  drops:{ammo:.17,health:.055,smallHeal:20,bigHeal:40,bigFrom:3.5,life:40,reach:1.5}};
const CHAPTERS=[
  {name:'荒漠午后',en:'DESERT AFTERNOON',theme:2,music:'west',from:1},{name:'尘白天',en:'DUST-WHITE DAY',theme:1,music:'strike',from:6},
  {name:'琥珀傍晚',en:'AMBER EVENING',theme:0,music:'synth',from:11},{name:'赭红落日',en:'OCHRE SUNSET',theme:4,music:'rock',from:16},
  {name:'沙尘暴',en:'SANDSTORM',theme:3,music:'strike',from:21},{name:'夜行',en:'NIGHT RUN',theme:5,music:'synth',from:26}];

/* ---------- 难度 ---------- */
const DIFF={
  easy:{id:'easy',label:'简单',en:'EASY',enemyHp:.8,enemyDamage:.55,hpGrowth:.6,damageGrowth:.5,budget:.8,playerHp:30,bossCd:1.15,aimError:1.5,bulletSpeed:.85,rangedInterval:1.3,ammoDrop:1.3,healthDrop:1.5,
    desc:'机器更脆，弹幕更稀'},
  normal:{id:'normal',label:'中等',en:'NORMAL',enemyHp:1,enemyDamage:1,hpGrowth:1,damageGrowth:1,budget:1,playerHp:0,bossCd:1,aimError:1,bulletSpeed:1,rangedInterval:1,ammoDrop:1,healthDrop:1,
    desc:'原汁原味的拆机试炼'},
  hard:{id:'hard',label:'困难',en:'HARD',enemyHp:1.2,enemyDamage:1.4,hpGrowth:1.2,damageGrowth:1.3,budget:1.2,playerHp:0,bossCd:.9,aimError:.8,bulletSpeed:1.1,rangedInterval:.85,ammoDrop:.8,healthDrop:.75,
    desc:'机器更多更硬，别挨打'}
};

/* ---------- 特殊关卡 ---------- */
const EVENTS={
  lockdown:{name:'封锁区',en:'LOCKDOWN',desc:'三面封锁 · 敌人只从一个方向涌来',from:3,budget:1.3},
  zone:{name:'信号区',en:'SIGNAL ZONE',desc:'沿箭头进入外围光幕内作战 · 出界会掉血',from:3,width:.42,prepare:6,hurt:9},
  timed:{name:'限时清场',en:'BEAT THE CLOCK',desc:'限时内清完 · 额外一次选卡',from:3,base:30,perPoint:2.4},
  doubleSupply:{name:'双倍补给',en:'DOUBLE SUPPLY',desc:'掉落翻倍 · 敌人多 40%',from:4,drops:2,budget:1.4},
  sandstorm:{name:'沙尘暴',en:'SANDSTORM',desc:'能见度很低 · 顺风快逆风慢 · 近战机器更多',from:6,melee:1.8,ranged:.35,wind:.28},
  eliteSurge:{name:'精英潮',en:'ELITE SURGE',desc:'精英大量出现 · 普通机器变少',from:8,elite:4,normal:.6}
};
const EVENT_CHANCE=.5;

/* ---------- 图鉴 ---------- */
const CODEX={
  tip:'首次出现',weap:['开火','换弹'],
  player:{name:'拾荒者',en:'SCRAPPER',desc:'在拆机试炼场里靠一把手枪活下来的拾荒者。',
    how:'A / D 移动 · Shift 疾跑 · 空格 跳 · C 滑铲 · Ctrl 蹲 · R 换弹 · G 手雷 · E 钩锁 · F 处决'},
  bossTip:{butcher:'红线冲撞 · 旋转斩 · 打背后发动机散热口',commander:'扇形弹幕打胸口高度 · 蹲下或滑铲躲开 · 打头部和背后电源',
    siege:'砸地后冲击波向外扩散 · 起跳躲开 · 血低时连砸两次 · 打背后散热口',carrier:'舱门打开时舱里是弱点 · 它会放出无人机 · 贴身会被践踏',
    maw:'地上的大沙圈是它冲出的位置 · 冒出来时打发光的腹部',titan:'四个阶段 · 砸地冲击波 · 扇形弹幕 · 炮击 · 光束 · 胸口核心和背后散热口是弱点'}
};

CL.D={W,ORDER,AMMO_PICK,E,EL,R,CARDS,CARD,MOD_NAME,BOSS,LEVELS,CHAPTERS,DIFF,EVENTS,EVENT_CHANCE,CODEX,K,
  chapterOf:l=>CHAPTERS[Math.min(CHAPTERS.length-1,Math.ceil(l/LEVELS.bossEvery)-1)],
  bossOf:l=>(l>0&&l%LEVELS.bossEvery===0)?BOSS[(l/LEVELS.bossEvery-1)%BOSS.length]:null,
  bossTier:l=>Math.floor((l/LEVELS.bossEvery-1)/BOSS.length)};
})();
