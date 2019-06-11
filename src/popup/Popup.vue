<template>
  <div class="settings">
    <label class="settings-row">
      <m-switch v-model="settings.isDarkTheme"></m-switch>
      {{msg}}
    </label>
    <pre>{{allData}}</pre>
  </div>
</template>

<script>
  import debounce from '../utils/debounce';
  import MSwitch from './components/MSwitch.vue';

  function readSettings() {
    if (localStorage.settings) {
      try {
        return JSON.parse(localStorage.settings);
      } catch (e) {
        return {};
      }
    }
  }

  export default {
    name: 'Popup',
    data() {
      return {
        msg: 'Dark theme',
        settings: {
          isDarkTheme: false,
          ...readSettings()
        }
      };
    },
    computed: {
      allData() {
        return this.$data;
      }
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
