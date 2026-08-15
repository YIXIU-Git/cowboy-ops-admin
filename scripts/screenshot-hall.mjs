import { createRequire } from 'module';
const require = createRequire('/Users/zhangxiang/.workbuddy/binaries/node/workspace/node_modules/');
const puppeteer = require('puppeteer-core');

const VISIBLE_DRAWER = '.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1560, height: 900, deviceScaleFactor: 2 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await page.waitForSelector('.ant-tabs-nav', { timeout: 15000 });
await new Promise(r => setTimeout(r, 600));

// 点 活动大厅配置 tab
await page.evaluate(() => {
  const tab = [...document.querySelectorAll('.ant-tabs-tab')].find((t) => t.innerText.includes('活动大厅配置'));
  if (tab) tab.click();
});
await new Promise(r => setTimeout(r, 800));

// 点 H2 的 编辑 按钮
await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  const row = rows[1]; // H2
  [...row.querySelectorAll('button')].find((b) => b.innerText.includes('编辑')).click();
});
await page.waitForSelector(`${VISIBLE_DRAWER} .cside-act-card.editing`, { timeout: 10000 });
await new Promise(r => setTimeout(r, 1000));

await page.screenshot({ path: 'activity-hall-global.png', fullPage: false });
console.log('saved activity-hall-global.png');
await browser.close();
