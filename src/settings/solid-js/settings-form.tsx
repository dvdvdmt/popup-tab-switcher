import {Show} from 'solid-js/web'
import {ISettingsStore} from './settings-store'
import {MBanner} from './components/m-banner/m-banner'
import styles from './settings.module.scss'
import {MSwitch} from './components/m-switch'
import {ISettings} from '../../utils/settings'
import {MNumberInput} from './components/m-text-field/m-number-input'

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
        {/* TODO: remove all '-new' postfixes */}
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
      <div class={styles.settings__row} title="Sets the popup width">
        <label for="popupWidth-new" class={styles.settings__label}>
          <i class="settings__icon settings__icon_label material-icons">border_horizontal</i>
          Popup width
        </label>
        <MNumberInput
          id="popupWidth-new"
          suffix="px"
          value={props.store.settings.popupWidth}
          onInput={(value) => {
            props.setSettingsOptions({popupWidth: value})
          }}
        />
      </div>
      <div class={styles.settings__row} title="Sets the popup height">
        <label for="tabHeight-new" class={styles.settings__label}>
          <i class="settings__icon settings__icon_label material-icons">format_line_spacing</i>
          Tab height
        </label>
        <MNumberInput
          id="tabHeight-new"
          suffix="px"
          value={props.store.settings.tabHeight}
          onInput={(value) => {
            props.setSettingsOptions({tabHeight: value})
          }}
        />
      </div>
      <div
        class={styles.settings__row}
        title="Specifies how many recently used tabs to show in the popup"
      >
        <label for="numberOfTabsToShow-new" class={styles.settings__label}>
          <i class="settings__icon settings__icon_label material-icons">format_list_numbered</i>
          Max number of tabs
        </label>
        <MNumberInput
          id="numberOfTabsToShow-new"
          value={props.store.settings.numberOfTabsToShow}
          onInput={(value) => {
            props.setSettingsOptions({numberOfTabsToShow: value})
          }}
        />
      </div>
      <div class={styles.settings__row} title="Sets the size of the tab title text">
        <label for="fontSize-new" class={styles.settings__label}>
          <i class="settings__icon settings__icon_label material-icons">format_size</i>
          Font size
        </label>
        <MNumberInput
          id="fontSize-new"
          suffix="px"
          value={props.store.settings.fontSize}
          onInput={(value) => {
            props.setSettingsOptions({fontSize: value})
          }}
        />
      </div>
      <div class={styles.settings__row} title="Sets the size of the tab icon">
        <label for="iconSize-new" class={styles.settings__label}>
          <i class="settings__icon settings__icon_label material-icons">crop_original</i>
          Icon size
        </label>
        <MNumberInput
          id="iconSize-new"
          suffix="px"
          value={props.store.settings.iconSize}
          onInput={(value) => {
            props.setSettingsOptions({iconSize: value})
          }}
        />
      </div>
    </form>
  )
}
