// 抽屉重构冒烟：宽度 800 + footer 按钮 + 两栏布局 + 预览在右栏
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
await new Promise((r) => setTimeout(r, 500));

// 布局断言
const layout = await page.evaluate(() => {
  const drawer = document.querySelector('.ant-drawer-content');
  const footer = document.querySelector('.ant-drawer-footer');
  const layoutEl = document.querySelector('.ant-drawer-body .drawer-layout');
  const left = document.querySelector('.ant-drawer-body .drawer-col-left');
  const right = document.querySelector('.ant-drawer-body .drawer-col-right');
  const preview = right ? right.querySelector('.cside-phone') : null;
  const formInLeft = left ? !!left.querySelector('form.ant-form') : false;
  const btns = footer ? [...footer.querySelectorAll('button')].map((b) => b.innerText.trim()) : [];
  return {
    drawerWidth: drawer ? Math.round(drawer.getBoundingClientRect().width) : null,
    hasFooter: !!footer,
    footerBtns: btns,
    hasTwoCol: !!layoutEl && !!left && !!right,
    previewInRightCol: !!preview,
    formInLeftCol: formInLeft,
    rightColWidth: right ? Math.round(right.getBoundingClientRect().width) : null,
    leftColWidth: left ? Math.round(left.getBoundingClientRect().width) : null,
    previewInsideForm: !!document.querySelector('.ant-drawer form .cside-phone'),
  };
});
console.log('布局:', JSON.stringify(layout, null, 2));

// 交互联动仍正常：第一个套餐切单行
await page.evaluate(() => {
  const sel = document.querySelector('.ant-drawer .disp-row .ant-select-content') ||
              document.querySelector('.ant-drawer .disp-row .ant-select-selector');
  if (sel) {
    sel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    sel.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    sel.click();
  }
  return !!sel;
});
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => {
  const dd = document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
  const leaf = [...dd.querySelectorAll('.ant-select-item-option-content, .ant-select-item')]
    .find((i) => i.textContent.trim() === '单行展示');
  if (leaf) leaf.click();
  return !!leaf;
});
await new Promise((r) => setTimeout(r, 700));

const after = await page.evaluate(() => {
  const phone = document.querySelector('.ant-drawer .cside-phone');
  const manual = [...phone.querySelectorAll('.cside-row')].filter((r) => !r.querySelector('.cside-auto-tag'));
  const first = manual[0];
  return {
    manualCount: manual.length,
    firstHasSub: !!first.querySelector('.cside-sub'),
    firstHasIcon: !!first.querySelector('.cside-icon'),
    firstText: first.innerText.replace(/\n+/g, ' | '),
  };
});
console.log('联动断言:', JSON.stringify(after, null, 2));

await page.screenshot({ path: '/tmp/drawer-layout.png' });
await browser.close();
console.log('错误:', errors.length ? errors : '无');
