<template>
  <div
    :class="[
      currentlyPlayingTrackPath === track.fileLocation ? 'playing_track' : '',
      'queuedTrack bg1 border_split'
    ]"
    :data-index="index"
  >
    <div @click.stop="playQueuedTrack(track)">
      <p class="card_title text-small-1">
        {{ track.defaultTitle }}
      </p>
      <p class="card_subTitle weight300 text-small-2">
        {{ track.defaultArtist }}
      </p>
    </div>
    <base-button
      icon="x"
      class="removeBt"
      :small="true"
      style="width: 25px; height: 25px"
      @click.native="removeTrackFromCustomQueue(index)"
    />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'QueTrack',
  props: {
    track: Object,
    index: Number
  },
  computed: {
    currentlyPlayingTrackPath() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track
        .fileLocation;
    }
  },
  methods: {
    ...mapMutations(['setPlayingTrack', 'removeTrackFromCustomQueue']),
    playQueuedTrack(track) {
      this.setPlayingTrack({ track, index: 0 });
    }
  }
};
</script>

<style lang="scss">
.queuedTrack {
  position: relative;
  padding: 10px;
  cursor: pointer;
  width: 90%;
  p {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .card_title {
    width: 90%;
  }

  .removeBt {
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%) scale(0);
    background: crimson;
  }
  .removeBt:hover {
    transform: translateX(-50%) scale(1.2) !important;
  }
  &::before,
  &::after {
    content: '';
    position: absolute;
    height: 3px;
    width: 20px;
    right: 10px;
    cursor: grab;
    top: 40%;
  }

  &::before {
    border-top: 2px solid white;
  }
  &::after {
    border-bottom: 2px solid white;
    border-top: 2px solid white;
    transform: translateY(5px);
  }
}
.ghost {
  background: var(--accentColor);
}
.queuedTrack:hover:not(.playing_track) {
  background: rgba(255, 255, 255, 0.158);
  .removeBt {
    transform: translateX(-50%) scale(1);
  }
}
.queuedTrack:active {
  img {
    transform: translateX(-50%) scale(0);
  }
}
.playing_track {
  border-radius: 10px;
  margin: 10px 0px;
  background: var(--accentColor);
}
</style>
