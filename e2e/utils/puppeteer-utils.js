import puppeteer from 'puppeteer';
import puppeteerConfig from './puppeteer-config';
import PuppeteerPopupHelper from './puppeteer-popup-helper';

/** @type {Browser} */
let browser;
/** @type {PuppeteerPopupHelper} */
let helper;

export async function startPuppeteer() {
  if (browser) {
    return {browser, helper};
  }
  browser = await puppeteer.launch(puppeteerConfig);
  const [blankPage] = await browser.pages();
  helper = new PuppeteerPopupHelper(browser, blankPage);
  return {browser, helper};
}

export async function restartPuppeteer() {
  if (browser) {
    await browser.close();
    browser = null;
  }
  return startPuppeteer();
}
