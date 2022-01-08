import {Storage} from 'webextension-polyfill'

import LocalStorageArea = Storage.LocalStorageArea

export interface DefaultSettings {
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

export const defaultSettings: DefaultSettings = {
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

export interface ISettings extends DefaultSettings {
  update(settings: DefaultSettings): Promise<void>
  reset(): Promise<void>
}

export async function getSettings(storage: LocalStorageArea): Promise<ISettings> {
  const stored = await storage.get('settings')
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
