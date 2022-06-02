import assert from 'assert'
import {TabRegistryFactory} from './tab-registry-factory'
import {ITab} from './check-tab'

function getTab(params: Partial<ITab>): ITab {
  const result: Partial<ITab> = {active: false, ...params}
  return result as ITab
}

function mapToUrls(tabs: ITab[]): (string | undefined)[] {
  return tabs.map(({url}) => url)
}

describe(TabRegistryFactory.name, () => {
  describe(`create`, () => {
    it(`creates registry if there are no saved tabs`, () => {
      const openTabs = [
        getTab({url: 'example'}),
        getTab({url: 'wikipedia', active: true}),
        getTab({url: 'stack'}),
      ]
      const savedTabs: ITab[] = []
      const registry = TabRegistryFactory.create({numberOfTabsToShow: 5, openTabs, savedTabs})
      const result = registry.getTabs()
      assert.deepStrictEqual(mapToUrls(result), ['example', 'stack', 'wikipedia'])
    })
  })

  describe(`sortTabs`, () => {
    it(`sorts tabs accordingly to saved ones`, () => {
      const openTabs = [
        getTab({url: 'wikipedia'}),
        getTab({url: 'stack'}),
        getTab({url: 'links'}),
        getTab({url: 'example'}),
        getTab({url: 'links'}),
      ]
      const savedTabs = [
        getTab({url: 'links'}),
        getTab({url: 'example'}),
        getTab({url: 'stack'}),
        getTab({url: 'wikipedia'}),
        getTab({url: 'links'}),
      ]
      const result = TabRegistryFactory.sortTabs(openTabs, savedTabs)
      assert.deepStrictEqual(mapToUrls(result), mapToUrls(savedTabs))
    })

    it(`sorts tabs accordingly to saved ones but prioritizes the active one`, () => {
      const openTabs = [
        getTab({url: 'wikipedia'}),
        getTab({url: 'stack', active: true}),
        getTab({url: 'example'}),
      ]
      const savedTabs = [
        getTab({url: 'example'}),
        getTab({url: 'stack'}),
        getTab({url: 'wikipedia'}),
      ]
      const result = TabRegistryFactory.sortTabs(openTabs, savedTabs)
      assert.deepStrictEqual(mapToUrls(result), ['example', 'wikipedia', 'stack'])
    })
  })
})
