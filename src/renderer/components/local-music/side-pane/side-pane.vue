<template>
  <div class="SidePane bg2">
    <div
      v-if="!playingTrack"
      style="width: 19.5vw; height: 100%"
      class="centerContents"
    >
      <img
        style="width: 19vw; margin: auto"
        src="@img/empty_illustration.svg"
      >
      <pre
        style="
          text-align: center;
          font-family: inherit;
          transform: translateY(-180px);
        "
      >
        This could be you,
        if you started playing something
      </pre>
    </div>
    <div
      v-if="playingTrack"
      class="Tabswitcher"
      style="margin-top: 0px"
    >
      <div
        v-for="tab in tabs"
        :id="tab.name"
        :key="tab.name"
        :class="[
          sidePaneActiveTab === tab.name ? 'activeTab' : '',
          'tabBtn bg1'
        ]"
        @click.stop="switchAidePaneActiveTab(tab.name)"
      >
        <base-icon
          :icon="tab.icon"
          class="icon"
        />
        <p>{{ tab.name }}</p>
      </div>
    </div>
    <track-info
      v-if="sidePaneActiveTab === 'Info' && playingTrack"
      @targetTrack="emitTargetTrack"
    />
    <queued-tracks v-if="sidePaneActiveTab === 'Queue'" />
    <lyrics v-if="sidePaneActiveTab === 'Lyrics'" />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'SidePane',

  data() {
    return {
      tabs: [
        { name: 'Info', icon: 'music-note-simple' },
        { name: 'Queue', icon: 'queue' },
        { name: 'Lyrics', icon: 'microphone' }
      ]
    };
  },
  computed: {
    playingTrack() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track;
    },
    sidePaneActiveTab() {
      return this.$store.state.UIController.UIProperties.currentSidePaneTab;
    },
    playingTrackLyrics() {
      return (
        this.$store.state.PlaybackManger.allLyrics.filter(
          trackLyricInfo => trackLyricInfo.trackName === this.playingTrack.defaultTitle
        )[0]?.lyrics || false
      );
    }
  },
  methods: {
    ...mapMutations([
      'UIcontrollerSetPropertyValue',
      'UIcontrollerToggleProperty'
    ]),
    switchAidePaneActiveTab(tab) {
      this.UIcontrollerSetPropertyValue({
        property: 'currentSidePaneTab',
        newValue: tab
      });
    },
    emitTargetTrack(track) {
      this.$emit('targetTrack', track);
      this.UIcontrollerToggleProperty('showTagEditor');
    }
  }
};
</script>

<style lang="scss">
.SidePane {
  position: relative;
  overflow: hidden;
  padding: 10px;
  border-radius: 20px;
  width: 19.5vw;
  height: 97%;
  @media (max-width: 900px) {
    .SidePane {
      display: none;
    }
  }
}
</style>
