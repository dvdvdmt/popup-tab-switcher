<template>
  <div class="mdc-switch" :class="classes">
    <div class="mdc-switch__track"></div>
    <div class="mdc-switch__thumb-underlay">
      <div class="mdc-switch__thumb">
        <input v-model="model"
               type="checkbox"
               :id="id"
               :name="id"
               class="mdc-switch__native-control"
               role="switch">
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'm-switch',
    props: {
      id: {
        type: String,
        required: true,
      },
      value: {
        type: Boolean,
        default: false
      },
    },
    computed: {
      model: {
        get() {
          return this.value;
        },
        set(state) {
          this.$emit('input', state);
        },
      },
      classes() {
        return {'mdc-switch--checked': this.value}
      }
    },
  };
</script>

<style lang="scss">
  @import "~@material/switch/mdc-switch.scss";
</style>
