import browser from 'webextension-polyfill'
import {checkTab, ITab} from './check-tab'
import TabRegistry from './tab-registry'

export async function getTabRegistry(numberOfTabsToShow: number) {
  const windows = await browser.windows.getAll({populate: true})
  const tabs = windows
    .flatMap((w) => w.tabs || [])
    .map(checkTab)
    .sort(activeLast)
  return new TabRegistry({
    tabs,
    numberOfTabsToShow,
  })

  function activeLast(a: ITab, b: ITab) {
    if (a.active < b.active) {
      return -1
    }
    if (a.active > b.active) {
      return 1
    }
    return 0
  }
}
