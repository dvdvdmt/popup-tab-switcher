import assert from 'assert';
import * as tabRegistry from './tabRegistry';

describe('Tab registry', function () {
  it('pushes tabs correctly', function () {
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
      {
        id: 1,
        title: '1 tab',
        url: '1 tab url',
        favIconUrl: '1 tab favicon',
      },
    ];

    tabActivations.forEach(activeTab => tabRegistry.push(activeTab));
    assert.deepStrictEqual(tabRegistry.getTabs(), resultRegistry);
  });

  it('removes tabs correctly', function () {
    const tabActivations = [
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
        id: 2,
        title: '2 tab',
        url: '2 tab url',
        favIconUrl: '2 tab favicon',
      },
      {
        id: 1,
        title: '1 tab',
        url: '1 tab url',
        favIconUrl: '1 tab favicon',
      },
    ];
    tabRegistry.init(tabActivations);
    tabRegistry.remove(4);
    tabRegistry.remove(3);
    tabRegistry.push({
      id: 7,
      title: '7 tab',
      url: '7 tab url',
      favIconUrl: '7 tab favicon',
    });
    assert.deepStrictEqual(tabRegistry.getTabs(), resultRegistry);
  });
});
