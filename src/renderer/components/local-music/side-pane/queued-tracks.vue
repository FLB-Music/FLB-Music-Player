<template>
  <div class="queuedTracks animated faster disable__options round20 pos-rel">
    <div
      v-if="customQueue.length > 1"
      class="queue-actions blurred_bg blur20 zIndex2 w-100 flex center-a"
    >
      <base-button
        text="Clear Queue"
        @click.native="clearCustomQueue"
      />
    </div>
    <div
      class="queuedTracksWrapper round20 h-90"
      @scroll="virtualize($event)"
    >
      <div class="tracksWrapper">
        <draggable
          v-model="customQueue"
          ghost-class="ghost"
          @start="drag = true"
          @end="drag = false"
        >
          <que-track
            v-for="(track, index) in tracksToRender"
            :key="track.fileLocation"
            :track="track"
            :index="index"
          />
        </draggable>
      </div>
      <div
        :style="{ height: compHeight }"
        class="filler"
      />
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'QueuedTracks',

  data() {
    return {
      queue: [],
      tracksToRender: [],
      NO_OF_TRACKS_TO_RENDER: 30
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
    },
    compHeight() {
      const number = this.customQueue.length + 8;
      const height = number * this.NO_OF_TRACKS_TO_RENDER;
      let tracksWrapperHeight = 0;
      try {
        tracksWrapperHeight = parseInt(
          getComputedStyle(
            document.querySelector('.tracksWrapper')
          ).height.replace('px', ''),
          10
        );
      } catch (error) {
        console.log('Component not yet rendered');
      }
      return `${height - tracksWrapperHeight}px`;
    }
  },
  watch: {
    customQueue() {
      this.virtualize();
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
    virtualize() {
      console.log('Virtualizing Queue');
      const container = document.querySelector('.queuedTracksWrapper');
      const scrollTop = Math.trunc(
        container.scrollTop / this.NO_OF_TRACKS_TO_RENDER
      );
      const start = scrollTop;
      const end = scrollTop + this.NO_OF_TRACKS_TO_RENDER;
      console.log(start, end);
      this.tracksToRender = this.customQueue.slice(start, end);
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
  },
  mounted() {
    this.tracksToRender = this.customQueue.slice(
      0,
      this.NO_OF_TRACKS_TO_RENDER
    );
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
    overflow: hidden;
    position: sticky;
    top: 0px;
    left: 0px;
    right: 0px;
    width: 100%;
    height: 100%;
    &:last-child {
      border-bottom: none !important;
    }
    .filler {
      width: 100%;
    }
  }
}
</style>
