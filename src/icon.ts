import noFaviconSVG from './images/no-favicon-icon.svg'
import settingsSVG from './images/settings-icon.svg'
import downloadsSVG from './images/downloads-icon.svg'
import extensionsSVG from './images/extensions-icon.svg'
import historySVG from './images/history-icon.svg'
import bookmarksSVG from './images/bookmarks-icon.svg'
import tabCornerSymbol from './images/tab-corner.svg'

const parser = new DOMParser()

const iconIdToElementMap: {[key: string]: HTMLElement} = {
  default: parseSVGIcon(noFaviconSVG),
  settings: parseSVGIcon(settingsSVG),
  downloads: parseSVGIcon(downloadsSVG),
  extensions: parseSVGIcon(extensionsSVG),
  history: parseSVGIcon(historySVG),
  bookmarks: parseSVGIcon(bookmarksSVG),
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

function createEmptyIcon() {
  const iconEl = document.createElement('div')
  iconEl.className = 'tab__icon'
  return iconEl
}

export function getIconEl(
  favIconUrl: string | undefined,
  url: string | undefined
): HTMLElement | SVGSVGElement {
  if (favIconUrl) {
    return createImageIcon(favIconUrl)
  }
  if (url) {
    const matches = /chrome:\/\/(\w*?)\//.exec(url)
    if (matches && matches[1] === 'newtab') {
      return createEmptyIcon()
    }
    if (matches && matches[1] && iconIdToElementMap[matches[1]]) {
      return getSVGIcon(matches[1], 'tab__icon')
    }
  }
  return getSVGIcon('default', 'tab__icon tab__icon_noFavIcon')
}
