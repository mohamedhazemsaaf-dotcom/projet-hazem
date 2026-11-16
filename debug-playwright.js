const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE_ERROR:', msg.text());
  });
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('canvas count:', await page.locator('#canvas-container canvas').count());
  console.log('body innerText length:', (await page.locator('body').innerText()).length);
  console.log('title:', await page.title());
  await browser.close();
})();
