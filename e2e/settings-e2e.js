import assert from 'assert';
import {defaultSettings} from '../src/utils/settings';
import {closeTabs, startPuppeteer, stopPuppeteer} from './utils/puppeteer-utils';

/** @type {Browser} */
let browser;
/** @type {PuppeteerPopupHelper} */
let helper;
const settingsPageUrl = 'chrome-extension://meonejnmljcnoodabklmloagmnmcmlam/settings/index.html';

async function input(page, selector, text) {
  await page.evaluate((s) => {
    document.querySelector(s).value = '';
  }, selector);
  await page.type(selector, text);
}

async function getSettingsFromPage(page) {
  const res = {};
  res.textScrollDelay = await page.$eval('#textScrollDelay', (el) => +el.value);
  res.textScrollCoefficient = await page.$eval('#textScrollCoefficient', (el) => +el.value);
  res.autoSwitchingTimeout = await page.$eval('#autoSwitchingTimeout', (el) => +el.value);
  res.numberOfTabsToShow = await page.$eval('#numberOfTabsToShow', (el) => +el.value);
  res.isDarkTheme = await page.$eval('#isDarkTheme', (el) => el.checked);
  res.popupWidth = await page.$eval('#popupWidth', (el) => +el.value);
  res.tabHeight = await page.$eval('#tabHeight', (el) => +el.value);
  res.fontSize = await page.$eval('#fontSize', (el) => +el.value);
  res.iconSize = await page.$eval('#iconSize', (el) => +el.value);
  res.isSwitchingToPreviouslyUsedTab = await page.$eval(
    '#isSwitchingToPreviouslyUsedTab',
    (el) => el.checked
  );
  res.isStayingOpen = await page.$eval('#isStayingOpen', (el) => el.checked);
  return res;
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
  },
};

async function setSettings(page) {
  await input(page, '#textScrollDelay', '1500');
  await input(page, '#textScrollCoefficient', '777');
  await input(page, '#autoSwitchingTimeout', '699');
  await input(page, '#numberOfTabsToShow', '5');
  await page.click('#isDarkTheme');
  await input(page, '#popupWidth', '444');
  await input(page, '#tabHeight', '30');
  await input(page, '#fontSize', '20');
  await input(page, '#iconSize', '55');
}

describe('settings >', function TestSettings() {
  this.timeout(30000);

  before(() => {
    return startPuppeteer().then((res) => {
      browser = res.browser;
      helper = res.helper;
    });
  });

  after(stopPuppeteer);

  afterEach(closeTabs);

  it('renders', async () => {
    const expected = defaultSettings;
    const settingsPage = await browser.newPage();
    await settingsPage.goto(settingsPageUrl);
    const actual = await getSettingsFromPage(settingsPage);
    assert.deepStrictEqual(actual, expected);
  });

  it('modifies and resets', async () => {
    const settingsPage = await browser.newPage();
    await settingsPage.goto(settingsPageUrl);
    await setSettings(settingsPage);
    let actual = await getSettingsFromPage(settingsPage);
    assert.deepStrictEqual(actual, newSettings, 'new settings set in the form');
    actual = await settingsPage.evaluate(() => JSON.parse(localStorage.settings));
    assert.deepStrictEqual(actual, newSettings, 'new settings set in localStorage');
    await settingsPage.click('#setDefaults');
    actual = await getSettingsFromPage(settingsPage);
    assert.deepStrictEqual(actual, defaultSettings, 'set defaults');
  });

  it('passes settings to a content script', async () => {
    function getSettingsFromContentScript() {
      return ([el]) => {
        const style = window.getComputedStyle(el);
        const popupWidth = Math.round(
          style.getPropertyValue('--popup-width-factor') * window.outerWidth
        );
        const tabHeight = Math.round(
          style.getPropertyValue('--tab-height-factor') * window.outerWidth
        );
        return {
          popupWidth,
          tabHeight,
          isDarkTheme: el.classList.contains('card_dark'),
        };
      };
    }

    const settingsPage = await browser.newPage();
    await settingsPage.goto(settingsPageUrl);
    await setSettings(settingsPage);
    const page = await helper.openPage('page-with-long-title.html');
    await helper.switchTab();
    let actual = await page.queryPopup('.card', getSettingsFromContentScript());
    assert.deepStrictEqual(
      actual,
      {
        popupWidth: newSettings.popupWidth,
        tabHeight: newSettings.tabHeight,
        isDarkTheme: newSettings.isDarkTheme,
      },
      'settings apply to the content script popup'
    );

    await settingsPage.click('#setDefaults');
    await page.bringToFront();
    await helper.selectTabForward();
    actual = await page.queryPopup('.card', getSettingsFromContentScript());
    assert.deepStrictEqual(
      actual,
      {
        popupWidth: defaultSettings.popupWidth,
        tabHeight: defaultSettings.tabHeight,
        isDarkTheme: defaultSettings.isDarkTheme,
      },
      'new settings apply to the rendered popup'
    );
  });

  it('validates inserted values', async () => {
    const settingsPage = await browser.newPage();
    await settingsPage.goto(settingsPageUrl);
    await input(settingsPage, '#textScrollDelay', '-1500');
    await input(settingsPage, '#popupWidth', 'asdf');
    const isValuesCorrect = await settingsPage.evaluate(() => {
      const {
        app: {
          settings: {textScrollDelay, popupWidth},
        },
      } = window;
      return (
        Number.isInteger(textScrollDelay) &&
        textScrollDelay >= 0 &&
        Number.isInteger(popupWidth) &&
        popupWidth >= 0
      );
    });
    assert(isValuesCorrect, 'values are valid');
  });

  it('opens contribute section', async () => {
    const settingsPage = await browser.newPage();
    await settingsPage.goto(settingsPageUrl);
    await settingsPage.click('#mdc-tab-2');
    const isContributeSectionOpen = await settingsPage.$eval(
      '.contribute',
      (el) => getComputedStyle(el).display !== 'none'
    );
    assert(isContributeSectionOpen, 'the contribute section is visible');
  });

  it('controls automatic switching to a previously used tab when a current one closes', async () => {
    const settingsPage = await browser.newPage();
    await settingsPage.goto(settingsPageUrl);
    await settingsPage.click('#isSwitchingToPreviouslyUsedTab');
    const pageWikipedia = await helper.openPage('wikipedia.html');
    await helper.openPage('example.html');
    await helper.openPage('stackoverflow.html');
    await pageWikipedia.bringToFront();
    await pageWikipedia.close();
    const activeTab = await helper.getActiveTab();
    const tabTitle = await activeTab.$eval('title', (el) => el.textContent);
    assert(tabTitle, 'Example', 'switched to the nearest tab');
  });

  it('controls hiding of the switcher when modifier key is released', async () => {
    const settingsPage = await browser.newPage();
    await settingsPage.goto(settingsPageUrl);
    await settingsPage.click('#isStayingOpen');
    await helper.openPage('wikipedia.html');
    await helper.openPage('example.html');
    await helper.switchTab();
    const activeTab = await helper.getActiveTab();
    const tabTitle = await activeTab.$eval('title', (el) => el.textContent);
    assert(tabTitle, 'Example', 'does not leave the current tab');
  });
});
