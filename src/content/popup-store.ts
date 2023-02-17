import {createStore, reconcile} from 'solid-js/store'
import browser from 'webextension-polyfill'
import type {ITab} from '../utils/check-tab'
import {ISettings, defaultSettings} from '../utils/settings'
import {getModel, IGetModelResponse} from '../utils/messages'
import {log} from '../utils/logger'

interface IStore {
  tabs: ITab[]
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
  }

  const openPopup = () => {
    setStore('isOpen', true)
  }

  const syncStoreWithBackground = async () => {
    const model: IGetModelResponse = await browser.runtime.sendMessage(getModel())
    log(`[syncStoreWithBackground model]`, model)
    setStore({
      settings: model.settings,
      zoomFactor: model.zoomFactor,
    })
    // This makes DOM updates efficient https://github.com/solidjs/solid/discussions/366#discussioncomment-5004420
    setStore('tabs', reconcile(model.tabs))
  }

  return {
    store,
    closePopup,
    openPopup,
    syncStoreWithBackground,
  }
}
