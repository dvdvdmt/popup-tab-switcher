import {ITab} from './check-tab'
import TabRegistry from './tab-registry'

interface ITabRegistryFactoryParams {
  openTabs: ITab[]
  savedTabs: ITab[]
  numberOfTabsToShow: number
  onTabsUpdate?: (tabs: ITab[]) => void
}

interface ITabWithCreationOrder extends ITab {
  creationOrder: number
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
    const openTabsWithCreationOrder = this.getTabsWithCreationOrder(openTabs)
    const savedTabsWithCreationOrder = this.getTabsWithCreationOrder(savedTabs)
    this.sortOpenTabsUsingSimilaritiesInSavedTabs(
      openTabsWithCreationOrder,
      savedTabsWithCreationOrder
    )
    this.moveActiveTabToTheEnd(openTabsWithCreationOrder)
    return openTabsWithCreationOrder
  }

  /**
   * Goes through the saved tabs and tries to find the corresponding open tab.
   * If the tab is found then it is moved to the end of the open tabs array.
   */
  private static sortOpenTabsUsingSimilaritiesInSavedTabs(
    openTabs: ITabWithCreationOrder[],
    savedTabs: ITabWithCreationOrder[]
  ) {
    savedTabs.forEach((savedTab) => {
      const similarTabIndex = this.getSimilarTabIndex(openTabs, savedTab)
      if (similarTabIndex > -1) {
        this.moveItemToTheEnd(openTabs, similarTabIndex)
      }
    })
  }

  /**
   * Returns the index of the open tab that is similar to the saved tab.
   * The similarity is determined by the url and the creation order.
   */
  private static getSimilarTabIndex(
    openTabs: ITabWithCreationOrder[],
    savedTab: ITabWithCreationOrder
  ): number {
    let result = -1
    openTabs.forEach((openTab, index) => {
      if (openTab.url === savedTab.url && openTab.creationOrder === savedTab.creationOrder) {
        result = index
      }
    })
    return result
  }

  private static moveItemToTheEnd(array: ITab[], itemIndex: number) {
    console.assert(itemIndex > -1, 'The itemIndex should be greater than -1')
    console.assert(itemIndex < array.length, 'The itemIndex should be less than the array length')
    console.assert(array.length > 0, 'The array should not be empty')
    const similarTab = array[itemIndex]
    array.splice(itemIndex, 1)
    array.push(similarTab)
  }

  private static moveActiveTabToTheEnd(openTabs: ITab[]) {
    const activeTabIndex = openTabs.findIndex((tab) => tab.active)
    if (activeTabIndex > -1) {
      this.moveItemToTheEnd(openTabs, activeTabIndex)
    }
  }

  /**
   * Adds the creation order to the tabs.
   * The creation order defines the order in which tabs with the same url were created.
   *
   * Creation order algorithm:
   * - Sort tabs by their ids (lower id means that the tab was created earlier).
   * - Enumerate tabs with equal urls using the creation order. Cache creation order in idToCreationOrderMap.
   * - Apply the creation order to the original tabs.
   */
  private static getTabsWithCreationOrder(tabs: ITab[]): ITabWithCreationOrder[] {
    const idToCreationOrderMap = new Map<number, number>()
    const urlToCreationOrderMap = new Map<string, number>()
    const sortedTabs = tabs.slice().sort((tab1, tab2) => tab1.id - tab2.id)
    sortedTabs.forEach((tab) => {
      const creationOrder = urlToCreationOrderMap.get(tab.url) || 0
      idToCreationOrderMap.set(tab.id, creationOrder)
      urlToCreationOrderMap.set(tab.url, creationOrder + 1)
    })
    return tabs.map((tab) => ({
      ...tab,
      creationOrder: idToCreationOrderMap.get(tab.id) || 0,
    }))
  }
}
