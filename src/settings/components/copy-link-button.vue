<template>
  <button class="mdc-icon-button" @click="copyLink">
    <svg-icon v-if="showCopiedIcon" :icon="icons.linkCopied" />
    <svg-icon v-else :icon="icons.link" />
  </button>
</template>

<script>
import SvgIcon from './svg-icon.vue'
import linkSymbol from '../../images/link-icon.svg'
import linkCopiedSymbol from '../../images/link-copied-icon.svg'

export default {
  name: 'copy-link-button',
  components: {SvgIcon},
  props: {
    link: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      icons: {
        link: linkSymbol,
        linkCopied: linkCopiedSymbol,
      },
      showCopiedIcon: false,
    }
  },
  methods: {
    async copyLink() {
      await navigator.clipboard.writeText(this.link)
      this.showCopiedIcon = true
      setTimeout(() => {
        this.showCopiedIcon = false
      }, 2000)
    },
  },
}
</script>
