const path = require('path');
const assert = require('assert');
const puppeteer = require('puppeteer');

const pathToExtension = path.join(__dirname, '../dist');
const launchOptions = {
  headless: false,
  slowMo: 50,
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
};

let browser;

before(async () => {
  browser = await puppeteer.launch(launchOptions);
});

after(function () {
  browser.close();
});

describe('Pop-up', function () {
  this.timeout(10000);
  describe('One page', function () {
    let page;

    beforeEach(async () => {
      [page] = await browser.pages();
      await page.goto('https://www.wikipedia.org');
    });

    async function popupOpens() {
      await page.keyboard.down('Alt');
      await page.keyboard.press('KeyY');

      const display = await page.$eval('.popup-tab-switcher', popup => getComputedStyle(popup).getPropertyValue('display'));
      assert.notStrictEqual(display, 'none', 'popup visible');
    }

    it('opens on "Alt+Y"', popupOpens);

    it('works after page reload', popupOpens);

    it('hides on "Alt" release', async () => {
      await popupOpens();

      await page.keyboard.up('Alt');
      const display = await page.$eval('.popup-tab-switcher', popup => getComputedStyle(popup).getPropertyValue('display'));
      assert.strictEqual(display, 'none', 'popup hidden');
    });
  });
});
