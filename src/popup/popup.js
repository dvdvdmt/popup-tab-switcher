import Vue from 'vue';
import Popup from './Popup.vue';

Vue.config.productionTip = false;
const app = new Vue(Popup);

// eslint-disable-next-line no-undef
document.addEventListener('DOMContentLoaded', () => {
  app.$mount('#app');
});
