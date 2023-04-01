import {Show} from 'solid-js/web'
import {ISettingsStore} from './settings-store'
import {MBanner} from './components/m-banner/m-banner'

interface IProps {
  store: ISettingsStore
  setKeyboardShortcutsEnabled: (enabled: boolean) => void
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
      <h1>Settings Form</h1>
    </form>
  )
}
