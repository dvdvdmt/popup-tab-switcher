import {Browser} from 'puppeteer'
import {closeTabs, startPuppeteer, stopPuppeteer, timeoutDurationMS} from '../utils/puppeteer-utils'
import {PuppeteerPopupHelper} from '../utils/puppeteer-popup-helper'
import {contentScript} from '../selectors/content-script'

describe(`Settings demo`, function () {
  let helper: PuppeteerPopupHelper
  let browser: Browser

  this.timeout(timeoutDurationMS)

  before(async () => {
    const res = await startPuppeteer()
    helper = res.helper
    browser = res.browser
  })

  after(stopPuppeteer)

  afterEach(closeTabs)

  it('shows popup on the page when the extension button clicked', async function () {
    if (process.env.CI) {
      // doesn't work in CI
      this.skip()
    }
    // Given the fully loaded page.
    // When the Extension button is clicked.
    // Then popup preview appears on the page to demonstrate the settings.

    const extBackgroundTarget = await browser.waitForTarget((t) => t.type() === 'service_worker')
    const extWorker = await extBackgroundTarget.worker()
    if (!extWorker) {
      throw new Error('The extension background worker is not found.')
    }
    const page = await helper.openPage('page-with-long-title.html')
    await page.bringToFront()

    // Simulate the click on the extension button.
    await extWorker.evaluate(() => {
      chrome.action.openPopup()
    })

    // Wait for the popup to appear.
    await page.isVisible(contentScript.root)
  })
})
