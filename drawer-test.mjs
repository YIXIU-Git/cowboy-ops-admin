// 交互冒烟 v3：编辑 C1 → 第1个套餐切单行+关图标 → 验证手机预览联动
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

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('.ant-table-tbody .ant-table-row', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 300));

// 打开编辑 C1
const editClicked = await page.evaluate(() => {
  const row = document.querySelector('.ant-table-tbody .ant-table-row');
  const btn = row && [...row.querySelectorAll('button')].find((b) => b.innerText.includes('编辑'));
  if (btn) { btn.click(); return true; }
  return false;
});
console.log('编辑按钮点击:', editClicked);
await page.waitForSelector('.ant-drawer .disp-row', { timeout: 8000 });
await new Promise((r) => setTimeout(r, 300));

// 1) 第一个套餐 双行 → 单行
await page.evaluate(() => {
  const sel = document.querySelector('.ant-drawer .disp-row .ant-select-content') ||
              document.querySelector('.ant-drawer .disp-row .ant-select-selector');
  if (sel) {
    sel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    sel.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    sel.click();
  }
  return !!sel;
}).then((ok) => console.log('下拉点击:', ok));
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => {
  const dd = document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
  const leaf = [...dd.querySelectorAll('.ant-select-item-option-content, .ant-select-item')]
    .find((i) => i.textContent.trim() === '单行展示');
  if (leaf) leaf.click();
  return !!leaf;
}).then((ok) => console.log('单行选项点击:', ok));
await new Promise((r) => setTimeout(r, 700));

// 2) 第一个套餐 关图标
const swClicked = await page.evaluate(() => {
  const row = document.querySelector('.ant-drawer .disp-row');
  const sw = row.querySelector('.ant-switch');
  if (!sw) return 'no-switch';
  sw.click();
  return 'clicked';
});
console.log('图标开关点击:', swClicked);
await new Promise((r) => setTimeout(r, 700));

// 3) 手机预览断言
const after = await page.evaluate(() => {
  const phone = document.querySelector('.ant-drawer .cside-phone');
  const manual = [...phone.querySelectorAll('.cside-row')].filter((r) => !r.querySelector('.cside-auto-tag'));
  const first = manual[0];
  return {
    manualCount: manual.length,
    firstHasSub: !!first.querySelector('.cside-sub'),
    firstHasIcon: !!first.querySelector('.cside-icon'),
    firstText: first.innerText.replace(/\n+/g, ' | '),
    secondText: manual[1] ? manual[1].innerText.replace(/\n+/g, ' | ') : null,
  };
});
await page.screenshot({ path: '/tmp/drawer-final.png' });
await browser.close();
console.log(JSON.stringify({ after, errors }, null, 2));
