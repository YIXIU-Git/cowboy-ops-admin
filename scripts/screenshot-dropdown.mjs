import { createRequire } from 'module';
const require = createRequire('/Users/zhangxiang/.workbuddy/binaries/node/workspace/node_modules/');
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1560, height: 900, deviceScaleFactor: 2 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await page.waitForSelector('.ant-tabs-nav');
await new Promise(r => setTimeout(r, 500));
await page.evaluate(() => {
  const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(t => t.innerText.includes('首页活动推荐'));
  tab.click();
});
await new Promise(r => setTimeout(r, 800));
await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const row = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')][0];
  [...row.querySelectorAll('button')].find(b => b.innerText.includes('更多')).click();
});
await page.waitForSelector('.ant-dropdown:not(.ant-dropdown-hidden)', { timeout: 6000 });
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: 'dropdown-ops.png', fullPage: false });
console.log('saved dropdown-ops.png');
await browser.close();
