<template>
  <div class="ytVideoPlayer">
    <iframe
      :src="srcString"
      width="560"
      height="315"
      frameborder="0"
    />
    <base-button
      icon="x"
      text="Close Player"
      @click.native="closePlayer"
    />
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'YtvideoPlayer',

  methods: {
    ...mapActions(['toggleIsPlaying']),
    closePlayer() {
      this.$emit('closeYTPlayer');
      if (!this.audioState.playing) {
        this.toggleIsPlaying();
      }
    }
  },
  props: {
    srcString: String
  },

  computed: {
    audioState() {
      return this.$store.state.PlaybackManger.audioState;
    }
  },
  mounted() {
    if (this.audioState.playing) {
      this.toggleIsPlaying();
    }
  }
};
</script>

<style lang="scss">
.ytVideoPlayer {
  position: absolute;
  bottom: 20px;
  left: 24.5%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.329);
  backdrop-filter: blur(40px);
  padding: 10px;
  border-radius: 18px;
  iframe {
    border-radius: 15px;
  }
  button {
    background: crimson;
  }
}
</style>
