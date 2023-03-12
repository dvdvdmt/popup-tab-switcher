interface IPoint {
  x: number
  y: number
}

function getElementFromPoint({x, y}: IPoint) {
  // Penetrates shadow roots
  let el = document.elementFromPoint(x, y)
  while (el?.shadowRoot) {
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

function getIsElementInDocumentPromise(selector: string): Promise<true> {
  return new Promise((resolve, reject) => {
    if (isElementInDocument()) {
      resolve(true)
    } else {
      testAgain(1, resolve, reject)
    }
  })

  function isElementInDocument(): boolean {
    return !!document.querySelector(selector)
  }

  function testAgain(
    attempt: number,
    resolve: (value: true) => void,
    reject: (reason: string) => void
  ) {
    setTimeout(() => {
      if (attempt >= 50) {
        reject(`Element '${selector}' is not found in document`)
      } else if (isElementInDocument()) {
        resolve(true)
      } else {
        testAgain(attempt + 1, resolve, reject)
      }
    })
  }
}

function getIsElementVisiblePromise(element: Element): Promise<true> {
  return new Promise((resolve, reject) => {
    if (isElementVisible(element)) {
      resolve(true)
    } else {
      testAgain(1, resolve, reject)
    }
  })

  function testAgain(
    attempt: number,
    resolve: (value: true) => void,
    reject: (reason: string) => void
  ) {
    setTimeout(() => {
      if (attempt >= 50) {
        reject(`Element '#${element.id}.${element.className}' is not visible`)
      } else if (isElementVisible(element)) {
        resolve(true)
      } else {
        testAgain(attempt + 1, resolve, reject)
      }
    })
  }
}

export function isVisible(selector: string | Element): Promise<true> {
  if (typeof selector === 'string') {
    return getIsElementInDocumentPromise(selector).then(() =>
      getIsElementVisiblePromise(document.querySelector(selector)!)
    )
  }
  return getIsElementVisiblePromise(selector)
}
