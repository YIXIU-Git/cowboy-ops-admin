import { createRequire } from 'module';
const require = createRequire('/Users/zhangxiang/.workbuddy/binaries/node/workspace/node_modules/');
const puppeteer = require('puppeteer-core');
const VISIBLE_DRAWER = '.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1560, height: 900, deviceScaleFactor: 2 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await page.waitForSelector('.ant-tabs-nav');
await new Promise(r => setTimeout(r, 500));
// 切到 首页活动推荐
await page.evaluate(() => {
  const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(t => t.innerText.includes('首页活动推荐'));
  tab.click();
});
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: 'activity-ops.png', fullPage: false });
console.log('saved activity-ops.png');
// 编辑 AC2，把 sort 改成 1 触发校验
await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  [...rows[1].querySelectorAll('button')].find(b => b.innerText.includes('编辑')).click();
});
await page.waitForSelector(`${VISIBLE_DRAWER} .cside-act-card.editing`, { timeout: 6000 });
await new Promise(r => setTimeout(r, 500));
await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  const input = drawer.querySelector('input.ant-input-number-input');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, '1');
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise(r => setTimeout(r, 300));
await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content-wrapper:not(.ant-drawer-content-wrapper-hidden)');
  [...drawer.querySelectorAll('.ant-drawer-footer button')].find(b => b.innerText.replace(/\s+/g, '').includes('保存')).click();
});
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'sort-validation.png', fullPage: false });
console.log('saved sort-validation.png');
await browser.close();
