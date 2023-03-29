import {Show} from 'solid-js/web'
import {ISettingsStore} from './settings-store'

interface IProps {
  store: ISettingsStore
}

export function SettingsForm(props: IProps) {
  return (
    <form class="settings__form">
      <Show when={!props.store.isKeyboardShortcutsEnabled}>
        <div>You need to set shortcuts!</div>
      </Show>
      <h1>Settings Form</h1>
    </form>
  )
}
