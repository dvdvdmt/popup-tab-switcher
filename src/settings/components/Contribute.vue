<template>
  <div class="contribute mdc-typography mdc-typography--body1">
    <p class="contribute__call-to-action">
      You can say thanks or help me one of the following ways:
    </p>
    <div class="contribute__actions">
      <m-button class="contribute__action" href="https://chrome.google.com/webstore"
                target="_blank">
        <i slot="icon" class="material-icons">star</i>
        Give me 5
      </m-button>
      <m-button class="contribute__action"
                href="https://github.com/dvdvdmt/popup-tab-switcher/issues"
                target="_blank"
      >
        <i slot="icon" class="material-icons">announcement</i>
        Report an issue
      </m-button>
      <m-button class="contribute__action"
                href="mailto:dvdvdmt.work@gmail.com?subject=Popup Tab Switcher. <Your question>"
                target="_blank"
      >
        <i slot="icon" class="material-icons">email</i>
        Contact me
      </m-button>
      <m-button class="contribute__action"
                href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QLYKYQ6VZK6FS&source=url"
                target="_blank"
                raised>
        <i slot="icon" class="material-icons">local_cafe</i>
        Buy me a coffee
      </m-button>
    </div>
    <div class="contribute__share">
      <p class="contribute__call-to-action">or share with others</p>
      <div class="contribute__share-links">
        <button class="mdc-icon-button" @click="copyLink">
          <svg-icon :icon="icons.link"/>
        </button>
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
  import linkSymbol from '../../images/link-icon.svg';
  import facebookSymbol from '../../images/facebook-icon.svg';
  import twitterSymbol from '../../images/twitter-icon.svg';
  import vkontakteSymbol from '../../images/vkontakte-icon.svg';
  import SvgIcon from './SvgIcon.vue';

  export default {
    name: 'Contribute',
    components: {
      SvgIcon,
      MButton,
    },
    data() {
      return {
        icons: {
          link: linkSymbol,
          facebook: facebookSymbol,
          twitter: twitterSymbol,
          vkontakte: vkontakteSymbol,
        },
      };
    },
    methods: {
      copyLink() {
        console.log('link is copied');
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
    align-items: center;
  }

  .contribute__action {
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
