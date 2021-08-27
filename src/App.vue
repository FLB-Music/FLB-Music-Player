<template>
  <div
    id="app"
    :class="[accentColor, theme + '_theme', miniMode ? 'miniMode' : '']"
    @click="cleanUp"
  >
    <custom-title-bar />
    <ipc-listener />
    <transition
      enter-active-class="animated slideInUp extrafaster"
      leave-active-class="animated slideOutDown extrafaster"
    >
      <settings v-if="showSettings" />
    </transition>
    <on-board v-if="showOnboard" @closeOnBoard="showOnboard = false" />
    <notifications />
    <section id="main-view">
      <div v-if="!miniMode" id="sub-view-1" class="flex">
        <side-nav />
        <router-view />
      </div>
      <playing-pane v-if="playingTrack" v-on:fullPlayer="reactToFullPlayer" />
    </section>
    <bg v-if="theme === 'fancy'" />
  </div>
</template>
<script>
export default {
  name: 'App',
  data() {
    return {
      showOnboard: true,
      fullPlayer: false
    };
  },
  computed: {
    theme() {
      return this.$store.state.SettingsManager.settings.theme;
    },
    playingTrack() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track;
    },
    showSettings() {
      return this.$store.state.UIController.UIProperties.showSettings;
    },
    accentColor() {
      return this.$store.state.SettingsManager.settings.accentColor;
    },
    addedTracks() {
      return this.$store.state.TabsManager.tabsData.addedTracks;
    },
    miniMode() {
      return this.$store.state.UIController.UIProperties.miniMode;
    }
  },
  methods: {
    cleanUp() {
      if (document.querySelector('.trackOptions')) {
        document.querySelector('.trackOptions').style.height = `0px`;
      }
    },
    reactToFullPlayer(fullPlayer) {
      this.fullPlayer = fullPlayer;
      console.log(this.fullPlayer);
    }
  }
};
</script>
<style lang="scss">
@import '@scss/animate.scss';
@import '@scss/global.scss';
@import '@scss/themer.scss';
@import '@scss/grouped-content.scss';
@import '@scss/utility-classes.scss';
@import '@scss/mixins.scss';
@import '@scss/fun.scss';
// @font-face {
//   font-family: 'Quicksand';
//   src: local('@styles/Quicksand.tff') format('tff');
// }
* {
  scroll-behavior: smooth;
}
body {
  height: 100vh;
  overflow: hidden;
}
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgb(8, 8, 8);
}
::-webkit-scrollbar {
  background: rgba(0, 0, 0, 0);
  width: 8px;
  height: 6px;
}
::-webkit-scrollbar-track-piece {
  background: rgba(255, 255, 255, 0);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb {
  background: var(--accentColor);
  border-radius: 10px;
}
.playingPaneLoaded {
  #main-view {
    height: 94%;
  }
  #sub-view-1 {
    min-height: 85%;
    max-height: 0vh;
  }
}
#main-view {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}
#sub-view-1 {
  height: 100%;
  min-height: 100%;
  max-height: 0vh;
}
.featuresSwitcherArea {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 100vh;
  padding-left: 0px;
  margin-right: 10px;
}

.playingPaneArea {
  position: relative;
}
.discoverTab {
  padding-top: 0px;
  height: 100vh;
}
</style>
