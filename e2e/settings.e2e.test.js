import assert from 'assert';
import puppeteer from 'puppeteer';
import { launchOptions } from './utils/config';
import { defaultSettings } from '../src/utils/settings';
import PuppeteerPopupHelper from './utils/PuppeteerPopupHelper';

let browser;
let helper;

const settingsPageUrl = 'chrome-extension://meonejnmljcnoodabklmloagmnmcmlam/settings/index.html';

before(async () => {
  browser = await puppeteer.launch(launchOptions);
  helper = new PuppeteerPopupHelper(browser);
});

after(function () {
  browser.close();
});

async function input(page, selector, text) {
  await page.evaluate((s) => {
    document.querySelector(s).value = '';
  }, selector);
  await page.type(selector, text);
}

async function getSettingsFromPage(page) {
  const res = {};
  res.textScrollDelay = await page.$eval('#textScrollDelay', el => +el.value);
  res.textScrollCoefficient = await page.$eval('#textScrollCoefficient', el => +el.value);
  res.autoSwitchingTimeout = await page.$eval('#autoSwitchingTimeout', el => +el.value);
  res.maxNumberOfTabs = await page.$eval('#maxNumberOfTabs', el => +el.value);
  res.isDarkTheme = await page.$eval('#isDarkTheme', el => el.checked);
  res.popupWidth = await page.$eval('#popupWidth', el => +el.value);
  res.tabHeight = await page.$eval('#tabHeight', el => +el.value);
  res.fontSize = await page.$eval('#fontSize', el => +el.value);
  res.iconSize = await page.$eval('#iconSize', el => +el.value);
  return res;
}

const newSettings = {
  textScrollDelay: 1500,
  textScrollCoefficient: 777,
  autoSwitchingTimeout: 699,
  maxNumberOfTabs: 5,
  isDarkTheme: true,
  popupWidth: 444,
  tabHeight: 30,
  fontSize: 20,
  iconSize: 55,
};

async function setSettings(page) {
  await input(page, '#textScrollDelay', '1500');
  await input(page, '#textScrollCoefficient', '777');
  await input(page, '#autoSwitchingTimeout', '699');
  await input(page, '#maxNumberOfTabs', '5');
  await page.click('#isDarkTheme');
  await input(page, '#popupWidth', '444');
  await input(page, '#tabHeight', '30');
  await input(page, '#fontSize', '20');
  await input(page, '#iconSize', '55');
}

describe('Settings', function () {
  this.timeout(1000000);

  afterEach(async () => {
    await helper.closeTabs();
  });

  it('Render', async function () {
    const expected = defaultSettings;
    const settingsPage = await browser.newPage();
    await settingsPage.goto(settingsPageUrl);
    const actual = await getSettingsFromPage(settingsPage);
    assert.deepStrictEqual(actual, expected);
  });

  it('Modify and reset', async function () {
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

  it('Pass to content script', async function () {
    function getSettingsFromContentScript() {
      return ([el]) => {
        const style = window.getComputedStyle(el);
        const popupWidth = Math.round(style.getPropertyValue('--popup-width-factor') * window.outerWidth);
        const tabHeight = Math.round(style.getPropertyValue('--tab-height-factor') * window.outerWidth);
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
    assert.deepStrictEqual(actual, {
      popupWidth: newSettings.popupWidth,
      tabHeight: newSettings.tabHeight,
      isDarkTheme: newSettings.isDarkTheme,
    }, 'settings apply to the content script popup');

    await settingsPage.click('#setDefaults');
    await page.bringToFront();
    await helper.selectTabForward();
    actual = await page.queryPopup('.card', getSettingsFromContentScript());
    assert.deepStrictEqual(actual, {
      popupWidth: defaultSettings.popupWidth,
      tabHeight: defaultSettings.tabHeight,
      isDarkTheme: defaultSettings.isDarkTheme,
    }, 'new settings apply to the rendered popup');
  });
});
