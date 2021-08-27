<template>
  <div class="playingPane bg2">
    <div class="flex split">
      <div class="left_pane_section">
        <!-- <img
          class="album_art"
          :src="playingTrack.albumArt || require('@img/flbdefault-cover.png')"
          @click="expandPlayingPane"
        /> -->
        <album-art-wrapper v-on:togglePlayerMode="togglePlayerMode" />
        <img
          class="album_art_blurred"
          :src="playingTrack.albumArt || require('@img/flbdefault-cover.png')"
        />

        <div class="track_info">
          <p class="track_title">
            {{ playingTrack.defaultTitle }}
          </p>
          <p
            title="Go To Artist"
            class="track_artist"
            @click="goToArtist(playingTrack.defaultArtist)"
          >
            {{ playingTrack.defaultArtist }}
          </p>
        </div>
      </div>
      <div class="center_pane_section">
        <div class="flex center-v gap20 t_actions">
          <base-button
            id="shuffle_bt"
            icon="shuffle"
            :active="audioState.shuffle"
            :small="true"
            @click.native="shuffler"
          />
          <base-button
            id="prev_bt"
            icon="skip-back"
            :small="true"
            @click.native="determineNextTrack('prev')"
          />
          <div id="toggle_play" @click="toggleIsPlaying">
            <base-button
              v-if="!audioState.playing"
              id="play_bt"
              icon="play"
              :icon-size="23"
              @click="toggleIsPlaying"
            />
            <base-button
              v-if="audioState.playing"
              id="prev_bt"
              icon="pause"
              :icon-size="23"
              @click="toggleIsPlaying"
            />
          </div>

          <base-button
            id="next_bt"
            icon="skip-forward"
            extra-class="scale_icon"
            :small="true"
            @click.native="determineNextTrack('next')"
          />

          <base-button
            id="repeat_bt"
            icon="repeat"
            :active="audioState.repeat"
            :small="true"
            @click.native="changeRepeat"
          />
        </div>
        <track-bar />
      </div>
    </div>

    <div class="right_pane_section gap20">
      <div class="flex center-v gap20">
        <base-button
          icon="heart"
          :active="isInFavorites"
          :small="true"
          @click.native="toggleFromFavorites"
        />
        <base-button
          :small="true"
          icon="playlist"
          :active="showPlaylistWidget"
          title="Playlist"
          @click.native="showPlaylistAdder"
        />
        <base-button
          :small="true"
          icon="faders"
          :active="showEqualizerWidget"
          title="Equalizer"
          @click.native="UIcontrollerToggleProperty('showEqualizerWidget')"
        />
        <base-button
          id="miniMode_bt"
          :small="true"
          icon="crop"
          :active="miniMode"
          title="Mini Mode"
          @click.native="toggleMiniMode"
        />
      </div>
      <volume-rocker />
    </div>

    <transition
      enter-active-class="animated fadeInUp extrafaster"
      leave-active-class="animated fadeOutDown extrafaster"
    >
      <equalizer v-if="showEqualizerWidget" />
    </transition>
    <base-button
      v-if="playingTrackLyrics"
      id="lyrics_bt"
      icon="microphone"
      :active="showLyrics"
      title="Lyrics"
      @click.native="showLyrics = !showLyrics"
    />
    <transition enter-active-class="animated fadeInRight">
      <div v-if="playingPaneExpanded && !showLyrics" class="que_wrappers">
        <h1>Queue</h1>
        <queued-tracks />
      </div>
      <div v-if="playingPaneExpanded && showLyrics" class="lyrics_wrappers">
        <h1>Lyrics</h1>
        <lyrics />
      </div>
    </transition>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';
import { sendMessageToNode } from '@/renderer/utils';
import { setupEqualizer } from '../equalizer/equalizer';

