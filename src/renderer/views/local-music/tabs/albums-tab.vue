<template>
  <div class="tab groupedContentTab">
    <div
      v-if="albums.length === 0"
      class="loadingArea"
    >
      <div class="loadingIndicator" />
    </div>
    <div
      v-if="!selectedGroup"
      class="groupCards grid_auto"
    >
      <album-card
        v-for="album in albums"
        :key="album.name"
        :album="album"
        @playAlbum="playAlbum"
      />
    </div>
    <transition
      enter-active-class="animated fadeInUp extrafaster"
      leave-active-class="animated fadeOutDown extrafaster"
    >
      <div
        v-if="selectedGroup"
        class="selectedGroup bg1"
      >
        <base-button
          id="backToUnfilteredItems"
          icon-weight="regular"
          icon="caret-left"
          @click.native="deSelectGroup"
        />
        <div class="sliverBar">
          <div class="sliverBarFooter">
            <div class="groupedCard_info">
              <p class="groupedInfo_title">
                {{ selectedGroup.name }}
              </p>
              <p
                title="Go To Artist"
                class="groupedInfo_subtitle"
                style="cursor: pointer"
                @click="goToArtist(selectedGroup.artist)"
              >
                {{ selectedGroup.artist }}
              </p>
            </div>
            <div class="sliverBarActions">
              <base-button
                icon="play"
                text="Play"
                @click.native="playAll"
              />
              <base-button
                icon="queue"
                text="Queue"
                @click.native="addTracksToQueue"
              />
            </div>
          </div>
          <img
            class="coverArt"
            :src="'file://' + selectedGroup.tracks[0].albumArt"
          >
          <img
            id="blurred"
            :src="'file://' + selectedGroup.tracks[0].albumArt"
          >
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
    </transition>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';

export default {
  name: 'AlbumsTab',

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
    ...mapActions(['generateAlbumsData', 'findAndGoToArtist']),
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
    },
    playAlbum(album) {
      this.setPlayingTrack({ track: album.tracks[0], index: 0 });
      this.overWriteCustomQueue(album.tracks);
      this.pushNotification({
        title: `Playing ${album.name} album`,
        subTitle: null,
        type: 'normal'
      });
    },
    goToArtist(artist) {
      document.querySelector('#Artists').click();
      this.findAndGoToArtist(artist);
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
