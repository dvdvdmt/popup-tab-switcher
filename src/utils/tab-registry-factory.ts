import {ITab} from './check-tab'
import TabRegistry from './tab-registry'

interface ITabRegistryParams {
  openTabs: ITab[]
  savedTabs: ITab[]
  numberOfTabsToShow: number
  onTabsUpdate?: (tabs: ITab[]) => void
}

export function getTabRegistry({
  numberOfTabsToShow,
  openTabs,
  savedTabs,
  onTabsUpdate,
}: ITabRegistryParams): TabRegistry {
  const tabs = sortTabs(openTabs, savedTabs)
  return new TabRegistry({
    tabs,
    numberOfTabsToShow,
    onUpdate: onTabsUpdate,
  })
}

function activeLast(first: ITab, second: ITab) {
  const isFirstActive = first.active && !second.active
  const isSecondActive = !first.active && second.active
  if (isFirstActive) {
    return 1
  }
  if (isSecondActive) {
    return -1
  }
  return 0
}

export function sortTabs(openTabs: ITab[], savedTabs: ITab[]): ITab[] {
  savedTabs.forEach((savedTab) => {
    openTabs.sort((first, second) => {
      const isFirstSimilarToSaved =
        first.title === savedTab.title && second.title !== savedTab.title
      const isSecondSimilarToSaved =
        first.title !== savedTab.title && second.title === savedTab.title
      if (isFirstSimilarToSaved) {
        return 1
      }
      if (isSecondSimilarToSaved) {
        return -1
      }
      return 0
    })
  })
  return openTabs.sort(activeLast)
}
