<template>
  <div class="settings mdc-typography" v-bind:class="{settings_dark: settings.isDarkTheme}">
    <m-tab-bar class="settings__nav-bar" :tabs="tabs" :active-tab-id="activeTabId"
               @activated="onTabActivated"/>
    <settings-form v-if="activeTabId === 0" :settings="settings" @setDefaults="setDefaults"/>
    <contribute v-if="activeTabId === 1"/>
  </div>
</template>

<script>
  import browser from 'webextension-polyfill';
  import * as settings from '../utils/settings';
  import { messages, ports } from '../utils/constants';
  import SettingsForm from './components/SettingsForm.vue';
  import MTabBar from './components/MTabBar.vue';
  import Contribute from './components/Contribute.vue';

  const port = browser.runtime.connect({ name: ports.POPUP_SCRIPT });

  export default {
    name: 'Settings',
    data() {
      return {
        tabs: [{
          id: 'settings',
          icon: 'settings',
        }, {
          id: 'contribute',
          icon: 'favorite',
        }],
        activeTabId: 0,
        settings: settings.get(),
      };
    },
    methods: {
      updateSettings() {
        port.postMessage({
          type: messages.UPDATE_SETTINGS,
          newSettings: this.settings,
        });
      },
      setDefaults() {
        settings.setDefaults();
        this.settings = settings.get();
        this.updateSettings();
      },
      onTabActivated(activeTabId) {
        this.activeTabId = activeTabId;
      },
    },
    created() {
      this.$watch('settings', this.updateSettings, { deep: true });
    },
    mounted() {
      this.updateSettings();
    },
    components: {
      Contribute,
      MTabBar,
      SettingsForm,
    },
  };
</script>

<style lang="scss">
  @import '~@material/typography/mdc-typography';
  @import '~@material/textfield/mixins';
  @import '~@material/tab/mixins';
  @import '~@material/tab-indicator/mixins';
  @import '../styles/mixins';

  body {
    margin: 0;
    user-select: none;
    width: 340px;
    height: 548px;
  }

  .settings {
    --settings-background-color: white;
    --settings__row_hover-background-color: #{$color-gray-athens-light};

    $theme-light: (
      'primary': $color-blue-mariner,
      'secondary': $color-blue-mariner-light,
      'background': white,
      'surface': white,
    );

    $colors: get-theme-colors($theme-light);
    @include theme-colors-as-custom-properties($colors);

    height: 100%;
    background-color: var(--settings-background-color);
    color: var(--mdc-theme-text-primary-on-background);

    &_dark {
      --settings-background-color: #{$color-gray-outer-space};
      --settings__row_hover-background-color: #{$color-gray-shark-light};

      $theme-dark: (
        "primary": $color-gray-shark,
        "secondary": $color-blue-mariner-light,
        "background": $color-gray-outer-space,
        "surface": $color-gray-outer-space,
      );

      $colors: get-theme-colors($theme-dark);
      @include theme-colors-as-custom-properties($colors);

      .mdc-button {
        --mdc-theme-primary: map_get($colors, text-primary-on-dark);
      }

      .mdc-text-field {
        @include mdc-text-field-ink-color(map_get($colors, text-primary-on-dark));
        @include mdc-text-field-caret-color(map_get($colors, text-primary-on-dark));
        @include mdc-text-field-outline-color(lighten($color-gray-outer-space, 10%));
        @include mdc-text-field-hover-outline-color(lighten($color-gray-outer-space, 20%));
        @include mdc-text-field-focused-outline-color(lighten($color-gray-outer-space, 20%));
      }

      .mdc-tab {
        @include mdc-tab-ink-color(map_get($colors, text-secondary-on-background));
        @include mdc-tab-active-icon-color(map_get($colors, text-primary-on-dark));
        @include mdc-tab-active-text-label-color(map_get($colors, text-primary-on-dark));
      }

      .mdc-tab-indicator {
        @include mdc-tab-indicator-underline-color(map_get($colors, text-secondary-on-background));
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

    &:hover {
      background-color: var(--settings__row_hover-background-color);
    }

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
      color: var(--mdc-theme-text-icon-on-background)
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