export default {
  name: 'PlayingPane',

  data() {
    return {
      elements: ['songName', 'artistName', 'albumName'],
      repeat: false,
      shuffle: false,
      possibleThumbnails: [],
      selectedCover: '',
      volume: 1,
      isOnline: false,
      playingPaneExpanded: false,
      showLyrics: false
    };
  },
  computed: {
    playingTrack() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track;
    },
    audioState() {
      return this.$store.state.PlaybackManger.audioState;
    },
    showPlaylistWidget() {
      return this.$store.state.UIController.UIProperties.showPlaylistWidget;
    },
    showEqualizerWidget() {
      return this.$store.state.UIController.UIProperties.showEqualizerWidget;
    },
    isInFavorites() {
      return this.$store.state.TabsManager.tabsData.playlists[0].tracks.some(
        track => track.fileLocation === this.playingTrack.fileLocation
      );
    },
    miniMode() {
      return this.$store.state.UIController.UIProperties.miniMode;
    },
    playingTrackLyrics() {
      return (
        this.$store.state.PlaybackManger.allLyrics.filter(
          trackLyricInfo =>
            trackLyricInfo.trackName === this.playingTrack.defaultTitle
        )[0]?.lyrics || false
      );
    }
  },
  watch: {
    playingTrack() {
      this.showLyrics = false;
    }
  },
  methods: {
    ...mapMutations([
      'pushNotification',
      'addToSelectedTracks',
      'addSelectedTracksToPlaylist',
      'deleteSelectedTrackFromPlaylist',
      'UIcontrollerToggleProperty',
      'UIcontrollerSetPropertyValue',
      'setSettingValue',
      'clearSelectedTracks'
    ]),
    ...mapActions([
      'toggleRepeat',
      'toggleShuffler',
      'toggleIsPlaying',
      'determineNextTrack',
      'findAndGoToArtist'
    ]),
    togglePlayerMode() {
      document.body.classList.toggle('fullScreenPlayingPane');
      this.playingPaneExpanded = !this.playingPaneExpanded;
      this.UIcontrollerSetPropertyValue({
        property: 'currentSidePaneTab',
        newValue: 'Info'
      });
    },
    toggleMiniMode() {
      sendMessageToNode('toggleMiniMode', !this.miniMode);
      this.UIcontrollerToggleProperty('miniMode');
      document.body.classList.remove('fullScreenPlayingPane');
      this.playingPaneExpanded = false;
    },
    goToArtist() {
      document.querySelector('#Artists').click();
      this.findAndGoToArtist(this.playingTrack.defaultArtist);
    },
    shuffler() {
      this.toggleShuffler();
      const state = this.audioState.shuffle ? 'On' : 'Off';
      this.pushNotification({
        title: `Shuffle ${state}`,
        subTitle: null,
        type: 'normal'
      });
    },
    showPlaylistAdder() {
      this.addToSelectedTracks(this.playingTrack);
      if (!this.showPlaylistWidget) {
        this.UIcontrollerToggleProperty('showPlaylistWidget');
      }
    },
    toggleFromFavorites() {
      this.addToSelectedTracks(this.playingTrack);
      if (this.isInFavorites) {
        this.deleteSelectedTrackFromPlaylist(this.playingTrack);
        this.pushNotification({
          title: `Removed from Favorites`,
          subTitle: `${this.playingTrack.defaultTitle}`,
          type: 'danger'
        });
      } else {
        this.addSelectedTracksToPlaylist('Favorites');
        this.pushNotification({
          title: `Added to Favorites`,
          subTitle: `${this.playingTrack.defaultTitle}`,
          type: 'normal'
        });
      }
    },
    changeRepeat() {
      this.toggleRepeat();
      const state = this.audioState.repeat ? 'On' : 'Off';
      this.pushNotification({
        title: `Repeat ${state}`,
        subTitle: null,
        type: 'normal'
      });
    }
  },
  mounted() {
    setupEqualizer();
    window.addEventListener('keydown', e => {
      if (!document.activeElement.classList.contains('inputElem')) {
        if (e.code === 'Space') {
          e.preventDefault();
          document.querySelector('#toggle_play').click();
          return;
        }
        if (e.code === 'ArrowLeft') {
          this.determineNextTrack('prev');
          return;
        }
        if (e.code === 'ArrowRight') {
          this.determineNextTrack('next');
          return;
        }
        if (e.code === 'Tab') {
          e.preventDefault();
          document.querySelector('#search').focus();
        }
      }
    });
    document.querySelector('body').classList.add('playingPaneLoaded');

    const actionHandlers = [
      [
        'play',
        () => {
          this.toggleIsPlaying();
        }
      ],
      [
        'pause',
        () => {
          this.toggleIsPlaying();
        }
      ],
      [
        'previoustrack',
        () => {
          this.determineNextTrack('prev');
        }
      ],
      [
        'nexttrack',
        () => {
          this.determineNextTrack('next');
        }
      ]
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.log(
          `The media session action "${action}" is not supported yet.`
        );
      }
    }
  }
};
</script>

<style lang="scss">
.playingPane {
  width: 100%;
  z-index: 20;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  height: 100px;
  transition: 0.1s;
  .split {
    width: 80%;
  }
}
.album_art_blurred {
  position: absolute;
  left: 10px;
  z-index: -1;
  height: 94vh;
  width: 98.5vw;
  top: 40px;
  opacity: 1;
  filter: blur(60px);
  display: none;
}
.left_pane_section {
  padding: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  width: 25%;
  transition: none;
}
.track_info {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: none;

  .track_title,
  .track_artist {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 0.95rem;
    font-family: inherit;
    max-width: 13vw;
    transition: none;
  }
  .track_title {
    font-size: 0.9rem;
    font-family: inherit;
  }
  .track_artist {
    font-size: 0.8rem;
    font-family: inherit;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
}

.center_pane_section {
  width: 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  transition: none;
  #toggle_play {
    button {
      width: 45px;
      height: 45px;
    }
  }
}
.right_pane_section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  width: 20%;
  transition: none;

  .vol_rocker {
    transition: none;
  }
}
.scale_icon {
  img {
    transition: none;

    transform: scale(1.5);
  }
}
.t_actions {
  transition: none;
}

