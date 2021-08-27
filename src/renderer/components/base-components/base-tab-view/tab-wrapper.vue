<template lang="html">
  <div
    v-show="isActive"
    class="tab bg1"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: 'TabWrapper',

  props: {
    title: {
      type: String,
      default: 'Tab'
    }
  },
  data() {
    return {
      isActive: true
    };
  }
};
</script>

<style lang="css"></style>
