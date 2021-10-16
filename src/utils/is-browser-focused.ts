import browser from 'webextension-polyfill';

let isFocused = false;
browser.windows.onFocusChanged.addListener(async () => {
  const lastFocused = await browser.windows.getLastFocused();
  isFocused = lastFocused.focused;
});

export function isBrowserFocused() {
  return isFocused;
}