#lyrics_bt {
  position: absolute;
  top: 20px;
  left: 61%;
  backdrop-filter: blur(30px);
  display: none;
}

.fullScreenPlayingPane {
  .playingPane {
    position: fixed;
    z-index: 30;
    height: 93.5vh;
    width: 98.5vw;
    bottom: 10px;
    background: black;
    overflow: hidden;
  }
  .album_art_blurred {
    display: block;
    opacity: 0.4;
  }
  .left_pane_section {
    left: 20px;
    top: 20px;
    position: absolute;
    width: 100%;
    height: 80%;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    .album_art {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 25vw;
    }
    .track_info {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      // transform: translateY(100%) translateX(-72%);
      height: 150px;
      .track_title {
        font-size: 4rem;
        max-width: 40vw;
        text-align: center;
      }
      .track_artist {
        font-size: 3rem;
        max-width: 40vw;
        pointer-events: none;
        text-align: center;
      }
    }
  }
  .center_pane_section {
    margin-left: 20px;
    width: 98%;
    justify-content: flex-end;
    .TrackBar {
      position: absolute;
      left: 52%;
      transform: translateX(-50%);
      width: 80%;
    }
    .t_actions {
      position: absolute;
      bottom: 40px;
      left: 52%;
      transform: translateX(-50%);
      button {
        width: 40px;
        height: 40px;
      }
      #toggle_play {
        button {
          width: 50px;
          height: 50px;
        }
      }
    }
  }
  .right_pane_section {
    position: absolute;
    left: -80px;
    top: 40%;
    justify-content: flex-end;
    transform: rotate(-90deg);
    z-index: 20;
    .vol_rocker {
      transform: rotateX(180deg) translateY(72px) translateX(-12px);
      img {
        opacity: 0;
      }
    }
    button {
      transform: rotate(90deg);
      backdrop-filter: blur(20px);
    }
  }
  #lyrics_bt {
    display: block;
  }
}
.que_wrappers {
  position: absolute;
  right: 10px;
  height: 82%;
  padding-top: 10px;
  width: 300px;
  h1 {
    text-align: center;
    margin-bottom: 10px;
  }
  .QueuedTracks {
    width: 100%;
    .centerContents {
      display: none;
    }
    .QueuedTracksWrapper {
      padding-top: 0px;
    }
    .clearQueueBt {
      display: none;
    }
  }
}

.playingPane {
  .lyrics_wrappers {
    h1 {
      text-align: center;
    }
    position: absolute;
    right: 10px;
    top: 10px;
    height: 85%;
    width: 22%;
  }
}

.miniMode {
  .playingPane {
    position: fixed;
    top: 0px;
    left: 0px;
    height: 100vh;
    width: 100vw;
    border-radius: 0px;
    background: none;
  }
  .album_art {
    position: absolute;
    width: 90%;
    left: 50%;
    top: 15px;
    transform: translateX(-50%);
  }
  .album_art_blurred {
    display: block;
  }
  .track_info {
    position: fixed;
    left: 15px;
    bottom: 10px;
    height: 15%;
    .track_title,
    .track_artist {
      max-width: 70vw;
    }
  }
  .TrackBar {
    position: absolute;
    left: 46%;
    transform: translateX(-50%);
    width: 82%;
    bottom: 30px;
  }
  .center_pane_section {
    backdrop-filter: blur(10px);
    background: rgba(0, 0, 0, 0.226);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: 0.2s ease-in-out;
  }
  &:hover {
    .center_pane_section,
    .vol_rocker,
    #miniMode_bt {
      opacity: 1;
    }
  }
  .right_pane_section button {
    display: none;
  }
  .vol_rocker {
    position: fixed;
    top: 20px;
    left: 40px;
    width: 25px;
    transition: 0.2s ease-in-out;
    background: rgba(0, 0, 0, 0.123);
    backdrop-filter: blur(10px);
    padding: 5px;
    border-radius: 10px;
    overflow: hidden;
    opacity: 0;
    img {
      margin-right: 10px;
    }
    // display: none;
    &:hover {
      width: 180px;
    }
  }
  button {
    backdrop-filter: blur(20px);
  }
  #toggle_play {
    position: absolute;
    left: 48%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    transition: 0.1s ease-in-out;
  }
  #next_bt {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
  }
  #prev_bt {
    position: absolute;
    left: 30px;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
  }
  #shuffle_bt,
  #repeat_bt {
    transform: translateX(-10px) scale(0.8) translateY(15px);
  }

  #miniMode_bt {
    display: block;
    position: fixed;
    top: 20px;
    right: 10px;
    transform: scale(0.75);
    opacity: 0;
  }
}
</style>
