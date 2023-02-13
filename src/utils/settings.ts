import type {Storage} from 'webextension-polyfill'

type LocalStorageArea = Storage.LocalStorageArea

export interface ISettings {
  textScrollDelay: number
  textScrollCoefficient: number
  autoSwitchingTimeout: number
  numberOfTabsToShow: number
  isDarkTheme: boolean
  popupWidth: number
  tabHeight: number
  fontSize: number
  iconSize: number
  opacity: number
  isSwitchingToPreviouslyUsedTab: boolean
  isStayingOpen: boolean
}

export const defaultSettings: ISettings = {
  textScrollDelay: 1000,
  textScrollCoefficient: 2500,
  autoSwitchingTimeout: 1000,
  numberOfTabsToShow: 7,
  isDarkTheme: false,
  popupWidth: 420,
  tabHeight: 40,
  fontSize: 16,
  iconSize: 24,
  opacity: 100,
  isSwitchingToPreviouslyUsedTab: true,
  isStayingOpen: false,
}

export interface ISettingsService extends ISettings {
  update(settings: ISettings): Promise<void>
  reset(): Promise<void>
}

export async function getSettings(storage: LocalStorageArea): Promise<ISettingsService> {
  const {settings: stored} = await storage.get('settings')
  return {
    ...defaultSettings,
    ...stored,
    async update(newSettings) {
      Object.assign(this, newSettings)
      await storage.set({settings: newSettings})
    },
    async reset() {
      Object.assign(this, defaultSettings)
      await storage.set({settings: defaultSettings})
    },
  }
}
