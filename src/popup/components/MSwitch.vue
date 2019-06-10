<template>
    <div class="mdc-switch">
      <div class="mdc-switch__track"></div>
      <div class="mdc-switch__thumb-underlay">
        <div class="mdc-switch__thumb">
          <input type="checkbox" id="basic-switch" class="mdc-switch__native-control" role="switch">
        </div>
      </div>
    </div>
</template>

<script>
  import {MDCSwitch} from '@material/switch/index';
  export default {
    name: 'MSwitch',
    data () {
      return {}
    },
    mounted() {
      new MDCSwitch(this.$el);
    }
  }
</script>

<style lang="scss">
  @import "~@material/switch/mdc-switch.scss";
</style>
