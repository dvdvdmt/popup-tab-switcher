import path from 'path'
import {
  startPuppeteer,
  stopPuppeteer,
  timeoutDurationMS,
  waitFor,
} from '../../utils/puppeteer-utils'
import {PuppeteerPopupHelper} from '../../utils/puppeteer-popup-helper'
import {settingsPage} from '../../selectors/settings-page'
import {defaultSettings} from '../../../src/utils/settings'

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

  afterEach(async () => {
    // reset settings to default
    const page = await helper.getActivePage()
    await page.evaluate((settings) => {
      window.e2e.setSettings(settings)
    }, defaultSettings)
  })

  it(`settings page on defaults looks as expected`, async () => {
    // Given the settings page is open.
    await helper.openPage('settings')

    // When the default settings are applied.
    await waitFor(100)

    // It should look as expected.
    const screenshotPath = path.join(__dirname, 'settings-view-default.expected.png')
    await helper.assertElementMatchesScreenshot(settingsPage.root, screenshotPath)
  })

  it(`settings page in dark mode looks as expected`, async () => {
    // Given the settings page is open.
    const page = await helper.openPage('settings')

    // When the dark mode is enabled.
    await page.waitForSelector(settingsPage.darkModeToggle)
    await page.click(settingsPage.darkModeToggle)
    await waitFor(100)

    // It should look as expected.
    const screenshotPath = path.join(__dirname, 'settings-view-dark.expected.png')
    await helper.assertElementMatchesScreenshot(settingsPage.root, screenshotPath)
  })

  it(`contribute page on defaults looks as expected`, async () => {
    // Given the contribute page is open with default settings.
    const page = await helper.openPage('settings')
    await page.click(settingsPage.contributeTab)
    // NOTE: Wait for the navigation animation to finish
    // Another variant is to disable animations via CSS: https://github.com/puppeteer/puppeteer/issues/511#issuecomment-468309571
    // Or use fake timers: https://github.com/sinonjs/fake-timers
    await waitFor(100)

    // It should look as expected.
    const screenshotPath = path.join(__dirname, 'contribute-view-default.expected.png')
    await helper.assertElementMatchesScreenshot(settingsPage.root, screenshotPath)
  })

  it(`contribute page in dark mode looks as expected`, async () => {
    // Given the contribute page is open with dark mode enabled.
    const page = await helper.openPage('settings')
    await page.click(settingsPage.darkModeToggle)
    await page.click(settingsPage.contributeTab)
    await waitFor(100)

    // It should look as expected.
    const screenshotPath = path.join(__dirname, 'contribute-view-dark.expected.png')
    await helper.assertElementMatchesScreenshot(settingsPage.root, screenshotPath)
  })
})
