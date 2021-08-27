<template>
  <div class="FLBing">
    <div class="main_content">
      <div :class="['SearchArea']">
        <bing-search-bar
          ref="searchBar"
          :search-in-progress="searchInProgress"
          :search-is-complete="searchDone"
          @searchQuery="makeSearch"
          @clearSearch="clearSearchResults"
        />
        <bing-recommender
          v-if="!searchDone"
          @selectedRecommendedArtist="setSelectedRecommendedArtist"
        />
      </div>
      <tabs-view :class="[!searchDone ? 'hide_this' : '', 'SearchResults']">
        <tab-wrapper title="Deezex">
          <deezer-page
            ref="deezerPage"
            @selectedArtist="setSelectedArtist"
            @selectedAlbum="setSelectedAlbum"
            @searchDone="searchDone = true"
            @searchInProgress="searchInProgress = true"
          />
        </tab-wrapper>
        <tab-wrapper title="YouTube">
          <youtube-page
            ref="youtubePage"
            @searchDone="searchDone = true"
            @searchInProgress="searchInProgress = true"
          />
        </tab-wrapper>
      </tabs-view>
      <transition
        enter-active-class="animated slideInUp extrafaster"
        leave-active-class="animated slideOutDown extrafaster"
      >
        <bing-artist-page
          v-if="selectedArtist"
          :artist-info="selectedArtist"
          @clearArtistResults="clearSelectedArtistOrAlbum('artist')"
          @selectedAlbum="setSelectedAlbum"
        />
      </transition>
      <transition
        enter-active-class="animated slideInUp extrafaster"
        leave-active-class="animated slideOutDown extrafaster"
      >
        <bing-album-page
          v-if="selectedAlbum"
          :album-info="selectedAlbum"
          @clearAlbumResults="clearSelectedArtistOrAlbum('album')"
        />
      </transition>
    </div>
    <downloads-widget />
    <download-widget-toggle />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'Flbing',

  data() {
    return {
      searchDone: false,
      searchInProgress: false,
      selectedArtist: null,
      selectedAlbum: null
    };
  },
  computed: {
    appIsOnline() {
      return this.$store.state.appIsOnline;
    }
  },
  methods: {
    ...mapMutations(['pushNotification']),
    clearSearchResults() {
      this.searchDone = false;
      this.searchInProgress = false;
    },
    setSelectedArtist(payload) {
      this.selectedArtist = payload;
    },
    setSelectedRecommendedArtist(payload) {
      this.selectedArtist = payload;
    },
    setSelectedAlbum(payload) {
      this.selectedAlbum = payload;
    },
    clearSelectedArtistOrAlbum(target) {
      if (target === 'artist') {
        this.selectedArtist = null;
        return;
      }
      this.selectedAlbum = null;
    },
    clearResults() {
      this.results.tracks = [];
      this.results.artists = [];
      this.results.albums = [];
      this.resultsGotten = false;
    },
    makeSearch(query) {
      this.$refs.youtubePage.searchInYoutube(query);
      this.$refs.deezerPage.searchInDeezer(query);
    }
  }
};
</script>

<style lang="scss">
.FLBing {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  .SearchArea {
    max-height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  h1 {
    text-shadow: 2px 2px 0px rgba(255, 255, 255, 0.295);
    text-align: center;
  }

  .scroller {
    position: fixed;
    z-index: 5;
    top: 8px;
    left: 50%;
    transform: translateX(-80%);
    background: black;
    border-radius: 20px;
    box-shadow: 0px 0px 20px black;

    h4 {
      border-radius: 20px;
      padding: 8px;
      text-align: center;
      cursor: pointer;
    }
    .activeScroll {
      background: rgb(0, 68, 255);
    }
  }
}

#flbingLogo {
  width: 50px;
}
.main_content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}
.SearchResults {
  height: 90%;
  width: 100%;
  border-radius: 15px;
  position: relative;
  .tab {
    width: 97%;
    height: 85.5%;
  }
}
</style>
