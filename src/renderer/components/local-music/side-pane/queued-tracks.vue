<template>
  <div class="queuedTracks animated faster disable__options round20 pos-rel">
    <div
      v-if="customQueue.length > 1"
      class="queue-actions blurred_bg blur20 zIndex2 w-100 flex center-a"
    >
      <base-button
        :text="t('queue.clear')"
        @click.native="clearCustomQueue"
      />
    </div>
    <div
      class="queuedTracksWrapper round20 h-90"
    >
      <div class="tracksWrapper">
        <draggable
          v-model="customQueue"
          ghost-class="ghost"
          @start="drag = true"
          @end="drag = false"
        >
          <que-track
            v-for="track in customQueue"
            :key="track.fileLocation"
            :track="track"
            :index="getQueueIndex(track)"
          />
        </draggable>
      </div>
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
    /**
     * The displayed queue can contain the currently playing track even when
     * it is not part of the real queue, the index has to point to the real
     * queue so the right track gets removed.
     */
    getQueueIndex(track) {
      const realQueue = this.$store.state.PlaybackManger.customQueue;
      const index = realQueue.findIndex(
        queuedTrack => queuedTrack.fileLocation === track.fileLocation
      );
      return index === -1 ? 0 : index;
    },
    scrollToPlayingTrack() {
      // setTimeout(() => {
      //   const index = parseInt(
      //     document.querySelector('.playing_track').getAttribute('data-index'),
      //     10
      //   );
      //   console.log(index);
      // }, 100);
    }
  }
};
</script>

<style lang="scss">
.queuedTracks {
  width: 100%;
  height: 95%;
  .queuedTracksWrapper {
    width: 103%;
    height: 100%;
    overflow-y: scroll;
  }
  .queue-actions {
    position: absolute;
    padding: 10px;
    bottom: 0px;
    left: 0px;
    border-radius: 0px 0px 20px 20px;
  }
  .tracksWrapper {
    position: relative;
    top: 0px;
    left: 0px;
    right: 0px;
    width: 100%;
    &:last-child {
      border-bottom: none !important;
    }
    .filler {
      width: 100%;
    }
  }
}
</style>
