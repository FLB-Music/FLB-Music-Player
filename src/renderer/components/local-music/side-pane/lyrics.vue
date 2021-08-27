<template>
  <div
    :class="[
      'LyricsContainer',
      bigLyrics ? 'bigLyrics pos-fix left0 blurred_bg blur40 round15 ml10' : ''
    ]"
  >
    <div v-if="!playingTrackLyrics" class="centerContents" style="height: 90%">
      <img width="200px" src="@img/no_lyrics.svg" />
      <p
        v-if="allLyrics.length === 0"
        style="text-align: center; font-family: inherit"
      >
        Comeback here for lyrics. A small dose of internet and bam💥 I'll have
        all the lyrics
      </p>
      <p v-else style="text-align: center; font-family: inherit">
        I haven't found the lyrics for this one, yet
      </p>
    </div>
    <div v-if="playingTrackLyrics" class="lyrics">
      <div
        v-for="(verse, index) in playingTrackLyrics"
        :key="index"
        class="verse"
      >
        <p class="line" v-for="(line, index) in verseLines(verse)" :key="index">
          {{ line }}
        </p>
      </div>
    </div>
    <div
      v-if="playingTrackLyrics"
      class="
        lyr_controls
        flex flex_between
        center-v
        blurred_bg
        bg1
        pos-abs
        left0
        bottom0
        pa5
      "
    >
      <div class="flex center-v border_split_right pr10">
        <base-button
          id="autoScroll"
          text="Auto Scroll"
          :active="autoScroll"
          @click.native="autoScroll = !autoScroll"
        />
        <div class="flex_evenly center-v">
          <base-button
            id="off_minus"
            icon="caret-down"
            icon-weight="regular"
            @click.native="offset += 20"
          />
          <p>{{ offset * -1 }}</p>
          <base-button
            id="off_add"
            icon="caret-up"
            @click.native="offset -= 20"
          />
        </div>
      </div>
      <div class="pl5">
        <base-button
          id="miniMode_bt"
          :tiny="true"
          icon="crop"
          :active="bigLyrics"
          title="Big Lyrics"
          @click.native="bigLyrics = !bigLyrics"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'Lyrics',

  methods: {
    ...mapActions(['getLyrics']),
    verseLines(verse) {
      return verse.replace(/\[.*\].*/gi, '').split(/\n/);
    },
    autoScrollContainer() {
      if (this.autoScroll) {
        const audio = document.querySelector('audio');
        const percent = audio.currentTime / audio.duration;
        const container = document.querySelector('.LyricsContainer .lyrics');
        if (!container) return;
        const scrollTo = Math.floor(percent * container.scrollHeight);
        container.scrollTo(0, scrollTo - this.offset);
      }
    },
    toggleWidgetSize() {
      //
    }
  },
  data() {
    return {
      offset: 50,
      autoScroll: false,
      bigLyrics: false
    };
  },
  computed: {
    playingTrack() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track;
    },
    playingTrackLyrics() {
      return (
        this.$store.state.PlaybackManger.allLyrics.filter(
          trackLyricInfo =>
            // eslint-disable-next-line implicit-arrow-linebreak
            trackLyricInfo.trackName === this.playingTrack.defaultTitle
        )[0]?.lyrics || false
      );
    },
    allLyrics() {
      return this.$store.state.PlaybackManger.allLyrics;
    }
  },
  mounted() {
    this.autoScroll = false;
    this.getLyrics();
    const audio = document.querySelector('audio');
    audio.addEventListener('timeupdate', e => {
      if (this.autoScroll) {
        this.autoScrollContainer();
      }
    });
  }
  //TODO clear set interval
};
</script>

<style lang="scss">
.bigLyrics {
  top: 38px;
  height: 80vh !important;
  width: 98.5vw !important;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .lyrics {
    width: 120%;
    text-align: center !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 88%;
    .verse {
      width: 100%;
      margin-bottom: 20px;
      .line {
        line-height: initial;
        font-size: 2rem;
      }
    }
  }
  .lyr_controls {
    position: relative;
    width: initial;
    border-radius: 15px;
  }
}
.LyricsContainer {
  scroll-behavior: smooth;
  width: 100%;
  height: 92%;
}
.lyrics {
  font-family: inherit;
  text-align: left;
  overflow: hidden;
  height: 90%;
  overflow-y: scroll;
  .verse {
    padding: 10px;
    line-height: 1.5rem;
    text-align: center;
    .line {
      text-align: center;
    }
  }
  // width: 100px;
}
.lyr_controls {
  width: 92%;
  z-index: 5;
  #off_add {
    transform: scale(0.6);
    img {
      transform: scale(0.8);
    }
  }
  #off_minus {
    transform: scale(0.6);
    img {
      transform: rotate(-45deg);
    }
  }
}
</style>
