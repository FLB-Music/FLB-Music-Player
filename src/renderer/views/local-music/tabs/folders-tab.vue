<template>
  <div class="FoldersTab groupedContentTab tab">
    <div v-if="!selectedGroup" class="folderCards grid_auto">
      <div
        v-for="folder in folders"
        :key="folder.path"
        class="folderCard"
        @click="selectGroup(folder)"
      >
        <div class="silv">
          <img class="folderIcon" src="@icon/folder.svg" />
          <div class="top3">
            <img
              v-if="folder.tracks[0]"
              :src="'file://' + folder.tracks[0].albumArt"
            />
            <img
              v-if="folder.tracks[1]"
              :src="'file://' + folder.tracks[1].albumArt"
            />
            <img
              v-if="folder.tracks[2]"
              :src="'file://' + folder.tracks[2].albumArt"
            />
          </div>
        </div>
        <p>{{ folder.name }}</p>
      </div>
    </div>
    <transition
      enter-active-class="animated fadeInUp extrafaster"
      leave-active-class="animated fadeOutDown extrafaster"
    >
      <div v-if="selectedGroup" class="selectedGroup bg1">
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
              <p class="groupedInfo_subtitle">
                {{ selectedGroup.path }}
              </p>
            </div>
            <div class="sliverBarActions">
              <base-button icon="play" text="Play" @click.native="playAll" />
              <base-button
                icon="queue"
                text="Queue"
                @click.native="addTracksToQueue"
              />
            </div>
          </div>
          <img
            v-if="selectedGroup.tracks[0].albumArt"
            id="blurred"
            :src="'file://' + selectedGroup.tracks[0].albumArt"
          />
          <img
            v-if="!selectedGroup.tracks[0].albumArt"
            id="blurred"
            src="@img/flbdefault-cover.png"
          />
          <img class="coverArt" src="@icon/folder.svg" />
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
  name: 'FoldersTab',

  data() {
    return {};
  },
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
    ...mapActions(['generateFoldersData']),
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
    },
    playAll() {
      this.setPlayingTrack({ track: this.selectedGroup.tracks[0], index: 0 });
      this.overWriteCustomQueue(this.selectedGroup.tracks);
      this.pushNotification({
        title: 'Playing all tracks from',
        subTitle: this.selectedGroup.name,
        type: 'normal'
      });
    }
  },
  computed: {
    folders() {
      return this.$store.state.TabsManager.tabsData.folders;
    },
    selectedGroup() {
      return this.$store.state.TrackSelector.selectedGroup;
    },
    renderedTracks() {
      return this.$store.state.renderedTracks;
    }
  },
  mounted() {
    this.generateFoldersData();
  }
};
</script>

<style lang="scss">
.folderCards {
  gap: 10px;
  height: 105%;
  overflow: hidden;
  overflow-y: scroll;
  .folderCard {
    cursor: pointer;
    padding: 10px;
    border-radius: 20px;
    max-width: 150px;
    .silv {
      position: relative;
      .folderIcon {
        width: 150px;
      }
      .top3 {
        position: absolute;
        top: 45%;
        transform: translateY(-50%) translateX(5px);
        display: flex;
        flex-direction: column;
        img {
          width: 25px;
          margin: 5px;
        }
      }
    }
  }
  .folderCard:hover {
    background: rgba(255, 255, 255, 0.11);
  }
}
</style>
