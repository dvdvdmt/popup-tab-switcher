<template>
  <div v-if="!settings">Loading...</div>
  <div v-else class="settings mdc-typography" v-bind:class="{settings_dark: settings.isDarkTheme}">
    <m-tab-bar
      class="settings__nav-bar"
      :tabs="tabs"
      :active-tab-id="activeTabId"
      @activated="onTabActivated"
    />
    <settings-form v-if="activeTabId === 0" :settings="settings" @setDefaults="setDefaults" />
    <contribute v-if="activeTabId === 1" />
  </div>
</template>

<script>
import browser from 'webextension-polyfill'
import {getSettings} from '../utils/settings'
import {Port} from '../utils/constants'
import SettingsForm from './components/settings-form.vue'
import MTabBar from './components/m-tab-bar.vue'
import Contribute from './components/contribute.vue'
import {updateSettings} from '../utils/messages'

// The connection is necessary for tracking settings popup closing (https://stackoverflow.com/q/15798516/3167855)
const port = browser.runtime.connect({name: Port.POPUP_SCRIPT})

export default {
  name: 'Settings',
  data() {
    return {
      tabs: [
        {
          id: 'settings',
          icon: 'settings',
        },
        {
          id: 'contribute',
          icon: 'favorite',
        },
      ],
      activeTabId: 0,
      settings: null,
    }
  },
  methods: {
    updateSettings(newSettings) {
      browser.runtime.sendMessage(updateSettings(newSettings))
    },
    setDefaults() {
      this.settings.reset()
      this.updateSettings(this.settings)
    },
    onTabActivated(activeTabId) {
      this.activeTabId = activeTabId
    },
  },
  watch: {
    settings: {
      handler: 'updateSettings',
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    getSettings().then((settings) => {
      this.settings = settings
    })
  },
  components: {
    Contribute,
    MTabBar,
    SettingsForm,
  },
}
</script>

<style lang="scss">
@import '~@material/typography/mdc-typography';
@import '~@material/textfield/mixins';
@import '~@material/tab/mixins';
@import '~@material/tab-indicator/mixins';
@import '~@material/button/mixins';
@import '../styles/mixins';

body {
  margin: 0;
  user-select: none;
  width: 340px;
}

.settings {
  --settings-background-color: white;

  $theme-light: (
    'primary': $color-blue-mariner,
    'secondary': $color-blue-mariner-light,
    'background': white,
    'surface': white,
  );

  $colors: get-theme-colors($theme-light);
  @include theme-colors-as-custom-properties($colors);

  min-height: 100%;
  background-color: var(--settings-background-color);
  color: var(--mdc-theme-text-primary-on-background);

  &_dark {
    --settings-background-color: #{$color-gray-shark};

    $theme-dark: (
      'primary': darken(white, 20%),
      'secondary': $color-blue-mariner-light,
      'background': $color-gray-shark,
      'surface': $color-gray-shark,
    );

    $colors: get-theme-colors($theme-dark);
    @include theme-colors-as-custom-properties($colors);

    .mdc-button {
      @include mdc-button-ink-color(map_get($colors, primary));

      &--raised {
        @include mdc-button-ink-color(map_get($colors, surface));
        @include mdc-button-container-fill-color(map_get($colors, primary));
      }
    }

    .mdc-text-field {
      @include mdc-text-field-ink-color(rgba(map_get($colors, on-surface), 0.87));
      @include mdc-text-field-caret-color(map_get($colors, primary));
      @include mdc-text-field-outline-color(rgba(map_get($colors, on-surface), 0.24));
      @include mdc-text-field-hover-outline-color(rgba(map_get($colors, on-surface), 0.87));
      @include mdc-text-field-focused-outline-color(map_get($colors, primary));
    }

    .mdc-tab {
      @include mdc-tab-text-label-color(rgba(map_get($colors, on-surface), 0.6));
      @include mdc-tab-active-text-label-color(map_get($colors, primary));
      @include mdc-tab-icon-color(rgba(map_get($colors, on-surface), 0.54));
      @include mdc-tab-active-icon-color(map_get($colors, primary));
    }

    .mdc-tab-indicator {
      @include mdc-tab-indicator-underline-color(map_get($colors, primary));
    }
  }
}

.settings__form {
  margin: 0;
}

.settings__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 16px 5px 10px;
  height: 40px;

  &_buttons {
    flex-direction: row-reverse;

    &:hover {
      background-color: unset;
    }
  }
}

.settings__icon {
  margin-right: 6px;

  &_label {
    color: var(--mdc-theme-text-icon-on-background);
  }
}

.settings__field {
  height: 28px;
  width: 180px;
}

.settings__label {
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
}
</style>
