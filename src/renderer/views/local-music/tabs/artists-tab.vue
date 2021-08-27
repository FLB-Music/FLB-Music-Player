<template>
  <div class="tab ArtistsTab groupedContentTab">
    <track-card v-if="0" />
    <div v-if="artists.length === 0" class="loadingArea">
      <div class="loadingIndicator" />
    </div>
    <div v-if="!selectedGroup" class="groupCards grid_auto">
      <artist-card
        v-for="artist in artists"
        :key="artist.name"
        :artist="artist"
      />
    </div>
    <transition
      enter-active-class="animated fadeInUp extrafaster"
      leave-active-class="animated fadeOutDown extrafaster"
    >
      <div v-if="selectedGroup" class="selectedGroup bg1">
        <div class="sliverBar">
          <base-button
            id="bingArtistBtn"
            img="@icon/flbing.svg"
            title="Bing this Artist"
            @click.native="bingThisArtist"
          />
          <div class="sliverBarFooter">
            <div class="groupedCard_info">
              <p class="groupedInfo_title">
                {{ selectedGroup.name }}
              </p>
              <p
                class="groupedInfo_subtitle"
                @click="goToArtist(selectedGroup.tracks.artist)"
              >
                {{ selectedGroup.tracks.artist }}
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

          <base-button
            id="backToUnfilteredItems"
            icon-weight="regular"
            icon="caret-left"
            @click.native="deSelectGroup"
          />
          <img
            v-if="artistPicture"
            class="coverArt roundImage"
            :src="'file://' + artistPicture"
          />
          <letter-card v-else :text="selectedGroup.name" />
          <img
            v-if="artistPicture"
            id="blurred"
            class="coverArt"
            :src="'file://' + artistPicture"
          />
        </div>
        <div class="cardsWrapper">
          <div class="flex gap20 al_t">
            <div class="artistAlbums">
              <div class="sectionHeading">
                <p>Albums</p>
                <div class="line" />
                <p>{{ removeDuplicateAlbums(selectedGroup.albums).length }}</p>
              </div>
              <div class="flex flex-wrap center-a content al">
                <album-card
                  v-for="album in removeDuplicateAlbums(selectedGroup.albums)"
                  :key="album.name"
                  :album="album"
                  :hide-artist="true"
                  @playAlbum="playAlbum"
                />
              </div>
            </div>

            <div class="artistTracks">
              <div class="sectionHeading">
                <p style="margin-left: -10px">Tracks</p>
                <div class="line" />
                <p>{{ selectedGroup.tracks.length }}</p>
              </div>
              <div class="content">
                <track-card
                  v-for="(track, index) in selectedGroup.tracks"
                  :key="track.path"
                  :index="index"
                  :source="track"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';
import { removeDuplicates } from '@/shared-utils';
import { bingAnArtist } from '@/renderer/global-activities/bing-artist';

export default {
  name: 'ArtistsTab',

  data() {
    return {
      lastScrollTop: 0
    };
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
      'pushNotification',
      'setDownloadedArtistInfo'
    ]),
    ...mapActions(['generateArtistsData']),
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
        title: 'Playing all tracks from',
        subTitle: this.selectedGroup.name,
        type: 'normal'
      });
    },
    goToAlbum(album) {
      document.querySelector('#Albums').click();
      this.selectGroup(album);
      this.query = '';
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
    goToArtist() {
      document.querySelector('#Artists').click();
      this.findAndGoToArtist(this.artist.name);
    },
    bingThisArtist() {
      bingAnArtist(this.selectedGroup.name);
    },
    removeDuplicateAlbums(arr) {
      return removeDuplicates(arr, 'name');
    }
  },
  computed: {
    artists() {
      return this.$store.state.TabsManager.tabsData.artists;
    },
    selectedGroup() {
      return this.$store.state.TrackSelector.selectedGroup;
    },
    artistPicture() {
      return (
        this.$store.state.TabsManager.downloadedArtistPictures.filter(
          artistPicInfo => artistPicInfo.name === this.selectedGroup.name
        )[0]?.pathToPicture || false
      );
    }
  },
  mounted() {
    this.generateArtistsData();
    const dbInfo = localStorage.getItem('downloadedArtists');
    let downloadedArtists = [];
    if (dbInfo) {
      downloadedArtists = JSON.parse(dbInfo);
      this.setDownloadedArtistInfo(downloadedArtists);
    }
  }
};
</script>

<style lang="scss">
.ArtistsTab {
  .sliverBar {
    .LetterCard {
      transform: translateY(40px);
      h1 {
        font-size: 7rem;
      }
    }
    #bingArtistBtn {
      position: absolute;
      right: 10px;
      top: 10px;
      z-index: 5;
    }
  }
  .cardsWrapper {
    overflow-y: hidden !important;
    height: 59%;
    .al_t {
      height: 100%;
      position: relative;
      align-items: flex-start;
    }
    .TrackCard {
      .artist {
        opacity: 0;
      }
    }
  }
  .artistTracks,
  .artistAlbums {
    height: 100%;
    width: 50%;
    .content {
      height: 88%;
      overflow: hidden;
      overflow-y: scroll;
      position: relative;
      padding: 10px;
    }
  }
  .al {
    min-height: 200px;
  }
}
</style>
