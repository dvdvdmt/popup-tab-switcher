import Vue from 'vue'
import Settings from './settings.vue'

// eslint-disable-next-line no-undef
if (E2E) {
  import('../../e2e/utils/e2e-content-script.ts')
}

Vue.config.productionTip = false
window.app = new Vue(Settings)
document.addEventListener('DOMContentLoaded', () => {
  window.app.$mount('#app')
})
