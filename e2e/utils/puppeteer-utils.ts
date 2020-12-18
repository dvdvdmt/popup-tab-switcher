import puppeteer, {Browser} from 'puppeteer';
import puppeteerConfig from './puppeteer-config';
import {PuppeteerPopupHelper} from './puppeteer-popup-helper';

let browser: Browser;
let helper: PuppeteerPopupHelper;

export async function startPuppeteer() {
  if (browser) {
    return {browser, helper};
  }
  browser = await puppeteer.launch(puppeteerConfig);
  helper = new PuppeteerPopupHelper(browser);
  return {browser, helper};
}

export async function closeTabs() {
  const [firstPage, ...restPages] = await browser.pages();
  await firstPage.goto('about:blank');
  const closeRestPromises = restPages.map((p) => p.close());
  return Promise.all(closeRestPromises);
}

export async function stopPuppeteer() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
