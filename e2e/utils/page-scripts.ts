declare global {
  interface Window {
    e2e: {
      isVisible(el: Element): boolean;
      queryPopup(selector: string): Element[];
      sendMessage(message: unknown): void;
    };
  }
}

export function registerScripts() {
  // NOTE:
  // All helper functions that are available in opened pages must be defined inside this function.
  // This is because the registration function will be passed as string and the information about
  // external definitions will be lost.
  function getElementFromPoint({x, y}: WebKitPoint) {
    // Penetrates shadow roots
    let el = document.elementFromPoint(x, y);
    while (el.shadowRoot) {
      el = el.shadowRoot.elementFromPoint(x, y);
    }
    return el;
  }

  function isVisible(el: HTMLElement) {
    const style = getComputedStyle(el);
    if (style.display === 'none') {
      return false;
    }
    if (style.visibility !== 'visible') {
      return false;
    }
    if (Number(style.opacity) < 0.1) {
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
    let pointContainer: Node = getElementFromPoint(elCenter);
    while (pointContainer) {
      if (pointContainer === el) {
        return true;
      }
      pointContainer =
        pointContainer instanceof ShadowRoot ? pointContainer.host : pointContainer.parentNode;
    }
    return false;
  }

  function queryPopup(selector: string) {
    return Array.from(
      document.querySelector('#popup-tab-switcher').shadowRoot.querySelectorAll(selector)
    );
  }

  function sendMessage(message: unknown) {
    window.dispatchEvent(new CustomEvent('e2e-command-to-background', {detail: message}));
  }

  window.e2e = {isVisible, queryPopup, sendMessage};
}
