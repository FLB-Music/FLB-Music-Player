<template>
  <div class="bg">
    <img id="bg_fancy" :src="albumArt" />
  </div>
</template>

<script>
export default {
  name: 'Bg',

  computed: {
    playingTrack() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track;
    },
    theme() {
      return this.$store.state.SettingsManager.settings.theme;
    },
    albumArt() {
      if (this.playingTrack?.albumArt) {
        return 'file://' + this.playingTrack.albumArt;
      }
      return require('@img/flbdefault-cover.png');
    }
  }
};
</script>

<style lang="scss">
.bg {
  pointer-events: none;
  position: fixed;
  top: 0%;
  left: 0;
  width: 120%;
  height: 100vh;
  .hideImage {
    border-radius: 50% !important;
    height: 0% !important;
    width: 0% !important;
  }
  #bg_fancy {
    border-radius: 0%;
    position: fixed;
    top: 0%;
    width: 100%;
    height: 100%;
    filter: blur(50px);
    opacity: 0.3;
  }
}
</style>
