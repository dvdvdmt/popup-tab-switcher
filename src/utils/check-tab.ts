type Tab = chrome.tabs.Tab

/**
 * This interface guarantees the presence of potentially undefined fields in a tab object
 * that comes from browser API.
 * We can guarantee their presence because the extension uses 'tabs' permission.
 * */
export interface ITab extends Tab {
  id: number
  url: string
  windowId: number
}

// TODO: Remove this function because it misleads the consumers of the API
export function checkTab(tab: Tab): ITab {
  if (!tab.id) {
    console.warn('The tab.id is empty', tab)
  }
  if (!tab.windowId) {
    console.warn('The tab.windowId is empty', tab)
  }
  if (!tab.url) {
    console.warn('The tab.url is empty', tab)
  }

  return tab as ITab
}
