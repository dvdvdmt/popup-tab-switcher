<template>
  <div class="settings">
    <label class="settings-row">
      <m-switch v-model="settings.isDarkTheme"></m-switch>
      {{msg}}
    </label>
    <pre>{{$data}}</pre>
  </div>
</template>

<script>
  import * as settings from '../utils/settings';
  import MSwitch from './components/MSwitch.vue';

  export default {
    name: 'Popup',
    data() {
      return {
        msg: 'Dark theme',
        settings: settings.get()
      };
    },
    created() {
      function saveSettings() {
        settings.update(this.settings)
      }

      this.$watch('settings', saveSettings, { deep: true });
    },
    components: {
      MSwitch
    }
  };
</script>

<style>
  .settings {
    width: 200px;
  }

  .settings-row {
    display: flex;
    justify-content: left;
    align-items: center;
    cursor: pointer;
  }

</style>
