<template>
  <div class="example">
    <label><m-switch></m-switch>{{msg}}</label>
    <pre>{{allData}}</pre>
  </div>
</template>

<script>
  import MSwitch from './components/MSwitch.vue';
  export default {
    name: 'Popup',
    data () {
      return {
        msg: 'Hello World!',
        isDarkTheme: false,
      }
    },
    computed: {
      allData () {
        return this.$data;
      }
    },
    components: {
      MSwitch
    }
  }
</script>

<style>
  .example {
    color: red;
  }
</style>
