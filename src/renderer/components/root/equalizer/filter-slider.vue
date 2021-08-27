<template>
  <div class="base_slider bg1">
    <input
      value="0"
      min="-15"
      max="15"
      type="range"
      @input="updateInput($event)"
    >
    <div
      :style="{ height: progressBarHeight }"
      class="base_slider_progress"
    />
  </div>
</template>

<script>
export default {
  name: 'FilterSlider',

  props: {
    filterValue: Number,
    targetBand: String,
    bandIndex: Number
  },
  data() {
    return {
      newFilterValue: 15
    };
  },
  computed: {
    progressBarHeight() {
      let absoluteValue = 15;
      absoluteValue = 15 + this.filterValue;
      return `${Math.trunc((absoluteValue / 30) * 100)}%`;
    }
  },
  methods: {
    updateInput(e) {
      this.newFilterValue = parseInt(e.srcElement.value, 10);
      this.$emit('rangeUpdated', {
        targetBandIndex: this.bandIndex,
        newValue: this.newFilterValue * -1
      });
    }
  }
};
</script>

<style lang="scss">
.base_slider {
  position: relative;
  width: 30px;
  height: 200px;
  border-radius: 10px;
  cursor: pointer;
  overflow: hidden;
  input {
    cursor: pointer;
    -webkit-appearance: none;
    opacity: 0;
    position: absolute;
    z-index: 2;
    top: 0px;
    left: 0px;
    height: 10px;
    width: 190px;
    background: none;
    transform-origin: center center;
    transform: rotate(90deg) translateX(90px) translateY(90px);
    &::-webkit-range-progress {
      -webkit-appearance: none;
      width: 90px;
    }
    &::-webkit-slider-runnable-track {
      height: 100%;
      border-radius: 3px;
    }
    &::-webkit-slider-thumb {
      -webkit-appearance: none !important;
      background: none;
      height: 100%;
      width: 10px;
    }
  }
  .base_slider_progress {
    position: absolute;
    border-radius: 10px;
    bottom: 0px;
    left: 0px;
    height: 50%;
    background: var(--accentColor);
    width: 100%;
  }
}
</style>
