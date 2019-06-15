<template>
  <div class="settings mdc-typography" v-bind:class="{settings_dark: settings.isDarkTheme}">
    <m-top-app-bar>Settings</m-top-app-bar>
    <div class="settings__form">
      <div class="settings__row mdc-form-field mdc-form-field--align-end">
        <m-switch id="my-checkbox" v-model="settings.isDarkTheme"></m-switch>
        <label for="my-checkbox">
          <i class="material-icons">brightness_3</i>
          Dark theme
        </label>
      </div>
    </div>
    <pre>{{$data}}</pre>
  </div>
</template>

<script>
  import * as settings from '../utils/settings';
  import MSwitch from './components/MSwitch.vue';
  import MTopAppBar from './components/MTopAppBar.vue';

  export default {
    name: 'Popup',
    data() {
      return {
        settings: settings.get(),
      };
    },
    created() {
      function saveSettings() {
        settings.update(this.settings);
      }

      this.$watch('settings', saveSettings, { deep: true });
    },
    components: {
      MSwitch,
      MTopAppBar,
    },
  };
</script>

<style lang="scss">
  @import '~@material/typography/mdc-typography';
  @import '~@material/form-field/mdc-form-field';

  body {
    margin: 0;
    user-select: none;
  }

  .settings {
    @include settings-theme-light();

    width: 300px;
    height: 400px;
    background-color: var(--settings-background-color);
    color: var(--mdc-theme-text-primary-on-background);

    &_dark {
      @include settings-theme-dark();
    }
  }

  .settings__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;

    &:hover {
      background-color: var(--settings__row_hover-background-color);
    }

    label {
      cursor: pointer;
      width: 100%;
      display: flex;
      align-items: center;
    }
  }

</style>
