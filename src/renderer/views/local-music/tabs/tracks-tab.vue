<template>
  <div @scroll="virtualize($event)" class="tab addedTracksTab">
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
    <virtual-list
      v-if="0"
      id="tracksTabVirtualList"
      scrollable
      :data-key="'fileLocation'"
      :data-sources="addedTracks"
      :data-component="card"
      :estimate-size="280"
    />
    <div :style="{ height: compHeight }" class="filler"></div>
    <div class="tracksWrapper" @click="addTracksToQueue">
      <track-card
        v-for="(track, index) in tracksToRender"
        :key="track.fileLocation"
        :source="track"
        :index="index"
      />
    </div>
    <div class="customScrollBar">
      <div class="l" :style="{ top: scrollPercent }" />
      <div class="wrapper" style="height: 100%">
        <input
          type="range"
          value="0"
          min="0"
          max="100"
          @input="scrollContainer($event)"
        />
      </div>
    </div>
    <track-card v-if="0" />
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex';
import { removeDuplicates, sortArrayOfObjects } from '@/shared-utils';
import TrackCard from '@/renderer/components/root/track/track-card.vue';

export default {
  name: 'TracksTab',

  data() {
    return {
      card: TrackCard,
      tracksToRender: [],
      scrollTop: 0,
      startingIndexForTracksNotRendered: 50,
      scrollDirection: 'Down',
      removedChucks: [],
      scrollAmountNotRepeated: 0,
      scrollPercent: '0%',
      offset: 0
    };
  },
  computed: {
    addedTracks() {
      const sortParameter = this.$store.state.sortParameter;
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
      const number = this.addedTracks.length + 9;
      const height = number * 20;
      return `${height}px`;
    }
  },
  watch: {
    sortParameter() {
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
      const container = document.querySelector('.addedTracksTab');
      const scrollTop = Math.trunc(container.scrollTop / 20);
      let start = scrollTop;
      let end = scrollTop + 16;
      this.tracksToRender = this.addedTracks.slice(start, end);
    }
  },
  mounted() {
    this.tracksToRender = this.addedTracks.slice(0, 16);
  }
};
</script>

<style lang="scss">
.customScrollBar {
  height: 90%;
  width: 8px;
  position: absolute;
  right: 0px;
  top: 0px;
  display: none;
  .wrapper {
    position: relative;
  }
  .l {
    background: var(--accentColor);
    height: 10%;
    width: 100%;
    border-radius: 10px;
    position: absolute;
  }
  input {
    position: absolute;
    width: 5600%;
    right: 0px;
    bottom: 280px;
    right: -280px;
    transform: rotate(90deg);
    opacity: 0;
    pointer-events: none;
  }
}
.addedTracksTab {
  // position: relative;
  overflow: hidden;
  overflow-y: scroll !important;
  width: 102%;
  margin-left: -10px;
  #tracksTabVirtualList,
  .tracksWrapper {
    overflow: hidden;
    position: absolute;

    bottom: 5px;
    top: 100px;
    left: 10px;
    right: 20px;
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
