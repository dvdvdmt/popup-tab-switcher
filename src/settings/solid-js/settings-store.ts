import {createStore} from 'solid-js/store'
import {ISettings, ISettingsService} from '../../utils/settings'
import {IPageTab} from './components/m-tab-bar'
import areShortcutsSet from '../../utils/are-shortcuts-set'

interface ISettingsStoreProps {
  settingsService: ISettingsService
}

export interface ISettingsStore {
  settings: ISettings
  currentPageTabId: string
  isKeyboardShortcutsEnabled: boolean
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
    settings: settingsService.getSettingsObject(), // Store can work only with plain objects.
    currentPageTabId: PageTab.Settings,
    isKeyboardShortcutsEnabled: true,
  })

  areShortcutsSet().then(setKeyboardShortcutsEnabled)

  return {
    store,
    setStore,
    pageTabs,
    setCurrentPageTab,
    setKeyboardShortcutsEnabled,
    setSettingsOptions,
  }

  function setCurrentPageTab(tabId: string) {
    setStore({currentPageTabId: tabId})
  }

  function setKeyboardShortcutsEnabled(enabled: boolean) {
    setStore({isKeyboardShortcutsEnabled: enabled})
  }

  function setSettingsOptions(options: Partial<ISettings>) {
    settingsService.update(options).then(() => {
      setStore('settings', options)
    })
  }
}
