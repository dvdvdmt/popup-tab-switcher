import {ITab} from './check-tab'
import TabRegistry from './tab-registry'

interface ITabRegistryFactoryParams {
  openTabs: ITab[]
  savedTabs: ITab[]
  numberOfTabsToShow: number
  onTabsUpdate?: (tabs: ITab[]) => void
}

export class TabRegistryFactory {
  static create({
    numberOfTabsToShow,
    openTabs,
    savedTabs,
    onTabsUpdate,
  }: ITabRegistryFactoryParams): TabRegistry {
    const tabs = TabRegistryFactory.sortTabs(openTabs, savedTabs)
    return new TabRegistry({
      tabs,
      numberOfTabsToShow,
      onUpdate: onTabsUpdate,
    })
  }

  static sortTabs(openTabs: ITab[], savedTabs: ITab[]): ITab[] {
    savedTabs.forEach((savedTab) => {
      const similarTabIndex = openTabs.findIndex((openTab) => savedTab.url === openTab.url)
      if (similarTabIndex > -1) {
        const similarTab = openTabs[similarTabIndex]
        openTabs.splice(similarTabIndex, 1)
        openTabs.push(similarTab)
      }
    })
    return openTabs.sort(TabRegistryFactory.activeLast)
  }

  static activeLast(first: ITab, second: ITab) {
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
}
