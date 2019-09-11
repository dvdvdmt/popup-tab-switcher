import assert from 'assert';
import {
  describe,
  it,
} from 'mocha';
import TabRegistry from './tab-registry';

describe('Tab registry', function () {
  it('Maintains the right order of recently active tabs', function () {
    const tabActivations = [
      {
        id: 1,
        title: '1 tab',
        url: '1 tab url',
        favIconUrl: '1 tab favicon',
      }, {
        id: 2,
        title: '2 tab',
        url: '2 tab url',
        favIconUrl: '2 tab favicon',
      }, {
        id: 3,
        title: '3 tab',
        url: '3 tab url',
        favIconUrl: '3 tab favicon',
      }, {
        id: 4,
        title: '4 tab',
        url: '4 tab url',
        favIconUrl: '4 tab favicon',
      }, {
        id: 2,
        title: '2 tab',
        url: '2 tab url',
        favIconUrl: '2 tab favicon',
      }, {
        id: 3,
        title: '3 tab',
        url: '3 tab url',
        favIconUrl: '3 tab favicon',
      },
    ];
    const resultRegistry = [
      {
        id: 3,
        title: '3 tab',
        url: '3 tab url',
        favIconUrl: '3 tab favicon',
      }, {
        id: 2,
        title: '2 tab',
        url: '2 tab url',
        favIconUrl: '2 tab favicon',
      },
      {
        id: 4,
        title: '4 tab',
        url: '4 tab url',
        favIconUrl: '4 tab favicon',
      },
    ];
    const registry = new TabRegistry({numberOfTabsToShow: 3});
    tabActivations.forEach((activeTab) => registry.push(activeTab));
    assert.deepStrictEqual(registry.getTabsToShow(), resultRegistry);
  });

  it('Removes tabs correctly', function () {
    const tabActivations = [
      {
        id: 3,
        title: '3 tab',
        url: '3 tab url',
        favIconUrl: '3 tab favicon',
      },
      {
        id: 2,
        title: '2 tab',
        url: '2 tab url',
        favIconUrl: '2 tab favicon',
      },
      {
        id: 4,
        title: '4 tab',
        url: '4 tab url',
        favIconUrl: '4 tab favicon',
      },
      {
        id: 1,
        title: '1 tab',
        url: '1 tab url',
        favIconUrl: '1 tab favicon',
      },
    ];
    const resultRegistry = [
      {
        id: 7,
        title: '7 tab',
        url: '7 tab url',
        favIconUrl: '7 tab favicon',
      },
      {
        id: 1,
        title: '1 tab',
        url: '1 tab url',
        favIconUrl: '1 tab favicon',
      },
      {
        id: 2,
        title: '2 tab',
        url: '2 tab url',
        favIconUrl: '2 tab favicon',
      },
    ];
    const registry = new TabRegistry();
    tabActivations.forEach((activeTab) => registry.push(activeTab));
    registry.remove(4);
    registry.remove(3);
    registry.push(resultRegistry[0]);
    assert.deepStrictEqual(registry.getTabsToShow(), resultRegistry);
  });

  it('Updates tab with new info', function () {
    const tabActivations = [
      {
        id: 1,
        title: '1 tab',
        url: '1 tab url',
        favIconUrl: '1 tab favicon',
      },
      {
        id: 4,
        title: '4 tab',
        url: '4 tab url',
        favIconUrl: '4 tab favicon',
      },
      {
        id: 2,
        title: '2 tab',
        url: '2 tab url',
        favIconUrl: '2 tab favicon',
      },
      {
        id: 3,
        title: '3 tab',
        url: '3 tab url',
        favIconUrl: '3 tab favicon',
      },
    ];
    const resultRegistry = [
      {
        id: 1,
        title: '1 tab',
        url: '1 tab url',
        favIconUrl: '1 tab favicon',
      },
      {
        id: 4,
        title: '4 tab',
        url: '4 tab url',
        favIconUrl: '4 tab favicon',
      },
      {
        id: 2,
        title: '2 tab updated',
        url: '2 tab url updated',
        favIconUrl: '2 tab favicon updated',
      },
      {
        id: 3,
        title: '3 tab',
        url: '3 tab url',
        favIconUrl: '3 tab favicon',
      },
    ];
    const registry = new TabRegistry();
    tabActivations.forEach((activeTab) => registry.push(activeTab));
    registry.update({
      id: 2,
      title: '2 tab updated',
      url: '2 tab url updated',
      favIconUrl: '2 tab favicon updated',
    });
    assert.deepStrictEqual(registry.getTabs(), resultRegistry);
  });
});
