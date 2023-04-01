import {Show} from 'solid-js/web'
import {ISettingsStore} from './settings-store'
import {MBanner} from './components/m-banner/m-banner'
import styles from './settings.module.scss'
import {MSwitch} from './components/m-switch'
import {ISettings} from '../../utils/settings'

interface IProps {
  store: ISettingsStore
  setKeyboardShortcutsEnabled: (enabled: boolean) => void
  setSettingsOptions: (options: Partial<ISettings>) => void
}

export function SettingsForm(props: IProps) {
  return (
    <form class="settings__form">
      <Show when={!props.store.isKeyboardShortcutsEnabled}>
        <MBanner
          icon="report_problem"
          message="Keyboard shortcuts for the extension are not configured. You should set them in Chrome settings"
          actionMessage="Set up shortcuts"
          onAction={() => {
            chrome.tabs.create({
              active: true,
              url: 'chrome://extensions/shortcuts#:~:text=Popup%20Tab%20Switcher',
            })
          }}
          onDismiss={() => {
            props.setKeyboardShortcutsEnabled(true)
          }}
        />
      </Show>
      <div class={styles.settings__row} title="Turns on or off the dark theme">
        <label for="isDarkTheme-new" class={styles.settings__label}>
          <i class="settings__icon settings__icon_label material-icons">brightness_3</i>
          Dark theme
        </label>
        <MSwitch
          id="isDarkTheme-new"
          isOn={props.store.settings.isDarkTheme}
          onToggle={() => {
            props.setSettingsOptions({isDarkTheme: !props.store.settings.isDarkTheme})
          }}
        />
      </div>
    </form>
  )
}
