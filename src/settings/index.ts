import {renderSettingsPage} from './solid-js/settings'
import {Port} from '../utils/constants'
import {IStoreSettingsService} from './solid-js/settings-store'
import {getSettings, setSettings} from '../utils/messages'

// eslint-disable-next-line no-undef
if (E2E) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore It is possible to import that file because of webpack aliases
  import('../../e2e/utils/e2e-content-script.ts')
}

document.addEventListener('DOMContentLoaded', () => {
  // The connection is necessary for tracking settings popup closing (https://stackoverflow.com/q/15798516/3167855)
  chrome.runtime.connect({name: Port.POPUP_SCRIPT})
  const settingsService: IStoreSettingsService = {
    async update(settings): Promise<void> {
      await chrome.runtime.sendMessage(setSettings(settings))
    },
    async reset() {
      await chrome.runtime.sendMessage(setSettings())
    },
    async getSettingsObject() {
      return chrome.runtime.sendMessage(getSettings())
    },
  }
  renderSettingsPage(settingsService)
})
