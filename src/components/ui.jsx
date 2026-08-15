import React, { useState } from 'react';
import { Tag, Alert, Empty } from 'antd';
import {
  HolderOutlined, InboxOutlined, GoldOutlined, GiftOutlined, CrownOutlined, StarOutlined, FireOutlined,
} from '@ant-design/icons';
import { STATUS_META, autoFill, isSourceValid, resolveDisplay, resolveActivityDisplay, ACTIVITY_STAT_OPTIONS } from '../business.js';
import { PACKAGES, PRODUCTS, pkgById, productById, activityById } from '../mock.js';

// ===== C端图标选项 =====
export const ICON_OPTIONS = [
  { value: 'coin', label: '金币', icon: <GoldOutlined /> },
  { value: 'gift', label: '礼盒', icon: <GiftOutlined /> },
  { value: 'crown', label: '皇冠', icon: <CrownOutlined /> },
  { value: 'star', label: '星星', icon: <StarOutlined /> },
  { value: 'fire', label: '热门', icon: <FireOutlined /> },
];

// ===== C端角标选项 =====
export const BADGE_OPTIONS = [
  { value: 'none', label: '无角标' },
  { value: 'hot', label: 'HOT 热门' },
  { value: 'limit', label: '限时' },
  { value: 'new', label: 'NEW 新品' },
];

export const BADGE_META = {
  hot: { text: 'HOT', color: '#ff4d4f' },
  limit: { text: '限时', color: '#fa8c16' },
  new: { text: 'NEW', color: '#1677ff' },
};

// ===== 活动入口卡片主题 =====
export const ACTIVITY_THEME_OPTIONS = [
  { value: 'default', label: '蓝紫渐变' },
  { value: 'warm', label: '红橙渐变' },
  { value: 'cool', label: '青绿渐变' },
  { value: 'gold', label: '暗金渐变' },
];

export const ACTIVITY_THEMES = {
  default: { bg: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)' },
  warm: { bg: 'linear-gradient(135deg, #fa541c 0%, #fa8c16 100%)' },
  cool: { bg: 'linear-gradient(135deg, #13c2c2 0%, #52c41a 100%)' },
  gold: { bg: 'linear-gradient(135deg, #5b4a1f 0%, #d4a017 100%)' },
};

export function iconOf(value) {
  const hit = ICON_OPTIONS.find((o) => o.value === value);
  return hit ? hit.icon : <GoldOutlined />;
}

