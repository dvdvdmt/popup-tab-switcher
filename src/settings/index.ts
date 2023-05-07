import {initSettings} from './solid-js/settings'

// eslint-disable-next-line no-undef
if (E2E) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore It is possible to import that file because of webpack aliases
  import('../../e2e/utils/e2e-content-script.ts')
}

document.addEventListener('DOMContentLoaded', initSettings)
