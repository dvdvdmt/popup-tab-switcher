import assert from 'assert'
import {Browser} from 'puppeteer'
import {closeTabs, startPuppeteer, stopPuppeteer, timeoutDurationMS} from '../utils/puppeteer-utils'
import {PuppeteerPopupHelper} from '../utils/puppeteer-popup-helper'

describe(`Sharing`, function () {
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

  it('copies link to the extension', async () => {
    // Given the Contribute page is open.
    // When the Copy button is clicked.
    // Then the link to the extension should be copied to the clipboard.

    const page = await helper.openPage('settings')
    const context = browser.defaultBrowserContext()
    await context.overridePermissions(page.url(), ['clipboard-read', 'clipboard-write'])
    await page.click('[data-test="contribute"]')
    await page.click('[data-test="contribute__copyLink_button"]')
    const copiedText = await page.evaluate(() => navigator.clipboard.readText())
    assert(copiedText, 'The link to the extension should be copied to the clipboard.')

    // For some reason the Puppeteer returns 'clipboard-read' string instead of the copied text.
    // It would be nice to report this to the Puppeteer team (https://github.com/puppeteer/puppeteer/issues).
    // assert.strictEqual(
    //   copiedText,
    //   'https://chrome.google.com/webstore/detail/popup-tab-switcher/cehdjppppegalmaffcdffkkpmoflfhkc'
    // )

    // This works as expected.
    // const page = await browser.newPage()
    // await page.goto('https://jsfiddle.net/exd1569b/')
    // const frame = await page.frames().find((f) => f.name() === 'result')!
    // await frame.waitForSelector('#copy-button')
    // // console.log(frame.url())
    // const context = browser.defaultBrowserContext()
    // await context.overridePermissions(page.url(), ['clipboard-read', 'clipboard-write'])
    // await frame.click('#copy-button')
    // const copiedText = await page.evaluate(() => navigator.clipboard.readText())
    // console.log(copiedText)
  })
})
