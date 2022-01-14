import assert from 'assert'
import {Browser, Page} from 'puppeteer'
import {defaultSettings, DefaultSettings} from '../src/utils/settings'
import {
  closeTabs,
  startPuppeteer,
  stopPuppeteer,
  timeoutDurationMS,
  waitFor,
} from './utils/puppeteer-utils'
import {PuppeteerPopupHelper, settingsPageUrl} from './utils/puppeteer-popup-helper'

declare global {
  interface Window {
    app: {settings: DefaultSettings}
  }
}

let browser: Browser
let helper: PuppeteerPopupHelper

async function input(page: Page, selector: string, text: string) {
  await page.evaluate((s) => {
    document.querySelector(s).value = ''
  }, selector)
  await page.type(selector, text)
}

async function getSettingsFromPage(page: Page) {
  // @ts-expect-error
  const textScrollDelay = await page.$eval('#textScrollDelay', (el: HTMLInputElement) => +el.value)
  const textScrollCoefficient = await page.$eval(
    '#textScrollCoefficient',
    // @ts-expect-error
    (el: HTMLInputElement) => +el.value
  )
  const autoSwitchingTimeout = await page.$eval(
    '#autoSwitchingTimeout',
    // @ts-expect-error
    (el: HTMLInputElement) => +el.value
  )
  const numberOfTabsToShow = await page.$eval(
    '#numberOfTabsToShow',
    // @ts-expect-error
    (el: HTMLInputElement) => +el.value
  )
  // @ts-expect-error
  const isDarkTheme = await page.$eval('#isDarkTheme', (el: HTMLInputElement) => el.checked)
  // @ts-expect-error
  const popupWidth = await page.$eval('#popupWidth', (el: HTMLInputElement) => +el.value)
  // @ts-expect-error
  const tabHeight = await page.$eval('#tabHeight', (el: HTMLInputElement) => +el.value)
  // @ts-expect-error
  const fontSize = await page.$eval('#fontSize', (el: HTMLInputElement) => +el.value)
  // @ts-expect-error
  const iconSize = await page.$eval('#iconSize', (el: HTMLInputElement) => +el.value)
  // @ts-expect-error
  const opacity = await page.$eval('#opacity', (el: HTMLInputElement) => +el.value)
  const isSwitchingToPreviouslyUsedTab = await page.$eval(
    '#isSwitchingToPreviouslyUsedTab',
    // @ts-expect-error
    (el: HTMLInputElement) => el.checked
  )
  // @ts-expect-error
  const isStayingOpen = await page.$eval('#isStayingOpen', (el: HTMLInputElement) => el.checked)
  return {
    textScrollDelay,
    textScrollCoefficient,
    autoSwitchingTimeout,
    numberOfTabsToShow,
    isDarkTheme,
    popupWidth,
    tabHeight,
    fontSize,
    iconSize,
    opacity,
    isSwitchingToPreviouslyUsedTab,
    isStayingOpen,
  }
}

const newSettings = {
  ...defaultSettings,
  ...{
    textScrollDelay: 1500,
    textScrollCoefficient: 777,
    autoSwitchingTimeout: 699,
    numberOfTabsToShow: 5,
    isDarkTheme: true,
    popupWidth: 444,
    tabHeight: 30,
    fontSize: 20,
    iconSize: 55,
    opacity: 30,
  },
}

async function setSettings(page: Page) {
  await input(page, '#textScrollDelay', `${newSettings.textScrollDelay}`)
  await input(page, '#textScrollCoefficient', `${newSettings.textScrollCoefficient}`)
  await input(page, '#autoSwitchingTimeout', `${newSettings.autoSwitchingTimeout}`)
  await input(page, '#numberOfTabsToShow', `${newSettings.numberOfTabsToShow}`)
  await page.click('#isDarkTheme')
  await input(page, '#popupWidth', `${newSettings.popupWidth}`)
  await input(page, '#tabHeight', `${newSettings.tabHeight}`)
  await input(page, '#fontSize', `${newSettings.fontSize}`)
  await input(page, '#iconSize', `${newSettings.iconSize}`)
  await input(page, '#opacity', `${newSettings.opacity}`)
}

