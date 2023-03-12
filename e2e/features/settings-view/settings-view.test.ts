import path from 'path'
import {startPuppeteer, stopPuppeteer, timeoutDurationMS} from '../../utils/puppeteer-utils'
import {PuppeteerPopupHelper} from '../../utils/puppeteer-popup-helper'
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

  it(`settings page in dark mode looks as expected`, async () => {
    // Given the settings page is open.
    const page = await helper.openPage('settings')

    // When the dark mode is enabled.
    await page.click(settingsPage.darkModeToggle)

    // It should look as expected.
    const screenshotPath = path.join(__dirname, 'settings-view-dark.expected.png')
    await helper.assertElementMatchesScreenshot(settingsPage.root, screenshotPath)
  })
})
