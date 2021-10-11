<template>
  <div class="album_art_wrapper">
    <img
      id="playing_track_album_art"
      class="album_art round15"
      :src="albumArt"
      @click="$emit('togglePlayerMode')"
    />
  </div>
</template>

<script>
// eslint-disable-next-line import/extensions
import ColorThief from './color-thief.min.js';

export default {
  computed: {
    dynamicAccentColor() {
      return this.$store.state.SettingsManager.settings.dynamicAccentColor;
    }
  },
  watch: {
    albumArt() {
      this.setThemeColor();
    }
  },
  methods: {
    setThemeColor() {
      if (this.dynamicAccentColor) {
        setTimeout(async () => {
          try {
            const palette = await ColorThief.prototype.getPalette(
              document.querySelector('#playing_track_album_art')
            );
            const app = document.querySelector('#app');
            if (palette[0] && palette[1]) {
              app.style.setProperty(
                '--accentColor',
                `linear-gradient(120deg,rgba(${palette[0]}),rgba(${palette[1]}))`
              );
            }
          } catch (error) {
            console.log('Error changing dynamic accent color');
            console.log(error);
          }
        }, 50);
      }
    }
  },
  props: {
    albumArt: String
  }
};
</script>

<style lang="scss">
.album_art_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  overflow: hidden;
  position: relative;
  border-radius: 15px;
  cursor: pointer;
  transition: none;
  .album_art {
    position: absolute;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
