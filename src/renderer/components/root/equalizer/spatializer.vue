<template>
  <div class="spatializer"></div>
</template>

<script>
import { spatialize } from "./spatializer";
export default {
  data() {
    return {
      panningData: null,
      trackLength: 0,
      currentSpatialPosition: null,
      nextSpatialPosition: null,
    };
  },
  computed: {
    playingTrack() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track;
    },
  },
  watch: {
    playingTrack() {
      setTimeout(() => {
        const audio = document.querySelector("audio");
        const trackLength = Math.trunc(audio.duration);
        console.log(trackLength);
        this.panningData = getSpatials(trackLength);
        /* //Once the playing track changes, reinitialize the spatializer */
        console.log("Intializing spatializer");
        console.log(this.panningData);
      }, 500);
    },
  },
  methods: {},
  mounted() {
    let isPlaying = false;
    setInterval(() => {
      if (isPlaying) {
        spatialize();
        isPlaying = false;
      }
    }, 4000);
    /* let timeout = 5000; */
    const audioElement = document.querySelector("audio");
    audioElement.addEventListener("timeupdate", (e) => {
      isPlaying = true;
      /*   setTimeout(() => { */
      /*     spatialize(); */
      /*   }, timeout); */
      /*   timeout++; */
    });
  },
};
</script>

<style></style>
