// eslint-disable-next-line @typescript-eslint/no-unused-vars
function registerScripts() {
  function getElementFromPoint({x, y}) {
    // Penetrates shadow roots
    let el = document.elementFromPoint(x, y);
    while (el.shadowRoot) {
      el = el.shadowRoot.elementFromPoint(x, y);
    }
    return el;
  }

  function isVisible(el) {
    const style = getComputedStyle(el);
    if (style.display === 'none') {
      return false;
    }
    if (style.visibility !== 'visible') {
      return false;
    }
    if (style.opacity < 0.1) {
      return false;
    }
    const elRect = el.getBoundingClientRect();
    if (elRect.height === 0 && elRect.width === 0) {
      return false;
    }
    const elCenter = {
      x: elRect.left + elRect.width / 2,
      y: elRect.top + elRect.height / 2,
    };
    if (
      elCenter.x < 0 ||
      elCenter.x > document.documentElement.clientWidth ||
      elCenter.y < 0 ||
      elCenter.y > document.documentElement.clientHeight
    ) {
      return false;
    }
    let pointContainer = getElementFromPoint(elCenter);
    while (pointContainer) {
      if (pointContainer === el) {
        return true;
      }
      pointContainer =
        pointContainer instanceof ShadowRoot ? pointContainer.host : pointContainer.parentNode;
    }
    return false;
  }

  function queryPopup(selector) {
    return Array.from(
      document.querySelector('#popup-tab-switcher').shadowRoot.querySelectorAll(selector)
    );
  }

  window.e2e = {isVisible, queryPopup};
}
