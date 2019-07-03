<template>
  <div class="contribute mdc-typography mdc-typography--body1">
    <p class="contribute__call-to-action">
      You can say thanks or help me one of the following ways:
    </p>
    <div class="contribute__actions">
      <m-button class="contribute__action"
                href="https://chrome.google.com/webstore/my-extension-id"
                target="_blank"
                outlined
      >
        <i slot="icon" class="material-icons">star</i>
        Give me 5 stars
      </m-button>
      <m-button class="contribute__action"
                href="https://github.com/dvdvdmt/popup-tab-switcher/issues"
                target="_blank"
                outlined
      >
        <i slot="icon" class="material-icons">announcement</i>
        Report an issue
      </m-button>
      <m-button class="contribute__action"
                href="mailto:dvdvdmt.work@gmail.com?subject=Popup Tab Switcher. <Your question>"
                target="_blank"
                outlined
      >
        <i slot="icon" class="material-icons">email</i>
        Contact me
      </m-button>
      <m-button class="contribute__action"
                href="https://www.paypal.me/dvdvdmt/3usd"
                target="_blank"
                raised
      >
        <i slot="icon" class="material-icons">local_cafe</i>
        Buy me a coffee
      </m-button>
    </div>
    <div class="contribute__share">
      <p class="contribute__call-to-action">or share with others</p>
      <div class="contribute__share-links">
        <copy-link-button :link="extensionUrl"/>
        <a class="mdc-icon-button" :href="shareOnFacebookUrl" target="_blank">
          <svg-icon :icon="icons.facebook"/>
        </a>
        <a class="mdc-icon-button" :href="shareOnTwitterUrl" target="_blank">
          <svg-icon :icon="icons.twitter"/>
        </a>
        <a class="mdc-icon-button" :href="shareOnVkontakteUrl" target="_blank">
          <svg-icon :icon="icons.vkontakte"/>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
  import MButton from './MButton.vue';
  import facebookSymbol from '../../images/facebook-icon.svg';
  import twitterSymbol from '../../images/twitter-icon.svg';
  import vkontakteSymbol from '../../images/vkontakte-icon.svg';
  import SvgIcon from './SvgIcon.vue';
  import CopyLinkButton from './CopyLinkButton.vue';

  function getQueryString(query){
    return Object.entries(query)
      .map(([key, val]) => encodeURIComponent(key) + '=' + encodeURIComponent(val))
      .join('&');
  }

  export default {
    name: 'Contribute',
    components: {
      CopyLinkButton,
      SvgIcon,
      MButton,
    },
    data() {
      return {
        extensionId: 'my-extension-id',
        extensionName: 'Popup tab switcher',
        extensionDescription: 'The extension that makes switching between tabs much simpler',
        icons: {
          facebook: facebookSymbol,
          twitter: twitterSymbol,
          vkontakte: vkontakteSymbol,
        },
      };
    },
    computed: {
      extensionUrl() {
        return `https://chrome.google.com/webstore/detail/${this.extensionId}`;
      },
      shareOnFacebookUrl() {
        const query = {
          u: this.extensionUrl
        };
        return `https://www.facebook.com/sharer/sharer.php?${getQueryString(query)}`;
      },
      shareOnTwitterUrl() {
        const query = {
          url: this.extensionUrl,
          text: this.extensionDescription
        };
        return `https://twitter.com/share?${getQueryString(query)}`;
      },
      shareOnVkontakteUrl() {
        const query = {
          url: this.extensionUrl,
          title: this.extensionName,
          description: this.extensionDescription
        };
        return `https://vk.com/share.php?${getQueryString(query)}}`
      },
    },
  };
</script>

<style lang="scss">
  @import "../../../node_modules/@material/icon-button/mdc-icon-button";

  .contribute {
    margin-top: 40px;
  }

  .contribute__call-to-action {
    text-align: center;
    margin-right: 40px;
    margin-left: 40px;
  }

  .contribute__actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    width: 200px;
    margin: auto;
  }

  .contribute__action {
    justify-content: flex-start;

    & + & {
      margin-top: 15px;
    }

    i {
      margin-right: 6px;
    }
  }

  .contribute__share {
    margin-top: 100px;
  }

  .contribute__share-links {
    display: flex;
    justify-content: center;
  }

</style>
