// 首页活动推荐 C端预览 + 展示配置 冒烟 v1
// 关键点：
// 1) antd 6.6.0 使用 @rc-component/tabs，pane 类名 .ant-tabs-content(+active/hidden)，查询限定激活 pane
// 2) antd v6 Drawer 关闭后 wrapper 仍驻留 DOM，查询限定 :not(.ant-drawer-content-wrapper-hidden)
// 3) 活动抽屉右侧应有 C端预览 .cside-act-card（左文案右封面）
import { createRequire } from 'node:module';
const require = createRequire('/Users/zhangxiang/.workbuddy/binaries/node/workspace/node_modules/');
const puppeteer = require('puppeteer-core');

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });

const VISIBLE_DRAWER = '.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)';

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('.ant-tabs-nav', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 400));

const assertions = [];
const check = (name, ok, extra = '') => {
  assertions.push([name, !!ok, extra]);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`);
};

// ===== 切到「首页活动推荐」Tab =====
const actTabBox = await page.evaluate(() => {
  const tab = [...document.querySelectorAll('.ant-tabs-tab')].find((t) => t.innerText.includes('首页活动推荐'));
  const r = tab.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.click(actTabBox.x, actTabBox.y);
await new Promise((r) => setTimeout(r, 800));

// ===== C1. 表格「展示配置」列存在 =====
const summaryColIdx = await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const ths = [...pane.querySelectorAll('.ant-table-thead th')];
  return ths.findIndex((th) => th.innerText.trim().includes('展示配置'));
});
check('C1 活动表格有展示配置列', summaryColIdx >= 0, `idx=${summaryColIdx}`);

const ac2Summary = await page.evaluate((idx) => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const row = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')][1]; // AC2
  return row.querySelectorAll('td')[idx].innerText.replace(/\n+/g, ' ');
}, summaryColIdx);
check('C2 AC2 摘要含 角标/主标题/副标题/主题/对外数据', /角标/.test(ac2Summary) && /主标题/.test(ac2Summary) && /副标题/.test(ac2Summary) && /主题warm/.test(ac2Summary) && /对外数据/.test(ac2Summary), ac2Summary);

const ac4Summary = await page.evaluate((idx) => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const row = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')][3]; // AC4
  return row.querySelectorAll('td')[idx].innerText.replace(/\n+/g, ' ');
}, summaryColIdx);
check('C2b AC4 摘要含 纯图模式/自定义图', /纯图模式/.test(ac4Summary) && /自定义图/.test(ac4Summary), ac4Summary);

// ===== C3. 编辑 AC2 → 抽屉右侧活动入口预览 =====
await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  const row = rows[1]; // AC2
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('编辑')).click();
});
await page.waitForSelector(`${VISIBLE_DRAWER} .cside-act-card.editing`, { timeout: 6000 });
await new Promise((r) => setTimeout(r, 500));

const actPreview = await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  const cards = [...drawer.querySelectorAll('.cside-act-card')];
  const editingCard = drawer.querySelector('.cside-act-card.editing');
  const title = editingCard?.querySelector('.cside-act-title')?.innerText || null;
  const sub = editingCard?.querySelector('.cside-act-sub')?.innerText || null;
  const badge = editingCard?.querySelector('.cside-act-badge')?.innerText || null;
  const stats = [...(editingCard?.querySelectorAll('.cside-act-stat') || [])].map((s) => s.innerText);
  const img = editingCard?.querySelector('img.cside-act-img');
  return {
    cardsCount: cards.length,
    hasEditing: !!editingCard,
    editingTag: !!editingCard?.querySelector('.cside-act-editing-tag'),
    title, sub, badge, stats,
    imgOk: !!img && (img.getAttribute('src') || '').startsWith('data:image/svg+xml'),
    bg: editingCard ? (editingCard.style.background || '') : '',
    hasRightPreview: !!drawer.querySelector('.drawer-col-right .drawer-preview'),
  };
});
check('C3 活动抽屉显示 C端预览区', actPreview.hasRightPreview === true);
check('D1 全局列表卡片数>=4(AC1/AC2/AC3/AC4)', actPreview.cardsCount >= 4, `cards=${actPreview.cardsCount}`);
check('D2 编辑项高亮且带「编辑中」标签', actPreview.hasEditing === true && actPreview.editingTag === true);
check('C4 编辑卡标题=周末嗨翻天', actPreview.title === '周末嗨翻天', actPreview.title);
check('C5 编辑卡副标题=双倍积分限时开启', actPreview.sub === '双倍积分限时开启', actPreview.sub);
check('C6 编辑卡角标=限时', actPreview.badge === '限时', actPreview.badge);
check('C7 编辑卡封面图(svg占位)', actPreview.imgOk === true);
check('C8 编辑卡背景为暖色渐变(warm)', actPreview.bg.includes('250, 84, 28') || actPreview.bg.includes('fa541c'), actPreview.bg);
check('C15 AC2 卡片展示参与人数/中奖人数', actPreview.stats.length >= 2 && actPreview.stats.some((s) => s.includes('参与人数')) && actPreview.stats.some((s) => s.includes('中奖人数')), JSON.stringify(actPreview.stats));

// ===== C9. 抽屉展示样式控件（主标题/副标题/角标/主题） =====
const actCtrls = await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  const inputs = [...drawer.querySelectorAll('input')].map((i) => i.getAttribute('placeholder') || '');
  return {
    titleInput: inputs.some((p) => p.includes('默认使用活动名称')),
    subInput: inputs.some((p) => p.includes('默认使用活动描述')),
    selectCount: drawer.querySelectorAll('.ant-select').length,
    hasThemeSelect: [...drawer.querySelectorAll('.ant-select')].some((s) => s.innerText.includes('渐变')),
  };
});
check('C9 活动抽屉含 主标题/副标题 输入', actCtrls.titleInput && actCtrls.subInput, JSON.stringify(actCtrls));
check('C10 活动抽屉含 角标/主题 选择器', actCtrls.hasThemeSelect && actCtrls.selectCount >= 3, `select=${actCtrls.selectCount}`);

// ===== C15b. 抽屉含对外展示数据复选框且已勾选两项 =====
const statsCtrls = await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  const boxes = [...drawer.querySelectorAll('.ant-checkbox-wrapper')];
  const checked = boxes.filter((b) => b.querySelector('.ant-checkbox-checked'));
  return {
    labels: boxes.map((b) => b.innerText.trim()),
    checkedLabels: checked.map((b) => b.innerText.trim()),
  };
});
check('C15b 抽屉含参与人数/中奖人数复选框且已勾选', statsCtrls.labels.some((t) => t.includes('参与人数')) && statsCtrls.labels.some((t) => t.includes('中奖人数')) && statsCtrls.checkedLabels.length >= 2, JSON.stringify(statsCtrls));

// ===== C11. 编辑 AC4 → 纯图片模式预览 =====
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  const row = rows[3]; // AC4
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('编辑')).click();
});
await page.waitForSelector(`${VISIBLE_DRAWER} .cside-act-card.editing.image-mode`, { timeout: 6000 });
await new Promise((r) => setTimeout(r, 500));

const ac4Preview = await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  const card = drawer.querySelector('.cside-act-card.editing.image-mode');
  return {
    isEditing: card?.classList.contains('editing'),
    isImageMode: card?.classList.contains('image-mode'),
    hasFullImg: !!card?.querySelector('img.cside-act-img-full'),
    noText: !card?.querySelector('.cside-act-title'),
  };
});
check('C11 AC4 预览为 image-mode 且高亮', ac4Preview.isImageMode === true && ac4Preview.isEditing === true);
check('C12 AC4 预览含全图', ac4Preview.hasFullImg === true);
check('C13 AC4 预览无标题文字', ac4Preview.noText === true);

// ===== C14. AC4 抽屉展示模式 = 纯图片模式 =====
const ac4Ctrls = await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  const radios = [...drawer.querySelectorAll('.ant-radio-wrapper')].map((r) => r.innerText.trim());
  const checkedRadio = [...drawer.querySelectorAll('.ant-radio-wrapper-checked')].map((r) => r.innerText.trim());
  return { radios, checkedRadio };
});
check('C14 AC4 抽屉展示模式为纯图片模式', ac4Ctrls.checkedRadio.some((t) => t.includes('纯图片')), JSON.stringify(ac4Ctrls));

// ===== C16. 纯图片模式卡片也支持对外数据浮层 =====
const ac4Stats = await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  const card = drawer.querySelector('.cside-act-card.editing.image-mode');
  const overlay = card?.querySelector('.cside-act-stats.overlay');
  return {
    hasOverlay: !!overlay,
    text: overlay?.innerText || '',
  };
});
check('C16 AC4 纯图模式含底部统计浮层', ac4Stats.hasOverlay === true && /参与人数/.test(ac4Stats.text), ac4Stats.text);

// ===== E1. 操作列含 编辑 + 更多下拉 =====
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 600));
const actOps = await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const row = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')][0];
  return [...row.querySelectorAll('button')].map((b) => b.innerText.replace(/\s+/g, '').trim());
});
check('E1 活动操作列含 编辑/更多', actOps.some((b) => b.includes('编辑')) && actOps.some((b) => b.includes('更多')), JSON.stringify(actOps));

await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const row = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')][0];
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('更多')).click();
});
await page.waitForSelector('.ant-dropdown:not(.ant-dropdown-hidden)', { timeout: 6000 });
await new Promise((r) => setTimeout(r, 300));
const actDropItems = await page.evaluate(() => {
  const menu = document.querySelector('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu');
  return [...menu.querySelectorAll('.ant-dropdown-menu-item')].map((i) => i.innerText.replace(/\s+/g, '').trim());
});
check('E1b 更多下拉含 复制/删除', actDropItems.some((t) => t.includes('复制')) && actDropItems.some((t) => t.includes('删除')), JSON.stringify(actDropItems));

// ===== E2. 点击复制 → 行数+1 且抽屉打开 =====
const beforeRows = await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  return pane.querySelectorAll('.ant-table-tbody .ant-table-row').length;
});
await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  const row = rows[1]; // AC2
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('更多')).click();
});
await page.waitForSelector('.ant-dropdown:not(.ant-dropdown-hidden)', { timeout: 6000 });
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const menu = document.querySelector('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu');
  [...menu.querySelectorAll('.ant-dropdown-menu-item')].find((i) => i.innerText.includes('复制')).click();
});
await page.waitForSelector(`${VISIBLE_DRAWER}`, { timeout: 6000 });
await new Promise((r) => setTimeout(r, 500));
const copyState = await page.evaluate((before) => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = pane.querySelectorAll('.ant-table-tbody .ant-table-row').length;
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  const title = drawer?.querySelector('.ant-drawer-title')?.innerText || '';
  const enabledSwitch = drawer?.querySelector('.ant-switch');
  const switchOff = enabledSwitch && !enabledSwitch.classList.contains('ant-switch-checked');
  return { rows, title, switchOff };
}, beforeRows);
check('E2 复制后表格行数+1', copyState.rows === beforeRows + 1, `rows=${copyState.rows} (before=${beforeRows})`);
check('E2b 复制打开抽屉且新配置默认下架', copyState.title.includes('编辑配置') && copyState.switchOff === true, JSON.stringify(copyState));

// ===== E3. sort 重复校验：编辑 AC2 改 sort=1 保存被拦截 =====
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  const row = rows[1]; // AC2
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('编辑')).click();
});
await page.waitForSelector(`${VISIBLE_DRAWER} .cside-act-card.editing`, { timeout: 6000 });
await new Promise((r) => setTimeout(r, 500));
await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  const input = drawer.querySelector('input.ant-input-number-input');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, '1'); // 与 AC1 的 sort=1 冲突
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  [...drawer.querySelectorAll('.ant-drawer-footer button')].find((b) => b.innerText.replace(/\s+/g, '').includes('保存')).click();
});
await new Promise((r) => setTimeout(r, 800));
const dupResult = await page.evaluate(() => {
  const notice = [...document.querySelectorAll('.ant-message-notice')].map((n) => n.innerText);
  const drawerOpen = !!document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden) .cside-act-card.editing');
  return { notice: notice.join('|'), drawerOpen };
});
check('E3 sort重复保存被拦截且抽屉未关闭', dupResult.drawerOpen === true && /占用/.test(dupResult.notice), dupResult.notice);

// ===== E4. 删除：确认后行数-1 =====
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 600));
const rowsBeforeDel = await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  return pane.querySelectorAll('.ant-table-tbody .ant-table-row').length;
});
await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  // 找最后一行（E2 复制出来的新行）删除
  const row = rows[rows.length - 1];
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('更多')).click();
});
await page.waitForSelector('.ant-dropdown:not(.ant-dropdown-hidden)', { timeout: 6000 });
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const menu = document.querySelector('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu');
  [...menu.querySelectorAll('.ant-dropdown-menu-item')].find((i) => i.innerText.includes('删除')).click();
});
await page.waitForSelector('.ant-modal-wrap:not(.ant-modal-wrap-hidden)', { timeout: 6000 });
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const modal = document.querySelector('.ant-modal-wrap:not(.ant-modal-wrap-hidden)');
  [...modal.querySelectorAll('button')].find((b) => b.innerText.replace(/\s+/g, '').includes('删除')).click();
});
await new Promise((r) => setTimeout(r, 800));
const rowsAfterDel = await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  return pane.querySelectorAll('.ant-table-tbody .ant-table-row').length;
});
check('E4 删除确认后行数-1', rowsAfterDel === rowsBeforeDel - 1, `rows=${rowsAfterDel} (before=${rowsBeforeDel})`);

await page.screenshot({ path: '/Users/zhangxiang/WorkBuddy/2026-08-14-16-56-51/activity-preview.png', fullPage: false });
await browser.close();

const pass = assertions.filter(([, ok]) => ok).length;
console.log(`\n===== 结果: ${pass}/${assertions.length} 通过 =====`);
console.log('错误:', errors.length ? errors : '无');
process.exit(pass === assertions.length && errors.length === 0 ? 0 : 1);
