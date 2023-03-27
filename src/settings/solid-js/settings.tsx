import {Match, render, Switch} from 'solid-js/web'
import styles from './settings.module.scss'
import {ServiceFactory} from '../../service-factory'
import {ISettingsService} from '../../utils/settings'
import {createSettingsStore, PageTab} from './settings-store'
import {MTabBar} from './m-tab-bar'

interface ISettingsProps {
  settingsService: ISettingsService
}

export function Settings(props: ISettingsProps) {
  const {store, pageTabs, setCurrentPageTab} = createSettingsStore(props)
  return (
    <div
      class={`${styles.settings} mdc-typography`}
      classList={{[styles.settings_dark]: store.settings.isDarkTheme}}
    >
      <MTabBar tabs={pageTabs} onTabActivated={setCurrentPageTab} />
      <Switch fallback={<div>Not Found</div>}>
        <Match when={PageTab.Settings === store.currentPageTabId}>
          <div>Settings</div>
        </Match>
        <Match when={PageTab.Contribute === store.currentPageTabId}>
          <div>Contribute</div>
        </Match>
      </Switch>
    </div>
  )
}

export async function initSettings() {
  const settings = await ServiceFactory.getSettings()
  window.settings = settings
  // TODO: Render the app right into the body element
  const appRootElement = document.createElement('div')
  render(() => <Settings settingsService={settings} />, appRootElement)

  document.body.appendChild(appRootElement)
}
