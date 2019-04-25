const path = require('path');
const assert = require('assert');
const puppeteer = require('puppeteer');

const pathToExtension = path.join(__dirname, '../build-e2e');
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

function getPagePath(pageName) {
  return `file:${path.join(__dirname, 'web-pages', pageName, 'index.html')}`;
}

async function openPopup(page) {
  await page.keyboard.down('Alt');
  await page.keyboard.press('KeyY');
}

describe('Pop-up', function () {
  this.timeout(10000);
  describe('One page', function () {
    let page;

    after(async () => {
      (await browser.pages()).forEach(p => p.close());
    });

    beforeEach(async () => {
      [page] = await browser.pages();
      await page.goto(getPagePath('wikipedia'));
    });

    async function popupOpens() {
      await openPopup(page);

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
  describe('Many pages', function () {
    it('adds visited pages to the registry in correct order', async () => {
      const pageWikipedia = await browser.newPage();
      await pageWikipedia.goto(getPagePath('wikipedia'));
      const pageExample = await browser.newPage();
      await pageExample.goto(getPagePath('example'));
      const pageStOverflow = await browser.newPage();
      await pageStOverflow.goto(getPagePath('stackoverflow'));
      await openPopup(pageStOverflow);
      const tabs = await pageStOverflow.$$('.popup-tab-switcher__tab');
      assert.strictEqual(tabs.length, 3, '3 tabs were added');
    });
    // it('preserves the list of tabs registry after page reload', async () => {
    //   const [pageWikipedia] = await browser.pages();
    //   await pageWikipedia.goto(getPagePath('wikipedia'));
    //   const pageExample = await browser.newPage();
    //   await pageExample.goto(getPagePath('example'));
    //   const pageStack = await browser.newPage();
    //   await pageStack.goto(getPagePath('stackoverflow'));
    //   await openPopup(pageStack);
    // });
  });
});
