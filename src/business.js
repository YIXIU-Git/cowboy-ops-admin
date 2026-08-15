import { PACKAGES, PRODUCTS, ACTIVITIES, pkgById, productById, activityById } from './mock.js';

// ===== 状态机定义 =====
// 未生效 / 生效中 / 已结束 / 已下架 / 源对象失效
export const STATUS_META = {
  pending: { label: '未生效', color: 'default' },
  active: { label: '生效中', color: 'success' },
  ended: { label: '已结束', color: 'default' },
  off_shelf: { label: '已下架', color: 'warning' },
  source_invalid: { label: '源对象失效', color: 'error' },
};

// 源业务对象是否仍有效（失效=下架/删除/售罄/已结束）
export function isSourceValid(item) {
  if (!item) return false;
  if (item.status === 'invalid' || item.status === 'off' || item.status === 'ended') return false;
  if (typeof item.stock === 'number' && item.stock <= 0) return false;
  return true;
}

// 配置整体是否“源对象失效”
export function configSourceInvalid(config) {
  if (!config) return false;
  if (config.type === 'coin') {
    return (config.manual || []).some((id) => !isSourceValid(pkgById(id)));
  }
  if (config.type === 'product') {
    return (config.manual || []).some((id) => !isSourceValid(productById(id)));
  }
  if (config.type === 'activity' || config.type === 'hall') {
    const act = activityById(config.activityId);
    return !act || !isSourceValid(act);
  }
  return false;
}

// 状态自动计算：源对象失效 > 下架 > 时间
export function calcStatus(config, now = new Date()) {
  if (configSourceInvalid(config)) return 'source_invalid';
  if (!config.enabled) return 'off_shelf';
  const start = config.startTime ? new Date(config.startTime) : null;
  const end = config.endTime ? new Date(config.endTime) : null;
  if (start && now < start) return 'pending';
  if (end && now > end) return 'ended';
  return 'active';
}

// ===== 门店关系 =====
function storeIntersect(a = [], b = []) {
  if (a.includes('ALL') || b.includes('ALL')) return true;
  return a.some((s) => b.includes(s));
}
function storeCovers(storeIds = [], item) {
  const itemStores = item.stores === 'ALL' ? 'ALL' : item.stores || [];
  return storeIntersect(storeIds, Array.isArray(itemStores) ? itemStores : [itemStores]);
}

// ===== 自动补位 =====
// 买币：最多 5；商品：最多 3；活动：不补位
export function autoFill(config) {
  if (!config) return [];
  if (config.type === 'coin') {
    const max = 5;
    const manual = config.manual || [];
    const pool = PACKAGES.filter((p) => isSourceValid(p) && storeCovers(config.stores, p));
    const manualIds = manual;
    return pool
      .filter((p) => !manualIds.includes(p.id))
      .slice(0, Math.max(0, max - manual.length));
  }
  if (config.type === 'product') {
    const max = 3;
    const manual = config.manual || [];
    const pool = PRODUCTS.filter((p) => isSourceValid(p) && storeCovers(config.stores, p));
    const manualIds = manual;
    return pool
      .filter((p) => !manualIds.includes(p.id))
      .slice(0, Math.max(0, max - manual.length));
  }
  return []; // activity / hall 不自动补位
}

// ===== 冲突校验（买币/商品：同店同时间段只允许一套生效方案）=====
function timeOverlap(a, b) {
  const aS = a.startTime ? new Date(a.startTime).getTime() : -Infinity;
  const aE = a.endTime ? new Date(a.endTime).getTime() : Infinity;
  const bS = b.startTime ? new Date(b.startTime).getTime() : -Infinity;
  const bE = b.endTime ? new Date(b.endTime).getTime() : Infinity;
  return aS < bE && bS < aE;
}
export function findConflict(config, list) {
  if (!config || !config.enabled) return null;
  if (config.type !== 'coin' && config.type !== 'product') return null;
  for (const o of list) {
    if (o.id === config.id) continue;
    if (!o.enabled) continue;
    if (!storeIntersect(config.stores, o.stores)) continue;
    if (timeOverlap(config, o)) return o;
  }
  return null;
}

