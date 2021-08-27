<template>
  <div class="selectedGroup bg1">
    <button
      class="iconBt backToUnfilteredItems"
      style="margin-top: 20px"
      @click="deSelectGroup()"
    >
      <base-icon
        icon="caret-left"
        weight="regular"
      />
    </button>
    <div class="sliverBar">
      <div class="sliverBarActions">
        <button
          class="btWithIcon"
          @click="playAll"
        >
          <base-icon icon="skip-forward" />
          <p>Play All</p>
        </button>
        <button
          class="btWithIcon"
          @click="addTracksToQueue"
        >
          <base-icon icon="queue" />
          <p>Add To Queue</p>
        </button>
      </div>
      <img
        class="coverArt"
        :src="'file://' + selectedGroup.tracks[0].albumArt"
      >
      <img
        id="blurred"
        :src="'file://' + selectedGroup.tracks[0].albumArt"
      >
      <div class="groupedCard_info">
        <p class="groupedInfo_title">
          {{ selectedGroup.name }}
        </p>
        <p class="artist">
          {{ selectedGroup.artist }}
        </p>
      </div>
    </div>
    <div class="cardsWrapper">
      <track-card
        v-for="(track, index) in selectedGroup.tracks"
        :key="track.path"
        :index="index"
        :source="track"
      />
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';

export default {
  name: 'SelectedGroupModal',

  methods: {
    ...mapMutations([
      'addSelectedTrackToCustomQueue',
      'addToSelectedTracks',
      'UIcontrollerSetPropertyValue',
      'clearSelectedTracks',
      'selectGroup',
      'deSelectGroup',
      'setPlayingTrack',
      'overWriteCustomQueue',
      'pushNotification'
    ]),
    ...mapActions(['generateAlbumsData']),
    addTracksToQueue() {
      this.UIcontrollerSetPropertyValue({
        property: 'currentSidePaneTab',
        newValue: 'Queue'
      });
      this.clearSelectedTracks();
      this.selectedGroup.tracks.forEach(track => {
        this.addToSelectedTracks(track);
      });
      this.addSelectedTrackToCustomQueue();
      this.pushNotification({
        title: 'Tracks addded to the queue',
        subTitle: null,
        type: 'normal'
      });
    },
    playAll() {
      this.setPlayingTrack({ track: this.selectedGroup.tracks[0], index: 0 });
      this.overWriteCustomQueue(this.selectedGroup.tracks);
      this.pushNotification({
        title: `Playing ${this.selectedGroup.name} album`,
        subTitle: null,
        type: 'normal'
      });
    }
  },
  computed: {
    albums() {
      return this.$store.state.TabsManager.tabsData.albums;
    },
    selectedGroup() {
      return this.$store.state.TrackSelector.selectedGroup;
    }
  },
  mounted() {
    this.generateAlbumsData();
  }
};
</script>

<style lang="scss"></style>
