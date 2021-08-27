<template>
  <div
    :id="index"
    :class="[
      isCurrentlyPlaying ? 'playingTrack' : '',
      isSelected ? 'bulkSelected' : '',
      'TrackCard'
    ]"
    @contextmenu="showOptions($event)"
    @click="playTrack"
  >
    <div
      class="fxSelectBt"
      @click.stop="bulkSelectTrack($event)"
    />
    <div class="info">
      <p class="trackTitle text-small-1">
        {{ source.defaultTitle }}
      </p>
      <p class="artist weight300 fade_to_8 text-small-1">
        {{ source.defaultArtist }}
      </p>
      <p class="album queue weight300 fade_to_8 text-small-1">
        {{ source.album }}
      </p>
      <p class="duration">
        {{ source.formattedLength }}
      </p>
    </div>
  </div>
</template>
<script>
import { mapMutations } from 'vuex';

export default {
  name: 'TrackCard',

  data() {
    return {
      track: null
    };
  },
  computed: {
    isCurrentlyPlaying() {
      return (
        this.$store.state.PlaybackManger.playingTrackInfo.track
        && this.$store.state.PlaybackManger.playingTrackInfo.track.fileLocation
          === this.source.fileLocation
      );
    },
    isSelected() {
      return (
        this.$store.state.TrackSelector.selectedTracks.findIndex(
          track => track.fileLocation === this.source.fileLocation
        ) !== -1
      );
    }
  },
  methods: {
    ...mapMutations([
      'setPlayingTrack',
      'addToSelectedTracks',
      'UIcontrollerToggleProperty',
      'clearSelectedTracks'
    ]),
    showOptions(e) {
      e.preventDefault();
      document.querySelector('#tabsArea').classList.remove('multiSelectMode');
      const cordinates = {
        x: e.clientX + 5,
        y: e.clientY
      };
      if (cordinates.y > 500) cordinates.y = 500;
      const trackOptions = document.querySelector('.trackOptions');
      trackOptions.style.height = `0px`;
      trackOptions.style.top = `${cordinates.y}px`;
      trackOptions.style.left = `${cordinates.x}px`;
      setTimeout(() => {
        trackOptions.style.height = `225px`;
      }, 100);
      this.clearSelectedTracks();
      this.addToSelectedTracks(this.source);
    },
    playTrack() {
      if (document.querySelector('audio')) {
        document.querySelector('audio').muted = false;
      }
      this.setPlayingTrack({ track: this.source, index: this.index });
    },
    bulkSelectTrack() {
      this.addToSelectedTracks(this.source);
    }
  },
  props: {
    // track: Object,
    // trackIndex: Number,
    // playlistIndex: Number,
    index: {
      // index of current item
      type: Number
    },
    source: {
      type: Object,
      default() {
        return {};
      }
    }
  }
};
</script>

<style lang="scss">
.multiSelectMode {
  .TrackCard {
    margin-left: 30px;
    .fxSelectBt {
      display: block;
    }
  }
  .TrackCard:hover {
    cursor: default;
    .cover {
      transform: scale(0.9) translate(0px, 0px);
      box-shadow: -4px 4px 15px rgba(0, 0, 0, 0.712);
    }
    .fxSelectBt {
      border: 2px solid#ffffff;
      cursor: pointer;
    }
  }
}
.bulkSelected {
  .fxSelectBt {
    border: 1px solid#ffffff !important;
    background: var(--accentColor) !important;
  }
}

.playingTrack {
  background: rgba(255, 255, 255, 0.137);
  border-radius: 20px;
  margin-top: 5px;
  border-bottom: none !important;
  position: relative;
  .trackTitle {
    margin-left: 25px;
  }
  .album {
    margin-right: 15px;
  }
  &::before {
    transform: translateY(-50%) scale(1) !important;
  }
  &::after {
    transform: translateY(-50%) scale(1) !important;
  }
}
.TrackCard {
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.356);
  color: white;
  cursor: pointer;
  padding-left: 0px;
  padding: 5px;
  transition: 0.2s ease;
  &::before {
    position: absolute;
    content: '';
    left: 5px;
    width: 20px;
    height: 70%;
    top: 50%;
    transform: translateY(-50%) scale(0);
    background: var(--accentColor);
    border-radius: 10px;
    transition: none;
  }
  &::after {
    position: absolute;
    content: '';
    right: 5px;
    width: 20px;
    height: 70%;
    top: 50%;
    transform: translateY(-50%) scale(0);
    background: var(--accentColor);
    border-radius: 10px;
    transition: none;
  }
  .fxSelectBt {
    position: absolute;
    top: 50%;
    left: -28px;
    transform: translateY(-50%);
    z-index: 4;
    background: rgba(0, 0, 0, 0.466);
    border: 1px solid rgba(255, 255, 255, 0.452);
    width: 20px;
    height: 20px;
    display: none;
  }
  .cover {
    width: 35px;
    transition: 0.2s ease;
    justify-self: center;
    align-self: center;
  }
  .trackTitle {
    font-family: inherit;
    opacity: 1;
  }

  p {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    align-self: center;
  }
  .info {
    width: 100%;
    display: grid;
    grid-template-columns: 3fr 1fr 2fr;
    justify-content: center;
    align-items: center;
    align-items: center;
  }
  .delIcon {
    position: absolute;
    top: 50%;
    right: 0;
    background: crimson;
    width: 30px;
    padding: 5px;
    transform-origin: center;
    transform: translateX(50%) translateY(-50%) scale(0);
    border-radius: 50%;
    transition: 0.4s ease;
    cursor: pointer;
    z-index: 4;
    display: none;
  }
  .delIcon:hover {
    transform: translateX(50%) translateY(-50%) scale(1.2) !important;
  }
  .unQueueIcon {
    position: absolute;
    top: 50%;
    right: 0;
    background: crimson;
    width: 30px;
    padding: 5px;
    transform-origin: center;
    transform: translateX(50%) translateY(-50%) scale(0);
    border-radius: 50%;
    transition: 0.4s ease;
    cursor: pointer;
    z-index: 4;
  }
  .dateAdded {
    display: none;
  }
}
.TrackCard:hover {
  background: rgba(255, 255, 255, 0.144);
  .delIcon {
    transform: translateX(50%) translateY(-50%) scale(1);
  }
}
</style>
