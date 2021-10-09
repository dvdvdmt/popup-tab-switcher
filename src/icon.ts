import noFaviconSymbol from './images/no-favicon-icon.svg';
import settingsSymbol from './images/settings-icon.svg';
import downloadsSymbol from './images/downloads-icon.svg';
import extensionsSymbol from './images/extensions-icon.svg';
import historySymbol from './images/history-icon.svg';
import bookmarksSymbol from './images/bookmarks-icon.svg';

interface FavIcons {
  [key: string]: SvgSymbol;
}

const favIcons: FavIcons = {
  default: noFaviconSymbol,
  settings: settingsSymbol,
  downloads: downloadsSymbol,
  extensions: extensionsSymbol,
  history: historySymbol,
  bookmarks: bookmarksSymbol,
};

export function createSVGIcon(symbol: SvgSymbol, className: string) {
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('viewBox', symbol.viewBox);
  svgEl.classList.add(...className.split(' '));
  const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  useEl.setAttribute('href', `#${symbol.id}`);
  svgEl.append(useEl);
  return svgEl;
}

function createImageIcon(favIconUrl: string) {
  const result = document.createElement('img');
  result.src = favIconUrl;
  result.className = 'tab__icon';
  result.addEventListener('error', function handler() {
    /*
    Sometimes favicons fail to load and ugly placeholder appears.
    For example the icon of htmlbook.ru doesn't load on other pages.
    This code tries to handle that situation by requesting icon from Google's public service.
    */
    const url = new URL(favIconUrl);
    result.src = `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
    result.removeEventListener('error', handler);
  });

  return result;
}

function createEmptyIcon() {
  const iconEl = document.createElement('div');
  iconEl.className = 'tab__icon';
  return iconEl;
}

export function getIconEl(
  favIconUrl: string | undefined,
  url: string | undefined
): HTMLElement | SVGSVGElement {
  if (favIconUrl) {
    return createImageIcon(favIconUrl);
  }
  if (url) {
    const matches = /chrome:\/\/(\w*?)\//.exec(url);
    if (matches && matches[1] === 'newtab') {
      return createEmptyIcon();
    }
    if (matches && matches[1] && favIcons[matches[1]]) {
      return createSVGIcon(favIcons[matches[1]], 'tab__icon');
    }
  }
  return createSVGIcon(favIcons.default, 'tab__icon tab__icon_noFavIcon');
}
