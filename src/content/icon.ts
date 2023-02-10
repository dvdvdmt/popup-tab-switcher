import noFaviconSVG from '../images/no-favicon-icon.svg'
import tabCornerSymbol from '../images/tab-corner.svg'

const parser = new DOMParser()

const iconIdToElementMap: {[key: string]: HTMLElement} = {
  default: parseSVGIcon(noFaviconSVG),
  tabCorner: parseSVGIcon(tabCornerSymbol),
}

function parseSVGIcon(source: string): HTMLElement {
  return parser.parseFromString(source, 'image/svg+xml').documentElement
}

export function getSVGIcon(id: string, className: string): SVGSVGElement {
  const icon = iconIdToElementMap[id]
  const result = icon.cloneNode(true) as SVGSVGElement
  result.classList.add(...className.split(' '))
  return result
}

function getFaviconUrl(url: string) {
  const faviconUrl = new URL(`chrome-extension://${chrome.runtime.id}/_favicon/`)
  faviconUrl.searchParams.set('pageUrl', url)
  faviconUrl.searchParams.set('size', '64')
  return faviconUrl.href
}

function createImageIcon(favIconUrl: string) {
  const result = document.createElement('img')
  result.src = favIconUrl
  result.className = 'tab__icon'
  result.addEventListener('error', function handler() {
    /*
    Sometimes favicons fail to load and ugly placeholder appears.
    For example the icon of htmlbook.ru doesn't load on other pages.
    This code tries to handle that situation by requesting icon from Google's public service.
    */
    const url = new URL(favIconUrl)
    result.src = `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`
    result.removeEventListener('error', handler)
  })

  return result
}

export function getIconEl(url: string | undefined, _id: number): HTMLElement | SVGSVGElement {
  if (url) {
    return createImageIcon(getFaviconUrl(url))
  }
  return getSVGIcon('default', 'tab__icon tab__icon_noFavIcon')
}
