<template>
  <div class="QueuedTracks animated faster disable__options round20 pos-rel">
    <div
      v-if="customQueue.length > 1"
      class="queue-actions pos-abs bottom0 bg2 pa10 zIndex2 w-100 flex center-a"
    >
      <base-button
        text="Clear Queue"
        :active="autoScroll"
        @click.native="clearCustomQueue"
      />
    </div>
    <div class="QueuedTracksWrapper round20 h-90 w-100">
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
  width: 97%;
  height: 95%;
  margin-left: -5px;
  .QueuedTracksWrapper {
    padding: 5px;
    padding-right: 12px;
    width: 104%;
    overflow: scroll;
    // padding-top: 40px;
  }
  .queue-actions {
    left: -5px;
    padding-top: 12px;
  }
}
</style>
