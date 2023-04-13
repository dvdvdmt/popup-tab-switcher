import {Show} from 'solid-js/web'
import {ISettingsStore} from './settings-store'
import {MBanner} from './components/m-banner/m-banner'
import styles from './settings.module.scss'
import {MSwitch} from './components/m-switch'
import {ISettings} from '../../utils/settings'
import {MNumberInput} from './components/m-text-field/m-number-input'
import {MButton} from './components/m-button/m-button'

interface IProps {
  store: ISettingsStore
  setKeyboardShortcutsEnabled: (enabled: boolean) => void
  setSettingsOptions: (options: Partial<ISettings>) => void
  restoreDefaultSettings: () => void
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
        <label for="isDarkTheme-new" class={styles.settings__label} data-test="darkModeToggle">
          <i class={styles.iconInLabel}>brightness_3</i>
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
          <i class={styles.iconInLabel}>border_horizontal</i>
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
          <i class={styles.iconInLabel}>format_line_spacing</i>
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
          <i class={styles.iconInLabel}>format_list_numbered</i>
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
          <i class={styles.iconInLabel}>format_size</i>
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
          <i class={styles.iconInLabel}>crop_original</i>
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
      <div class={styles.settings__row} title="Sets popup opacity (0 - invisible, 100 - visible)">
        <label for="opacity-new" class={styles.settings__label}>
          <i class={styles.iconInLabel}>opacity</i>
          Opacity
        </label>
        <MNumberInput
          id="opacity-new"
          value={props.store.settings.opacity}
          suffix="%"
          min={0}
          max={100}
          onInput={(value) => {
            props.setSettingsOptions({opacity: value})
          }}
        />
      </div>
      <div
        class={styles.settings__row}
        title="If a page has no focus (address bar or search field is focused, etc.) then the extension starts a timer by the end of which it will switch a user to the selected tab. This timer restarts on each selection command (Alt+Y or Alt+Shift+Y by default)"
      >
        <label for="autoSwitchingTimeout-new" class={styles.settings__label}>
          <i class={styles.iconInLabel}>timelapse</i>
          Auto switching timeout
        </label>
        <MNumberInput
          id="autoSwitchingTimeout-new"
          suffix="ms"
          value={props.store.settings.autoSwitchingTimeout}
          onInput={(value) => {
            props.setSettingsOptions({autoSwitchingTimeout: value})
          }}
        />
      </div>
      <div
        class={styles.settings__row}
        title="If a tab title is wider than the popup then its overflowing part will be hidden. When such a tab is selected its text will be scrolled. This option delays the start of the scrolling"
      >
        <label for="textScrollDelay-new" class={styles.settings__label}>
          <i class={styles.iconInLabel}>timer</i>
          Text scroll delay
        </label>
        <MNumberInput
          id="textScrollDelay-new"
          suffix="ms"
          value={props.store.settings.textScrollDelay}
          onInput={(value) => {
            props.setSettingsOptions({textScrollDelay: value})
          }}
        />
      </div>
      <div class={styles.settings__row} title="Sets the speed of a selected tab text scrolling">
        <label for="textScrollCoefficient-new" class={styles.settings__label}>
          <i class={styles.iconInLabel}>text_rotation_none</i>
          Text scroll speed
        </label>
        <MNumberInput
          id="textScrollCoefficient-new"
          value={props.store.settings.textScrollCoefficient}
          onInput={(value) => {
            props.setSettingsOptions({textScrollCoefficient: value})
          }}
        />
      </div>
      <div
        class={styles.settings__row}
        title="Switch to a previously active tab when the current one closes"
      >
        <label for="isSwitchingToPreviouslyUsedTab-new" class={styles.settings__label}>
          <i class={styles.iconInLabel}>low_priority</i>
          Switch to a previously used tab
        </label>
        <MSwitch
          id="isSwitchingToPreviouslyUsedTab-new"
          isOn={props.store.settings.isSwitchingToPreviouslyUsedTab}
          onToggle={() => {
            props.setSettingsOptions({
              isSwitchingToPreviouslyUsedTab: !props.store.settings.isSwitchingToPreviouslyUsedTab,
            })
          }}
        />
      </div>
      <div
        class={styles.settings__row}
        title="The switcher stays open and stops switching tabs on a modifier key release"
      >
        <label for="isStayingOpen-new" class={styles.settings__label}>
          <i class={styles.iconInLabel}>flip_to_front</i>
          Stay open
        </label>
        <MSwitch
          id="isStayingOpen-new"
          isOn={props.store.settings.isStayingOpen}
          onToggle={() => {
            props.setSettingsOptions({isStayingOpen: !props.store.settings.isStayingOpen})
          }}
        />
      </div>
      <div class={styles.bottomActions}>
        <MButton icon="restore" text="Set defaults" onClick={props.restoreDefaultSettings} />
      </div>
    </form>
  )
}
