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
  import debounce from '../utils/debounce';
  import MSwitch from './components/MSwitch.vue';

  export default {
    name: 'Popup',
    data() {
      return {
        msg: 'Dark theme',
        settings: JSON.parse(localStorage.settings)
      };
    },
    created() {
      function saveSettings() {
        localStorage.settings = JSON.stringify(this.settings);
      }

      this.$watch('settings', debounce(saveSettings, 500), { deep: true });
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
