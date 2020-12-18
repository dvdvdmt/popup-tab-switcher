import assert from 'assert';
import {Browser, Page} from 'puppeteer';
import {PuppeteerPopupHelper, getPagePath} from './utils/puppeteer-popup-helper';
import {defaultSettings} from '../src/utils/settings';
import {closeTabs, startPuppeteer, stopPuppeteer} from './utils/puppeteer-utils';

let browser: Browser;
let helper: PuppeteerPopupHelper;

function newPagePromise() {
  return new Promise<Page>((resolve) =>
    browser.once('targetcreated', (target) => resolve(target.page()))
  );
}

describe('popup >', function TestPopup() {
  this.timeout(30000);

  before(() =>
    startPuppeteer().then((res) => {
      browser = res.browser;
      helper = res.helper;
    })
  );

  after(stopPuppeteer);

  context('one page >', () => {
    after(closeTabs);

    async function popupOpens(page: Page) {
      await helper.selectTabForward();
      const isVisible = await page.$eval('#popup-tab-switcher', (popup) =>
        window.e2e.isVisible(popup)
      );
      assert(isVisible, 'Popup is not visible');
    }

    it('opens on "Alt+Y"', async () => {
      const page = await helper.openPage('wikipedia.html');
      await popupOpens(page);
      // Works after page reload
      await popupOpens(await helper.openPage('wikipedia.html', page));
    });

    it('opens on "Alt+Y" even if the page has popup-tab-switcher element', async () => {
      const page = await helper.openPage('page-with-popup-tab-switcher.html');
      await popupOpens(page);
    });

    it('opens on file pages', async () => {
      await popupOpens(await helper.openPage('file.png'));
      await popupOpens(await helper.openPage('file.js'));
    });

    it('hides on "Alt" release', async () => {
      const page = await helper.openPage('wikipedia.html');
      await popupOpens(page);
      await page.keyboard.up('Alt');
      const display = await page.$eval('#popup-tab-switcher', (popup) =>
        getComputedStyle(popup).getPropertyValue('display')
      );
      assert.strictEqual(display, 'none', 'popup hidden');
    });

    it('hides the popup if a user selects other tab in a browser top bar', async () => {
      // the closing behaviour is based on a blur event
      const pageWikipedia = await helper.openPage('wikipedia.html');
      await helper.selectTabForward();
      await pageWikipedia.evaluate(() => {
        window.dispatchEvent(new Event('blur'));
      });

      const display = await pageWikipedia.$eval(
        '#popup-tab-switcher',
        (el) => getComputedStyle(el).display
      );
      assert.strictEqual(display, 'none', 'The popup is closed');
    });
  });

  context('many pages >', () => {
    afterEach(() => {
      return closeTabs();
    });

    it('adds visited pages to the registry in correct order', async () => {
      const expectedTexts = ['Stack Overflow', 'Example', 'Wikipedia'];
      await helper.openPage('wikipedia.html');
      await helper.openPage('example.html');
      const pageStOverflow = await helper.openPage('stackoverflow.html');
      await helper.selectTabForward();
      const elTexts = await pageStOverflow.queryPopup('.tab', (els) =>
        els.map((el) => el.textContent)
      );
      assert.deepStrictEqual(elTexts, expectedTexts, '3 tabs were added');
    });

    it('updates tab list on closing open tabs', async () => {
      const expectedTexts = ['Stack Overflow', 'Wikipedia'];
      await helper.openPage('wikipedia.html');
      const pageExample = await helper.openPage('example.html');
      const pageStOverflow = await helper.openPage('stackoverflow.html');
      await pageExample.close();
      await helper.selectTabForward();
      const elTexts = await pageStOverflow.queryPopup('.tab', (els) =>
        els.map((el) => el.textContent)
      );
      assert.deepStrictEqual(elTexts, expectedTexts, '2 tabs were left');
    });

    it('selects proper tab names in the popup', async () => {
      await helper.openPage('wikipedia.html');
      const pageExample = await helper.openPage('example.html');
      const pageStOverflow = await helper.openPage('stackoverflow.html');
      await helper.selectTabForward();
      let elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Example');
      await pageStOverflow.keyboard.press('KeyY');
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await pageStOverflow.keyboard.press('KeyY');
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Stack Overflow');
      await helper.switchToSelectedTab();
      await helper.selectTabBackward();
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await helper.selectTabBackward();
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Example');
      await helper.selectTabBackward(); // Stack Overflow is selected
      await pageExample.close();
      await helper.selectTabForward();
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
    });

    it('switches between tabs on Alt release', async () => {
      await helper.openPage('wikipedia.html');
      await helper.openPage('example.html');
      await helper.openPage('stackoverflow.html');
      let activeTab = await helper.switchTab();
      let elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Example');
      activeTab = await helper.switchTab();
      elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Stack Overflow');
      activeTab = await helper.switchTab(2);
      elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      activeTab = await helper.switchTab(3);
      elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      activeTab = await helper.switchTab(2);
      elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Example');
    });

    it('switches to previously opened tab when current one closes', async () => {
      const pageWikipedia = await helper.openPage('wikipedia.html');
      const pageExample = await helper.openPage('example.html');
      await helper.openPage('stackoverflow.html');
      await pageWikipedia.bringToFront();
      await pageWikipedia.close();
      let activeTab = await helper.getActiveTab();
      let elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Stack Overflow');
      await helper.openPage('wikipedia.html');
      await pageExample.bringToFront();
      await pageExample.close();
      activeTab = await helper.getActiveTab();
      elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
    });

    it('focuses previously active window on a tab closing', async () => {
      const pageWikipedia = await helper.openPage('wikipedia.html');
      await pageWikipedia.evaluate((url) => {
        window.open(url, '_blank', 'width=500,height=500');
      }, getPagePath('example.html'));
      const pageExample = await newPagePromise();
      await pageWikipedia.evaluate((url) => {
        window.open(url, '_blank', 'width=500,height=500');
      }, getPagePath('stackoverflow.html'));
      const pageStOverflow = await newPagePromise();
      const pageFile = await helper.openPage('file.js');
      await pageFile.close();
      const isStOverflowFocused = await pageStOverflow.evaluate(() => document.hasFocus());
      assert(isStOverflowFocused, 'Switched to a tab in previous window (StackOverflow)');
      await pageStOverflow.close();
      const isExampleFocused = await pageExample.evaluate(() => document.hasFocus());
      assert(isExampleFocused, 'Switched to a tab in previous window (Example)');
      await pageExample.close();
      const isWikipediaFocused = await pageWikipedia.evaluate(() => document.hasFocus());
      assert(isWikipediaFocused, 'Switched to a tab in previous window (Wikipedia)');
    });

    it('switches to the tab that was clicked', async () => {
      await helper.openPage('wikipedia.html');
      await helper.openPage('example.html');
      const pageStOverflow = await helper.openPage('stackoverflow.html');
      await helper.selectTabForward();
      await pageStOverflow.queryPopup('.tab:nth-child(3)', ([el]) => {
        el.click();
      });

      await pageStOverflow.keyboard.up('Alt');
      const activeTab = await helper.getActiveTab();
      const elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia', 'switches to the clicked tab');
    });

    it('pressing ESC stops switching', async () => {
      await helper.openPage('wikipedia.html');
      await helper.openPage('example.html');
      const pageStOverflow = await helper.openPage('stackoverflow.html');
      await helper.selectTabForward();
      await pageStOverflow.keyboard.press('Escape');
      const isPopupClosed = await pageStOverflow.$eval(
        '#popup-tab-switcher',
        (el) => getComputedStyle(el).display === 'none'
      );
      assert(isPopupClosed, 'hides on pressing Esc button');
      await pageStOverflow.keyboard.up('Alt');
      const activeTab = await helper.getActiveTab();
      const elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Stack Overflow', 'stays on the same tab');
    });

    it('switches between windows', async () => {
      const pageWikipedia = await helper.openPage('wikipedia.html');
      const pageExample = await helper.openPage('example.html');
      const pageStOverflow = await openPageInAPopup(pageExample, 'stackoverflow.html');

      await pageStOverflow.keyboard.down('Alt');
      await pageStOverflow.keyboard.press('KeyY');
      await pageStOverflow.keyboard.up('Alt');
      const isExampleFocused = await pageExample.evaluate(() => document.hasFocus());
      assert(isExampleFocused, 'Example page is focused');

      await pageExample.keyboard.down('Alt');
      await pageExample.keyboard.press('KeyY');
      await pageExample.keyboard.up('Alt');
      const isStOverflowFocused = await pageStOverflow.evaluate(() => document.hasFocus());
      assert(isStOverflowFocused, 'Stack Overflow page is focused');

      await pageStOverflow.keyboard.down('Alt');
      await pageStOverflow.keyboard.press('KeyY');
      await pageStOverflow.keyboard.press('KeyY');
      await pageStOverflow.keyboard.up('Alt');
      const isWikipediaFocused = await pageWikipedia.evaluate(() => document.hasFocus());
      assert(isWikipediaFocused, 'Wikipedia page is focused');

      async function openPageInAPopup(existingPage: Page, pageFileName: string) {
        await existingPage.evaluate((url) => {
          window.open(url, '_blank', 'width=500,height=500');
        }, getPagePath(pageFileName));
        return newPagePromise();
      }
    });

    it('stores unlimited number of opened tabs in history', async () => {
      const pages = [await helper.openPage('wikipedia.html')];
      const numberOfTabsToOpen = defaultSettings.numberOfTabsToShow + 3;
      for (let i = 0; i < numberOfTabsToOpen; i += 1) {
        // We need to open tabs with focusing on them to populate tab registry
        // eslint-disable-next-line no-await-in-loop
        pages.push(await helper.openPage('example.html'));
      }
      await helper.selectTabForward();
      let activeTab = await helper.getActiveTab();
      let numberOfShownTabs = await activeTab.queryPopup('.tab', (els) => els.length);
      assert.strictEqual(
        numberOfShownTabs,
        defaultSettings.numberOfTabsToShow,
        'The number of shown tabs is correct'
      );
      const closingPagesPromises = [];
      for (let i = pages.length - 1; i > 2; i -= 1) {
        closingPagesPromises.push(pages[i].close());
      }
      await Promise.all(closingPagesPromises);
      await helper.selectTabForward();
      activeTab = await helper.getActiveTab();
      numberOfShownTabs = await activeTab.queryPopup('.tab', (els) => els.length);
      assert.strictEqual(
        numberOfShownTabs,
        3,
        'The number of shown tabs is correct after closing multiple tabs'
      );
      const tabTitle = await activeTab.queryPopup('.tab:nth-child(3)', ([el]) => el.textContent);
      assert.strictEqual(tabTitle, 'Wikipedia');
    });

    it('selects tabs with Up/Down arrow keys and switches to them by Enter', async () => {
      await helper.openPage('wikipedia.html');
      await helper.openPage('example.html');
      const pageStOverflow = await helper.openPage('stackoverflow.html');
      await helper.selectTabForward();
      await pageStOverflow.keyboard.press('ArrowDown');
      let elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await pageStOverflow.keyboard.press('ArrowDown');
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Stack Overflow');
      await pageStOverflow.keyboard.press('ArrowDown');
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Example');
      await pageStOverflow.keyboard.press('ArrowUp');
      await pageStOverflow.keyboard.press('ArrowUp');
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await pageStOverflow.keyboard.press('Enter');
      const activeTab = await helper.getActiveTab();
      elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
    });

    it('selects tabs with Tab or Shift+Tab and switches to them by Enter', async () => {
      await helper.openPage('wikipedia.html');
      await helper.openPage('example.html');
      const pageStOverflow = await helper.openPage('stackoverflow.html');
      await helper.selectTabForward();
      await pageStOverflow.keyboard.press('Tab');
      let elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await pageStOverflow.keyboard.press('Tab');
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Stack Overflow');
      await pageStOverflow.keyboard.press('Tab');
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Example');
      await pageStOverflow.keyboard.down('Shift');
      await pageStOverflow.keyboard.press('Tab');
      await pageStOverflow.keyboard.press('Tab');
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
      await pageStOverflow.keyboard.press('Enter');
      const activeTab = await helper.getActiveTab();
      elText = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual(elText, 'Wikipedia');
    });

    it('sets focus back to a previously focused element and cursor position', async () => {
      const pageWikipedia = await helper.openPage('wikipedia.html');
      await pageWikipedia.focus('#searchInput');
      await pageWikipedia.keyboard.type('Hello World!');
      await pageWikipedia.keyboard.down('Shift');
      const moveCursorLeftPromises = [];
      for (let i = 0; i < 7; i += 1) {
        moveCursorLeftPromises.push(pageWikipedia.keyboard.press('ArrowLeft'));
      }
      await Promise.all(moveCursorLeftPromises);
      await pageWikipedia.keyboard.up('Shift');
      await helper.selectTabForward();
      await helper.selectTabForward();
      await pageWikipedia.keyboard.press('Escape');
      const focusedEl = await pageWikipedia.evaluate(() => {
        const {
          id,
          selectionStart,
          selectionEnd,
          selectionDirection,
        } = document.activeElement as HTMLInputElement;
        return {
          id,
          selectionStart,
          selectionEnd,
          selectionDirection,
        };
      });
      assert.strictEqual(focusedEl.id, 'searchInput');
      assert.strictEqual(focusedEl.selectionStart, 5);
      assert.strictEqual(focusedEl.selectionEnd, 12);
      assert.strictEqual(focusedEl.selectionDirection, 'backward');
    });

    it('restores focus without breaking switching', async () => {
      const errors: Error[] = [];
      await helper.openPage('example.html');
      const pageWithInputs = await helper.openPage('non-selectable-inputs.html');
      pageWithInputs.on('pageerror', (err) => {
        errors.push(err);
      });
      await pageWithInputs.focus('#dewey');
      await helper.switchTab();
      let activeTab = await helper.getActiveTab();
      let tabTitle = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual('Example', tabTitle, 'focus on radio button does not prevent switching');

      await pageWithInputs.bringToFront();
      await pageWithInputs.focus('#manual-mode');
      await helper.switchTab();
      activeTab = await helper.getActiveTab();
      tabTitle = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual('Example', tabTitle, 'focus on checkbox does not prevent switching');

      const [firstError] = errors;
      if (firstError) {
        throw firstError;
      }
    });

    it('switches on any modifier (Alt, Control, Command) keyup event', async () => {
      await helper.openPage('wikipedia.html');
      await helper.openPage('example.html');
      let activeTab = await helper.getActiveTab();
      await activeTab.keyboard.down('Control');
      await activeTab.keyboard.press('KeyY');
      await activeTab.keyboard.up('Control');
      activeTab = await helper.getActiveTab();
      let tabTitle = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual('Wikipedia', tabTitle);
      await activeTab.keyboard.down('Meta'); // Command or Windows key
      await activeTab.keyboard.press('KeyY');
      await activeTab.keyboard.up('Meta');
      activeTab = await helper.getActiveTab();
      tabTitle = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual('Example', tabTitle);
    });

    it('works in pages with iframe', async () => {
      await helper.openPage('wikipedia.html');
      const pageWithIframe = await helper.openPage('page-with-iframe.html');
      const frame = await pageWithIframe.$('iframe').then((handle) => handle.contentFrame());
      await frame.focus('input');
      await helper.switchTab();
      let activeTab = await helper.getActiveTab();
      let tabTitle = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual('Wikipedia', tabTitle);
      await helper.switchTab();
      activeTab = await helper.getActiveTab();
      tabTitle = await activeTab.$eval('title', (el) => el.textContent);
      assert.strictEqual('Page with iframe', tabTitle);
    });

    it('adds tabs opened by Ctrl+Click to the registry', async () => {
      const pageWithLinks = await helper.openPage('page-with-links.html');
      await pageWithLinks.click('#wikipedia', {button: 'middle'});
      await pageWithLinks.click('#stack', {button: 'middle'});
      await pageWithLinks.click('#example', {button: 'middle'});
      await helper.selectTabForward();
      const elTexts = await pageWithLinks.queryPopup('.tab', (els) =>
        els.map((el) => el.textContent)
      );
      const expectedTexts = ['Page with links', 'Example', 'Stack Overflow', 'Wikipedia'];
      assert.deepStrictEqual(elTexts, expectedTexts, 'background tabs were added');
    });
  });
});
