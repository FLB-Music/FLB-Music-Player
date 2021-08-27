<template>
  <div class="PlaylistWidget blurred_bg blur20 widget">
    <div class="widget_header">
      <h1 class="widget_title">
        Select Playlist
      </h1>
      <base-button
        icon="x"
        extra-class="widget_close shrink_icon circle shrink8"
        :small="true"
        @click.native="UIcontrollerToggleProperty('showPlaylistWidget')"
      />
    </div>
    <div class="newPlaylistForm">
      <input
        v-model="newPlaylistName"
        class="inputElem w-90"
        placeholder="Create new playlist"
        type="text"
      >
      <base-button
        text="Create"
        :active="true"
        class="w-100 mt10"
        @click.native="createNewPlaylist()"
      />
    </div>
    <div class="playlistNamesWrapper">
      <p
        v-for="playlist in playlists"
        :key="playlist.name"
        class="playlistName"
        @click="addToPlaylist(playlist.name)"
      >
        {{ playlist.name }}
      </p>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'PlaylistWidget',

  data() {
    return {
      newPlaylistName: ''
    };
  },
  computed: {
    playlists() {
      return this.$store.state.TabsManager.tabsData.playlists;
    },
    selectedTracks() {
      return this.$store.state.TrackSelector.selectedTracks;
    }
  },
  methods: {
    ...mapMutations([
      'createPlaylist',
      'addSelectedTracksToPlaylist',
      'UIcontrollerToggleProperty',
      'pushNotification',
      'clearSelectedTracks'
    ]),
    createNewPlaylist() {
      this.createPlaylist(this.newPlaylistName);
      this.newPlaylistName = '';
    },
    addToPlaylist(playlistName) {
      this.addSelectedTracksToPlaylist(playlistName);
      this.UIcontrollerToggleProperty('showPlaylistWidget');
      this.pushNotification({
        title: `Added to ${playlistName} playlist`,
        subTitle: `${this.selectedTracks[0].defaultTitle}`,
        type: 'normal'
      });
      this.clearSelectedTracks();
    }
  }
};
</script>

<style lang="scss">
.PlaylistWidget {
  z-index: 40;
}
.newPlaylistForm {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.playlistNamesWrapper {
  margin-top: 10px;
  .playlistName {
    padding: 5px;
    font-size: var(--baseFontSize);
    font-family: inherit;
    transition: 0.2s ease;
    cursor: pointer;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.356);
    &:hover {
      background-color: #ffffff1e;
      border-radius: 20px;
      margin: 5px;
      border: none;
      padding-left: 10px;
    }
  }
}
</style>
