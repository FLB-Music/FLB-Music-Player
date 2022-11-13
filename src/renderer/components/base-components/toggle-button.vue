<template>
  <div @click="toggle" :class="['toggleBtn', on ? 'toggleActive' : 'bg1']">
    <div :class="['circle', 'bg2']" />
  </div>
</template>

<script>
export default {
  name: "ToggleButton",
  data() {
    return {
      on: this.active,
    };
  },
  methods: {
    toggle() {
      this.on = !this.on;
      this.$emit("toggled", this.on);
    },
  },
  props: {
    active: {
      default: false,
      type: Boolean,
    },
  },
  created() {
    console.log(this.active);
  },
};
</script>

<style lang="scss">
.toggleBtn {
  height: 25px;
  width: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.315);
  .circle {
    height: 70%;
    width: 40%;
    transform: translateX(20%);
    border: 1px solid rgba(255, 255, 255, 0.315);
  }
}
.toggleActive {
  background: var(--accentColor) !important;
  border: none;
  .circle {
    transform: translateX(120%);
    background: white;
    border: none;
  }
}
</style>
