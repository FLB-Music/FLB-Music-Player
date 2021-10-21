<template>
  <div
    class="tab addedTracksTab"
    @scroll="virtualize($event)"
  >
    <div
      v-if="addedTracks.length === 0"
      class="flex-col center-a"
      style="height: 100%; width: 100%"
    >
      <p>💬 I did not Find🔎 Any Tracks💨</p>
      <p>
        💬 Head over to ⚙Settings⚙ and Add➕ the Folder📂 where your music is at
      </p>
      <!-- <p>💬 Or Just Download⬇ some with FLBing💎</p> -->
    </div>
    <div
      class="tracksWrapper"
      @click="addTracksToQueue"
    >
      <track-card
        v-for="(track, index) in tracksToRender"
        :key="track.fileLocation"
        :track-info="track"
        :index="index"
      />
    </div>
    <div
      :style="{ height: compHeight }"
      class="filler"
    />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import { sortArrayOfObjects } from '@/shared-utils';

export default {
  name: 'TracksTab',

  data() {
    return {
      tracksToRender: [],
      NO_OF_TRACKS_TO_RENDER: 30
    };
  },
  computed: {
    addedTracks() {
      const { sortParameter } = this.$store.state;
      const tracks = [...this.$store.state.TabsManager.tabsData.addedTracks];
      sortArrayOfObjects(tracks, sortParameter);
      return tracks;
    },
    flipSortOrder() {
      return this.$store.state.flipSortOrder;
    },
    sortParameter() {
      return this.$store.state.sortParameter;
    },
    compHeight() {
      const number = this.addedTracks.length - 1;
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
    sortParameter() {
      this.virtualize();
    },
    addedTracks() {
      this.virtualize();
    },
    flipSortOrder() {
      this.addedTracks.reverse();
      this.virtualize();
    }
  },
  methods: {
    ...mapMutations([
      'updatePlayingQueue',
      'setRenderedTrack',
      'overWriteCustomQueue'
    ]),
    addTracksToQueue() {
      this.overWriteCustomQueue(this.addedTracks);
    },
    virtualize() {
      console.log('Virtualizing');
      const container = document.querySelector('.addedTracksTab');
      const scrollTop = Math.trunc(
        container.scrollTop / this.NO_OF_TRACKS_TO_RENDER
      );
      const start = scrollTop;
      const end = scrollTop + this.NO_OF_TRACKS_TO_RENDER;
      this.tracksToRender = this.addedTracks.slice(start, end);
    }
  },
  mounted() {
    this.tracksToRender = this.addedTracks.slice(
      0,
      this.NO_OF_TRACKS_TO_RENDER
    );
  }
};
</script>

<style lang="scss">
.addedTracksTab {
  position: relative;
  overflow: hidden;
  overflow-y: scroll !important;
  width: 102%;
  margin-left: -10px;
  #tracksTabVirtualList,
  .tracksWrapper {
    overflow: hidden;
    position: sticky;
    top: 0px;
    left: 10px;
    height: 100%;
    padding: 10px;
    &:last-child {
      border-bottom: none !important;
    }
    .filler {
      width: 100%;
    }
  }
  .showHiddenActions {
    background: #0062ff !important;
    border-radius: 12px !important;
    .hiddenActions {
      display: block !important;
    }
  }
  .trackActions {
    position: sticky;
    background-color: rgba(0, 0, 0, 0.247);
    backdrop-filter: blur(10px);
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10;
    padding: 10px;
    padding-right: 15px;
    padding-left: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    .hiddenActions {
      display: none;
      box-shadow: 0px 0px 50px black;
    }
    #enterFxMode {
      display: block;
    }
    #exitFxMode {
      display: none;
    }
    .actionBt {
      background-color: rgba(0, 0, 0, 0.295);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      border-radius: 40px;
      cursor: pointer;
    }
    .actionBt:hover {
      background-color: rgba(252, 252, 252, 0.089);
    }
  }
}
// @media (max-width: 900px) {
//   .addedTracksTab {
//     height: 100vh !important;
//   }
//   .trackActions {
//     display: none !important;
//   }
// }
</style>
