<template>
  <button class="mdc-tab" role="tab" aria-selected="true" tabindex="0">
    <span class="mdc-tab__content">
      <span class="mdc-tab__icon material-icons" aria-hidden="true"><slot name="icon"></slot></span>
      <span class="mdc-tab__text-label"><slot></slot></span>
    </span>
    <span class="mdc-tab-indicator">
      <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
    </span>
    <span class="mdc-tab__ripple"></span>
  </button>
</template>

<script>
export default {
  name: 'm-tab',
}
</script>
