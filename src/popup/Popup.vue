<template>
  <div class="settings mdc-typography" v-bind:class="{settings_dark: settings.isDarkTheme}">
    <m-top-app-bar>Settings</m-top-app-bar>
    <label class="settings__row">
      <m-switch v-model="settings.isDarkTheme"></m-switch>
      {{msg}}
    </label>
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
        msg: 'Dark theme',
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

  body {
    margin: 0;
  }

  .settings {
    @include settings-theme-light();

    width: 200px;
    background-color: var(--settings-background-color);

    &_dark {
      @include settings-theme-dark();
    }
  }

  .settings__row {
    display: flex;
    justify-content: left;
    align-items: center;
    cursor: pointer;
  }

</style>
