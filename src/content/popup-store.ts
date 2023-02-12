import {createStore} from 'solid-js/store'
import type {ITab} from '../utils/check-tab'

interface IStore {
  tabs: ITab[]
  isShown: boolean
}

export function createPopupStore() {
  const [store, setStore] = createStore<IStore>({
    tabs: [],
    isShown: false,
  })

  const hidePopup = () => {
    setStore('isShown', false)
  }

  const showPopup = () => {
    setStore('isShown', true)
  }

  return {
    store,
    hidePopup,
    showPopup,
  }
}
