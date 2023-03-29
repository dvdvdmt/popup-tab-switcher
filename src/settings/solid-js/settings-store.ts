import {createStore} from 'solid-js/store'
import {ISettings, ISettingsService} from '../../utils/settings'
import {IPageTab} from './components/m-tab-bar'

interface ISettingsStoreProps {
  settingsService: ISettingsService
}

interface ISettingsStore {
  settings: ISettings
  currentPageTabId: string
}

export const enum PageTab {
  Settings = 'settings',
  Contribute = 'contribute',
}

export function createSettingsStore({settingsService}: ISettingsStoreProps) {
  const pageTabs: IPageTab[] = [
    {id: PageTab.Settings, icon: 'settings'},
    {id: PageTab.Contribute, icon: 'favorite'},
  ]
  const [store, setStore] = createStore<ISettingsStore>({
    settings: settingsService,
    currentPageTabId: PageTab.Settings,
  })

  return {store, pageTabs, setCurrentPageTab}

  function setCurrentPageTab(tabId: string) {
    setStore({currentPageTabId: tabId})
  }
}
