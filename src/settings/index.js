import Vue from 'vue';
import sprite from '../utils/sprite';
import Settings from './Settings.vue';

Vue.config.productionTip = false;
window.app = new Vue(Settings);

document.addEventListener('DOMContentLoaded', () => {
  sprite.attach(document.body);
  window.app.$mount('#app');
});
