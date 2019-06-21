import assert from 'assert';
import puppeteer from 'puppeteer';
import { launchOptions } from './utils/config';
import { defaultSettings } from '../src/utils/settings';

let browser;

const settingsPageUrl = 'chrome-extension://meonejnmljcnoodabklmloagmnmcmlam/settings/index.html';

before(async () => {
  browser = await puppeteer.launch(launchOptions);
});

after(function () {
  browser.close();
});

describe('Settings', function () {
  it('Renders settings', async function () {
    const expected = defaultSettings;
    const settingsPage = await browser.newPage();
    await settingsPage.goto(settingsPageUrl);
    const actual = {};
    actual.textScrollDelay = await settingsPage.$eval('#textScrollDelay', el => +el.value);
    actual.textScrollCoefficient = await settingsPage.$eval('#textScrollCoefficient', el => +el.value);
    actual.autoSwitchingTimeout = await settingsPage.$eval('#autoSwitchingTimeout', el => +el.value);
    actual.maxNumberOfTabs = await settingsPage.$eval('#maxNumberOfTabs', el => +el.value);
    actual.isDarkTheme = await settingsPage.$eval('#isDarkTheme', el => el.checked);
    actual.popupWidth = await settingsPage.$eval('#popupWidth', el => +el.value);
    actual.tabHeight = await settingsPage.$eval('#tabHeight', el => +el.value);
    actual.fontSize = await settingsPage.$eval('#fontSize', el => +el.value);
    actual.iconSize = await settingsPage.$eval('#iconSize', el => +el.value);
    assert.deepStrictEqual(actual, expected);
  });
});
