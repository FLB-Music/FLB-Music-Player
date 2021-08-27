<template>
  <div
    class="trackOptions blurred_bg blur20"
    @click="close"
  >
    <div
      class="option hideOnMultiSelectMode"
      @click.stop="playNext"
    >
      <base-icon icon="skip-forward" />
      <p class="weight300">
        Play Next
      </p>
    </div>
    <div
      class="option"
      @click.stop="queueTrack"
    >
      <base icon="plus">
      <p class="weight300">
        Add to Queue
      </p>
    </div>
    <div
      class="option"
      @click.stop="addToFavorites"
    >
      <base-icon icon="heart" />
      <p class="weight300">
        Add to Favorites
      </p>
    </div>
    <div
      v-if="currentTab !== 'Playlists'"
      class="option"
      @click.stop="showPlaylistWidget"
    >
      <base-icon icon="playlist" />
      <p class="weight300">
        Add to Playlist
      </p>
    </div>
    <div
      v-if="currentTab === 'Playlists'"
      class="option"
      @click.stop="removeFromPlaylist"
    >
      <base-icon icon="x-circle" />
      <p class="weight300">
        Remove from Playlist
      </p>
    </div>
    <div
      class="option"
      @click.stop="deleteSelectedTracks"
    >
      <base-icon icon="trash-simple" />
      <p class="weight300">
        Delete Permanently
      </p>
    </div>
    <div
      class="option hideOnMultiSelectMode"
      @click.stop="showTagEditor"
    >
      <base-icon icon="pencil-simple" />
      <p class="weight300">
        Edit Tags
      </p>
    </div>
  </div>
</template>

<script>
import { sendMessageToNode } from '@/renderer/utils/index';
import { mapMutations } from 'vuex';

export default {
  name: 'TrackContextMenu',

  computed: {
    UIcontroller() {
      return this.$store.state.UIController.UIProperties;
    },
    selectedGroup() {
      return this.$store.state.TrackSelector.selectedGroup;
    },
    selectedTracks() {
      return this.$store.state.TrackSelector.selectedTracks;
    },
    currentTab() {
      return this.$store.state.UIController.UIProperties.currentMainTab;
    }
  },
  methods: {
    ...mapMutations([
      'addSelectedTracksToPlaylist',
      'deleteSelectedTrackFromPlaylist',
      'UIcontrollerToggleProperty',
      'UIcontrollerSetPropertyValue',
      'addToCustomQueue',
      'addSelectedTrackToCustomQueue',
      'setSelectedTrackToPlayNext',
      'clearSelectedTracks',
      'pushNotification'
    ]),
    queueTrack() {
      this.addSelectedTrackToCustomQueue();
      this.UIcontrollerSetPropertyValue({
        property: 'currentSidePaneTab',
        newValue: 'Queue'
      });
      this.pushNotification({
        title: 'Track(s) added to queue',
        subTitle: null,
        type: 'normal'
      });
      this.close();
    },
    playNext() {
      this.setSelectedTrackToPlayNext();
      this.pushNotification({
        title: `Playing that track Next`,
        subTitle: null,
        type: 'normal'
      });
      this.close();
    },
    close() {
      document.querySelector('.trackOptions').style.height = `0px`;
      this.UIcontrollerSetPropertyValue({
        property: 'multiSelectMode',
        newValue: false
      });
    },
    showPlaylistWidget() {
      if (!this.UIcontroller.showPlaylistWidget) {
        this.UIcontrollerToggleProperty('showPlaylistWidget');
      }
      this.close();
    },
    removeFromPlaylist() {
      this.deleteSelectedTrackFromPlaylist();
      this.close();
      this.pushNotification({
        title: `Removed from Favorites ${this.selectedGroup.name}`,
        subTitle: `${this.selectedTracks[0].defaultTitle}`,
        type: 'danger'
      });
      this.clearSelectedTracks();
    },
    addToFavorites() {
      this.addSelectedTracksToPlaylist('Favorites');
      this.pushNotification({
        title: `Added to Favorites`,
        subTitle: `${this.selectedTracks[0].defaultTitle}`,
        type: 'normal'
      });
      this.close();
      this.clearSelectedTracks();
    },
    showTagEditor() {
      this.UIcontrollerToggleProperty('showTagEditor');
      this.$emit('targetTrack', this.selectedTracks[0]);
      this.close();
      this.clearSelectedTracks();
    },
    deleteSelectedTracks() {
      sendMessageToNode('deleteFiles', this.selectedTracks);
      this.close();
    }
  }
};
</script>

<style lang="scss">
.multiSelectMode {
  .trackOptions {
    height: 150px !important;
    .hideOnMultiSelectMode {
      display: none !important;
    }
  }
}
.trackOptions {
  position: fixed;
  top: 0px;
  z-index: 80;
  left: 10px;
  border-radius: 20px;
  width: 220px;
  height: 0px;
  overflow: hidden;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.597) !important;
  transition: 0.2s ease;
  .option {
    padding: 8px;
    padding-left: 10px;
    cursor: pointer;
    display: grid;
    grid-template-columns: 1fr 5fr;
    transition: 0.2s ease;
    p {
      font-family: inherit;
    }
    img {
      width: 20px;
    }
  }
  .option:hover {
    background-color: #ffffff1e;
    border-radius: 20px;
    margin: 5px;
  }
}
</style>
