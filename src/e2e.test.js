const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const pathToExtension = path.join(__dirname, '../dist');
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });
  const [page] = await browser.pages();
  await page.goto('https://www.wikipedia.org');
  await page.keyboard.down('Alt');
  await page.keyboard.press('KeyY');
  await page.keyboard.up('Alt');

  browser.close();
})();
