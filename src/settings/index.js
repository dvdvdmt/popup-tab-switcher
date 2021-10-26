import Vue from 'vue';
import Settings from './settings.vue';

Vue.config.productionTip = false;
window.app = new Vue(Settings);
document.addEventListener('DOMContentLoaded', () => {
  window.app.$mount('#app');
});
