import browser from 'webextension-polyfill'
import {ITab} from './check-tab'
import {log} from './logger'

export interface ITabInitializer {
  resolver: (status: boolean) => void
  promise: Promise<boolean>
}

export function createTabInitializer(tab: ITab): ITabInitializer {
  let resolver: (status: boolean) => void = () => {}
  const promise = new Promise<boolean>((resolve) => {
    resolver = resolve
    browser.scripting
      .executeScript({
        target: {tabId: tab.id, allFrames: false},
        files: ['content.js'],
      })
      .catch((e) => {
        log(`[tab initialization failed]`, tab, e)
        resolve(false)
      })
  })
  return {resolver, promise}
}
