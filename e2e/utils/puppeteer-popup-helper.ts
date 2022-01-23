import path from 'path'
import {Browser, JSONObject, Page} from 'puppeteer'
import * as fs from 'fs'

export const settingsPageUrl =
  'chrome-extension://meonejnmljcnoodabklmloagmnmcmlam/settings/index.html'
const webPagesDir = path.resolve(__dirname, '..', 'web-pages')
const e2ePageScriptsPath = path.resolve(__dirname, '..', '..', 'build-e2e', 'e2e-page-scripts.js')
const e2ePageScripts = fs.readFileSync(e2ePageScriptsPath, 'utf-8')

export function getPagePath(pageFileName: string) {
  if (pageFileName === 'settings') {
    return settingsPageUrl
  }
  return `file:${path.resolve(webPagesDir, pageFileName)}`
}

const pageMixin = {
  async queryPopup<T>(
    this: Page,
    queryString: string,
    resultFn: (els: HTMLElement[]) => T
  ): Promise<T> {
    return this.evaluate(`(${resultFn})(e2e.queryPopup('${queryString}'))`) as Promise<T>
  },

  async isVisible(this: Page, selector: string): Promise<true> {
    return this.evaluate((sel) => window.e2e.isVisible(sel), selector)
  },
}

function isBlank(page: Page) {
  return page.url() === 'about:blank'
}

export type HelperPage = Page & typeof pageMixin

export class PuppeteerPopupHelper {
  private browser: Browser

  constructor(browser: Browser) {
    this.browser = browser
  }

  static async initPageScripts(page: Page) {
    const frames = await page.frames()
    await Promise.all(frames.map((frame) => frame.evaluate(e2ePageScripts)))
  }

  async getActivePage(): Promise<HelperPage> {
    const pages = await this.browser.pages()
    const promises = pages.map((p, i) =>
      p.evaluate((index) => document.visibilityState === 'visible' && index, `${i}`)
    )
    const firstActivePage = pages[(await Promise.all(promises)).find((i) => i)]
    return Object.assign(firstActivePage, pageMixin)
  }

  async selectTabForward() {
    const page = await this.getActivePage()
    await page.keyboard.down('Alt')
    await page.keyboard.press('KeyY')
  }

  async selectTabBackward() {
    const page = await this.getActivePage()
    await page.keyboard.down('Alt')
    await page.keyboard.down('Shift')
    await page.keyboard.press('KeyY')
  }

  async switchToSelectedTab() {
    const page = await this.getActivePage()
    await page.keyboard.up('Alt')
    await page.keyboard.up('Shift')
  }

  async switchTab(times = 1) {
    for (let i = 0; i < times; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.selectTabForward()
    }
    await this.switchToSelectedTab()
    return this.getActivePage()
  }

  async openPage(pageFileName: string, existingPage?: Page): Promise<HelperPage> {
    let page = existingPage
    if (!page) {
      const [firstPage] = await this.browser.pages()
      if (firstPage && isBlank(firstPage)) {
        page = firstPage
      } else {
        page = await this.browser.newPage()
      }
    }
    await page.goto(getPagePath(pageFileName))
    await PuppeteerPopupHelper.initPageScripts(page)
    await page.bringToFront()
    return Object.assign(page, pageMixin)
  }

  async openPageAsPopup(pageName: string): Promise<HelperPage> {
    const active = await this.getActivePage()
    await active.evaluate((url) => {
      window.open(url, '_blank', 'width=500,height=500')
    }, getPagePath(pageName))
    const page = await this.newPagePromise()
    await PuppeteerPopupHelper.initPageScripts(page)
    return Object.assign(page, pageMixin)
  }

  async openSettingsPage() {
    const settingsPage = await this.browser.newPage()
    await settingsPage.goto(settingsPageUrl)
    await settingsPage.click('#isStayingOpen')
    return settingsPage
  }

  async sendMessage(message: JSONObject) {
    const page = await this.getActivePage()
    page.evaluate((m) => window.e2e.sendMessage(m), message)
  }

  async resizeWindow(width: number, height: number) {
    const page = await this.getActivePage()
    const session = await page.target().createCDPSession()
    await page.setViewport({height, width})
    const {windowId} = (await session.send('Browser.getWindowForTarget')) as {windowId: number}
    await session.send('Browser.setWindowBounds', {
      bounds: {height, width},
      windowId,
    })
  }

  newPagePromise() {
    return new Promise<Page>((resolve) =>
      this.browser.once('targetcreated', (target) => resolve(target.page()))
    )
  }
}
