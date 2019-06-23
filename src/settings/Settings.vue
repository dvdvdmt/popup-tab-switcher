<template>
  <div class="settings mdc-typography" v-bind:class="{settings_dark: settings.isDarkTheme}">
    <m-top-app-bar>Settings</m-top-app-bar>
    <form class="settings__form">
      <div class="settings__row mdc-form-field">
        <label for="isDarkTheme" class="settings__label">
          <i class="settings__icon settings__icon_label material-icons">brightness_3</i>
          Dark theme
        </label>
        <m-switch id="isDarkTheme" v-model="settings.isDarkTheme"></m-switch>
      </div>
      <div class="settings__row mdc-form-field">
        <label for="popupWidth" class="settings__label">
          <i class="settings__icon settings__icon_label material-icons">border_horizontal</i>
          Popup width
        </label>
        <m-text-field id="popupWidth"
                      type="number"
                      class="settings__field"
                      suffix="px"
                      v-model="settings.popupWidth"
        />
      </div>
      <div class="settings__row mdc-form-field">
        <label for="tabHeight" class="settings__label">
          <i class="settings__icon settings__icon_label material-icons">format_line_spacing</i>
          Tab height
        </label>
        <m-text-field id="tabHeight"
                      type="number"
                      class="settings__field"
                      suffix="px"
                      v-model="settings.tabHeight"
        />
      </div>
      <div class="settings__row mdc-form-field">
        <label for="maxNumberOfTabs" class="settings__label">
          <i class="settings__icon settings__icon_label material-icons">format_list_numbered</i>
          Max number of tabs
        </label>
        <m-text-field id="maxNumberOfTabs"
                      type="number"
                      class="settings__field"
                      v-model="settings.maxNumberOfTabs"
        />
      </div>
      <div class="settings__row mdc-form-field">
        <label for="fontSize" class="settings__label">
          <i class="settings__icon settings__icon_label material-icons">format_size</i>
          Font size
        </label>
        <m-text-field id="fontSize"
                      type="number"
                      class="settings__field"
                      suffix="px"
                      v-model="settings.fontSize"
        />
      </div>
      <div class="settings__row mdc-form-field">
        <label for="iconSize" class="settings__label">
          <i class="settings__icon settings__icon_label material-icons">crop_original</i>
          Icon size
        </label>
        <m-text-field id="iconSize"
                      type="number"
                      class="settings__field"
                      suffix="px"
                      v-model="settings.iconSize"
        />
      </div>
      <div class="settings__row mdc-form-field">
        <label for="autoSwitchingTimeout" class="settings__label">
          <i class="settings__icon settings__icon_label material-icons">timelapse</i>
          Auto switching timeout
        </label>
        <m-text-field id="autoSwitchingTimeout"
                      type="number"
                      class="settings__field"
                      suffix="ms"
                      v-model="settings.autoSwitchingTimeout"
        />
      </div>
      <div class="settings__row mdc-form-field">
        <label for="textScrollDelay" class="settings__label">
          <i class="settings__icon settings__icon_label material-icons">timer</i>
          Text scroll delay
        </label>
        <m-text-field id="textScrollDelay"
                      type="number"
                      class="settings__field"
                      suffix="ms"
                      v-model="settings.textScrollDelay"
        />
      </div>
      <div class="settings__row mdc-form-field">
        <label for="textScrollCoefficient" class="settings__label">
          <i class="settings__icon settings__icon_label material-icons">text_rotation_none</i>
          Text scroll speed
        </label>
        <m-text-field id="textScrollCoefficient"
                      type="number"
                      class="settings__field"
                      v-model="settings.textScrollCoefficient"
        />
      </div>
      <div class="settings__row settings__row_buttons">
        <m-button id="setDefaults" @click="setDefaults" type="button">
          <i slot="icon" class="settings__icon material-icons">restore</i>
          Set defaults
        </m-button>
      </div>
    </form>
  </div>
</template>

<script>
  import browser from 'webextension-polyfill';
  import * as settings from '../utils/settings';
  import { ports, messages } from '../utils/constants';
  import MSwitch from './components/MSwitch.vue';
  import MTopAppBar from './components/MTopAppBar.vue';
  import MTextField from './components/MTextField.vue';
  import MButton from './components/MButton.vue';

  const port = browser.runtime.connect({ name: ports.POPUP_SCRIPT });

  export default {
    name: 'Settings',
    data() {
      return {
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
    },
    created() {
      this.$watch('settings', this.updateSettings, { deep: true });
    },
    mounted() {
      this.updateSettings();
    },
    components: {
      MSwitch,
      MTopAppBar,
      MTextField,
      MButton,
    },
  };
</script>

<style lang="scss">
  @import '~@material/typography/mdc-typography';
  @import '~@material/form-field/mdc-form-field';
  @import '~@material/textfield/mixins';
  @import '../styles/mixins';
  /*@import './styles/dark-theme';*/

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
