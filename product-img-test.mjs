// 角标/标题/失效隐藏/商品主图 冒烟 v5
// 关键点：
// 1) antd 6.6.0 使用 @rc-component/tabs，pane 类名 .ant-tabs-content(+active/hidden)，查询限定激活 pane
// 2) antd v6 Drawer 关闭后 wrapper 仍驻留 DOM，查询限定 :not(.ant-drawer-content-wrapper-hidden)
// 3) 商品模块预览为主图卡片 .cside-card-img；买币为文字卡片 .cside-row
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

// ===== A. 买币模块（回归：双行/图标/角标/标题） =====
const c1Summary = await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const ths = [...pane.querySelectorAll('.ant-table-thead th')];
  const idx = ths.findIndex((th) => th.innerText.trim().includes('展示配置'));
  const row = pane.querySelector('.ant-table-tbody .ant-table-row');
  return row.querySelectorAll('td')[idx].innerText.replace(/\n+/g, ' ');
});
check('A1 C1 摘要含双行/图标/角标/标题', /双行×5/.test(c1Summary) && /图标全开/.test(c1Summary) && /角标×2/.test(c1Summary) && /标题×1/.test(c1Summary), c1Summary);

await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const row = pane.querySelector('.ant-table-tbody .ant-table-row');
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('编辑')).click();
});
await page.waitForSelector(`${VISIBLE_DRAWER} .cside-phone`, { timeout: 6000 });
await new Promise((r) => setTimeout(r, 500));

const c1Preview = await page.evaluate(() => {
  const phone = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden) .cside-phone');
  const rows = [...phone.querySelectorAll('.cside-row')].filter((r) => !r.querySelector('.cside-auto-tag'));
  return {
    cardCount: rows.length,
    isMainImgCard: phone.querySelectorAll('.cside-card-img').length > 0, // 买币不应有主图卡片
    badges: rows.slice(0, 3).map((r) => r.querySelector('.cside-badge')?.innerText || null),
    names: rows.slice(0, 3).map((r) => r.querySelector('.cside-name')?.innerText.replace(/\n+/g, ' ').trim()),
  };
});
check('A2 买币预览为文字卡片(无主图卡片)', c1Preview.cardCount === 5 && c1Preview.isMainImgCard === false, `cards=${c1Preview.cardCount}`);
check('A3 买币角标 HOT/限时 生效', c1Preview.badges[0] === 'HOT' && c1Preview.badges[2] === '限时', JSON.stringify(c1Preview.badges));
check('A4 买币自定义标题生效', c1Preview.names[1] === '暑期特惠包', JSON.stringify(c1Preview.names));

const c1Ctrls = await page.evaluate(() => {
  const first = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden) .disp-row');
  return {
    selectCount: first.querySelectorAll('.ant-select').length,
    switchCount: first.querySelectorAll('.ant-switch').length,
    lineModeSelect: !!first.querySelector('input[placeholder*="副文案"]'),
  };
});
check('A5 买币抽屉控件(3Select+2Switch+副文案)', c1Ctrls.selectCount === 3 && c1Ctrls.switchCount === 2 && c1Ctrls.lineModeSelect, JSON.stringify(c1Ctrls));
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 600));

// ===== B. 商品模块（主图卡片） =====
const prTabBox = await page.evaluate(() => {
  const tab = [...document.querySelectorAll('.ant-tabs-tab')].find((t) => t.innerText.includes('商品推荐'));
  const r = tab.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.click(prTabBox.x, prTabBox.y);
await new Promise((r) => setTimeout(r, 800));

const pr2Summary = await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const ths = [...pane.querySelectorAll('.ant-table-thead th')];
  const idx = ths.findIndex((th) => th.innerText.trim().includes('展示配置'));
  const row = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')][1]; // PR2
  return row.querySelectorAll('td')[idx].innerText.replace(/\n+/g, ' ');
});
check('B1 PR2 摘要为 角标×1 失效隐藏×1 仅主图×1(无双行/图标)', /角标×1/.test(pr2Summary) && /失效隐藏×1/.test(pr2Summary) && /仅主图×1/.test(pr2Summary) && !/双行|单行|图标/.test(pr2Summary), pr2Summary);

await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  const row = rows[1]; // PR2
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('编辑')).click();
});
await page.waitForSelector(`${VISIBLE_DRAWER} .cside-phone`, { timeout: 6000 });
await new Promise((r) => setTimeout(r, 500));

