import assert from 'assert'
import {TabRegistryFactory} from './tab-registry-factory'
import {ITab} from './check-tab'

function getTab(params: Partial<ITab>): ITab {
  const result: Partial<ITab> = {active: false, ...params}
  return result as ITab
}

function mapToResult(tabs: ITab[]): Pick<ITab, 'url' | 'id'>[] {
  return tabs.map(({id, url}) => ({id, url}))
}

describe(TabRegistryFactory.name, () => {
  describe(`create`, () => {
    it(`creates registry if there are no saved tabs`, () => {
      const openTabs = [
        getTab({id: 1001, url: 'example'}),
        getTab({id: 1002, url: 'wikipedia', active: true}),
        getTab({id: 1003, url: 'stack'}),
      ]
      const savedTabs: ITab[] = []
      const registry = TabRegistryFactory.create({numberOfTabsToShow: 5, openTabs, savedTabs})
      const result = registry.getTabs()
      const expected = [
        getTab({id: 1001, url: 'example'}),
        getTab({id: 1003, url: 'stack'}),
        getTab({id: 1002, url: 'wikipedia'}),
      ]
      assert.deepStrictEqual(mapToResult(result), mapToResult(expected))
    })
  })

  describe(`sortTabs`, () => {
    // Problem:
    // Current sorting algorithm doesn't distinct between tabs with equal URLs.
    //
    // Example:
    // Given the openTabs array [tab1, tab2, activeTab] where tab1, tab2 have equal 'example' URL
    // and the user last accessed the tab2.
    // And the savedTabs array is [tab] with 'example' URL,
    // When the openTabs is sorted using the savedTabs.
    // Then the resulted array will be: [tab2, tab1, activeTab]
    // This places the tab1 before the tab2 which is invalid last access order.
    //
    // This may confuse the user because another tab will be selected after the extension initialisation.
    // If the tab could be identified uniquely between sessions (browser reloads) then the sorting would be easy to do.
    // This answer may provide the solution for the unique tabs between sessions (https://stackoverflow.com/a/14518800/3167855)
    it(`sorts tabs accordingly to saved ones`, () => {
      const openTabs = [
        getTab({id: 1001, url: 'wikipedia'}),
        getTab({id: 1002, url: 'stack'}),
        getTab({id: 1003, url: 'links'}),
        getTab({id: 1004, url: 'example'}),
        getTab({id: 1005, url: 'links'}),
      ]
      const savedTabs = [
        getTab({id: 2001, url: 'links'}),
        getTab({id: 2002, url: 'example'}),
        getTab({id: 2003, url: 'stack'}),
        getTab({id: 2004, url: 'wikipedia'}),
        getTab({id: 2005, url: 'links'}),
      ]
      const expected = [
        getTab({id: 1003, url: 'links'}),
        getTab({id: 1004, url: 'example'}),
        getTab({id: 1002, url: 'stack'}),
        getTab({id: 1001, url: 'wikipedia'}),
        getTab({id: 1005, url: 'links'}),
      ]
      const result = TabRegistryFactory.sortTabs(openTabs, savedTabs)
      assert.deepStrictEqual(mapToResult(result), mapToResult(expected))
    })

    it(`sorts tabs accordingly to saved ones but prioritizes the active one`, () => {
      const openTabs = [
        getTab({id: 1001, url: 'wikipedia'}),
        getTab({id: 1002, url: 'stack', active: true}),
        getTab({id: 1003, url: 'example'}),
      ]
      const savedTabs = [
        getTab({id: 2001, url: 'example'}),
        getTab({id: 2002, url: 'stack'}),
        getTab({id: 2003, url: 'wikipedia'}),
      ]
      const expected = [
        getTab({id: 1003, url: 'example'}),
        getTab({id: 1001, url: 'wikipedia'}),
        getTab({id: 1002, url: 'stack'}),
      ]
      const result = TabRegistryFactory.sortTabs(openTabs, savedTabs)
      assert.deepStrictEqual(mapToResult(result), mapToResult(expected))
    })
  })
})