// ===== C端展示配置解析 =====
// displayConfig: { [pkgId]: { lineMode, subText, showIcon, icon, title, badge, hideWhenInvalid } }
// 默认：双行 / 副文案取套餐 benefit / 显示图标 / 图标类型按业务取默认 / 主标题取套餐名 / 无角标 / 失效仅灰显不隐藏 / 商品显示信息(meta)
export const BADGE_VALUES = ['hot', 'limit', 'new'];
export function resolveDisplay(config, pkg) {
  if (!config || !pkg) return { lineMode: 'double', subText: '', showIcon: true, icon: 'coin', title: '', badge: null, hideWhenInvalid: false, showMeta: true };
  const d = (config.displayConfig || {})[pkg.id] || {};
  const isCoin = config.type === 'coin';
  const defaultSub = isCoin ? pkg.benefit || '' : `${pkg.lottery}彩票`;
  const defaultIcon = isCoin ? 'coin' : 'gift';
  return {
    lineMode: d.lineMode === 'single' ? 'single' : 'double',
    subText: d.subText !== undefined && d.subText !== null && d.subText !== '' ? d.subText : defaultSub,
    showIcon: d.showIcon !== false,
    icon: d.icon || defaultIcon,
    title: (d.title && d.title.trim()) || pkg.name,
    badge: d.badge && BADGE_VALUES.includes(d.badge) ? d.badge : null,
    hideWhenInvalid: d.hideWhenInvalid === true,
    showMeta: d.showMeta !== false,
  };
}

// 展示配置摘要（用于列表列展示）
// 商品模块展示主图卡片，不涉及单行/双行/图标，仅统计角标/标题/失效隐藏/仅主图
export function displaySummary(config) {
  if (!config) return { double: 0, single: 0, iconOn: 0, badge: 0, customTitle: 0, hide: 0, showMetaOff: 0, total: 0 };
  const isCoin = config.type === 'coin';
  const ids = config.manual || [];
  const dc = config.displayConfig || {};
  let double = 0, single = 0, iconOn = 0, badge = 0, customTitle = 0, hide = 0, showMetaOff = 0;
  ids.forEach((id) => {
    const d = dc[id] || {};
    if (isCoin) {
      if (d.lineMode === 'single') single += 1; else double += 1;
      if (d.showIcon !== false) iconOn += 1;
    } else {
      if (d.showMeta === false) showMetaOff += 1;
    }
    if (d.badge && BADGE_VALUES.includes(d.badge)) badge += 1;
    if (d.title && d.title.trim()) customTitle += 1;
    if (d.hideWhenInvalid === true) hide += 1;
  });
  return { double, single, iconOn, badge, customTitle, hide, showMetaOff, total: ids.length };
}

// 活动对外展示统计项（参与人数 / 中奖人数）
export const ACTIVITY_STAT_OPTIONS = [
  { value: 'participants', label: '参与人数' },
  { value: 'winners', label: '中奖人数' },
];
export const ACTIVITY_STAT_KEYS = ACTIVITY_STAT_OPTIONS.map((o) => o.value);

// ===== 活动展示配置解析 =====
// 活动配置为单值：displayConfig: { mode, image, title, subtitle, badge, theme, stats }
// mode: 'mixed' 图文模式（默认） | 'image' 纯图片模式
// image: 自定义背景/纯图图片 URL
// stats: 要对外展示的统计项数组，如 ['participants','winners']
// 默认：主标题取活动名 / 副标题取活动描述 / 无角标 / 默认主题 / 不展示统计
export function resolveActivityDisplay(config, activity) {
  const d = (config && config.displayConfig) || {};
  const mode = d.mode === 'image' ? 'image' : 'mixed';
  const stats = (d.stats || []).filter((k) => ACTIVITY_STAT_KEYS.includes(k));
  const statValues = {};
  stats.forEach((k) => { statValues[k] = activity && typeof activity[k] === 'number' ? activity[k] : 0; });
  return {
    mode,
    image: d.image || '',
    title: (d.title && d.title.trim()) || (activity && activity.name) || '',
    subtitle: (d.subtitle && d.subtitle.trim()) || (activity && activity.desc) || '',
    badge: d.badge && BADGE_VALUES.includes(d.badge) ? d.badge : null,
    theme: d.theme || 'default',
    stats,
    statValues,
  };
}

// 活动展示配置摘要（用于列表列展示）
export function activityDisplaySummary(config) {
  const d = (config && config.displayConfig) || {};
  const s = {
    mode: d.mode === 'image' ? 'image' : 'mixed',
    image: !!d.image,
    badge: 0,
    customTitle: 0,
    customSub: 0,
    theme: 'default',
    stats: 0,
  };
  if (d.badge && BADGE_VALUES.includes(d.badge)) s.badge += 1;
  if (d.title && d.title.trim()) s.customTitle += 1;
  if (d.subtitle && d.subtitle.trim()) s.customSub += 1;
  s.theme = d.theme || 'default';
  if (Array.isArray(d.stats)) s.stats = d.stats.filter((k) => ACTIVITY_STAT_KEYS.includes(k)).length;
  return s;
}

// ===== 工具 =====
export function formatRange(start, end) {
  if (!start && !end) return '长期有效';
  const s = start || '立即生效';
  const e = end || '长期有效';
  return `${s} ~ ${e}`;
}

export function resolveManual(config) {
  if (config.type === 'coin') return (config.manual || []).map(pkgById);
  if (config.type === 'product') return (config.manual || []).map(productById);
  return [];
}

let _seq = 1000;
export function genId(prefix) {
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${_seq}`;
}
