const path = require('path');
const assert = require('assert');
const puppeteer = require('puppeteer');

const pathToExtension = path.join(__dirname, '../build-e2e');
const launchOptions = {
  headless: false,
  slowMo: 20,
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

function getPagePath(pageName) {
  return `file:${path.join(__dirname, 'web-pages', pageName, 'index.html')}`;
}

async function openPopup(page) {
  await page.keyboard.down('Alt');
  await page.keyboard.press('KeyY');
}

async function closeTabs() {
  await Promise.all((await browser.pages()).map(p => p.close()));
}

describe('Pop-up', function () {
  this.timeout(10000);
  describe('One page', function () {
    let page;

    after(closeTabs);

    beforeEach(async () => {
      [page] = await browser.pages();
      await page.goto(getPagePath('wikipedia'));
    });

    async function popupOpens() {
      await openPopup(page);

      const display = await page.$eval('.popup-tab-switcher', popup => getComputedStyle(popup)
        .getPropertyValue('display'));
      assert.notStrictEqual(display, 'none', 'popup visible');
    }

    it('Opens on "Alt+Y"', popupOpens);

    it('Works after page reload', popupOpens);

    it('Hides on "Alt" release', async () => {
      await popupOpens();

      await page.keyboard.up('Alt');
      const display = await page.$eval('.popup-tab-switcher', popup => getComputedStyle(popup)
        .getPropertyValue('display'));
      assert.strictEqual(display, 'none', 'popup hidden');
    });
  });
  describe('Many pages', function () {
    beforeEach(closeTabs);

    it('Adds visited pages to the registry in correct order', async () => {
      const expectedTexts = [
        'About - Stack Overflow',
        'Example Domain',
        'Wikipedia',
      ];
      const pageWikipedia = await browser.newPage();
      await pageWikipedia.goto(getPagePath('wikipedia'));
      const pageExample = await browser.newPage();
      await pageExample.goto(getPagePath('example'));
      const pageStOverflow = await browser.newPage();
      await pageStOverflow.goto(getPagePath('stackoverflow'));
      await openPopup(pageStOverflow);
      const elTexts = await pageStOverflow.$$eval('.popup-tab-switcher__tab', els => els.map(el => el.textContent));
      assert.deepStrictEqual(elTexts, expectedTexts, '3 tabs were added');
    });

    it('Updates tab list on closing open tabs', async () => {
      const expectedTexts = [
        'About - Stack Overflow',
        'Wikipedia',
      ];
      const pageWikipedia = await browser.newPage();
      await pageWikipedia.goto(getPagePath('wikipedia'));
      const pageExample = await browser.newPage();
      await pageExample.goto(getPagePath('example'));
      const pageStOverflow = await browser.newPage();
      await pageStOverflow.goto(getPagePath('stackoverflow'));
      await pageExample.close();
      await openPopup(pageStOverflow);
      const elTexts = await pageStOverflow.$$eval('.popup-tab-switcher__tab', els => els.map(el => el.textContent));
      assert.deepStrictEqual(elTexts, expectedTexts, '2 tabs were left');
    });

    it('Selects proper tab names in the popup', async () => {
      const pageWikipedia = await browser.newPage();
      await pageWikipedia.goto(getPagePath('wikipedia'));
      const pageExample = await browser.newPage();
      await pageExample.goto(getPagePath('example'));
      const pageStOverflow = await browser.newPage();
      await pageStOverflow.goto(getPagePath('stackoverflow'));
      await openPopup(pageStOverflow);
      let elText = await pageStOverflow.$eval('.popup-tab-switcher__tab--selected', el => el.textContent);
      assert.strictEqual(elText, 'Example Domain');
      await pageStOverflow.keyboard.press('KeyY');
      elText = await pageStOverflow.$eval('.popup-tab-switcher__tab--selected', el => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await pageStOverflow.keyboard.press('KeyY');
      elText = await pageStOverflow.$eval('.popup-tab-switcher__tab--selected', el => el.textContent);
      assert.strictEqual(elText, 'About - Stack Overflow');
      await pageStOverflow.keyboard.up('Alt');
      await pageExample.close();
      await openPopup(pageStOverflow);
      elText = await pageStOverflow.$eval('.popup-tab-switcher__tab--selected', el => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
    });
  });
});
