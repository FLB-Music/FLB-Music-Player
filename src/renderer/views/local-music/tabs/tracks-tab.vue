<template>
  <div
    ref="scroller"
    class="tab addedTracksTab"
    @scroll="onScroll"
  >
    <div
      v-if="addedTracks.length === 0"
      class="flex-col center-a"
      style="height: 100%; width: 100%"
    >
      <p>{{ t('tracks.empty') }}</p>
      <p>
        {{ t('tracks.emptyHint') }}
      </p>
      <!-- <p>Or Just Download some with FLBing 🔥</p> -->
    </div>
    <div
      v-else
      class="virtualList"
      :style="{ height: totalHeight + 'px' }"
    >
      <div
        ref="wrapper"
        class="tracksWrapper"
        :style="{ transform: 'translateY(' + offsetTop + 'px)' }"
        @click="addTracksToQueue"
      >
        <track-card
          v-for="(track, index) in visibleTracks"
          :key="track.fileLocation"
          :track-info="track"
          :index="startIndex + index"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import { sortArrayOfObjects } from '@/shared-utils';

// Space the row of the track that is playing needs on top of a normal row
const PLAYING_TRACK_SPACE = 12;

export default {
  name: 'TracksTab',

  data() {
    return {
      startIndex: 0,
      endIndex: 0,
      visibleTracks: [],
      // Height of a single row, measured from the dom once the list is
      // rendered. The old implementation used a hardcoded value that did
      // not match the real height of a track card, which made the scroll
      // range too short and hid the last tracks of the library.
      rowHeight: 22.4,
      windowSize: 30,
      overscan: 5,
      scrollFrame: null,
      scrollTimeout: null,
      measureTimer: null,
      measureRetries: 0
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
    totalHeight() {
      // The track that is currently playing has extra margins, the space it
      // needs is added so the last track of the list is fully reachable
      return this.addedTracks.length * this.rowHeight + PLAYING_TRACK_SPACE;
    },
    offsetTop() {
      return this.startIndex * this.rowHeight;
    }
  },
  watch: {
    sortParameter() {
      this.recompute();
    },
    addedTracks() {
      this.recompute();
    },
    flipSortOrder() {
      this.recompute();
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
    getScroller() {
      return this.$refs.scroller;
    },
    /**
     * Measures the real height of a track card so the scrollable area
     * matches the content. The row that is currently playing has extra
     * margins, so a normal row is preferred for the measurement.
     */
    measureRowHeight() {
      const wrapper = this.$refs.wrapper;
      if (!wrapper) return false;
      const cards = wrapper.querySelectorAll('.TrackCard');
      if (!cards.length) return false;

      let card = cards[0];
      for (const candidate of cards) {
        if (!candidate.classList.contains('playingTrack')) {
          card = candidate;
          break;
        }
      }

      const style = window.getComputedStyle(card);
      const height =
        card.getBoundingClientRect().height +
        parseFloat(style.marginTop || '0') +
        parseFloat(style.marginBottom || '0');

      if (height > 0) {
        // A whole number keeps the rows on the pixel grid, the list does not
        // shimmer while scrolling
        this.rowHeight = Math.round(height);
        return true;
      }
      return false;
    },
    computeWindowSize() {
      const scroller = this.getScroller();
      if (!scroller) return;
      const visibleRows = Math.ceil(scroller.clientHeight / this.rowHeight);
      this.windowSize = Math.max(10, visibleRows + this.overscan * 2);
    },
    updateWindow(force = false) {
      const scroller = this.getScroller();
      const total = this.addedTracks.length;

      if (!total) {
        if (this.startIndex !== 0 || this.visibleTracks.length) {
          this.startIndex = 0;
          this.endIndex = 0;
          this.visibleTracks = [];
        }
        return;
      }

      const firstVisibleRow = scroller
        ? Math.floor(scroller.scrollTop / this.rowHeight)
        : 0;
      // the window never goes past the end of the list
      const maxStart = Math.max(0, total - this.windowSize);
      const start = Math.min(
        Math.max(0, firstVisibleRow - this.overscan),
        maxStart
      );
      const end = Math.min(total, start + this.windowSize);

      // Only touch the dom when the window really moved, rendering the list
      // on every scroll event is what makes it shake
      if (!force && start === this.startIndex && end === this.endIndex) {
        return;
      }

      this.startIndex = start;
      this.endIndex = end;
      this.visibleTracks = this.addedTracks.slice(start, end);
    },
    onScroll() {
      if (this.scrollFrame) return;
      this.scrollFrame = requestAnimationFrame(() => {
        this.scrollFrame = null;
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
          this.scrollTimeout = null;
        }
        this.updateWindow();
      });
      // the animation frame does not always come, the list must not freeze
      this.scrollTimeout = setTimeout(() => {
        this.scrollTimeout = null;
        if (!this.scrollFrame) return;
        cancelAnimationFrame(this.scrollFrame);
        this.scrollFrame = null;
        this.updateWindow();
      }, 60);
    },
    onResize() {
      this.recompute();
    },
    recompute() {
      // render the window first, the height of a row can only be measured
      // once the track cards are in the dom
      this.updateWindow(true);
      this.$nextTick(() => {
        this.measureRowHeight();
        this.computeWindowSize();
        this.updateWindow(true);
      });
    }
  },
  created() {
    // the first rows are rendered right away, without them the height of a
    // row cannot be measured and the scroll range would be wrong
    this.updateWindow(true);
  },
  mounted() {
    this.recompute();
    this.measureRetries = 0;
    this.measureTimer = setInterval(() => {
      if (this.measureRowHeight()) {
        clearInterval(this.measureTimer);
        this.measureTimer = null;
        this.computeWindowSize();
        this.updateWindow(true);
      } else if (++this.measureRetries > 20) {
        clearInterval(this.measureTimer);
        this.measureTimer = null;
      }
    }, 100);
    window.addEventListener('resize', this.onResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
    if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame);
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    if (this.measureTimer) clearInterval(this.measureTimer);
  }
};
</script>

<style lang="scss">
.addedTracksTab {
  position: relative;
  overflow-x: hidden;
  overflow-y: scroll !important;
  // the browser must not try to compensate the scroll position when the
  // rendered part of the list changes
  overflow-anchor: none;
  width: 102%;
  margin-left: -10px;
  .virtualList {
    position: relative;
    width: 100%;
  }
  .tracksWrapper {
    position: absolute;
    top: 0;
    left: 10px;
    right: 0;
    padding: 0 10px;
    will-change: transform;
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
      background: rgba(252, 252, 252, 0.089);
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
