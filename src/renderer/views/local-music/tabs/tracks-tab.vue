<template>
  <div class="tab addedTracksTab">
    <div
      v-if="addedTracks.length === 0"
      class="flex-col center-a"
      style="height: 100%; width: 100%"
    >
      <p>💬 I did not Find🔎 Any Tracks💨</p>
      <p>
        💬 Head over to ⚙Settings⚙ and Add➕ the Folder📂 where your music is at
      </p>
      <p>💬 Or Just Download⬇ some with FLBing💎</p>
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
    <div
      class="tracksWrapper"
      @click="addTracksToQueue"
      @scroll="virtualize($event)"
    >
      <track-card
        v-for="(track, index) in tracksToRender"
        :key="track.fileLocation"
        :source="track"
        :index="index"
      />
    </div>
    <div class="customScrollBar">
      <div
        class="l"
        :style="{ top: scrollPercent }"
      />
      <div
        class="wrpper"
        style="height: 100%"
      >
        <input
          type="range"
          value="0"
          min="0"
          max="100"
          @input="scrollContainer($event)"
        >
      </div>
    </div>
    <track-card v-if="0" />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import { removeDuplicates } from '@/shared-utils';
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
      scrollPercent: '0%'
    };
  },
  computed: {
    addedTracks() {
      return this.$store.state.TabsManager.tabsData.addedTracks;
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
    virtualize(e) {
      const scrollInfo = {
        scrollHeight: e.srcElement.scrollHeight,
        scrollTop: e.srcElement.scrollTop
      };
      const scrollAmount = Math.trunc(
        (scrollInfo.scrollTop / scrollInfo.scrollHeight) * 100
      );
      if (this.scrollAmountNotRepeated === scrollAmount) {
        return;
      }
      this.scrollAmountNotRepeated = scrollAmount;

      if (scrollInfo.scrollTop > this.scrollTop) {
        if (scrollAmount > 50) {
          // 1. Remove top Ten items from  tracksToRender
          this.removedChucks.unshift([...this.tracksToRender.slice(0, 5)]);
          this.tracksToRender.splice(0, 5);

          // 2. Get 5 items from addedTracks and add them to the end of tracksRendered
          const tenNotRenderedTracks = this.addedTracks.slice(
            this.startingIndexForTracksNotRendered,
            this.startingIndexForTracksNotRendered + 5
          );
          this.startingIndexForTracksNotRendered += 5;
          setTimeout(() => {
            this.tracksToRender = removeDuplicates(
              [...this.tracksToRender, ...tenNotRenderedTracks],
              'fileLocation'
            );
          }, 0);
        }
      } else if (scrollAmount < 20 && this.removedChucks.length) {
        // 1. Remove last Ten items from  tracksToRender
        this.tracksToRender.splice(40, 5);

        // 2. Get the last removed chunk of ten and add it to the start of tracksRendered
        // setTimeout(() => {
        const tracksToReturnBack = this.removedChucks[0];
        this.removedChucks.shift();
        this.startingIndexForTracksNotRendered -= 5;
        this.tracksToRender = removeDuplicates(
          [...tracksToReturnBack, ...this.tracksToRender],
          'fileLocation'
        );
        // }, 0);
      }
      this.scrollTop = scrollInfo.scrollTop;
      if (this.tracksToRender.length > 50) {
        this.tracksToRender.splice(50, this.tracksToRender.length);
      }
      this.percentageOfRenderedTracks();
    },
    percentageOfRenderedTracks() {
      let am = Math.trunc(
        (this.startingIndexForTracksNotRendered / this.addedTracks.length) * 100
      );
      am += 10;
      this.scrollPercent = `${am - 25}%`;
    }
  },
  mounted() {
    this.tracksToRender = this.addedTracks.slice(0, 50);
  }
};
</script>

<style lang="scss">
.customScrollBar {
  height: 100%;
  width: 8px;
  position: absolute;
  right: 0px;
  top: 0px;
  cursor: f;
  .wrpper {
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
  position: relative;
  overflow: hidden;
  #tracksTabVirtualList,
  .tracksWrapper {
    height: 99%;
    overflow: hidden;
    overflow-y: scroll;
    margin-right: -20px;
    padding-right: 30px;
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
