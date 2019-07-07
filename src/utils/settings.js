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
};

export function initialize() {
  let settings;
  try {
    settings = JSON.parse(localStorage.settings);
  } catch (e) {
    settings = {};
  }
  localStorage.settings = JSON.stringify({ ...defaultSettings, ...settings });
}

export function getString() {
  return localStorage.settings;
}

export function get() {
  return JSON.parse(getString());
}

export function update(newSettings) {
  localStorage.settings = JSON.stringify(newSettings);
}

export function setDefaults() {
  update(defaultSettings);
}
