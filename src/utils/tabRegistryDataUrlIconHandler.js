import toDataUrl from './toDataUrl';
import defaultFavIcon from '../images/default-favicon.svg';

const iconsCache = { undefined: defaultFavIcon };

export default {
  get(target, prop) {
    if (prop === 'push' || prop === 'update') {
      return function addDataUrlIcon(tab) {
        if (tab.favIconUrl && tab.favIconUrl.startsWith('data:')) {
          iconsCache[tab.favIconUrl] = tab.favIconUrl;
        }
        // eslint-disable-next-line no-param-reassign
        tab.favIconDataUrl = iconsCache[tab.favIconUrl];

        if (!tab.favIconDataUrl) {
          toDataUrl(tab.favIconUrl)
            .then((dataUrl) => {
              // eslint-disable-next-line no-param-reassign
              tab.favIconDataUrl = dataUrl;
              iconsCache[tab.favIconUrl] = dataUrl;
            });
        }

        return target[prop](tab);
      };
    }
    return target[prop];
  },
};
