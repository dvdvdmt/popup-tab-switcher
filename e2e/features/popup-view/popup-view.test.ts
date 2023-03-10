import path from 'path'
import {startPuppeteer, stopPuppeteer, timeoutDurationMS} from '../../utils/puppeteer-utils'
import {PuppeteerPopupHelper} from '../../utils/puppeteer-popup-helper'
import {contentScript} from '../../selectors/content-script'

/**
 * Contains visual tests of the popup component.
 */
describe('Popup view', function () {
  let helper: PuppeteerPopupHelper
  this.timeout(timeoutDurationMS)

  before(() =>
    startPuppeteer().then((res) => {
      helper = res.helper
    })
  )

  after(stopPuppeteer)

  it(`looks as expected on default settings`, async () => {
    // Given the browser has many tabs.
    await helper.openPage('selection-restoration.html')
    // await helper.openPage('file.pdf')
    await helper.openPage('file.png')
    await helper.openPage('stackoverflow.html')
    await helper.openPage('wikipedia.html')
    await helper.openPage('page-with-long-title.html')
    await helper.openPage('page-with-popup-tab-switcher.html')
    await helper.openPage('example.html')

    // When the popup is opened.
    await helper.selectTabForward()

    // It should look as expected.
    const screenshotPath = path.resolve(__dirname, 'expected.png')
    await helper.assertElementMatchesScreenshot(contentScript.popup, screenshotPath)
  })
})
