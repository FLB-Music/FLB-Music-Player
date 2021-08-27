<template>
  <div class="searchResults blurred_bg blur20 no_scroll">
    <div class="TracksResults">
      <div class="sectionHeading">
        <h3>Tracks</h3>
        <div class="line" />
        <h4>{{ searchResults.tracks.length }}</h4>
      </div>
      <div
        style="max-height: 200px; overflow: hidden; overflow-y: scroll"
        class="trackResults"
      >
        <track-card
          v-for="track in searchResults.tracks"
          :key="track.fileLocation"
          :source="track"
          :index="0"
        />
      </div>
    </div>
    <hr>
    <div
      class="ArtistResults groupedContentTab"
      style="padding: 0px"
      @click="closeSearch"
    >
      <div class="sectionHeading">
        <h3>Artists</h3>
        <div class="line" />
        <h4>{{ searchResults.artists.length }}</h4>
      </div>
      <div
        v-if="searchResults.artists.length > 0"
        class="grid_auto"
        style="max-height: 160px; overflow: hidden; overflow-y: scroll"
      >
        <artist-card
          v-for="artist in searchResults.artists"
          :key="artist.name"
          :artist="artist"
        />
      </div>
    </div>
    <div
      class="AlbumResults groupedContentTab"
      @click="closeSearch"
    >
      <div class="sectionHeading">
        <h3>Albums</h3>
        <div class="line" />
        <h4>{{ searchResults.albums.length }}</h4>
      </div>
      <div
        v-if="searchResults.albums.length > 0"
        class="grid_auto"
        style="max-height: 150px; overflow: hidden; overflow-y: scroll"
      >
        <album-card
          v-for="album in searchResults.albums"
          :key="album.name"
          :album="album"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'SearchResults',

  computed: {
    searchResults() {
      return this.$store.state.SearchManager.searchResults;
    }
  },
  methods: {
    ...mapMutations(['search', 'selectGroup', 'clearSelectedTracks']),
    goToArtist(artist) {
      document.querySelector('#Artists').click();
      this.selectGroup(artist);
      this.closeSearch();
    },
    goToAlbum(album) {
      document.querySelector('#Albums').click();
      this.selectGroup(album);
      this.closeSearch();
    },
    closeSearch() {
      this.$emit('closeSearch');
    }
  }
};
</script>

<style lang="scss">
.searchResults {
  position: absolute;
  bottom: -5px;
  left: -7px;
  transform: translateY(100%);
  min-width: 61vw;
  max-width: 70vw;
  max-height: 85vh;
  padding: 10px;
  padding-bottom: 0px;
  border: 1px solid rgba(255, 255, 255, 0.315);
  border-radius: 20px;
  box-shadow: 0px 0px 50px black;
  h3 {
    padding: 5px;
  }
  hr {
    height: 1px;
    background: rgba(255, 255, 255, 0.377);
    border: none;
    margin-bottom: 5px;
  }
  .groupCard {
    transform: scale(0.8) translateY(-25px);
  }
}
@media (max-width: 900px) {
  .searchResults {
    width: 86vw !important;
    max-width: 86vw !important;
  }
}
</style>
