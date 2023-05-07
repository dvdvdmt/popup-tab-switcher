import {createStore} from 'solid-js/store'
import {ISettings} from '../../utils/settings'
import {IPageTab} from './components/m-tab-bar'

export interface IStoreSettingsService {
  update(settings: Partial<ISettings>): Promise<void>
  reset(): Promise<void>
  getSettingsObject(): Promise<ISettings>
}

interface ISettingsStoreProps {
  areShortcutsEnabled: boolean
  initialSettings: ISettings
  settingsService: IStoreSettingsService
}

export interface ISettingsStore {
  pageTabs: IPageTab[]
  restoreDefaultSettings: () => Promise<void>
  setCurrentPageTab: (tabId: string) => void
  setKeyboardShortcutsEnabled: (enabled: boolean) => void
  setSettingsOptions: (options: Partial<ISettings>) => void
  store: ISettingsStoreObject
}

export interface ISettingsStoreObject {
  settings: ISettings
  currentPageTabId: string
  isKeyboardShortcutsEnabled: boolean
}

export const enum PageTab {
  Settings = 'settings',
  Contribute = 'contribute',
}

export function createSettingsStore({
  settingsService,
  initialSettings,
  areShortcutsEnabled,
}: ISettingsStoreProps): ISettingsStore {
  const pageTabs: IPageTab[] = [
    {id: PageTab.Settings, icon: 'settings'},
    {id: PageTab.Contribute, icon: 'favorite'},
  ]

  const [store, setStore] = createStore<ISettingsStoreObject>({
    settings: initialSettings, // Store can work only with plain objects.
    currentPageTabId: PageTab.Settings,
    isKeyboardShortcutsEnabled: areShortcutsEnabled,
  })

  return {
    pageTabs,
    restoreDefaultSettings,
    setCurrentPageTab,
    setKeyboardShortcutsEnabled,
    setSettingsOptions,
    store,
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

  async function restoreDefaultSettings() {
    await settingsService.reset()
    setStore('settings', await settingsService.getSettingsObject())
  }
}
