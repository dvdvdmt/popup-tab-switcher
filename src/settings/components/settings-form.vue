<template>
  <form class="settings__form">
    <m-banner
      v-if="!isShortcutsSet"
      message="Keyboard shortcuts for the extension are not configured. You should set them in Chrome settings"
      action="Set up shortcuts"
      icon="report_problem"
      @action="openChromeShortcuts"
    />
    <div class="settings__row mdc-form-field" title="Turns on or off the dark theme">
      <label for="isDarkTheme" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">brightness_3</i>
        Dark theme
      </label>
      <m-switch id="isDarkTheme" v-model="settings.isDarkTheme"></m-switch>
    </div>
    <div class="settings__row mdc-form-field" title="Sets the popup width">
      <label for="popupWidth" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">border_horizontal</i>
        Popup width
      </label>
      <m-text-field
        id="popupWidth"
        type="number"
        class="settings__field"
        suffix="px"
        v-model="settings.popupWidth"
        :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field" title="Sets the popup height">
      <label for="tabHeight" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">format_line_spacing</i>
        Tab height
      </label>
      <m-text-field
        id="tabHeight"
        type="number"
        class="settings__field"
        suffix="px"
        v-model="settings.tabHeight"
        :min="0"
      />
    </div>
    <div
      class="settings__row mdc-form-field"
      title="Specifies how many recently used tabs to show in the popup"
    >
      <label for="numberOfTabsToShow" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">format_list_numbered</i>
        Max number of tabs
      </label>
      <m-text-field
        id="numberOfTabsToShow"
        type="number"
        class="settings__field"
        v-model="settings.numberOfTabsToShow"
        :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field" title="Sets the size of the tab title text">
      <label for="fontSize" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">format_size</i>
        Font size
      </label>
      <m-text-field
        id="fontSize"
        type="number"
        class="settings__field"
        suffix="px"
        v-model="settings.fontSize"
        :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field" title="Sets the size of the tab icon">
      <label for="iconSize" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">crop_original</i>
        Icon size
      </label>
      <m-text-field
        id="iconSize"
        type="number"
        class="settings__field"
        suffix="px"
        v-model="settings.iconSize"
        :min="0"
      />
    </div>
    <div
      class="settings__row mdc-form-field"
      title="Sets popup opacity (0 - invisible, 100 - visible)"
    >
      <label for="opacity" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">opacity</i>
        Opacity
      </label>
      <m-text-field
        id="opacity"
        type="number"
        class="settings__field"
        v-model="settings.opacity"
        suffix="%"
        :min="0"
        :max="100"
      />
    </div>
    <div
      class="settings__row mdc-form-field"
      title="If a page has no focus (address bar or search field is focused, etc.) then the extension starts a timer by the end of which it will switch a user to the selected tab. This timer restarts on each selection command (Alt+Y or Alt+Shift+Y by default)"
    >
      <label for="autoSwitchingTimeout" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">timelapse</i>
        Auto switching timeout
      </label>
      <m-text-field
        id="autoSwitchingTimeout"
        type="number"
        class="settings__field"
        suffix="ms"
        v-model="settings.autoSwitchingTimeout"
        :min="0"
      />
    </div>
    <div
      class="settings__row mdc-form-field"
      title="If a tab title is wider than the popup then its overflowing part will be hidden. When such a tab is selected its text will be scrolled. This option delays the start of the scrolling"
    >
      <label for="textScrollDelay" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">timer</i>
        Text scroll delay
      </label>
      <m-text-field
        id="textScrollDelay"
        type="number"
        class="settings__field"
        suffix="ms"
        v-model="settings.textScrollDelay"
        :min="0"
      />
    </div>
    <div
      class="settings__row mdc-form-field"
      title="Sets the speed of a selected tab text scrolling"
    >
      <label for="textScrollCoefficient" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">text_rotation_none</i>
        Text scroll speed
      </label>
      <m-text-field
        id="textScrollCoefficient"
        type="number"
        class="settings__field"
        v-model="settings.textScrollCoefficient"
        :min="0"
      />
    </div>
    <div
      class="settings__row mdc-form-field"
      title="Switch to a previously active tab when a current one closes"
    >
      <label for="isSwitchingToPreviouslyUsedTab" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">low_priority</i>
        Switch to a previously used tab
      </label>
      <m-switch
        id="isSwitchingToPreviouslyUsedTab"
        v-model="settings.isSwitchingToPreviouslyUsedTab"
      >
      </m-switch>
    </div>
    <div
      class="settings__row mdc-form-field"
      title="The switcher stays open and stops switching tabs on a modifier key release"
    >
      <label for="isStayingOpen" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">flip_to_front</i>
        Stay open
      </label>
      <m-switch id="isStayingOpen" v-model="settings.isStayingOpen"> </m-switch>
    </div>
    <div class="settings__row settings__row_buttons">
      <m-button id="setDefaults" @click="$emit('setDefaults')" type="button">
        <i slot="icon" class="settings__icon material-icons">restore</i>
        Set defaults
      </m-button>
    </div>
  </form>
</template>

<script>
import browser from 'webextension-polyfill'
import MSwitch from './m-switch.vue'
import MTextField from './m-text-field.vue'
import MButton from './m-button.vue'
import MBanner from './m-banner/m-banner.vue'
import areShortcutsSet from '../../utils/are-shortcuts-set.ts'

export default {
  name: 'settings-form',
  props: {
    settings: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {isShortcutsSet: false}
  },
  methods: {
    openChromeShortcuts() {
      browser.tabs.create({
        active: true,
        url: 'chrome://extensions/shortcuts',
      })
    },
  },
  created() {
    areShortcutsSet().then((isSet) => {
      this.isShortcutsSet = isSet
    })
  },
  components: {
    MSwitch,
    MTextField,
    MButton,
    MBanner,
  },
}
</script>

<style lang="scss">
@import '~@material/form-field/mdc-form-field';
</style>
