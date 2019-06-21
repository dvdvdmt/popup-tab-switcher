import assert from 'assert';
import puppeteer from 'puppeteer';
import PuppeteerPopupHelper from './utils/PuppeteerPopupHelper';
import { launchOptions } from './utils/config';

let browser;
let helper;

before(async () => {
  browser = await puppeteer.launch(launchOptions);
  helper = new PuppeteerPopupHelper(browser);
});

after(function () {
  browser.close();
});

describe('Pop-up', function () {
  this.timeout(1000000);

  describe('One page', function () {
    after(async () => {
      await helper.closeTabs();
    });

    async function popupOpens(page) {
      await helper.selectTabForward();

      const display = await page.$eval('popup-tab-switcher', popup => getComputedStyle(popup)
        .getPropertyValue('display'));
      assert.notStrictEqual(display, 'none', 'popup visible');
    }

    it('Opens on "Alt+Y"', async () => {
      const [page] = await browser.pages();
      await helper.openPage('wikipedia.html', page);
      await popupOpens(page);

      // Works after page reload
      await popupOpens(await helper.openPage('wikipedia.html', page));
    });

    it('Opens on file pages', async () => {
      await popupOpens(await helper.openPage('file.png'));
      await popupOpens(await helper.openPage('file.pdf'));
      await popupOpens(await helper.openPage('file.js'));
    });

    it('Hides on "Alt" release', async () => {
      const page = await helper.openPage('wikipedia.html');
      await popupOpens(page);
      await page.keyboard.up('Alt');
      const display = await page.$eval('popup-tab-switcher', popup => getComputedStyle(popup)
        .getPropertyValue('display'));
      assert.strictEqual(display, 'none', 'popup hidden');
    });
  });

  describe('Many pages', function () {
    beforeEach(async () => {
      await helper.closeTabs();
    });

    it('Adds visited pages to the registry in correct order', async () => {
      const expectedTexts = [
        'Tour - Stack Overflow',
        'Example Domain',
        'Wikipedia',
      ];
      await helper.openPage('wikipedia.html');
      await helper.openPage('example.html');
      const pageStOverflow = await helper.openPage('stackoverflow.html');
      await helper.selectTabForward();
      const elTexts = await pageStOverflow.queryPopup('.tab', els => els.map(el => el.textContent));
      assert.deepStrictEqual(elTexts, expectedTexts, '3 tabs were added');
    });

    it('Updates tab list on closing open tabs', async () => {
      const expectedTexts = [
        'Tour - Stack Overflow',
        'Wikipedia',
      ];
      await helper.openPage('wikipedia.html');
      const pageExample = await helper.openPage('example.html');
      const pageStOverflow = await helper.openPage('stackoverflow.html');
      await pageExample.close();
      await helper.selectTabForward();
      const elTexts = await pageStOverflow.queryPopup('.tab', els => els.map(el => el.textContent));
      assert.deepStrictEqual(elTexts, expectedTexts, '2 tabs were left');
    });

    it('Selects proper tab names in the popup', async () => {
      await helper.openPage('wikipedia.html');
      const pageExample = await helper.openPage('example.html');
      const pageStOverflow = await helper.openPage('stackoverflow.html');
      await helper.selectTabForward();
      let elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Example Domain');
      await pageStOverflow.keyboard.press('KeyY');
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await pageStOverflow.keyboard.press('KeyY');
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Tour - Stack Overflow');
      await helper.switchToSelectedTab();
      await helper.selectTabBackward();
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await helper.selectTabBackward();
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Example Domain');
      await helper.selectTabBackward(); // selected Tour - Stack Overflow
      await pageExample.close();
      await helper.selectTabForward();
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
    });

    it('Switches between tabs on Alt release', async () => {
      await helper.openPage('wikipedia.html');
      await helper.openPage('example.html');
      await helper.openPage('stackoverflow.html');
      let curTab = await helper.switchTab();
      let elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Example Domain');
      curTab = await helper.switchTab();
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Tour - Stack Overflow');
      curTab = await helper.switchTab(2);
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      curTab = await helper.switchTab(3);
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      curTab = await helper.switchTab(2);
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Example Domain');
    });

    it('Switches to previously opened tab when current one closes', async () => {
      const pageWikipedia = await helper.openPage('wikipedia.html');
      const pageExample = await helper.openPage('example.html');
      await helper.openPage('stackoverflow.html');
      await pageWikipedia.bringToFront();
      await pageWikipedia.close();
      let curTab = await helper.getActiveTab();
      let elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Tour - Stack Overflow');
      await helper.openPage('wikipedia.html');
      await pageExample.bringToFront();
      await pageExample.close();
      curTab = await helper.getActiveTab();
      elText = await curTab.$eval('title', el => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
    });

    /*
    NOTE: Chrome does not support el.getAnimations()
      and web-animations-js polyfill does not help also because getAnimations() returns
      empty array. Apparently it is because the polyfill does not support custom elements.

    it('Scrolls long text of selected tab', async () => {
    function getDelayedPromise(timeBeforeReject = 1000) {
      let resolvePromise;
      const promise = new Promise((resolve, reject) => {
        resolvePromise = resolve;
        setTimeout(reject, timeBeforeReject);
      });
      return { promise, resolvePromise };
    }

      const pageWithLongTitle = await browser.newPage();
      await pageWithLongTitle.goto(getPagePath('page-with-long-title'));
      const pageWikipedia = await browser.newPage();
      const { promise, resolvePromise } = getDelayedPromise();
      await pageWikipedia.exposeFunction('onAnimationFinish', () => {
        resolvePromise();
      });
      await pageWikipedia.goto(getPagePath('wikipedia.html'));
      const polyfillPath = './node_modules/web-animations-js/web-animations-next.min.js';
      const animationsPolyfill = fs.readFileSync(polyfillPath, 'utf8');
      await pageWikipedia.evaluate(animationsPolyfill);
      await selectTabForward();
      await pageWikipedia.evaluate(() => {
        const textEl = document.querySelector('popup-tab-switcher')
          .shadowRoot
          .querySelector('.tab_selected .tab__text');
        Promise.all(textEl.getAnimations().map(a => a.finished)).then(window.onAnimationFinish);
      });
      try {
        await promise;
      } catch (e) {
        assert.fail('text scroll animation did not start');
      }
    }) */

    /*
    NOTE: It can't be tested because you cant inject content scripts into special Chrome tabs

    it('Switches from a special tab back to previous without showing a popup', async () => {
      const pageWikipedia = await browser.newPage();
      await pageWikipedia.goto(getPagePath('wikipedia.html'));
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

    // it('Switches from PDF and other file types pages', async () => {
    //   const pageWikipedia = await browser.newPage();
    //   await pageWikipedia.goto(getPagePath('wikipedia.html'));
    //
    //
    // });
  });
});
