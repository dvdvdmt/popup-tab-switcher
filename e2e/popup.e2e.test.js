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

async function getActiveTab() {
  const pages = await browser.pages();
  const promises = pages.map((p, i) => p.evaluate(index => document.visibilityState === 'visible' && index, `${i}`));
  return pages[(await Promise.all(promises)).find(i => i)];
}

async function selectTabForward() {
  const page = await getActiveTab();
  await page.keyboard.down('Alt');
  await page.keyboard.press('KeyY');
}

async function selectTabBackward() {
  const page = await getActiveTab();
  await page.keyboard.down('Alt');
  await page.keyboard.down('Shift');
  await page.keyboard.press('KeyY');
}

async function switchToSelectedTab() {
  const page = await getActiveTab();
  await page.keyboard.up('Alt');
  await page.keyboard.up('Shift');
}

async function switchTab(times = 1) {
  for (let i = 0; i < times; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await selectTabForward();
  }
  await switchToSelectedTab();
  return getActiveTab();
}

async function closeTabs() {
  await Promise.all((await browser.pages()).map(p => p.close()));
}

async function queryPopup(page, queryString, resultFn) {
  // NOTE: This awful string was created because other ways for selecting
  // elements in shadow root did not work. It would be great to rewrite this part
  return page.evaluate(`(${resultFn})(Array.from(document.querySelector('popup-tab-switcher').shadowRoot.querySelectorAll('${queryString}')))`);
}

describe('Pop-up', function () {
  this.timeout(1000000);
  describe('One page', function () {
    let page;

    after(closeTabs);

    beforeEach(async () => {
      [page] = await browser.pages();
      await page.goto(getPagePath('wikipedia'));
    });

    async function popupOpens() {
      await selectTabForward();

      const display = await page.$eval('popup-tab-switcher', popup => getComputedStyle(popup)
        .getPropertyValue('display'));
      assert.notStrictEqual(display, 'none', 'popup visible');
    }

    it('Opens on "Alt+Y"', popupOpens);

    it('Works after page reload', popupOpens);

    it('Hides on "Alt" release', async () => {
      await popupOpens();

      await page.keyboard.up('Alt');
      const display = await page.$eval('popup-tab-switcher', popup => getComputedStyle(popup)
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
      await selectTabForward();
      const elTexts = await queryPopup(pageStOverflow, '.tab', els => els.map(el => el.textContent));
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
      await selectTabForward();
      const elTexts = await queryPopup(pageStOverflow, '.tab', els => els.map(el => el.textContent));
      assert.deepStrictEqual(elTexts, expectedTexts, '2 tabs were left');
    });

    it('Selects proper tab names in the popup', async () => {
      const pageWikipedia = await browser.newPage();
      await pageWikipedia.goto(getPagePath('wikipedia'));
      const pageExample = await browser.newPage();
      await pageExample.goto(getPagePath('example'));
      const pageStOverflow = await browser.newPage();
      await pageStOverflow.goto(getPagePath('stackoverflow'));
      await selectTabForward();
      let elText = await queryPopup(pageStOverflow, '.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Example Domain');
      await pageStOverflow.keyboard.press('KeyY');
      elText = await queryPopup(pageStOverflow, '.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await pageStOverflow.keyboard.press('KeyY');
      elText = await queryPopup(pageStOverflow, '.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'About - Stack Overflow');
      await switchToSelectedTab();
      await selectTabBackward();
      elText = await queryPopup(pageStOverflow, '.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await selectTabBackward();
      elText = await queryPopup(pageStOverflow, '.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Example Domain');
      await selectTabBackward(); // selected About - Stack Overflow
      await pageExample.close();
      await selectTabForward();
      elText = await queryPopup(pageStOverflow, '.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
    });

    it('Switches between tabs on Alt release', async () => {
      const pageWikipedia = await browser.newPage();
      await pageWikipedia.goto(getPagePath('wikipedia'));
      const pageExample = await browser.newPage();
      await pageExample.goto(getPagePath('example'));
      const pageStOverflow = await browser.newPage();
      await pageStOverflow.goto(getPagePath('stackoverflow'));
      let curTab = await switchTab();
      let elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Example Domain');
      curTab = await switchTab();
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'About - Stack Overflow');
      curTab = await switchTab(2);
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      curTab = await switchTab(3);
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      curTab = await switchTab(2);
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Example Domain');
    });

    it('Switches to previously opened tab when current one closes', async () => {
      let pageWikipedia = await browser.newPage();
      await pageWikipedia.goto(getPagePath('wikipedia'));
      const pageExample = await browser.newPage();
      await pageExample.goto(getPagePath('example'));
      const pageStOverflow = await browser.newPage();
      await pageStOverflow.goto(getPagePath('stackoverflow'));
      await pageWikipedia.bringToFront();
      await pageWikipedia.close();
      let curTab = await getActiveTab();
      let elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'About - Stack Overflow');
      pageWikipedia = await browser.newPage();
      await pageWikipedia.goto(getPagePath('wikipedia'));
      await pageExample.bringToFront();
      await pageExample.close();
      curTab = await getActiveTab();
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
    });

    /*
    NOTE: It can't be tested because you cant inject content scripts into special Chrome tabs

    it('Switches from a special tab back to previous without showing a popup', async () => {
      const pageWikipedia = await browser.newPage();
      await pageWikipedia.goto(getPagePath('wikipedia'));
      await browser.newPage();
      let curTab = await switchTab();
      let elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      const pageSettings = await browser.newPage();
      await pageSettings.goto('chrome://settings');
      curTab = await switchTab();
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
    }); */
  });
});
