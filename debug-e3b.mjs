import { createRequire } from 'module';
const require = createRequire('/Users/zhangxiang/.workbuddy/binaries/node/workspace/node_modules/');
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await page.waitForSelector('.ant-tabs-nav');
await new Promise(r => setTimeout(r, 400));
await page.evaluate(() => {
  const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(t => t.innerText.includes('首页活动推荐'));
  tab.click();
});
await new Promise(r => setTimeout(r, 800));
// 复制 AC2
await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  [...rows[1].querySelectorAll('button')].find(b => b.innerText.includes('复制')).click();
});
await new Promise(r => setTimeout(r, 500));
await page.keyboard.press('Escape');
await new Promise(r => setTimeout(r, 600));
// 编辑 AC2
await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  [...rows[1].querySelectorAll('button')].find(b => b.innerText.includes('编辑')).click();
});
await new Promise(r => setTimeout(r, 1200));
const info = await page.evaluate(() => {
  const wrappers = [...document.querySelectorAll('.ant-drawer-content-wrapper')];
  return wrappers.map((w, i) => {
    const footerBtns = [...w.querySelectorAll('.ant-drawer-footer button')].map(b => b.innerText.trim());
    const hasEditingCard = !!w.querySelector('.cside-act-card.editing');
    const hidden = w.classList.contains('ant-drawer-content-wrapper-hidden');
    return { i, hidden, footerBtns, hasEditingCard };
  });
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
