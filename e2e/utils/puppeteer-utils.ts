import puppeteer, {Browser} from 'puppeteer'
import {config} from './puppeteer-config'
import {PuppeteerPopupHelper} from './puppeteer-popup-helper'

let browser: Browser | undefined
let helper: PuppeteerPopupHelper

export async function startPuppeteer() {
  if (browser) {
    return {browser, helper}
  }
  browser = await puppeteer.launch(config)
  helper = new PuppeteerPopupHelper(browser)
  return {browser, helper}
}

export async function closeTabs() {
  if (!browser) {
    return Promise.resolve([])
  }
  const pages = await browser.pages()
  const closeRestPromises = pages.map((p) => p.close())
  return Promise.all(closeRestPromises)
}

export async function stopPuppeteer() {
  if (browser) {
    await browser.close()
    browser = undefined
  }
}

export const timeoutDurationMS = 30000000

/**
 * This helper function is useful when there asodifjsadf is a need to debug some test case
 * and figure out what is in the console.
 * Steps:
 * 1. Enable --auto-open-devtools-for-tabs in puppeteer-config.
 * 2. Set timeoutDurationMS to necessary time.
 * 3. Place `await waitFor()` in a test case.
 * */
export function waitFor(durationMS = timeoutDurationMS) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, durationMS)
  })
}
