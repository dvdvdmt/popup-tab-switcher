type LocalStorageArea = chrome.storage.LocalStorageArea

export interface ISettings {
  textScrollDelay: number
  textScrollSpeed: number
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
  textScrollSpeed: 1,
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
  update(settings: Partial<ISettings>): Promise<void>
  reset(): Promise<void>
  getSettingsObject(): ISettings
}

export async function getSettings(storage: LocalStorageArea): Promise<ISettingsService> {
  const {settings: stored} = await storage.get('settings')
  return {
    ...defaultSettings,
    ...stored,
    async update(this: ISettingsService, newSettings: Partial<ISettings>) {
      Object.assign(this, newSettings)
      await storage.set({settings: this.getSettingsObject()})
    },
    async reset() {
      Object.assign(this, defaultSettings)
      await storage.set({settings: defaultSettings})
    },
    getSettingsObject(this: ISettingsService): ISettings {
      return {
        textScrollDelay: this.textScrollDelay,
        textScrollSpeed: this.textScrollSpeed,
        autoSwitchingTimeout: this.autoSwitchingTimeout,
        numberOfTabsToShow: this.numberOfTabsToShow,
        isDarkTheme: this.isDarkTheme,
        popupWidth: this.popupWidth,
        tabHeight: this.tabHeight,
        fontSize: this.fontSize,
        iconSize: this.iconSize,
        opacity: this.opacity,
        isSwitchingToPreviouslyUsedTab: this.isSwitchingToPreviouslyUsedTab,
        isStayingOpen: this.isStayingOpen,
      }
    },
  }
}
