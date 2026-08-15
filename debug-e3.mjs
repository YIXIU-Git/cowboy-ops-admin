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
await new Promise(r => setTimeout(r, 1000));
const info = await page.evaluate(() => {
  const pane = document.querySelector('.ant-tabs [role="tabpanel"].ant-tabs-content-active');
  const rows = [...pane.querySelectorAll('.ant-table-tbody .ant-table-row')];
  return rows.map((row, i) => {
    const btns = [...row.querySelectorAll('button')].map(b => b.innerText.trim());
    const firstTd = row.querySelector('td')?.innerText.trim();
    return { i, firstTd, btns };
  });
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