const pr2Preview = await page.evaluate(() => {
  const phone = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden) .cside-phone');
  const cards = [...phone.querySelectorAll('.cside-card-img')].filter((c) => !c.querySelector('.cside-auto-tag'));
  return {
    cardCount: cards.length,
    imgCount: cards.filter((c) => c.querySelector('img.cside-card-img-src')).length,
    imgSrc: cards[0]?.querySelector('img')?.getAttribute('src') || null,
    badges: cards.map((c) => c.querySelector('.cside-badge')?.innerText || null),
    names: cards.map((c) => c.querySelector('.cside-name')?.innerText.replace(/\n+/g, ' ').trim() || null),
    metaCount: cards.filter((c) => c.querySelector('.cside-card-meta')).length, // 显示信息开关：仅 G4 有 meta
    g2Hidden: !cards.some((c) => (c.querySelector('.cside-name')?.innerText || '').includes('金币巧克力')),
    noMetaRect: cards[1] ? { w: Math.round(cards[1].getBoundingClientRect().width), h: Math.round(cards[1].getBoundingClientRect().height) } : null, // G9 钥匙扣 showMeta:false → 1:1
  };
});
check('B2 商品预览为主图卡片×2', pr2Preview.cardCount === 2, `cards=${pr2Preview.cardCount}`);
check('B3 卡片均有主图(img)', pr2Preview.imgCount === 2 && (pr2Preview.imgSrc || '').startsWith('data:image/svg+xml'), pr2Preview.imgSrc);
check('B4 第一卡 HOT 角标', pr2Preview.badges[0] === 'HOT', JSON.stringify(pr2Preview.badges));
check('B5 商品名: G4有名字, G9仅主图无名字', pr2Preview.names[0] === '幸运刮刮卡' && pr2Preview.names[1] === null, JSON.stringify(pr2Preview.names));
check('B6 G2(金币巧克力) 售罄被隐藏', pr2Preview.g2Hidden === true, JSON.stringify(pr2Preview.names));
check('B8 仅主图卡片×1(仅G4带meta)', pr2Preview.metaCount === 1, `meta=${pr2Preview.metaCount}`);
check('B9 仅主图卡片宽高 1:1', pr2Preview.noMetaRect && pr2Preview.noMetaRect.w === pr2Preview.noMetaRect.h, JSON.stringify(pr2Preview.noMetaRect));

const pr2Ctrls = await page.evaluate(() => {
  const first = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden) .disp-row');
  return {
    selectCount: first.querySelectorAll('.ant-select').length,
    switchCount: first.querySelectorAll('.ant-switch').length,
    hasLineMode: !!first.querySelector('input[placeholder*="副文案"]'),
    hasHideToggle: !!first.querySelector('.disp-hide-toggle'),
    titlePlaceholder: first.querySelector('input')?.getAttribute('placeholder') || null,
  };
});
check('B7 商品抽屉控件(1Select+2Switch:角标/显示信息/失效隐藏,无副文案)', pr2Ctrls.selectCount === 1 && pr2Ctrls.switchCount === 2 && !pr2Ctrls.hasLineMode && pr2Ctrls.hasHideToggle, JSON.stringify(pr2Ctrls));

// ===== F. 买币/商品 操作列含 编辑/更多 + 下拉含复制/删除 =====
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 600));
const prOps = await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const row = pane.querySelector('.ant-table-tbody .ant-table-row');
  return [...row.querySelectorAll('button')].map((b) => b.innerText.replace(/\s+/g, '').trim());
});
check('F1 商品操作列含 编辑/更多', prOps.some((b) => b.includes('编辑')) && prOps.some((b) => b.includes('更多')), JSON.stringify(prOps));

await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const row = pane.querySelector('.ant-table-tbody .ant-table-row');
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('更多')).click();
});
await page.waitForSelector('.ant-dropdown:not(.ant-dropdown-hidden)', { timeout: 6000 });
await new Promise((r) => setTimeout(r, 300));
const prDropItems = await page.evaluate(() => {
  const menu = document.querySelector('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu');
  return [...menu.querySelectorAll('.ant-dropdown-menu-item')].map((i) => i.innerText.replace(/\s+/g, '').trim());
});
check('F1b 商品更多下拉含 复制/删除', prDropItems.some((t) => t.includes('复制')) && prDropItems.some((t) => t.includes('删除')), JSON.stringify(prDropItems));

const coinTabBox = await page.evaluate(() => {
  const tab = [...document.querySelectorAll('.ant-tabs-tab')].find((t) => t.innerText.includes('买币推荐'));
  const r = tab.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.click(coinTabBox.x, coinTabBox.y);
await new Promise((r) => setTimeout(r, 800));
const coinOps = await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const row = pane.querySelector('.ant-table-tbody .ant-table-row');
  return [...row.querySelectorAll('button')].map((b) => b.innerText.replace(/\s+/g, '').trim());
});
check('F2 买币操作列含 编辑/更多', coinOps.some((b) => b.includes('编辑')) && coinOps.some((b) => b.includes('更多')), JSON.stringify(coinOps));

await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const row = pane.querySelector('.ant-table-tbody .ant-table-row');
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('更多')).click();
});
await page.waitForSelector('.ant-dropdown:not(.ant-dropdown-hidden)', { timeout: 6000 });
await new Promise((r) => setTimeout(r, 300));
const coinDropItems = await page.evaluate(() => {
  const menu = document.querySelector('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu');
  return [...menu.querySelectorAll('.ant-dropdown-menu-item')].map((i) => i.innerText.replace(/\s+/g, '').trim());
});
check('F2b 买币更多下拉含 复制/删除', coinDropItems.some((t) => t.includes('复制')) && coinDropItems.some((t) => t.includes('删除')), JSON.stringify(coinDropItems));

await page.screenshot({ path: '/Users/zhangxiang/WorkBuddy/2026-08-14-16-56-51/product-img-preview.png', fullPage: false });
await browser.close();

const pass = assertions.filter(([, ok]) => ok).length;
console.log(`\n===== 结果: ${pass}/${assertions.length} 通过 =====`);
console.log('错误:', errors.length ? errors : '无');
process.exit(pass === assertions.length && errors.length === 0 ? 0 : 1);
