<template>
  <div class="VolumeRocker flex center-v gap10 pl5">
    <div class="rocker_icons flex center-a" @click="toggleMute">
      <base-icon v-if="volume > 0.6" icon="speaker-simple-high" :size="18" />
      <base-icon
        v-if="volume <= 0.6 && volume > 0"
        icon="speaker-simple-low"
        :size="18"
      />
      <base-icon v-if="volume == 0" icon="speaker-slash" :size="18" />
    </div>
    <div class="rocker_wrapper bg1 pos-rel round10">
      <input min="0" v-model="volume" max="1" step="0.05" type="range" />
      <!-- <div class="base_slider_progress"></div> -->
      <div :style="{ width: progressBarWidth }" class="base_slider_progress" />
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import { gainNode } from '../equalizer/equalizer';

export default {
  name: 'VolumeRocker',

  data() {
    return {
      volume: 0.5,
      mute: false
    };
  },
  computed: {
    progressBarWidth() {
      return `${Math.trunc(this.userSetVolume * 100)}%`;
    },
    userSetVolume() {
      return this.$store.state.SettingsManager.settings.volume;
    }
  },
  watch: {
    volume() {
      gainNode.gain.value = this.volume;
      this.setSettingValue({ property: 'volume', newValue: this.volume });
    }
  },
  methods: {
    ...mapMutations(['setSettingValue']),
    toggleMute() {
      this.mute = !this.mute;
      if (this.mute) {
        this.volume = 0;
      } else {
        this.volume = 0.5;
      }
    }
  },
  mounted() {
    this.volume = this.userSetVolume;
    setTimeout(() => {
      gainNode.gain.value = this.volume;
    }, 0);
  }
};
</script>

<style lang="scss">
.VolumeRocker {
  position: relative;
  width: 135px;
  height: 6px;
  border-radius: 10px;
  cursor: pointer;

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
