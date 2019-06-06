import Vue from 'vue';
import Popup from './Popup.vue';

Vue.config.productionTip = false;
const AppClass = Vue.extend(Popup);
const app = new AppClass();

// eslint-disable-next-line no-undef
document.addEventListener('DOMContentLoaded', () => {
  app.$mount('#app');
});
