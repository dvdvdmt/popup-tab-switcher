import browser from 'webextension-polyfill';
import { UPDATE_SETTINGS_MESSAGE } from './constants';

const defaultSettings = {
  textScrollDelay: 1000,
  textScrollCoefficient: 2500,
  autoSwitchingTimeout: 1000,
  isDarkTheme: false,
  sizes: {
    popupWidth: 420,
    popupHeight: 448,
    popupBorderRadius: 8,
    tabHeight: 40,
    font: 16,
    icon: 24,
  },
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

export async function update(newSettings) {
  localStorage.settings = JSON.stringify(newSettings);

  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  browser.tabs.sendMessage(currentTab.id, {
    type: UPDATE_SETTINGS_MESSAGE,
    newSettings,
  });
}
