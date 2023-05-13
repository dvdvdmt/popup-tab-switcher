let isFocused = false
chrome.windows.onFocusChanged.addListener(async () => {
  const lastFocused = await chrome.windows.getLastFocused()
  isFocused = lastFocused.focused
})

export function isBrowserFocused() {
  return isFocused
}
