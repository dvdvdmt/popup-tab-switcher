<template>
  <header class="mdc-top-app-bar mdc-top-app-bar--dense">
    <div class="mdc-top-app-bar__row">
      <section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-start">
        <span class="mdc-top-app-bar__title"><slot></slot></span>
      </section>
    </div>
  </header>
</template>

<script>
  import { MDCTopAppBar } from '@material/top-app-bar/index';

  export default {
    name: 'm-top-app-bar',
    mounted() {
      MDCTopAppBar.attachTo(this.$el);
    }
  };
</script>

<style lang="scss">
  @import "~@material/top-app-bar/mdc-top-app-bar.scss";

  .mdc-top-app-bar {
    position: initial;
  }
</style>