describe.skip('settings >', function TestSettings() {
  this.timeout(timeoutDurationMS)

  before(() =>
    startPuppeteer().then((res) => {
      browser = res.browser
      helper = res.helper
    })
  )

  after(stopPuppeteer)

  afterEach(closeTabs)

  it('renders', async () => {
    const expected = defaultSettings
    const settingsPage = await browser.newPage()
    await settingsPage.goto(settingsPageUrl)
    const actual = await getSettingsFromPage(settingsPage)
    assert.deepStrictEqual(actual, expected)
  })

  it('modifies and resets', async () => {
    const settingsPage = await helper.openPage('settings')
    await waitFor()
    await setSettings(settingsPage)
    let actual = await getSettingsFromPage(settingsPage)
    assert.deepStrictEqual(actual, newSettings, 'settings in form are different')
    // actual = await settingsPage.evaluate(() => window.e2e.getSettings())
    await waitFor()
    assert.deepStrictEqual(actual, newSettings, 'settings were not updated in storage')
    await settingsPage.click('#setDefaults')
    actual = await getSettingsFromPage(settingsPage)
    assert.deepStrictEqual(actual, defaultSettings, 'set defaults')
  })

  it('passes settings to a content script', async () => {
    function getSettingsFromContentScript() {
      return ([el]: HTMLElement[]) => {
        const style = window.getComputedStyle(el)
        const popupWidth = Number.parseInt(style.getPropertyValue('--popup-width'), 10)
        const tabHeight = Number.parseInt(style.getPropertyValue('--tab-height'), 10)
        const opacity = Number.parseFloat(style.getPropertyValue('--popup-opacity')) * 100
        return {
          popupWidth,
          tabHeight,
          isDarkTheme: el.classList.contains('card_dark'),
          opacity,
        }
      }
    }

    const settingsPage = await browser.newPage()
    await settingsPage.goto(settingsPageUrl)
    await setSettings(settingsPage)
    const page = await helper.openPage('page-with-long-title.html')
    await helper.switchTab()
    let actual = await page.queryPopup('.card', getSettingsFromContentScript())
    assert.deepStrictEqual(
      actual,
      {
        popupWidth: newSettings.popupWidth,
        tabHeight: newSettings.tabHeight,
        isDarkTheme: newSettings.isDarkTheme,
        opacity: newSettings.opacity,
      },
      'settings apply to the content script popup'
    )

    await settingsPage.click('#setDefaults')
    await page.bringToFront()
    await helper.selectTabForward()
    actual = await page.queryPopup('.card', getSettingsFromContentScript())
    assert.deepStrictEqual(
      actual,
      {
        popupWidth: defaultSettings.popupWidth,
        tabHeight: defaultSettings.tabHeight,
        isDarkTheme: defaultSettings.isDarkTheme,
        opacity: defaultSettings.opacity,
      },
      'new settings apply to the rendered popup'
    )
  })

  it('validates inserted values', async () => {
    const settingsPage = await browser.newPage()
    await settingsPage.goto(settingsPageUrl)
    await input(settingsPage, '#textScrollDelay', '-1500')
    await input(settingsPage, '#popupWidth', 'asdf')
    const isValuesCorrect = await settingsPage.evaluate(() => {
      const {
        app: {
          settings: {textScrollDelay, popupWidth},
        },
      } = window
      return (
        Number.isInteger(textScrollDelay) &&
        textScrollDelay >= 0 &&
        Number.isInteger(popupWidth) &&
        popupWidth >= 0
      )
    })
    assert(isValuesCorrect, 'values are valid')
  })

  it('opens contribute section', async () => {
    const settingsPage = await browser.newPage()
    await settingsPage.goto(settingsPageUrl)
    await settingsPage.click('#mdc-tab-2')
    const isContributeSectionOpen = await settingsPage.$eval(
      '.contribute',
      (el) => getComputedStyle(el).display !== 'none'
    )
    assert(isContributeSectionOpen, 'the contribute section is visible')
  })

  it('controls automatic switching to a previously used tab when the current one closes', async () => {
    const settingsPage = await browser.newPage()
    await settingsPage.goto(settingsPageUrl)
    await settingsPage.click('#isSwitchingToPreviouslyUsedTab')
    await settingsPage.close()
    const pageWikipedia = await helper.openPage('wikipedia.html')
    await helper.openPage('example.html')
    await helper.openPage('stackoverflow.html')
    await pageWikipedia.bringToFront()
    await pageWikipedia.close()
    const activeTab = await helper.getActiveTab()
    const tabTitle = await activeTab.$eval('title', (el) => el.textContent)
    assert.strictEqual(tabTitle, 'Example', 'switched to the nearest tab')
  })

  it('controls hiding of the switcher when modifier key is released', async () => {
    const settingsPage = await browser.newPage()
    await settingsPage.goto(settingsPageUrl)
    await settingsPage.click('#isStayingOpen')
    await helper.openPage('wikipedia.html')
    await helper.openPage('example.html')
    await helper.switchTab()
    const activeTab = await helper.getActiveTab()
    const tabTitle = await activeTab.$eval('title', (el) => el.textContent)
    assert.strictEqual(tabTitle, 'Example', 'does not leave the current tab')
  })

  it('limits the height of the popup to the height of the window and allows scrolling if there are many tabs', async () => {
    const settingsPage = await browser.newPage()
    await settingsPage.goto(settingsPageUrl)
    await input(settingsPage, '#tabHeight', '250')
    await input(settingsPage, '#numberOfTabsToShow', '10')
    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await helper.openPage('example.html')
    }
    await helper.selectTabForward()
    await helper.selectTabBackward() // Focuses on the first tab
    const activeTab = await helper.getActiveTab()
    const isFirstTabVisible = await activeTab.queryPopup('.tab_selected', ([el]) =>
      window.e2e.isVisible(el)
    )
    assert(isFirstTabVisible, 'First tab is not visible')
    await helper.selectTabBackward()
    const isSecondTabVisible = await activeTab.queryPopup('.tab_selected', ([el]) =>
      window.e2e.isVisible(el)
    )
    assert(isSecondTabVisible, 'Second tab is not visible')
  })
})
