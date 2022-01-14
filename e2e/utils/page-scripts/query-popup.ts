export function queryPopup(selector: string) {
  return Array.from(
    // @ts-expect-error The #popup-tab-switcher has shadowRoot
    document.querySelector('#popup-tab-switcher').shadowRoot.querySelectorAll(selector)
  )
}
