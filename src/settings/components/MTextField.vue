<template>
  <div class="mdc-text-field mdc-text-field--outlined mdc-text-field--no-label">
    <input class="mdc-text-field__input"
           :id="id"
           :type="type"
           :class="{'mdc-text-field__input--suffix': suffix}"
           :name="id"
           v-model="model">
    <div v-if="suffix" class="mdc-text-field__suffix">{{suffix}}</div>
    <div class="mdc-notched-outline">
      <div class="mdc-notched-outline__leading"></div>
      <div class="mdc-notched-outline__trailing"></div>
    </div>
  </div>
</template>

<script>
  import { MDCTextField } from '@material/textfield/index';

  export default {
    name: 'MTextField',
    props: {
      value: {
        type: [String, Number],
        default: '',
      },
      id: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      suffix: {
        type: String,
        default: '',
      },
    },
    computed: {
      model: {
        get() {
          return this.value;
        },
        set(state) {
          if(this.type === 'number') {
            state = +state;
          }
          this.$emit('input', state);
        },
      },
    },
    mounted() {
      MDCTextField.attachTo(this.$el);
    },
  };
</script>

<style lang="scss">
  @import "~@material/textfield/mdc-text-field.scss";

  .mdc-text-field__input--suffix {
    padding-right: 0 !important;
  }

  .mdc-text-field__suffix {
    font-family: Roboto, sans-serif;
    font-size: 1rem;
    line-height: 1.75rem;
    font-weight: 400;
    letter-spacing: 0.009375em;
    text-decoration: inherit;
    text-transform: inherit;
    right: 0;
    box-sizing: border-box;
    height: 100%;
    padding-right: 16px;
    transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--mdc-theme-text-secondary-on-background);
  }

</style>
