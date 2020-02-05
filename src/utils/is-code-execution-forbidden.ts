import {Tabs} from 'webextension-polyfill-ts';

import Tab = Tabs.Tab;

export default function isCodeExecutionForbidden(tab: Tab) {
  return /^(chrome|view-source):/.test(tab.url);
}
