import path from 'path';
import {Browser, Page} from 'puppeteer';
import {registerScripts} from './page-scripts';

const webPagesDir = path.resolve(__dirname, '..', 'web-pages');
export function getPagePath(pageFileName: string) {
  return `file:${path.resolve(webPagesDir, pageFileName)}`;
}

const pageMixin = {
  async queryPopup(queryString: string, resultFn: (els: HTMLElement[]) => void) {
    return this.evaluate(`(${resultFn})(e2e.queryPopup('${queryString}'))`);
  },
};

function isBlank(page: Page) {
  return page.url() === 'about:blank';
}

export class PuppeteerPopupHelper {
  private browser: Browser;

  constructor(browser: Browser) {
    this.browser = browser;
  }

  async getActiveTab() {
    const pages = await this.browser.pages();
    const promises = pages.map((p, i) =>
      p.evaluate((index) => document.visibilityState === 'visible' && index, `${i}`)
    );
    const firstActivePage = pages[(await Promise.all(promises)).find((i) => i)];
    return Object.assign(firstActivePage, pageMixin);
  }

  async selectTabForward() {
    const page = await this.getActiveTab();
    await page.keyboard.down('Alt');
    await page.keyboard.press('KeyY');
  }

  async selectTabBackward() {
    const page = await this.getActiveTab();
    await page.keyboard.down('Alt');
    await page.keyboard.down('Shift');
    await page.keyboard.press('KeyY');
  }

  async switchToSelectedTab() {
    const page = await this.getActiveTab();
    await page.keyboard.up('Alt');
    await page.keyboard.up('Shift');
  }

  async switchTab(times = 1) {
    for (let i = 0; i < times; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.selectTabForward();
    }
    await this.switchToSelectedTab();
    return this.getActiveTab();
  }

  async openPage(pageFileName: string, existingPage?: Page) {
    let page = existingPage;
    if (!page) {
      const [firstPage] = await this.browser.pages();
      if (isBlank(firstPage)) {
        page = firstPage;
      } else {
        page = await this.browser.newPage();
      }
    }
    await page.evaluateOnNewDocument(registerScripts);
    await page.goto(getPagePath(pageFileName));
    await page.bringToFront();
    return Object.assign(page, pageMixin);
  }
}
