import Vue from 'vue'
import Settings from './settings.vue'
import {ServiceFactory} from '../service-factory'

// eslint-disable-next-line no-undef
if (E2E) {
  import('../../e2e/utils/e2e-content-script.ts')
}

Vue.config.productionTip = false

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await ServiceFactory.getSettings()
  window.settings = settings
  // eslint-disable-next-line no-new
  new Vue({
    el: '#app',
    render(createElement) {
      return createElement(Settings, {props: {initialSettings: settings}})
    },
  })
})
