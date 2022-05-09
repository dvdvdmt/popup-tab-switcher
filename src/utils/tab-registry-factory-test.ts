import assert from 'assert'
import {TabRegistryFactory} from './tab-registry-factory'
import {ITab} from './check-tab'

function getTab(params: Partial<ITab>): ITab {
  const result: Partial<ITab> = {active: false, ...params}
  return result as ITab
}

function mapToTitles(tabs: ITab[]): (string | undefined)[] {
  return tabs.map(({title}) => title)
}

describe(TabRegistryFactory.name, () => {
  describe(`create`, () => {
    it(`creates registry if there are no saved tabs`, () => {
      const openTabs = [
        getTab({title: 'example', url: 'http://example.com'}),
        getTab({title: 'wikipedia', url: 'http://wikipedia.org', active: true}),
        getTab({title: 'stack', url: 'http://stack.com'}),
      ]
      const savedTabs: ITab[] = []
      const registry = TabRegistryFactory.create({numberOfTabsToShow: 5, openTabs, savedTabs})
      const result = registry.getTabs()
      assert.deepStrictEqual(mapToTitles(result), ['example', 'stack', 'wikipedia'])
    })
  })

  describe(`sortTabs`, () => {
    it(`sorts tabs accordingly to saved ones`, () => {
      const openTabs = [
        getTab({title: 'wikipedia', url: 'http://wikipedia.org'}),
        getTab({title: 'stack', url: 'http://stack.com'}),
        getTab({title: 'links', url: 'http://links.com'}),
        getTab({title: 'example', url: 'http://example.com'}),
        getTab({title: 'links', url: 'http://links.com'}),
      ]
      const savedTabs = [
        getTab({title: 'links', url: 'http://links.com'}),
        getTab({title: 'example', url: 'http://example.com'}),
        getTab({title: 'stack', url: 'http://stack.com'}),
        getTab({title: 'wikipedia', url: 'http://wikipedia.org'}),
        getTab({title: 'links', url: 'http://links.com'}),
      ]
      const result = TabRegistryFactory.sortTabs(openTabs, savedTabs)
      assert.deepStrictEqual(mapToTitles(result), mapToTitles(savedTabs))
    })

    it(`sorts tabs accordingly to saved ones but prioritizes the active one`, () => {
      const openTabs = [
        getTab({title: 'wikipedia', url: 'http://wikipedia.org'}),
        getTab({title: 'stack', url: 'http://stack.com', active: true}),
        getTab({title: 'example', url: 'http://example.com'}),
      ]
      const savedTabs = [
        getTab({title: 'example', url: 'http://example.com'}),
        getTab({title: 'stack', url: 'http://stack.com'}),
        getTab({title: 'wikipedia', url: 'http://wikipedia.org'}),
      ]
      const result = TabRegistryFactory.sortTabs(openTabs, savedTabs)
      assert.deepStrictEqual(mapToTitles(result), ['example', 'wikipedia', 'stack'])
    })
  })
})
