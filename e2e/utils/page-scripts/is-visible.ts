interface IPoint {
  x: number
  y: number
}

function getElementFromPoint({x, y}: IPoint) {
  // Penetrates shadow roots
  let el = document.elementFromPoint(x, y)
  while (el?.shadowRoot) {
    // @ts-expect-error The ShadowRoot must have elementFromPoint method (https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot#:~:text=ShadowRoot.elementFromPoint())
    el = el.shadowRoot.elementFromPoint(x, y)
  }
  return el
}

function isElementVisible(el: Element) {
  const style = getComputedStyle(el)
  if (style.display === 'none') {
    return false
  }
  if (style.visibility !== 'visible') {
    return false
  }
  if (Number(style.opacity) < 0.1) {
    return false
  }
  const elRect = el.getBoundingClientRect()
  if (elRect.height === 0 && elRect.width === 0) {
    return false
  }
  const elCenter = {
    x: elRect.left + elRect.width / 2,
    y: elRect.top + elRect.height / 2,
  }
  if (
    elCenter.x < 0 ||
    elCenter.x > document.documentElement.clientWidth ||
    elCenter.y < 0 ||
    elCenter.y > document.documentElement.clientHeight
  ) {
    return false
  }
  let pointContainer: Node | null = getElementFromPoint(elCenter)
  while (pointContainer) {
    if (pointContainer === el) {
      return true
    }
    pointContainer =
      pointContainer instanceof ShadowRoot ? pointContainer.host : pointContainer.parentNode
  }
  return false
}

export function isVisible(selector: string | Element): Promise<true> {
  function testAgain(
    element: Element,
    attempt: number,
    resolve: (value: true) => void,
    reject: (reason: string) => void
  ) {
    setTimeout(() => {
      if (attempt >= 5) {
        reject(`Element '${selector}' is not visible`)
      } else if (isElementVisible(element)) {
        resolve(true)
      } else {
        testAgain(element, attempt + 1, resolve, reject)
      }
    })
  }

  const element = typeof selector === 'string' ? document.querySelector(selector) : selector
  if (!element) {
    return Promise.reject(new Error(`Element '${selector}' is not found in DOM`))
  }

  return new Promise((resolve, reject) => {
    if (isElementVisible(element)) {
      resolve(true)
    } else {
      testAgain(element, 1, resolve, reject)
    }
  })
}
