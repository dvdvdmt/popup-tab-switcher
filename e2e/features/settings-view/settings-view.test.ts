import path from 'path'
import {startPuppeteer, stopPuppeteer, timeoutDurationMS} from '../../utils/puppeteer-utils'
import {PuppeteerPopupHelper} from '../../utils/puppeteer-popup-helper'
import {contentScript} from '../../selectors/content-script'
import {settingsPage} from '../../selectors/settings-page'

/**
 * Contains visual tests of the settings component.
 */
describe('Settings view', function () {
  let helper: PuppeteerPopupHelper
  this.timeout(timeoutDurationMS)

  before(() =>
    startPuppeteer().then((res) => {
      helper = res.helper
    })
  )

  after(stopPuppeteer)

  it(`settings page on defaults looks as expected`, async () => {
    // Given the settings page is open.
    await helper.openPage('settings')

    // When the default settings are applied.

    // It should look as expected.
    const screenshotPath = path.join(__dirname, 'settings-view-default.expected.png')
    await helper.assertElementMatchesScreenshot(settingsPage.root, screenshotPath)
  })

  it(`looks as expected on custom settings`, async () => {
    // Given the browser has many tabs and extension configured with custom settings.
    await helper.openPage('selection-restoration.html')
    await helper.openPage('file.png')
    await helper.openPage('stackoverflow.html')
    await helper.openPage('wikipedia.html')
    await helper.openPage('page-with-long-title.html')
    await helper.openPage('page-with-popup-tab-switcher.html')
    const page = await helper.openPage('example.html')
    await page.evaluate(() => window.e2e.setSettings({isDarkTheme: true, popupWidth: 605}))

    // When the popup is opened.
    await helper.selectTabForward()

    // It should look as expected.
    const screenshotPath = path.join(__dirname, 'popup-view-customized.expected.png')
    await helper.assertElementMatchesScreenshot(contentScript.popup, screenshotPath)
  })
})
