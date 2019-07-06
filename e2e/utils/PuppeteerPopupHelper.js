import path from 'path';

export function getPagePath(pageFileName) {
  return `file:${path.join(__dirname, '../web-pages', pageFileName)}`;
}

async function queryPopup(queryString, resultFn) {
  // NOTE: This awful string was created because other ways for selecting
  // elements in shadow root did not work. It would be great to rewrite this part
  return this.evaluate(`(${resultFn})(Array.from(document.querySelector('#popup-tab-switcher').shadowRoot.querySelectorAll('${queryString}')))`);
}

export default class PuppeteerPopupHelper {
  constructor(browser) {
    this.browser = browser;
  }

  async getActiveTab() {
    const pages = await this.browser.pages();
    // eslint-disable-next-line no-undef
    const promises = pages.map((p, i) => p.evaluate(index => document.visibilityState === 'visible' && index, `${i}`));
    return pages[(await Promise.all(promises)).find(i => i)];
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

  async closeTabs() {
    await Promise.all((await this.browser.pages()).map(p => p.close()));
  }

  async openPage(pageFileName, existingPage) {
    let page = existingPage;
    if (!page) {
      page = await this.browser.newPage();
    }
    await page.goto(getPagePath(pageFileName));
    page.queryPopup = queryPopup;
    return page;
  }
}
