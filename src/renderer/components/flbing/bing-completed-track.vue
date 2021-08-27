<template>
  <div class="BingCompletedTrack">
    <!-- <img id="cover" :src="track.albumArt" /> -->

    <div class="content">
      <p class="track_title">
        {{ track.defaultTitle }}
      </p>
      <p class="track_artist">
        {{ track.artist }}
      </p>
    </div>
    <base-button
      id="playBt"
      icon="play"
      :small="true"
      @click.native="playTrack"
    />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'BingCompletedTrack',

  methods: {
    ...mapMutations(['setPlayingTrack']),
    playTrack() {
      this.setPlayingTrack({ track: this.track, index: 0 });
    }
  },
  props: {
    track: Object
  }
};
</script>

<style lang="scss">
.BingCompletedTrack {
  padding: 10px;
  background: rgba(255, 255, 255, 0.11);
  width: 90%;
  position: relative;
  border-radius: 15px;
  break-inside: avoid;
  display: flex;
  justify-content: left;
  gap: 10px;
  margin: 10px 0px;
  #playBt {
    background: rgba(255, 255, 255, 0.11);
    backdrop-filter: blur(10px);
    width: 40px;
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%) scale(0.8);
  }
  #cover {
    width: 20%;
    border-radius: 10px;
  }
  .content {
    width: 60%;
  }
}
</style>
