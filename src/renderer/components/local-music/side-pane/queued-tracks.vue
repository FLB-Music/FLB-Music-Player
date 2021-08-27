<template>
  <div class="QueuedTracks animated faster disable__options">
    <div
      v-if="customQueue.length !== 0"
      class="clearQueueBt"
      @click="clearCustomQueue"
    >
      Clear Queue
    </div>
    <div class="QueuedTracksWrapper">
      <draggable
        v-model="customQueue"
        ghost-class="ghost"
        @start="drag = true"
        @end="drag = false"
      >
        <que-track
          v-for="(track, index) in customQueue"
          :key="track.fileLocation"
          :track="track"
          :index="index"
        />
      </draggable>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'QueuedTracks',

  data() {
    return {
      queue: []
    };
  },
  computed: {
    customQueue: {
      get() {
        const queue = this.$store.state.PlaybackManger.customQueue;
        const indexOfPlayingTrack = queue.findIndex(
          track => track.fileLocation === this.currentlyPlayingTrackPath
        );
        if (indexOfPlayingTrack > -1) {
          return queue;
        }
        if (queue.length === 1) {
          return [this.$store.state.PlaybackManger.playingTrackInfo.track];
        }
        return [
          this.$store.state.PlaybackManger.playingTrackInfo.track,
          ...queue
        ];
      },
      set(value) {
        this.$store.commit('reorderQueue', value);
      }
    },
    currentlyPlayingTrackPath() {
      this.scrollToPlayingTrack();
      return this.$store.state.PlaybackManger.playingTrackInfo.track
        .fileLocation;
    }
  },
  methods: {
    ...mapMutations([
      'setPlayingTrack',
      'removeTrackFromCustomQueue',
      'UIcontrollerToggleProperty',
      'clearCustomQueue'
    ]),
    playQueuedTrack(track) {
      this.setPlayingTrack({ track, index: 0 });
    },
    scrollToPlayingTrack() {
      setTimeout(() => {
        const index = parseInt(
          document.querySelector('.playing_track').getAttribute('data-index')
        );
        console.log(index);
      }, 100);
    }
  }
};
</script>

<style lang="scss">
.QueuedTracks {
  height: 95%;
  overflow: hidden;
  overflow-y: scroll;
  .clearQueueBt {
    padding: 5px;
    text-align: center;
    background: crimson;
    border-radius: 10px;
    position: absolute;
    top: 50px;
    z-index: 2;
    width: 84%;
    cursor: pointer;
    display: none;
    &:hover {
      border-radius: 20px;
    }
  }
  .QueuedTracksWrapper {
    // padding-top: 40px;
  }
}
</style>
