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

export default class Settings {
  private readonly defaults: DefaultSettings

  private storage: Storage

  constructor(defaults = defaultSettings, storage = localStorage) {
    this.defaults = defaults
    this.storage = storage
    let settings
    try {
      settings = JSON.parse(this.storage.settings)
    } catch (e) {
      settings = {}
    }
    this.storage.settings = JSON.stringify({...defaults, ...settings})
  }

  get(name: keyof DefaultSettings) {
    return this.getObject()[name]
  }

  getObject(): DefaultSettings {
    return JSON.parse(this.getString())
  }

  getString() {
    return this.storage.settings
  }

  update(newSettings: DefaultSettings) {
    this.storage.settings = JSON.stringify(newSettings)
  }

  setDefaults() {
    this.update(this.defaults)
  }
}
