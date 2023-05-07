import {Match, render, Switch} from 'solid-js/web'
import styles from './settings.module.scss'
import {createSettingsStore, ISettingsStore, IStoreSettingsService, PageTab} from './settings-store'
import {MTabBar} from './components/m-tab-bar'
import {SettingsForm} from './settings-form'
import {Contribute} from './contribute/contribute'
import areShortcutsSet from '../../utils/are-shortcuts-set'

interface ISettingsProps {
  settingsStore: ISettingsStore
}

export function Settings(props: ISettingsProps) {
  const {
    store,
    pageTabs,
    setCurrentPageTab,
    setKeyboardShortcutsEnabled,
    setSettingsOptions,
    restoreDefaultSettings,
  } = props.settingsStore
  return (
    <div
      class={`${styles.settings} mdc-typography`}
      classList={{[styles.settings_dark]: store.settings.isDarkTheme}}
      data-test="settings"
    >
      <MTabBar
        tabs={pageTabs}
        initialTabId={store.currentPageTabId}
        onTabActivated={setCurrentPageTab}
      />
      <Switch fallback={<div>Not Found</div>}>
        <Match when={PageTab.Settings === store.currentPageTabId}>
          <SettingsForm
            store={store}
            setKeyboardShortcutsEnabled={setKeyboardShortcutsEnabled}
            setSettingsOptions={setSettingsOptions}
            restoreDefaultSettings={restoreDefaultSettings}
          />
        </Match>
        <Match when={PageTab.Contribute === store.currentPageTabId}>
          <Contribute />
        </Match>
      </Switch>
    </div>
  )
}

export async function renderSettingsPage(settingsService: IStoreSettingsService) {
  const [initialSettings, areShortcutsEnabled] = await Promise.all([
    settingsService.getSettingsObject(),
    areShortcutsSet(),
  ])
  const settingsStore = await createSettingsStore({
    settingsService,
    initialSettings,
    areShortcutsEnabled,
  })
  window.settings = initialSettings
  render(() => <Settings settingsStore={settingsStore} />, document.body)
}
