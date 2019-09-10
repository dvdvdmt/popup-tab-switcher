import browser from 'webextension-polyfill';

let isFocused = false;
browser.windows.onFocusChanged.addListener((windowId) => {
  isFocused = (windowId !== browser.windows.WINDOW_ID_NONE);
});

export default function isBrowserFocused() {
  return isFocused;
}
