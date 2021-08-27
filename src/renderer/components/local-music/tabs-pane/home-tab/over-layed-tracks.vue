<template>
  <div
    :class="[
      vertical ? 'vertical_overlay' : 'horizontal_overlay',
      'overLayedTracks'
    ]"
  >
    <div
      v-for="track in top10MixTracks"
      :key="track.fileLocation"
      class="card blurred_bg blur20 bg2"
      @click="playTrack(track)"
    >
      <img
        v-if="track.albumArt"
        class="card_image"
        :src="'file://' + track.albumArt"
      >
      <img
        v-else
        class="card_image"
        src="@img/flbdefault-cover.png"
      >
      <base-button
        id="card_playBt"
        icon="play"
        style="backdrop-filter: blur(20px)"
      />
      <p class="card_title">
        {{ track.defaultTitle }}
      </p>
      <p class="card_subTitle">
        {{ track.defaultArtist || 'unknown artist' }}
      </p>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';

export default {
  name: 'OverLayedTracks',

  computed: {
    top10MixTracks() {
      return this.tracks.slice(0, 10);
    }
  },
  methods: {
    ...mapMutations(['setPlayingTrack']),
    playTrack(track) {
      if (document.querySelector('audio')) {
        document.querySelector('audio').muted = false;
      }
      this.setPlayingTrack({ track, index: 0 });
    }
  },
  props: {
    tracks: Array,
    vertical: Boolean
  }
};
</script>

<style lang="scss">
.overLayedTracks {
  // overflow-x: scroll;
  padding-bottom: 10px;
  .card {
    padding: 10px;
    position: relative;
    max-width: 140px;
    overflow: hidden;
    border-radius: 20px;

    cursor: pointer;
    p {
      text-align: left;
      font-family: inherit;
      width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card_title {
      font-size: 0.9rem;
    }
    .card_subTitle {
      font-size: 0.8rem;
    }
    .card_image {
      height: 140px;
      margin: auto;
      border-radius: 20px;
    }
    #card_playBt {
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
    }
  }
}
.horizontal_overlay {
  display: flex;
  align-items: flex-end;
  height: 215px;
  .card {
    box-shadow: -15px 5px 10px rgba(0, 0, 0, 0.39);
  }
  .card:hover {
    transform: translateY(-10px);
    #card_playBt {
      transform: translate(-50%, -50%) scale(1.1);
    }
  }
  .card:hover ~ .card {
    transform: translateX(90px);
  }
  .card:not(:first-child) {
    margin-left: -90px;
  }
}
.vertical_overlay {
  overflow: hidden;
  margin: 0px 10px;
  .card_image {
    height: 100px;
  }
  .card:hover {
    #card_playBt {
      transform: translate(-50%, -50%) scale(1.1);
    }
  }
  .card:hover ~ .card {
    transform: translateY(180px);
  }
  .card:not(:first-child) {
    box-shadow: 0px -5px 10px rgba(0, 0, 0, 0.39);
    margin-top: -160px;
  }
}
</style>
