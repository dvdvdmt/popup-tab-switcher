import assert from 'assert';
import * as tabRegistry from './tabRegistry';

describe('Tab registry', function () {
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

  it('pushes tabs correctly', function () {
    tabActivations.forEach(activeTab => tabRegistry.push(activeTab));
    assert.deepStrictEqual(tabRegistry.getTabs(), resultRegistry);
  });
});
