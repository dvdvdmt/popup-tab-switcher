<template>
  <svg :viewBox="icon.viewBox">
    <use :href="'#'+icon.id"/>
  </svg>
</template>

<script>
  export default {
    name: 'svg-icon',
    props: {
      icon: {
        type: Object,
        required: true,
      },
    },
  };
</script>
