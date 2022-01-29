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
import ColorThief from "./color-thief.min.js";

export default {
  computed: {
    dynamicAccentColor() {
      return this.$store.state.SettingsManager.settings.dynamicAccentColor;
    },
    presetAccentColor() {
      return this.$store.state.SettingsManager.settings.accentColor;
    },
    playingTrack() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track;
    },
  },
  watch: {
    playingTrack() {
      this.setThemeColor();
      this.recolorDefaultAlbumArt(
        parseInt(this.presetAccentColor.replace("accent_", ""))
      );
    },
    presetAccentColor(newAccent) {
      this.recolorDefaultAlbumArt(parseInt(newAccent.replace("accent_", "")));
    },
    dynamicAccentColor() {
      this.setThemeColor();
    },
  },
  methods: {
    setThemeColor() {
      if (this.dynamicAccentColor) {
        setTimeout(async () => {
          try {
            const palette = await ColorThief.prototype.getPalette(
              document.querySelector("#playing_track_album_art")
            );
            const app = document.querySelector("#app");
            if (palette[0] && palette[1]) {
              app.style.setProperty(
                "--accentColor",
                `linear-gradient(120deg,rgba(${palette[0]}),rgba(${palette[1]}))`
              );
            }
          } catch (error) {
            console.log("Error changing dynamic accent color");
            console.log(error);
          }
        }, 0);
      }
    },
    recolorDefaultAlbumArt(index) {
      //only recolor when dc is off
      if (!this.dynamicAccentColor) {
        const accentColorHues = [231, 268, 298, 38, 169, 27, 193, 328, 0, 19];
        const hueToApply = accentColorHues[index];

        const bgImage = document.querySelector("#bg_fancy");
        const albumArt = document.querySelector("#playing_track_album_art");
        setTimeout(() => {
          if (bgImage) {
            if (bgImage.src.includes("flbdefault")) {
              bgImage.style.filter = `hue-rotate(${hueToApply}deg) blur(50px)`;
              console.log("bg hue applied");
            } else {
              bgImage.style.filter = `blur(50px)`;
              console.log("bgImage hue reset");
            }
          }
          if (albumArt) {
            if (albumArt.src.includes("flbdefault")) {
              albumArt.style.filter = `hue-rotate(${hueToApply}deg)`;
              console.log("albumArt hue applied");
            } else {
              albumArt.style.filter = `none`;
              console.log("albumArt hue reset");
            }
          }
        }, 0);
      }
    },
  },
  props: {
    albumArt: String,
  },
  mounted() {
    this.recolorDefaultAlbumArt(
      parseInt(this.presetAccentColor.replace("accent_", ""))
    );
  },
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
