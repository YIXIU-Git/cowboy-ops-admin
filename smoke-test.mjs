// 运行时冒烟测试：用 puppeteer-core + 本机 Chrome 打开预览服务，
// 收集 console 错误，截图确认页面真实渲染。
import { createRequire } from 'node:module';
const require = createRequire('/Users/zhangxiang/.workbuddy/binaries/node/workspace/node_modules/');
const puppeteer = require('puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:4173/';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

const errors = [];
const page = await browser.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
page.on('response', (res) => {
  if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`);
});

await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));

// 等待应用真正渲染：Tabs 标签存在
try {
  await page.waitForSelector('.ant-tabs-nav', { timeout: 8000 });
} catch {
  errors.push('[render] 未找到 .ant-tabs-nav，应用可能未渲染');
}

const title = await page.title();
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200).replace(/\n+/g, ' | '));
const tabCount = await page.evaluate(() => document.querySelectorAll('.ant-tabs-tab').length);
const rowCount = await page.evaluate(() => document.querySelectorAll('.ant-table-row').length);

await page.screenshot({ path: '/Users/zhangxiang/WorkBuddy/2026-08-14-16-56-51/smoke-shot.png', fullPage: false });
await browser.close();

console.log(JSON.stringify({ title, tabCount, rowCount, bodyText, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
