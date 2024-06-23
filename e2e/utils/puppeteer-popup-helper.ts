import path from 'path'
import {Browser, Page} from 'puppeteer'
import * as fs from 'fs'
import {PNG} from 'pngjs'
import pixelmatch from 'pixelmatch'
import {IMessage, IMessageResponse} from '../../src/utils/messages'

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

  async isNotVisible(this: Page, selector: string): Promise<boolean> {
    return this.evaluate(async (sel) => {
      try {
        return await window.e2e.isVisible(sel)
      } catch (e) {
        return true
      }
    }, selector)
  },

  async resizeWindow(this: Page, width: number, height: number): Promise<void> {
    const session = await this.target().createCDPSession()
    await this.setViewport({height, width})
    const {windowId} = (await session.send('Browser.getWindowForTarget')) as {windowId: number}
    await session.send('Browser.setWindowBounds', {
      bounds: {height, width},
      windowId,
    })
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

  // TODO: Try replace this method with the CDP (Chrome DevTools Protocol) method.
  // async function getActiveTab(page) {
  //   const client = await page.target().createCDPSession();
  //   const { targetId } = await client.send('Target.getTargetInfo', { targetId: page.target()._targetId });
  //   const { windowId } = await client.send('Browser.getWindowForTarget', { targetId });
  //   const tabs = await client.send('Browser.getTabs');
  //   return tabs.tabs.find(tab => tab.active && tab.windowId === windowId);
  // }
  async getActivePage(): Promise<HelperPage> {
    const pages = await this.browser.pages()
    const promises = pages.map((p, index) =>
      p.evaluate(async (i) => {
        const isActive = await window.e2e.isTabActive()
        return {
          isActive,
          title: document.title,
          pageIndex: i,
        }
      }, index)
    )
    const promiseResults = await Promise.all(promises)
    const activePageIndex = promiseResults.findIndex(({isActive}) => isActive)
    if (activePageIndex === -1) {
      throw new Error('No active page is found')
    }
    const firstActivePage = pages[activePageIndex]
    return Object.assign(firstActivePage, pageMixin)
  }

  async selectTabForward() {
    const page = await this.getActivePage()
    await page.keyboard.down('Alt')
    await page.keyboard.press('KeyY')
    await page.evaluate(() => window.e2e.waitUntilCommandReachesTheBackgroundScript())
  }

  async selectTabBackward() {
    const page = await this.getActivePage()
    await page.keyboard.down('Alt')
    await page.keyboard.down('Shift')
    await page.keyboard.press('KeyY')
    await page.evaluate(() => window.e2e.waitUntilCommandReachesTheBackgroundScript())
  }

  async switchToSelectedTab() {
    const page = await this.getActivePage()
    await page.keyboard.up('Alt')
    await page.keyboard.up('Shift')
    await page.evaluate(() => window.e2e.waitUntilCommandReachesTheBackgroundScript())
  }

  async switchTab(times = 1) {
    for (let i = 0; i < times; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.selectTabForward()
    }
    const activePage = await this.getActivePage()
    const activatedPagePromise = this.newlyActivatedPage(activePage)
    await this.switchToSelectedTab()
    return activatedPagePromise
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
    await page.evaluate(() => window.e2e.waitUntilMessagingIsReady())
    await page.bringToFront()
    return Object.assign(page, pageMixin)
  }

  async openPageAsPopup(pageName: string): Promise<HelperPage> {
    const active = await this.getActivePage()
    const newPagePromise = this.newPagePromise()
    await active.evaluate((url) => {
      window.open(url, '_blank', 'width=500,height=500')
    }, getPagePath(pageName))
    const page = await newPagePromise
    await PuppeteerPopupHelper.initPageScripts(page)
    return Object.assign(page, pageMixin)
  }

  async openPageByClickOnHyperlink(currentPage: Page, elementId: string): Promise<HelperPage> {
    const newPagePromise = this.newPagePromise()
    await currentPage.click(elementId, {button: 'middle'})
    const page = await newPagePromise
    await PuppeteerPopupHelper.initPageScripts(page)
    return Object.assign(page, pageMixin)
  }

  async sendMessage<Message extends IMessage>(
    message: Message
  ): Promise<IMessageResponse<Message>> {
    const page = await this.getActivePage()
    return page.evaluate((m) => window.e2e.sendMessage(m), message) as Promise<
      IMessageResponse<Message>
    >
  }

  newPagePromise() {
    return new Promise<Page>((resolve, reject) =>
      this.browser.on('targetcreated', async (target) => {
        if (target.type() === 'page') {
          const page = await target.page()
          if (!page) {
            reject(new Error('Page is not found'))
            return
          }
          resolve(page)
        }
      })
    )
  }

  /**
   * It waits for the page activation and returns the activated page.
   * The currently active page will be returned if the time threshold passes.
   */
  async newlyActivatedPage(activePage: Page): Promise<Page> {
    const pages = await this.browser.pages()
    const notActivePages = pages.filter((page) => page.target() !== activePage.target())
    const promises = notActivePages.map((page, index) =>
      page.evaluate(async (i) => {
        let resolver: (value: {pageIndex: number}) => void = () => {}
        const promise = new Promise<{pageIndex: number}>((resolve) => {
          resolver = resolve
        })
        let attempt = 0
        function testAgain() {
          setTimeout(async () => {
            const isActive = await window.e2e.isTabActive()
            if (isActive) {
              resolver({pageIndex: i})
            } else if (attempt > 100) {
              // after 1000ms the test stops
              resolver({pageIndex: -1})
            } else {
              attempt += 1
              testAgain()
            }
          }, 10)
        }

        if (await window.e2e.isTabActive()) {
          resolver({pageIndex: i})
        } else {
          testAgain()
        }
        return promise
      }, index)
    )
    const result = await Promise.race(promises)
    const activePageIndex = result.pageIndex
    if (activePageIndex === -1) {
      return activePage
    }
    const newActivePage = notActivePages[activePageIndex]
    return Object.assign(newActivePage, pageMixin)
  }

  async assertElementMatchesScreenshot(elementSelector: string, expectedScreenshotPath: string) {
    // 1. Gets the element and makes a screenshot of it
    // 2. Checks if the expected screenshot file exists
    // 3. If not, it creates the file in the path using the screenshot of the element.
    //    And logs this into console.
    // 4. If yes, it compares the screenshot of the element with the expected screenshot file.
    //    If they are not the same, it saves the diff image in the path and throws an error.
    //    If they are the same, it does nothing.
    const page = await this.getActivePage()
    const element = await page.$(elementSelector)
    if (!element) {
      throw new Error(`Element ${elementSelector} not found`)
    }
    const elementSize = await element.boundingBox()
    if (!elementSize) {
      throw new Error(`Element ${elementSelector} not visible`)
    }
    const elementScreenshot = (await element.screenshot()) as Buffer
    const screenshotDir = path.dirname(expectedScreenshotPath)
    const screenshotName = path.basename(expectedScreenshotPath, '.expected.png')
    const currentScreenshotPath = path.join(screenshotDir, `${screenshotName}.current.png`)
    if (!fs.existsSync(expectedScreenshotPath)) {
      fs.writeFileSync(currentScreenshotPath, elementScreenshot)
      console.log(`Current screenshot saved in ${currentScreenshotPath}`)
      throw new Error(`Expected screenshot not found in ${expectedScreenshotPath}`)
    }
    const expectedScreenshot = fs.readFileSync(expectedScreenshotPath)
    const {width, height} = elementSize
    const elementImg = PNG.sync.read(elementScreenshot)
    const expectedImg = PNG.sync.read(expectedScreenshot)
    const diff = new PNG({width, height})
    try {
      const diffCount = pixelmatch(elementImg.data, expectedImg.data, diff.data, width, height, {
        threshold: 0.05,
      })
      if (diffCount > 0) {
        const diffPath = path.join(
          path.dirname(expectedScreenshotPath),
          `${screenshotName}.diff.png`
        )
        fs.writeFileSync(currentScreenshotPath, elementScreenshot)
        fs.writeFileSync(diffPath, PNG.sync.write(diff))
        throw new Error(`Images are different. Diff image saved in ${diffPath}`)
      }
    } catch (e) {
      console.log(`Current screenshot saved in ${currentScreenshotPath}`)
      fs.writeFileSync(currentScreenshotPath, elementScreenshot)
      throw e
    }
  }
}
