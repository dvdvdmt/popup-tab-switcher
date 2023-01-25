import {ITab} from './check-tab'

export function getTabsInfo(tabs: ITab[]): string {
  return tabs.map((tab) => `#${tab.id} ${tab.title}`).join('\n')
}
