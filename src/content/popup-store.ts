import {createStore} from 'solid-js/store'
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
}

export function createPopupStore() {
  const [store, setStore] = createStore<IStore>({
    tabs: [],
    isOpen: false,
    settings: defaultSettings,
    zoomFactor: 1,
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
      tabs: model.tabs,
      settings: model.settings,
      zoomFactor: model.zoomFactor,
    })
  }

  return {
    store,
    closePopup,
    openPopup,
    syncStoreWithBackground,
  }
}
