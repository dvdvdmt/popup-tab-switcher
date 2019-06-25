import Vue from 'vue';
import Settings from './Settings.vue';

Vue.config.productionTip = false;
window.app = new Vue(Settings);

// eslint-disable-next-line no-undef
document.addEventListener('DOMContentLoaded', () => {
  window.app.$mount('#app');
});
