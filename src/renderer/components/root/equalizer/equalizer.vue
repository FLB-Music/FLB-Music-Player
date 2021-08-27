<template>
  <div class="Equalizer widget blurred_bg blur20">
    <div class="widget_header">
      <h1 class="widget_title">
        Equalizer
      </h1>
      <base-button
        icon="x"
        class="widget_close circle shrink8"
        :small="true"
        @click.native="UIcontrollerToggleProperty('showEqualizerWidget')"
      />
    </div>
    <div class="presets grid3 gap10">
      <base-button
        v-for="preset in equalizerPresets"
        :key="preset.name"
        extra-class="bg1"
        :text="preset.name"
        :active="currentPreset === preset.name"
        @click.native.stop="loadPreset(preset)"
      />
    </div>
    <div class="filter_sliders">
      <div
        v-for="(band, index) in bands"
        :key="band.id"
        class="filter"
      >
        <p>{{ band.value }}db</p>
        <filter-slider
          :target-band="band.id"
          :band-index="index"
          :filter-value="band.value"
          @rangeUpdated="updateBandFilter"
        />
        <p>{{ band.frequency }}</p>
      </div>
    </div>
    <div class="b_t">
      <triangle-slider
        filter-name="Bass"
        @newGainValues="changeBandGains"
      />
      <triangle-slider
        filter-name="Treble"
        @newGainValues="changeBandGains"
      />
      <triangle-slider
        filter-name="VBoost"
        title="Boost Volume"
      />
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'Equalizer',

  computed: {
    bands() {
      return this.$store.state.EqualizerManager.bands;
    },
    equalizerPresets() {
      return this.$store.state.EqualizerManager.equalizerPresets;
    },
    currentPreset() {
      return this.$store.state.EqualizerManager.currentPreset;
    }
  },
  methods: {
    ...mapMutations([
      'UIcontrollerToggleProperty',
      'updateBandFilter',
      'changeBandGains',
      'loadPreset'
    ])
  }
};
</script>

<style lang="scss">
.Equalizer {
  padding: 10px;
  padding-top: 5px;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.582);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 50;
  .filter_sliders {
    padding: 10px;
    display: flex;
    gap: 15px;
    .filter {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      p {
        font-size: 0.8rem;
        font-family: inherit;
      }
    }
  }
  .b_t {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0px;
  }
}
</style>
