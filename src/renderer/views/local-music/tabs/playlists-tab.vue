<template>
  <div class="PlaylistsTab tab">
    <div
      v-if="!selectedGroup"
      class="playlistCards"
    >
      <playlist-card
        v-for="playlist in playlists"
        :key="playlist.name"
        :playlist="playlist"
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
          extra-class="blurred_bg"
          icon-weight="regular"
          icon="caret-left"
          @click.native="deSelectGroup"
        />
        <div class="sliverBar">
          <div class="images_flex">
            <div
              v-for="albumArt in imageFlex"
              :key="albumArt"
              class="flex_image_wrapper"
            >
              <img
                class="flexImage"
                :src="'file://' + albumArt"
              >
            </div>
          </div>

          <edit-playlist-widget
            v-if="showPlaylistEditor"
            @newPlaylistName="renamePlaylist"
            @closeWidget="closeWidget"
          />
          <div class="sliverBarFooter">
            <div class="groupedCard_info">
              <p
                style="margin-bottom: 10px"
                class="groupedInfo_title"
              >
                {{ selectedGroup.name }}
              </p>
            </div>

            <div class="sliverBarActions">
              <base-button
                icon="queue"
                text="Queue"
                extra-class="blurred_bg"
                @click.native="addPlaylistToQueue"
              />
              <base-button
                v-if="selectedGroup.name !== 'Favorites'"
                icon="pencil-simple"
                text="Edit"
                extra-class="blurred_bg"
                @click.native="showPlaylistEditor = !showPlaylistEditor"
              />
              <base-button
                v-if="selectedGroup.name !== 'Favorites'"
                icon="trash-simple"
                text="Delete"
                extra-class="blurred_bg"
                @click.native="deleteCurrentPlaylist"
              />
            </div>
          </div>
        </div>
        <div class="cardsWrapper">
          <transition-group leave-active-class="animated slideOutDown fast">
            <track-card
              v-for="(track, index) in selectedGroup.tracks"
              :key="track.fileLocation"
              :index="index"
              :source="track"
            />
          </transition-group>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import { removeDuplicates } from '@/shared-utils';

export default {
  name: 'PlaylistsTab',

  data() {
    return {
      showPlaylistEditor: false
    };
  },
  methods: {
    ...mapMutations([
      'selectGroup',
      'deSelectGroup',
      'deletePlaylist',
      'addToSelectedTracks',
      'clearSelectedTracks',
      'addSelectedTrackToCustomQueue',
      'UIcontrollerSetPropertyValue',
      'renameCurrentPlaylist'
    ]),
    addPlaylistToQueue() {
      this.UIcontrollerSetPropertyValue({
        property: 'currentSidePaneTab',
        newValue: 'Queue'
      });
      this.clearSelectedTracks();
      this.selectedGroup.tracks.forEach(track => {
        this.addToSelectedTracks(track);
      });
      this.addSelectedTrackToCustomQueue();
    },
    deleteCurrentPlaylist() {
      this.deletePlaylist(this.selectedGroup.name);
      this.deSelectGroup();
    },
    renamePlaylist(newPlaylistName) {
      this.showPlaylistEditor = false;
      this.renameCurrentPlaylist(newPlaylistName);
    },
    closeWidget() {
      this.showPlaylistEditor = false;
    }
  },
  computed: {
    playlists() {
      return this.$store.state.TabsManager.tabsData.playlists;
    },
    selectedTracks() {
      return this.$store.state.TrackSelector.selectedTracks;
    },
    selectedGroup() {
      return this.$store.state.TrackSelector.selectedGroup;
    },
    imageFlex() {
      return removeDuplicates(this.selectedGroup.tracks, 'album')
        .filter(track => track.albumArt)
        .map(track => track.albumArt);
    }
  }
};
</script>

<style lang="scss">
@import '@scss/mixins.scss';

.PlaylistsTab {
  position: relative;
  height: 100%;
  .playlistCards {
    padding: 10px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    // flex-direction: column;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    height: 95%;
    overflow: hidden;
    overflow-y: scroll;
  }
  .images_flex {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.151);
    // display: grid;
    // grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
    display: flex;
    .flex_image_wrapper {
      height: 100%;
      overflow: hidden;
      .flexImage {
        // position: absolute;
        // display: none;
        height: 100%;
      }
    }
  }
  .selectedGroup {
    button {
      @include blur-bg(10px);
      background: rgba(0, 0, 0, 0.24);
    }
  }
}
</style>
