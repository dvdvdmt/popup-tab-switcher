<template>
  <div class="settings mdc-typography" v-bind:class="{settings_dark: settings.isDarkTheme}">
    <m-tab-bar :tabs="tabs" :active-tab-id="activeTabId" @activated="onTabActivated"/>
    <settings-form v-if="activeTabId === 0" :settings="settings" @setDefaults="setDefaults"/>
    <div v-if="activeTabId === 1">You can contribute to the project one of the following way</div>
  </div>
</template>

<script>
  import browser from 'webextension-polyfill';
  import * as settings from '../utils/settings';
  import { messages, ports } from '../utils/constants';
  import MTopAppBar from './components/MTopAppBar.vue';
  import SettingsForm from './components/SettingsForm.vue';
  import MTabBar from './components/MTabBar.vue';

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
      MTabBar,
      SettingsForm,
      MTopAppBar,
    },
  };
</script>

<style lang="scss">
  @import '~@material/typography/mdc-typography';
  @import '~@material/textfield/mixins';
  @import '../styles/mixins';

  body {
    margin: 0;
    user-select: none;
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

    @include mdc-theme-colors($theme-light);

    width: 340px;
    height: 548px;
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

      @include mdc-theme-colors($theme-dark);

      .mdc-button {
        --mdc-theme-primary: var(--mdc-theme-text-primary-on-dark);
      }

      .mdc-text-field {
        @include mdc-text-field-ink-color(var(--mdc-theme-text-primary-on-dark));
        @include mdc-text-field-caret-color(var(--mdc-theme-text-primary-on-dark));
        @include mdc-text-field-outline-color(lighten($color-gray-outer-space, 10%));
        @include mdc-text-field-hover-outline-color(lighten($color-gray-outer-space, 20%));
        @include mdc-text-field-focused-outline-color(lighten($color-gray-outer-space, 20%));
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
