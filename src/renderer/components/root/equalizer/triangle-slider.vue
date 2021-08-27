<template>
  <div class="triangle_slider">
    <div class="slider_wrapper">
      <input
        type="range"
        min="0"
        max="15"
        value="0"
        @input="updateInput($event)"
      >
      <div
        v-if="filterName === 'VBoost'"
        class="slider_progress"
        :style="{ height: barHeightForVolumeBoost }"
      />
      <div
        v-else
        class="slider_progress"
        :style="{ height: barHeight }"
      />
    </div>
    <p>
      {{ filterName }}
    </p>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import { gainNode } from './equalizer';

export default {
  name: 'TriangleSlider',

  data() {
    return {
      barHeight: 0
    };
  },
  computed: {
    userSetVolume() {
      return this.$store.state.SettingsManager.settings.volume;
    },
    barHeightForVolumeBoost() {
      const h = this.userSetVolume * 100 - 100;
      if (h < 1) {
        return `0%`;
      }
      return `${h}%`;
    },
    bandValuesFromState() {
      return this.$store.state.EqualizerManager.bands.map(band => band.value);
    }
  },
  methods: {
    ...mapMutations(['setSettingValue']),
    updateInput(e) {
      const filterValue = parseInt(e.srcElement.value, 10);
      if (this.filterName === 'VBoost') {
        this.adjustVolumeBoost(filterValue);
        return;
      }
      if (this.filterName === 'Bass') {
        this.adjustBase(filterValue);
        this.barHeight = `${(parseInt(filterValue, 10) / 15) * 100}%`;
      } else {
        this.adjustTreble(filterValue);
        this.barHeight = `${(parseInt(filterValue, 10) / 15) * 100}%`;
      }
    },
    adjustBase(filterValue) {
      const bandGains = [0, 0, 0, 0, 0];
      bandGains[0] = filterValue - 2 < 0 ? 0 : filterValue - 2;
      bandGains[1] = filterValue - 4 < 0 ? 0 : filterValue - 4;
      bandGains[2] = filterValue - 6 < 0 ? 0 : -filterValue + 6;
      bandGains[3] = filterValue - 5 < 0 ? 0 : -filterValue + 5;
      bandGains[4] = filterValue - 4 < 0 ? 0 : -filterValue + 4;
      this.$emit('newGainValues', bandGains);
    },
    adjustTreble(filterValue) {
      const bandGains = [0, 0, 0, 0, 0];
      bandGains[0] = filterValue - 4 < 0 ? 0 : -filterValue + 4;
      bandGains[1] = filterValue - 5 < 0 ? 0 : -filterValue + 5;
      bandGains[2] = filterValue - 6 < 0 ? 0 : -filterValue + 6;
      bandGains[3] = filterValue - 4 < 0 ? 0 : filterValue - 4;
      bandGains[4] = filterValue - 2 < 0 ? 0 : filterValue - 2;
      this.$emit('newGainValues', bandGains);
    },
    adjustVolumeBoost(filterValue) {
      const boostedVolume = 1 + parseInt(filterValue, 10) / 15;
      if (boostedVolume > 1) {
        this.setSettingValue({
          property: 'volume',
          newValue: boostedVolume
        });
        gainNode.gain.value = 1 + parseInt(filterValue, 10) / 15;
      } else {
        this.setSettingValue({ property: 'volume', newValue: 1 });
      }
    }
  },
  props: {
    filterName: String
  }
};
</script>

<style lang="scss">
// .black_theme,
// .dark_theme {
//   .slider_wrapper {
//     &::before {
//       filter: invert(1) !important;
//     }
//   }
// }

.triangle_slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  input {
    position: absolute;
    bottom: 0;
    transform: rotate(-90deg) translateX(10px);
    width: 100%;
    height: 70%;
    z-index: 3;
    opacity: 0;
  }
  .slider_wrapper {
    position: relative;
    display: inline-block;
    width: 80px;
    filter: url('#goo');
    display: flex;
    flex-direction: column-reverse;
    overflow: hidden;
    &::before {
      content: '';
      display: block;
      padding-top: 86%;
      background: var(--accentColor);
      filter: brightness(1.5);
      clip-path: polygon(100% 0, 50% 100%, 0 0);
    }
  }

  .slider_progress {
    position: absolute;
    bottom: 0;
    height: 100%;
    width: 100%;
    &::before {
      content: '';
      display: block;
      padding-top: 86%;
      background: var(--accentColor);
      clip-path: polygon(100% 0, 50% 100%, 0 0);
    }
  }
  p {
    text-align: center;
    color: white;
  }
}
</style>
