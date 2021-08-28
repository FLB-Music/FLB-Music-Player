<template>
  <div class="album_art_wrapper">
    <img
      class="album_art"
      id="playing_track_album_art"
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
    albumArt() {
      const playingTrackAlbumArt =
        this.$store.state.PlaybackManger.playingTrackInfo.track.albumArt;
      if (playingTrackAlbumArt) {
        return 'file://' + playingTrackAlbumArt;
      } else {
        return require('@img/flbdefault-cover.png');
      }
    },
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
        setTimeout(() => {
          const palette = ColorThief.prototype.getPalette(
            document.querySelector('#playing_track_album_art')
          );
          const app = document.querySelector('#app');
          app.style.setProperty(
            '--accentColor',
            `linear-gradient(120deg,rgba(${palette[0]}),rgba(${palette[1]}))`
          );
        }, 100);
      }
    }
  }
};
</script>

<style lang="scss">
.album_art_wrapper {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  .album_art {
    width: 70px;
    border-radius: 15px;
    cursor: pointer;
    transition: none;
  }
}
</style>