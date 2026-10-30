<template>
  <div class="VolumeRocker flex center-v gap10 pl5 bg1">
    <div class="rocker_icons flex center-a" @click="toggleMute">
      <base-icon v-if="volumeNumber > 0.6" icon="speaker-simple-high" :size="18" />
      <base-icon
        v-if="volumeNumber <= 0.6 && volumeNumber > 0"
        icon="speaker-simple-low"
        :size="18"
      />
      <base-icon v-if="volumeNumber == 0" icon="speaker-slash" :size="18" />
    </div>
    <div class="rocker_wrapper bg1 pos-rel round10">
      <input
        v-model="volume"
        min="0"
        :max="maxVolume"
        step="0.05"
        type="range"
      />
      <div :style="{ width: progressBarWidth }" class="base_slider_progress" />
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import { setMasterVolume } from "../equalizer/equalizer";

export default {
  name: "VolumeRocker",

  data() {
    return {
      volume: 0.5,
      mute: false,
    };
  },
  computed: {
    // the range input works with strings, everything that shows or applies
    // the volume uses the number
    volumeNumber() {
      const parsed = parseFloat(this.volume);
      return Number.isNaN(parsed) ? 0 : parsed;
    },
    // the boost mode of the settings lets the slider go up to 200%
    volumeBoost() {
      return !!this.$store.state.SettingsManager.settings.volumeBoost;
    },
    maxVolume() {
      return this.volumeBoost ? 2 : 1;
    },
    progressBarWidth() {
      return `${Math.trunc((this.volumeNumber / this.maxVolume) * 100)}%`;
    },
    userSetVolume() {
      return this.$store.state.SettingsManager.settings.volume;
    },
  },
  watch: {
    volume() {
      this.applyVolume();
    },
    // turning the boost off brings the volume back to the normal limit and
    // turning it on keeps the current value
    volumeBoost() {
      this.volume = Math.min(this.volumeNumber, this.maxVolume);
      this.applyVolume();
    },
    // the volume boost of the equalizer writes the setting directly, the
    // slider follows it here
    userSetVolume(value) {
      const parsed = parseFloat(value);
      if (!Number.isNaN(parsed) && parsed !== this.volumeNumber) {
        this.volume = parsed;
      }
    },
  },
  methods: {
    ...mapMutations(["setSettingValue"]),
    applyVolume() {
      const limitedVolume = setMasterVolume(this.volumeNumber, this.volumeBoost);
      this.setSettingValue({ property: "volume", newValue: limitedVolume });
    },
    toggleMute() {
      this.mute = !this.mute;
      if (this.mute) {
        this.volume = 0;
      } else {
        this.volume = 0.5;
      }
    },
  },
  mounted() {
    // the saved value can arrive as a string and above the limit when the
    // boost mode was turned off in another session
    const savedVolume = parseFloat(this.userSetVolume);
    this.volume = Number.isNaN(savedVolume)
      ? 1
      : Math.min(savedVolume, this.maxVolume);
    this.applyVolume();
  },
};
</script>

<style lang="scss">
.VolumeRocker {
  position: relative;
  width: 180px;
  height: 6px;
  border-radius: 10px;
  cursor: pointer;
  padding: 10px;
  .rocker_wrapper {
    width: 100%;
    height: 100%;
    &:active {
      height: 12px;
    }
    &:hover {
      .base_slider_progress {
        background: var(--accentColor);
      }
    }
  }
  .rocker_icons {
    width: 20px;
  }
  input {
    cursor: pointer;
    -webkit-appearance: none;
    opacity: 0;
    position: absolute;
    z-index: 2;
    top: -10px;
    left: -5px;
    height: 20px;
    width: 100%;
  }
  .base_slider_progress {
    position: absolute;
    border-radius: 10px;
    top: 50%;
    transform: translateY(-50%);
    left: 0px;
    height: 150%;
    background: white;
    width: 100%;
    max-width: 100%;
  }
}
</style>
