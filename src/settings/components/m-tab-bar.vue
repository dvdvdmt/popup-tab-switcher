<template>
  <div class="mdc-tab-bar" role="tablist" @MDCTabBar:activated="onActivated">
    <div class="mdc-tab-scroller">
      <div class="mdc-tab-scroller__scroll-area">
        <div class="mdc-tab-scroller__scroll-content">
          <m-tab v-for="(tab, index) in tabs"
               :key="index">
            <template slot="icon">{{tab.icon}}</template>
            {{tab.id}}
          </m-tab>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { MDCTabBar } from '@material/tab-bar/index';
  import MTab from './m-tab.vue';

  export default {
    name: 'm-tab-bar',
    props: {
      activeTabId: {
        type: Number,
        default: 0,
      },
      tabs: {
        type: Array,
        default: []
      }
    },
    components: { MTab },
    mounted() {
      this.mdcTabBar = MDCTabBar.attachTo(this.$el);
      this.mdcTabBar.activateTab(this.activeTabId);
    },
    beforeDestroy() {
      this.mdcTabBar.destroy();
    },
    methods: {
      onActivated(e) {
        this.$emit('activated', e.detail.index);
      }
    }
  };
</script>

<style lang="scss">
  @import "~@material/tab-bar/mdc-tab-bar";
  @import "~@material/tab-scroller/mdc-tab-scroller";
  @import "~@material/tab-indicator/mdc-tab-indicator";
  @import "~@material/tab/mdc-tab";
</style>
