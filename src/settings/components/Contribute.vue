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
        <copy-link-button link="https://chrome.google.com/webstore/my-extension-id"/>
        <a class="mdc-icon-button" href="https://facebook.com" target="_blank">
          <svg-icon :icon="icons.facebook"/>
        </a>
        <a class="mdc-icon-button" href="https://twitter.com" target="_blank">
          <svg-icon :icon="icons.twitter"/>
        </a>
        <a class="mdc-icon-button" href="https://vk.com" target="_blank">
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

  export default {
    name: 'Contribute',
    components: {
      CopyLinkButton,
      SvgIcon,
      MButton,
    },
    data() {
      return {
        icons: {
          facebook: facebookSymbol,
          twitter: twitterSymbol,
          vkontakte: vkontakteSymbol,
        },
      };
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
