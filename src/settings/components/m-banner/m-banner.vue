<template>
  <div class="mdc-banner" :class="{'mdc-banner--hidden': isHidden}">
    <div class="mdc-banner__content">
      <div v-if="icon" class="mdc-banner__icon material-icons">{{ icon }}</div>
      <div class="mdc-typography--body2">
        {{ message }}
      </div>
    </div>
    <div class="mdc-banner__actions">
      <button type="button" class="mdc-button mdc-banner__button" @click="hide">dismiss</button>
      <a v-if="action" type="button" class="mdc-button mdc-banner__button" @click="$emit('action')">
        {{ action }}
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'm-banner',
  props: {
    message: {
      type: String,
      required: true,
    },
    action: {
      type: String,
    },
    icon: {
      type: String,
    },
  },
  data() {
    return {isHidden: false}
  },
  methods: {
    hide() {
      this.isHidden = true
    },
  },
}
</script>

<style lang="scss">
@import './mdc-banner.scss';

.mdc-banner__icon {
  font-size: 40px;
}

.mdc-banner {
  position: sticky;
  top: 0;
  z-index: 10;
}

.mdc-banner--hidden {
  display: none;
}
</style>