// ===== 状态标签 =====
export function StatusTag({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return <Tag color={m.color}>{m.label}</Tag>;
}

// ===== 拖拽排序列表 =====
export function DragSortList({ items, renderItem, onReorder, disabled }) {
  const [dragIndex, setDragIndex] = useState(null);
  if (!items.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先选择推荐内容" />;
  const handleDrop = (to) => {
    if (dragIndex === null || dragIndex === to) {
      setDragIndex(null);
      return;
    }
    const next = [...items];
    const [m] = next.splice(dragIndex, 1);
    next.splice(to, 0, m);
    onReorder(next);
    setDragIndex(null);
  };
  return (
    <div>
      {items.map((it, idx) => (
        <div
          key={it.id}
          className={`drag-item${dragIndex === idx ? ' dragging' : ''}`}
          draggable={!disabled}
          onDragStart={() => setDragIndex(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(idx)}
        >
          <span>
            <HolderOutlined className="drag-handle" />
            <b style={{ marginRight: 8 }}>{idx + 1}.</b>
            {renderItem(it)}
          </span>
          {!disabled && <span style={{ color: '#bbb' }}>拖拽排序</span>}
        </div>
      ))}
    </div>
  );
}

// ===== 自动补位预览 =====
export function AutoFillPreview({ config }) {
  if (!config) return null;
  if (config.type === 'activity' || config.type === 'hall') {
    return (
      <Alert
        type="info"
        showIcon
        message="活动类配置不自动补位：仅展示人工推荐，C端按排序取前 2 个。"
      />
    );
  }
  const resolve = config.type === 'coin' ? pkgById : productById;
  const manualIds = config.manual || [];
  const manualItems = manualIds.map(resolve);
  const fill = autoFill(config);

  const renderPkg = (p) => (
    <span>
      {p.name} · ¥{p.price} / {p.coins}币
      {!isSourceValid(p) && <Tag color="error" style={{ marginLeft: 6 }}>已失效</Tag>}
    </span>
  );
  const renderProduct = (p) => (
    <span>
      {p.emoji} {p.name} · {p.lottery}彩票
      {!isSourceValid(p) && <Tag color="error" style={{ marginLeft: 6 }}>已失效</Tag>}
    </span>
  );
  const renderItem = config.type === 'coin' ? renderPkg : renderProduct;

  return (
    <div className="fill-preview">
      <div style={{ marginBottom: 8, fontWeight: 600 }}>
        自动补位预览（人工 {manualIds.length} 个 / 预计补位 {fill.length} 个）
      </div>
      {manualItems.map((p, i) => (
        <div className="fill-row" key={`m${p.id}`}>
          <span className="fill-tag-manual">人工 {i + 1}</span>
          <span>{renderItem(p)}</span>
        </div>
      ))}
      {fill.map((p, i) => (
        <div className="fill-row" key={`f${p.id}`}>
          <span className="fill-tag-auto">系统补位 {manualIds.length + i + 1}</span>
          <span>{renderItem(p)}</span>
        </div>
      ))}
      {fill.length === 0 && manualIds.length === 0 && (
        <div className="fill-row">
          <span style={{ color: '#999' }}>未选择人工推荐，C端按门店默认排序前 {config.type === 'coin' ? 5 : 3} 个展示</span>
        </div>
      )}
    </div>
  );
}

// ===== C端实时预览（手机框） =====
export function CsidePreview({ config, type }) {
  if (!config) return null;

  // 活动入口卡片（活动/大厅：支持纯图片模式 或 图文混合模式）
  if (type === 'activity' || type === 'hall') {
    const isHall = type === 'hall';
    const configs = (config && config.configs) || [];
    const editingId = (config && config.editingId) || null;
    // 仅展示已上架的配置，按 sort 升序
    const visibleConfigs = configs
      .map((c) => ({ ...c, _activity: activityById(c.activityId), _disp: resolveActivityDisplay(c, activityById(c.activityId)) }))
      .filter((c) => c.enabled !== false)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));

    const formatStat = (n) => {
      if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
      if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
      return `${n}`;
    };
    const statLabel = (key) => (ACTIVITY_STAT_OPTIONS.find((o) => o.value === key) || {}).label || key;
    const renderStats = (disp, overlay = false) => {
      if (!disp.stats || disp.stats.length === 0) return null;
      return (
        <div className={`cside-act-stats${overlay ? ' overlay' : ''}`}>
          {disp.stats.map((k) => (
            <span key={k} className="cside-act-stat">
              <span className="cside-act-stat-val">{formatStat(disp.statValues[k] || 0)}</span>
              <span className="cside-act-stat-label">{statLabel(k)}</span>
            </span>
          ))}
        </div>
      );
    };

    const renderEntry = (c) => {
      const isEditing = c.id === editingId;
      const disp = c._disp;
      const theme = ACTIVITY_THEMES[disp.theme] || ACTIVITY_THEMES.default;
      const badge = disp.badge && BADGE_META[disp.badge] ? BADGE_META[disp.badge] : null;
      const bgStyle = disp.image
        ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url(${disp.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: theme.bg };
      if (!c._activity) {
        return (
          <div className={`cside-act-card empty-placeholder${isEditing ? ' editing' : ''}`} key={c.id}>
            <div className="cside-empty">待选择活动</div>
          </div>
        );
      }
      return (
        <div
          className={`cside-act-card${disp.mode === 'image' ? ' image-mode' : ''}${isEditing ? ' editing' : ''}`}
          style={disp.mode === 'image' ? {} : bgStyle}
          key={c.id}
        >
          {isEditing && <span className="cside-act-editing-tag">编辑中</span>}
          {disp.mode === 'image' ? (
            <>
              <img src={disp.image || c._activity.image} alt={c._activity.name} className="cside-act-img-full" />
              {renderStats(disp, true)}
            </>
          ) : (
            <>
              <div className="cside-act-info">
                {badge && <span className="cside-act-badge" style={{ background: badge.color }}>{badge.text}</span>}
                <span className="cside-act-title">{disp.title}</span>
                {disp.subtitle && <span className="cside-act-sub">{disp.subtitle}</span>}
                {renderStats(disp)}
              </div>
              <div className="cside-act-img-box">
                {c._activity.image ? (
                  <img src={c._activity.image} alt={c._activity.name} className="cside-act-img" />
                ) : (
                  <span className="cside-act-emoji">{c._activity.emoji}</span>
                )}
              </div>
            </>
          )}
        </div>
      );
    };

    return (
      <div className="cside-phone">
        <div className="cside-screen">
          <div className="cside-title">
            {isHall ? '活动大厅' : '热门活动'}
            <span className="cside-title-badge">共 {visibleConfigs.length} 个</span>
          </div>
          <div className={isHall ? 'cside-act-vlist' : 'cside-list act-list'}>
            {visibleConfigs.length > 0 ? visibleConfigs.map(renderEntry) : <div className="cside-empty">暂无已上架活动</div>}
          </div>
        </div>
      </div>
    );
  }

  const isCoin = type === 'coin';
  const maxItems = isCoin ? 5 : 3;
  const resolve = isCoin ? pkgById : productById;
  const manualIds = config.manual || [];
  const manualItems = manualIds.map(resolve).filter(Boolean);
  const fill = autoFill(config);

  const priceLine = (p) => (isCoin ? `¥${p.price} / ${p.coins}币` : `${p.lottery}彩票`);

  // 商品主图卡片（商品模块专属：主图 + 名称 + 彩票数 + 角标，无需单行/双行/副文案/图标）
  const renderProductCard = (p, disp, auto) => {
    const invalid = !isSourceValid(p);
    // 失效/售罄 + 开启「失效隐藏」→ C端直接不展示
    if (invalid && disp.hideWhenInvalid) return null;
    const badge = disp.badge && BADGE_META[disp.badge] ? BADGE_META[disp.badge] : null;
    const showMeta = disp.showMeta !== false;
    return (
      <div className={`cside-card-img${invalid ? ' invalid' : ''}${showMeta ? '' : ' no-meta'}`} key={`${auto ? 'f' : 'm'}${p.id}`}>
        <div className="cside-card-img-box">
          {p.image ? (
            <img src={p.image} alt={p.name} className="cside-card-img-src" />
          ) : (
            <span className="cside-card-img-fallback">{p.emoji}</span>
          )}
          {badge && <span className="cside-badge" style={{ background: badge.color }}>{badge.text}</span>}
          {invalid && <span className="cside-card-invalid">已失效</span>}
        </div>
        {showMeta && (
          <div className="cside-card-meta">
            <span className="cside-name">
              {disp.title}
              {auto && <Tag className="cside-auto-tag" color="blue">自动补位</Tag>}
            </span>
            <span className="cside-price">{priceLine(p)}</span>
          </div>
        )}
      </div>
    );
  };

  const renderRow = (p, disp, auto) => {
    if (!isCoin) return renderProductCard(p, disp, auto);
    const invalid = !isSourceValid(p);
    // 失效/售罄 + 开启「失效隐藏」→ C端直接不展示
    if (invalid && disp.hideWhenInvalid) return null;
    const icon = disp.showIcon ? iconOf(disp.icon) : null;
    const badge = disp.badge && BADGE_META[disp.badge] ? BADGE_META[disp.badge] : null;
    return (
      <div className={`cside-row${invalid ? ' invalid' : ''}`} key={`${auto ? 'f' : 'm'}${p.id}`}>
        {badge && <span className="cside-badge" style={{ background: badge.color }}>{badge.text}</span>}
        <span className="cside-row-main">
          {icon && <span className="cside-icon">{icon}</span>}
          <span>
            <span className="cside-name">
              {disp.title}
              {auto && <Tag className="cside-auto-tag" color="blue">自动补位</Tag>}
              {invalid && <Tag color="error" style={{ marginLeft: 4 }}>已失效</Tag>}
            </span>
            {disp.lineMode === 'double' && disp.subText && (
              <span className="cside-sub">{disp.subText}</span>
            )}
          </span>
        </span>
        <span className="cside-price">{priceLine(p)}</span>
      </div>
    );
  };

  return (
    <div className="cside-phone">
      <div className="cside-screen">
        <div className="cside-title">
          {isCoin ? '游戏币套餐' : '幸运商品'}
          <span className="cside-title-badge">{manualIds.length + fill.length}/{maxItems}</span>
        </div>
        <div className="cside-list">
          {manualItems.map((p) => renderRow(p, resolveDisplay(config, p), false)).filter(Boolean)}
          {fill.map((p) => renderRow(p, resolveDisplay(config, p), true)).filter(Boolean)}
          {manualItems.length + fill.length === 0 && (
            <div className="cside-empty">暂无可展示内容</div>
          )}
        </div>
      </div>
    </div>
  );
}
