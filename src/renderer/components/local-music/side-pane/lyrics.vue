<template>
  <div
    :class="[
      'LyricsContainer',
      bigLyrics ? 'bigLyrics pos-fix left0 blurred_bg blur40 round15 ml10' : ''
    ]"
  >
    <div
      v-if="!playingTrackLyrics"
      class="centerContents"
      style="height: 90%"
    >
      <img
        width="200px"
        src="@img/no_lyrics.svg"
      >
      <template v-if="lyricsSearching">
        <p class="emptyLyrics">
          {{ t('lyrics.searching') }}
        </p>
      </template>
      <template v-else-if="showManualInput">
        <textarea
          v-model="manualLyrics"
          class="manualLyricsInput"
          :placeholder="t('lyrics.manualPlaceholder')"
        />
        <div class="flex center-a gap10 mt5">
          <base-button
            :text="t('lyrics.save')"
            :active="true"
            :small="true"
            @click.native="saveManualLyrics"
          />
          <base-button
            :text="t('lyrics.cancel')"
            :small="true"
            @click.native="showManualInput = false"
          />
        </div>
      </template>
      <template v-else>
        <p class="emptyLyrics">
          {{ searchMissed ? t('lyrics.notFound') : t('lyrics.emptyHint') }}
        </p>
        <div class="flex center-a gap10">
          <base-button
            :text="t('lyrics.download')"
            :active="true"
            :small="true"
            @click.native="downloadLyrics"
          />
          <base-button
            :text="t('lyrics.add')"
            :small="true"
            @click.native="openManualInput"
          />
        </div>
      </template>
    </div>
    <div
      v-if="playingTrackLyrics && autoScroll"
      class="lyrics"
    >
      <div
        v-for="(verse, index) in playingTrackLyrics"
        :key="index"
        class="verse"
      >
        <p
          v-for="(line, lineIndex) in verseLines(verse)"
          :key="lineIndex"
          class="line"
        >
          {{ line }}
        </p>
      </div>
    </div>

    <div
      v-if="playingTrackLyrics && !autoScroll"
      class="lyrics-no-auto"
    >
      <div
        v-for="(verse, index) in playingTrackLyrics"
        :key="index"
        class="verse"
      >
        <p
          v-for="(line, lineIndex) in verseLines(verse)"
          :key="lineIndex"
          class="line"
        >
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
        <div>
          <base-button
            id="autoScroll"
            :text="t('lyrics.autoScroll')"
            :active="autoScroll"
            @click.native="autoScroll = !autoScroll"
          />
        </div>
        <div class="flex flex-col center-a">
          <p class="text-small-2">
            {{ t('lyrics.offset') }}
          </p>
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
      </div>
      <div class="pl5">
        <base-button
          id="miniMode_bt"
          :tiny="true"
          icon="crop"
          :active="bigLyrics"
          :title="t('lyrics.bigLyrics')"
          @click.native="bigLyrics = !bigLyrics"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';

export default {
  name: 'Lyrics',

  methods: {
    ...mapActions({
      getLyrics: 'getLyrics',
      saveLyrics: 'saveManualLyrics',
    }),
    ...mapMutations(['pushNotification']),
    /**
     * The timestamps of the synced lyrics and the section tags like [Chorus]
     * are removed line by line. The old version removed the whole line after
     * a bracket, which showed nothing when the lyrics came timestamped.
     */
    verseLines(verse) {
      return verse
        .split('\n')
        .map((line) => line.replace(/\s*\[[^\]]*\]/g, '').trim())
        .filter((line) => line !== '');
    },
    /**
     * Asks for the lyrics of the track that is playing again and saves the
     * answer in a file, like the covers.
     */
    downloadLyrics() {
      this.getLyrics({ force: true });
    },
    openManualInput() {
      this.manualLyrics = '';
      this.showManualInput = true;
    },
    async saveManualLyrics() {
      if (!this.manualLyrics.trim()) return;
      await this.saveLyrics({ text: this.manualLyrics });
      this.showManualInput = false;
      this.pushNotification({
        title: this.t('lyrics.saved'),
        subTitle: this.playingTrack ? this.playingTrack.defaultTitle : null,
        type: 'normal',
      });
    },
    autoScrollContainer() {
      console.log("Auto Scrolling")
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
      bigLyrics: false,
      showManualInput: false,
      manualLyrics: ''
    };
  },
  watch: {
    // the form of manual input belongs to the track that was playing when
    // it was opened, it closes when another track starts
    playingTrack() {
      this.showManualInput = false;
      this.manualLyrics = '';
    }
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
    },
    lyricsSearching() {
      return this.$store.state.PlaybackManger.lyricsSearching;
    },
    lyricsMissedTrack() {
      return this.$store.state.PlaybackManger.lyricsMissedTrack;
    },
    // the search looked for the track that is playing and found nothing
    searchMissed() {
      return (
        this.lyricsMissedTrack !== '' &&
        this.playingTrack !== null &&
        this.lyricsMissedTrack === this.playingTrack.defaultTitle
      );
    }
  },
  mounted() {
    this.autoScroll = false;
    this.getLyrics();
    const audio = document.querySelector('audio');
    audio.addEventListener('timeupdate', () => {
      console.log(this.autoScroll)
      if (this.autoScroll) {
        this.autoScrollContainer();
      }
    });
  }
  // TODO clear set interval
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
.emptyLyrics {
  text-align: center;
  font-family: inherit;
  max-width: 90%;
}
.manualLyricsInput {
  width: 90%;
  height: 130px;
  resize: vertical;
}
.lyrics {
  font-family: inherit;
  text-align: left;
  overflow: hidden;
  height: 90%;
  width: 105%;
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

.lyrics-no-auto {
  font-family: inherit;
  text-align: left;
  overflow: hidden;
  height: 90%;
  width: 105%;
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
