<template>
  <div class="groupedContentTab blurred_bg blur30 bingArtistPage bingPage">
    <div class="sliverBar">
      <img id="blurred" class="coverArt" :src="artistInfo.picture" />
      <img class="coverArt roundImage" :src="artistInfo.picture" />
      <div class="sliverBarFooter">
        <div class="groupedCard_info">
          <p class="groupedInfo_title">
            {{ artistInfo.name }}
          </p>
        </div>
      </div>
      <base-button
        id="backToUnfilteredItems"
        icon="caret-left"
        icon-weight="regular"
        @click.native="$emit('clearArtistResults')"
      />
    </div>
    <div class="cardsWrapper artist_data_results">
      <div class="grid2 gap10">
        <div class="artist_data">
          <div class="sectionHeading">
            <p>Tracks</p>
            <div class="line" />
            <p>{{ artistInfo.tracks.length }}</p>
          </div>
          <div class="column content">
            <bing-track
              v-for="track in artistInfo.tracks"
              :key="track.id"
              :track-info="track"
            />
          </div>
        </div>
        <div class="artist_data">
          <div class="sectionHeading">
            <p>Albums</p>
            <div class="line" />
            <p>{{ artistInfo.albums.length }}</p>
          </div>
          <div class="content albums">
            <bing-album-card
              v-for="album in artistInfo.albums"
              :key="album.id"
              :album-info="album"
              @selectedAlbum="bubbleAlbum"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BingArtistPage',

  props: {
    artistInfo: Object
  },
  methods: {
    bubbleAlbum(albumData) {
      this.$emit('selectedAlbum', albumData);
      console.log('Sending...');
      console.table(albumData);
    }
  }
};
</script>

<style lang="scss">
.bingPage {
  position: absolute;
  top: 0;
  z-index: 4;
  border-radius: 20px;
  overflow: hidden;
  height: 96% !important;
  .content {
    padding: 20px;
    overflow: hidden;
    overflow-y: scroll;
  }
  .sectionHeading {
    margin-right: 20px;
    margin-left: 10px;
  }
}
.artist_data_results {
  height: 72%;
  overflow: hidden;
  .grid2 {
    height: 100%;
    align-items: flex-start;
    .artist_data {
      .content {
        height: 43vh;
      }
    }
  }
}
.artist_data {
  .albums {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px;
    align-items: flex-start;
    justify-content: left;
  }
}
</style>
