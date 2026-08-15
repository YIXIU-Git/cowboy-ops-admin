# 研发交接说明（首页改版一期 · B端配置后台）

> 版本 V2.1 · Ant Design Pro v6 / React 19 / antd 6.6 / Vite 6
> 截止 2026-08-15：原型 + 业务模型已收敛，可正式进入后端对接与权限细化阶段。

---

## 1. 目录结构

```
src/
├── App.jsx                      # 根组件，Tabs + 全局 state (configs, logs)
├── main.jsx                     # ReactDOM + ConfigProvider + zh_CN locale
├── index.css                    # 全局样式 + C端预览样式
├── mock.js                      # 演示数据（门店/套餐/商品/活动 + 初始配置）
├── business.js                  # 业务逻辑层（状态机/补位/冲突/解析）
├── pages/
│   └── modules.jsx              # 4 个 tab 的页面（ItemModule + ActivityModule）
└── components/
    ├── ConfigDrawer.jsx         # 配置抽屉（买币/商品/活动/大厅 共用）
    ├── ui.jsx                   # CsidePreview / DragSortList / StatusTag 等
    ├── BatchModal.jsx           # 批量门店配置弹窗（仅 ItemModule 用）
    └── LogModal.jsx             # 操作日志弹窗
```

---

## 2. 数据模型（核心）

### 2.1 配置对象（4 类共用字段）

```js
{
  id: 'C1',                    // 唯一 ID（新增由 genId('coin') 生成）
  type: 'coin',                // coin | product | activity | hall
  enabled: true,               // 是否上架
  startTime: '2026-08-01 00:00', // null 表示长期有效
  endTime:   '2026-08-31 23:59',
  updater:   '张三',
  updateTime: '2026-08-10 14:20',
}
```

### 2.2 差异化字段

| type | stores | manual | displayConfig | 其他 |
|------|--------|--------|---------------|------|
| coin | `['1','2']` 或 `['ALL']` | `['P1','P2']`（最多 5） | `{ [pkgId]: { lineMode, subText, showIcon, icon, title, badge, hideWhenInvalid } }` | — |
| product | 同上 | `['G1','G3']`（最多 3） | `{ [productId]: { badge, title, showMeta, hideWhenInvalid } }` | — |
| activity | — | — | `{ mode, image, title, subtitle, badge, theme, stats }` | `activityId, scope, specifiedStores, sort, remark` |
| hall | — | — | 同 activity | 同 activity |

### 2.3 状态机（`business.js: STATUS_META`）

```
源对象失效 > 下架(enabled=false) > 时间
  ├─ startTime > now → 未生效(pending)
  ├─ endTime < now   → 已结束(ended)
  └─ 其余            → 生效中(active)
```

### 2.4 冲突规则（`business.js: findConflict`）

- 仅对 coin / product 生效
- 同门店 + 时间段重叠 + 同类型 + 都上架 → 冲突，保存时拦截

---

## 3. 业务规则一览

| 规则 | 实现位置 |
|------|---------|
| 自动补位（买币≤5 / 商品≤3 / 活动不补） | `business.js: autoFill` |
| 同店同段时间冲突拦截 | `business.js: findConflict` |
| 失效/售罄隐藏开关 | `business.js: isSourceValid` + displayConfig.hideWhenInvalid |
| 商品「仅主图」开关 | displayConfig.showMeta=false，C端 1:1 卡片 |
| 活动展示双模式（图文/纯图） | displayConfig.mode='image'/'mixed' |
| 活动对外统计（参与人数/中奖人数） | displayConfig.stats=['participants','winners'] |
| 排序冲突检测 | 已补：ConfigDrawer 保存时校验同 list 重复 sort，重复则 message.error 拦截 |
| 复制配置 | 已补：四大模块操作列「更多」下拉内含复制，复制后默认下架，自动打开编辑抽屉 |
| 删除配置 | 已补：四大模块操作列「更多」下拉内含删除 + Modal 二次确认，删除写入操作日志 |

---

## 4. 已知遗留 / 待优化项

| 优先级 | 项目 | 说明 |
|-------|------|------|
| P2 | 图片上传 | 原型用 FileReader 转 base64（≤2MB 提示已加），真实环境需对接对象存储 / CDN |
| P2 | 数据持久化 | 当前 state 仅内存；接后端时把 App.jsx 的 setConfigs 替换为 API 调用即可 |
| P2 | 鉴权 | 当前「当前运营」写死；接 IAM 时把 hard-code 替换为登录态 |
| P3 | 拖拽排序触屏支持 | DragSortList 用 HTML5 DnD；触屏无效，B端通常桌面使用可暂缓 |

---

## 5. 测试资产

`product-img-test.mjs`（18 断言）+ `activity-test.mjs`（26 断言），覆盖：
- C端预览元素渲染
- 展示配置摘要列
- 抽屉表单控件
- 全局预览（编辑高亮）
- 1:1 商品卡片 / 失效隐藏
- 活动统计浮层 / 纯图模式
- **复制 / 删除 操作列按钮**
- **sort 重复校验拦截**

脚本：`scripts/screenshot-hall.mjs`、`scripts/screenshot-overview.mjs`、`scripts/screenshot-ops.mjs`、`scripts/screenshot-dropdown.mjs`（puppeteer-core 截图）。

---

## 6. 后端对接清单

最小化接口需求（按 4 类拆开）：

```
GET  /api/stores                  # 门店列表（替换 STORES）
GET  /api/packages                # 套餐池（替换 PACKAGES）
GET  /api/products                # 商品池（替换 PRODUCTS）
GET  /api/activities              # 活动池（替换 ACTIVITIES）

GET  /api/configs/:type           # 配置列表（type=coin|product|activity|hall）
POST /api/configs/:type           # 新增
PUT  /api/configs/:type/:id       # 编辑
DELETE /api/configs/:type/:id     # 删除（P1 补功能后启用）

POST /api/upload                  # 图片上传（替换 base64，返回 CDN URL）

GET  /api/logs?type=&page=&size=  # 操作日志（替换 App.jsx 中的 logs state）
```

所有 mock 数据字段（`stores`/`manual`/`displayConfig`/`activityId`/`sort`/`stats`...）即后端 schema。
