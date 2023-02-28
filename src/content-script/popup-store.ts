import {createStore, reconcile} from 'solid-js/store'
import browser from 'webextension-polyfill'
import {defaultSettings, ISettings} from '../utils/settings'
import {getModel, IGetModelResponse} from '../utils/messages'
import {log} from '../utils/logger'

interface IStore {
  tabs: chrome.tabs.Tab[]
  isOpen: boolean
  settings: ISettings
  zoomFactor: number
  selectedTabIndex: number // maybe replace it with selectedTabId?
}

export function createPopupStore() {
  const [store, setStore] = createStore<IStore>({
    tabs: [],
    isOpen: false,
    settings: defaultSettings,
    zoomFactor: 1,
    selectedTabIndex: 0,
  })

  const closePopup = () => {
    setStore('isOpen', false)
    setStore('selectedTabIndex', 0)
  }

  const openPopup = () => {
    setStore('isOpen', true)
  }

  const syncStoreWithBackground = async () => {
    const model: IGetModelResponse = await browser.runtime.sendMessage(getModel())
    log(`[syncStoreWithBackground model]`, model)
    setStore({
      zoomFactor: model.zoomFactor,
    })
    // This makes DOM updates efficient https://github.com/solidjs/solid/discussions/366#discussioncomment-5004420
    setStore('settings', reconcile(model.settings))
    setStore('tabs', reconcile(model.tabs))
  }

  return {
    store,
    closePopup,
    openPopup,
    syncStoreWithBackground,
    selectNextTab,
  }

  function selectNextTab(increment: number) {
    const newIndex = rangedIncrement(store.selectedTabIndex, increment, store.tabs.length)
    setStore('selectedTabIndex', newIndex)
  }
}

/**
 * Restricts result of a number increment between [0, maxInteger - 1]
 */
export function rangedIncrement(number: number, increment: number, maxInteger: number) {
  return (number + (increment % maxInteger) + maxInteger) % maxInteger
}
