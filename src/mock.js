// ===== 门店 =====
export const STORES = [
  { id: '1', name: '百信店' },
  { id: '2', name: '大石店' },
  { id: '3', name: '珠江店' },
  { id: '4', name: '天河南店' },
  { id: '5', name: '客村店' },
  { id: '6', name: '岗顶店' },
  { id: '7', name: '番禺店' },
  { id: '8', name: '白云店' },
  { id: '9', name: '花都店' },
  { id: '10', name: '增城店' },
];

export const storeName = (id) => (STORES.find((s) => s.id === id) || {}).name || id;
export const storeNameList = (ids) => (ids || []).map(storeName).join('、');

// ===== 买币套餐池 =====
// status: valid 有效 / invalid 已失效
export const PACKAGES = [
  { id: 'P1', name: '66元套餐', price: 66, coins: 500, benefit: '赠送10币', status: 'valid', stores: 'ALL' },
  { id: 'P2', name: '100元套餐', price: 100, coins: 800, benefit: '赠送20币', status: 'valid', stores: 'ALL' },
  { id: 'P3', name: '188元套餐', price: 188, coins: 1600, benefit: '赠送50币', status: 'valid', stores: 'ALL' },
  { id: 'P4', name: '288元套餐', price: 288, coins: 2600, benefit: '赠送80币', status: 'valid', stores: 'ALL' },
  { id: 'P5', name: '500元套餐', price: 500, coins: 5000, benefit: '赠送200币', status: 'valid', stores: 'ALL' },
  { id: 'P6', name: '88元套餐', price: 88, coins: 700, benefit: '赠送15币', status: 'valid', stores: ['1', '2', '3'] },
  { id: 'P7', name: '128元套餐', price: 128, coins: 1100, benefit: '赠送30币', status: 'valid', stores: ['4', '5'] },
  { id: 'P8', name: '388元套餐', price: 388, coins: 3500, benefit: '赠送100币', status: 'valid', stores: ['6', '7', '8'] },
  { id: 'P9', name: '豪华套餐', price: 888, coins: 9999, benefit: '赠送500币', status: 'valid', stores: ['9', '10'] },
  { id: 'P10', name: '限时特惠9.9', price: 9.9, coins: 99, benefit: '赠送1币', status: 'invalid', stores: ['1'] },
  { id: 'P11', name: '老用户专享', price: 200, coins: 1800, benefit: '赠送40币', status: 'valid', stores: ['1', '2'] },
  { id: 'P12', name: '新人礼包', price: 30, coins: 300, benefit: '赠送5币', status: 'valid', stores: 'ALL' },
];

