<template>
  <a
    v-if="href"
    :class="classes"
    :href="href"
    v-bind="$attrs"
    role="button"
    class="mdc-button"
    v-on="$listeners"
  >
    <slot name="icon"/>
    <slot/>
  </a>
  <button
    v-else
    :class="classes"
    v-bind="$attrs"
    class="mdc-button"
    v-on="$listeners"
  >
    <slot name="icon"/>
    <slot/>
  </button>
</template>

<script>
  import { MDCRipple } from '@material/ripple/index';

  export default {
    name: 'MButton',
    props: {
      raised: {
        type: Boolean,
        default: false,
      },
      unelevated: {
        type: Boolean,
        default: false,
      },
      outlined: {
        type: Boolean,
        default: false,
      },
      href: {
        type: String,
        default: '',
      },
    },
    computed: {
      classes() {
        return {
          'mdc-button--raised': this.raised,
          'mdc-button--unelevated': this.unelevated,
          'mdc-button--outlined': this.outlined,
        };
      },
    },
    mounted() {
      this.mdcRipple = MDCRipple.attachTo(this.$el);
    },
    beforeDestroy() {
      this.mdcRipple.destroy();
    },
  };
</script>

<style lang="scss">
  @import "~@material/button/mdc-button.scss";
</style>
