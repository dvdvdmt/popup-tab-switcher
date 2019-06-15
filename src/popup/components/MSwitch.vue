<template>
  <div class="mdc-switch">
    <div class="mdc-switch__track"></div>
    <div class="mdc-switch__thumb-underlay">
      <div class="mdc-switch__thumb">
        <input v-model="model"
               type="checkbox"
               :id="id"
               class="mdc-switch__native-control"
               role="switch">
      </div>
    </div>
  </div>
</template>

<script>
  import { MDCSwitch } from '@material/switch/index';

  export default {
    name: 'MSwitch',
    props: {
      id: {
        type: String,
        required: true
      },
      value: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      model: {
        get() {
          return this.value;
        },
        set(state) {
          this.$emit('input', state);
        }
      }
    },
    mounted() {
      MDCSwitch.attachTo(this.$el);
    }
  };
</script>

<style lang="scss">
  @import "~@material/switch/mdc-switch.scss";
</style>