// ===== 商品池 =====
// status: valid 上架 / off 下架 ; stock<=0 视为售罄
// image: 商品主图（原型用 SVG 渐变占位图，真实环境替换为 CDN URL 即可）
function mainImg(emoji, name, c1, c2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>`
    + `</linearGradient></defs>`
    + `<rect width="240" height="240" fill="url(#g)"/>`
    + `<text x="120" y="120" font-size="76" text-anchor="middle">${emoji}</text>`
    + `<text x="120" y="208" font-size="20" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-weight="600">${name}</text>`
    + `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
export const PRODUCTS = [
  { id: 'G1', name: '牛仔公仔', emoji: '🤠', lottery: 5, stock: 20, status: 'valid', stores: 'ALL', image: mainImg('🤠', '牛仔公仔', '#7a4a21', '#c97b3d') },
  { id: 'G2', name: '金币巧克力', emoji: '🍫', lottery: 3, stock: 0, status: 'valid', stores: 'ALL', image: mainImg('🍫', '金币巧克力', '#6b4226', '#a06b3f') },
  { id: 'G3', name: '牛仔帽', emoji: '👒', lottery: 8, stock: 15, status: 'valid', stores: ['1', '2', '3'], image: mainImg('👒', '牛仔帽', '#2f6f8f', '#4aa3c9') },
  { id: 'G4', name: '幸运刮刮卡', emoji: '🎫', lottery: 1, stock: 50, status: 'valid', stores: ['4', '5'], image: mainImg('🎫', '幸运刮刮卡', '#7a4fb8', '#c24f9e') },
  { id: 'G5', name: '限定T恤', emoji: '👕', lottery: 12, stock: 8, status: 'valid', stores: ['6', '7'], image: mainImg('👕', '限定T恤', '#2a6db8', '#3fa3d6') },
  { id: 'G6', name: '神秘礼盒', emoji: '🎁', lottery: 20, stock: 5, status: 'valid', stores: 'ALL', image: mainImg('🎁', '神秘礼盒', '#3d3d8f', '#7a4fb8') },
  { id: 'G7', name: '牛仔靴', emoji: '🥾', lottery: 15, stock: 9, status: 'off', stores: 'ALL', image: mainImg('🥾', '牛仔靴', '#a8432f', '#d97a52') },
  { id: 'G8', name: '抱枕', emoji: '🛋️', lottery: 6, stock: 30, status: 'valid', stores: ['8', '9', '10'], image: mainImg('🛋️', '抱枕', '#d96a8f', '#f0a06b') },
  { id: 'G9', name: '钥匙扣', emoji: '🔑', lottery: 2, stock: 100, status: 'valid', stores: 'ALL', image: mainImg('🔑', '钥匙扣', '#2f8f5f', '#57c29a') },
  { id: 'G10', name: '马克杯', emoji: '☕', lottery: 4, stock: 12, status: 'valid', stores: ['1', '2'], image: mainImg('☕', '马克杯', '#5a6b8f', '#8fa3c9') },
];

// ===== 活动池 =====
// type: normal 普通活动 / ranking 排行榜合集(固定置顶, 不进普通配置)
// status: valid 有效 / ended 已结束 / invalid 已失效
// image: 活动封面图（原型用 SVG 渐变占位图，真实环境替换为 CDN URL 即可）
function activityImg(emoji, name, c1, c2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>`
    + `</linearGradient></defs>`
    + `<rect width="240" height="240" fill="url(#g)"/>`
    + `<circle cx="120" cy="120" r="84" fill="rgba(255,255,255,0.94)"/>`
    + `<text x="120" y="136" font-size="70" text-anchor="middle">${emoji}</text>`
    + `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
// 纯图片模式演示用横幅占位图（真实环境替换为上传的 CDN URL）
function bannerImg(emoji, name, c1, c2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">`
    + `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>`
    + `</linearGradient></defs>`
    + `<rect width="600" height="120" fill="url(#g)"/>`
    + `<text x="40" y="76" font-size="30" fill="#fff" font-weight="700" opacity="0.96">${name}</text>`
    + `<text x="560" y="76" font-size="56" text-anchor="end">${emoji}</text>`
    + `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
export const ACTIVITIES = [
  { id: 'A1', name: '夏日冲金币', emoji: '☀️', desc: '夏日限定，冲币赢大奖', type: 'normal', status: 'valid', image: activityImg('☀️', '夏日冲金币', '#ff9a3c', '#ff5e62'), participants: 12850, winners: 342 },
  { id: 'A2', name: '周末狂欢', emoji: '🎉', desc: '周末专属福利活动', type: 'normal', status: 'valid', image: activityImg('🎉', '周末狂欢', '#1677ff', '#722ed1'), participants: 8960, winners: 128 },
  { id: 'A3', name: '周年庆典', emoji: '🎂', desc: '周年庆感恩回馈', type: 'normal', status: 'valid', image: activityImg('🎂', '周年庆典', '#fa8c16', '#fa541c'), participants: 21500, winners: 888 },
  { id: 'A4', name: '新人首充礼', emoji: '🎁', desc: '新人首充双倍赠送', type: 'normal', status: 'valid', image: activityImg('🎁', '新人首充礼', '#13c2c2', '#52c41a'), participants: 5680, winners: 0 },
  { id: 'A5', name: '老带新瓜分', emoji: '👥', desc: '邀请好友一起瓜分奖励', type: 'normal', status: 'ended', image: activityImg('👥', '老带新瓜分', '#2f6f8f', '#4aa3c9'), participants: 4300, winners: 120 },
  { id: 'A6', name: '充值排行榜', emoji: '🏆', type: 'ranking', status: 'valid', image: activityImg('🏆', '充值排行榜', '#8c6d1f', '#d4a017') },
  { id: 'A7', name: '消费排行榜', emoji: '👑', type: 'ranking', status: 'valid', image: activityImg('👑', '消费排行榜', '#6b4226', '#c97b3d') },
  { id: 'A8', name: '限时秒杀', emoji: '⏰', desc: '整点秒杀，先到先得', type: 'normal', status: 'invalid', image: activityImg('⏰', '限时秒杀', '#a8432f', '#d97a52'), participants: 1200, winners: 30 },
];

export const pkgById = (id) => PACKAGES.find((p) => p.id === id);
export const productById = (id) => PRODUCTS.find((p) => p.id === id);
export const activityById = (id) => ACTIVITIES.find((a) => a.id === id);
export const activityName = (id) => (activityById(id) || {}).name || id;

// ===== 初始配置数据（演示用，覆盖各类状态） =====
export const INITIAL_CONFIGS = {
  coin: [
    {
      id: 'C1', type: 'coin', stores: ['1', '2'],
      manual: ['P1', 'P2', 'P3', 'P4', 'P5'],
      displayConfig: {
        P1: { badge: 'hot' },
        P2: { title: '暑期特惠包' },
        P3: { badge: 'limit' },
      },
      enabled: true, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      updater: '张三', updateTime: '2026-08-10 14:20',
    },
    {
      id: 'C2', type: 'coin', stores: ['3'],
      manual: ['P6', 'P7'],
      enabled: true, startTime: '2026-08-20 00:00', endTime: '2026-08-31 23:59',
      updater: '李四', updateTime: '2026-08-12 09:10',
    },
    {
      id: 'C3', type: 'coin', stores: ['4', '5'],
      manual: ['P10'],
      enabled: true, startTime: '2026-08-01 00:00', endTime: '2026-12-31 23:59',
      updater: '张三', updateTime: '2026-08-05 11:00',
    },
    {
      id: 'C4', type: 'coin', stores: ['6'],
      manual: ['P8'],
      enabled: false, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      updater: '王五', updateTime: '2026-08-03 16:40',
    },
    {
      id: 'C5', type: 'coin', stores: ['7', '8'],
      manual: ['P8', 'P9'],
      enabled: true, startTime: '2026-07-01 00:00', endTime: '2026-07-31 23:59',
      updater: '李四', updateTime: '2026-07-20 10:00',
    },
  ],
  product: [
    {
      id: 'PR1', type: 'product', stores: ['1', '2', '3'],
      manual: ['G1', 'G3'],
      enabled: true, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      updater: '张三', updateTime: '2026-08-09 15:30',
    },
    {
      id: 'PR2', type: 'product', stores: ['4', '5'],
      manual: ['G4', 'G9', 'G2'],
      displayConfig: {
        G4: { badge: 'hot' },
        G9: { showMeta: false },
        G2: { hideWhenInvalid: true },
      },
      enabled: true, startTime: '2026-08-01 00:00', endTime: '2026-12-31 23:59',
      updater: '李四', updateTime: '2026-08-11 13:05',
    },
    {
      id: 'PR3', type: 'product', stores: ['6', '7'],
      manual: ['G5'],
      enabled: true, startTime: '2026-08-15 00:00', endTime: '2026-08-20 23:59',
      updater: '王五', updateTime: '2026-08-12 17:22',
    },
    {
      id: 'PR4', type: 'product', stores: ['8', '9', '10'],
      manual: ['G8', 'G9'],
      enabled: false, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      updater: '张三', updateTime: '2026-08-02 09:40',
    },
  ],
  activity: [
    {
      id: 'AC1', type: 'activity', remark: '', activityId: 'A1', scope: 'all', specifiedStores: [],
      sort: 1, enabled: true, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      displayConfig: { badge: 'hot' },
      updater: '张三', updateTime: '2026-08-01 10:00',
    },
    {
      id: 'AC2', type: 'activity', remark: '', activityId: 'A2', scope: 'all', specifiedStores: [],
      sort: 2, enabled: true, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      displayConfig: { title: '周末嗨翻天', subtitle: '双倍积分限时开启', badge: 'limit', theme: 'warm', stats: ['participants', 'winners'] },
      updater: '张三', updateTime: '2026-08-01 10:05',
    },
    {
      id: 'AC3', type: 'activity', remark: '暑期指定店', activityId: 'A3', scope: 'specified', specifiedStores: ['1', '2'],
      sort: 3, enabled: true, startTime: '2026-08-10 00:00', endTime: '2026-08-20 23:59',
      displayConfig: { theme: 'gold' },
      updater: '李四', updateTime: '2026-08-08 14:00',
    },
    {
      id: 'AC4', type: 'activity', remark: '', activityId: 'A4', scope: 'all', specifiedStores: [],
      sort: 4, enabled: true, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      displayConfig: { mode: 'image', image: bannerImg('🎁', '新人首充礼', '#13c2c2', '#52c41a'), stats: ['participants'] },
      updater: '王五', updateTime: '2026-08-04 11:30',
    },
    {
      id: 'AC5', type: 'activity', remark: '暂停投放', activityId: 'A5', scope: 'specified', specifiedStores: ['3', '4'],
      sort: 5, enabled: false, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      updater: '张三', updateTime: '2026-08-06 09:00',
    },
  ],
  hall: [
    {
      id: 'H1', type: 'hall', remark: '', activityId: 'A1', scope: 'all', specifiedStores: [],
      sort: 1, enabled: true, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      updater: '张三', updateTime: '2026-08-01 10:10',
    },
    {
      id: 'H2', type: 'hall', remark: '', activityId: 'A2', scope: 'specified', specifiedStores: ['1', '2'],
      sort: 2, enabled: true, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      displayConfig: { stats: ['participants'] },
      updater: '李四', updateTime: '2026-08-02 12:00',
    },
    {
      id: 'H3', type: 'hall', remark: '临时下线', activityId: 'A3', scope: 'all', specifiedStores: [],
      sort: 3, enabled: false, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      updater: '王五', updateTime: '2026-08-03 15:00',
    },
    {
      id: 'H4', type: 'hall', remark: '', activityId: 'A5', scope: 'all', specifiedStores: [],
      sort: 4, enabled: true, startTime: '2026-08-01 00:00', endTime: '2026-08-31 23:59',
      updater: '张三', updateTime: '2026-08-04 10:20',
    },
  ],
};
