/* eslint-env browser */
export const defaultSettings = {
  textScrollDelay: 1000,
  textScrollCoefficient: 2500,
  autoSwitchingTimeout: 1000,
  numberOfTabsToShow: 7,
  isDarkTheme: false,
  popupWidth: 420,
  tabHeight: 40,
  fontSize: 16,
  iconSize: 24,
  isSwitchingToPreviouslyUsedTab: true,
};

export default class Settings {
  constructor(defaults = defaultSettings, storage = localStorage) {
    this.defauts = defaults;
    this.storage = storage;
    let settings;
    try {
      settings = JSON.parse(this.storage.settings);
    } catch (e) {
      settings = {};
    }
    this.storage.settings = JSON.stringify({ ...defaults, ...settings });
  }

  get(name) {
    return this.getObject()[name];
  }

  getObject() {
    return JSON.parse(this.getString());
  }

  getString() {
    return this.storage.settings;
  }

  update(newSettings) {
    this.storage.settings = JSON.stringify(newSettings);
  }

  setDefaults() {
    this.update(this.defauts);
  }
}
