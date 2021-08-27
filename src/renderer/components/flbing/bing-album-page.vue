<template>
  <div class="groupedContentTab bingPage blurred_bg blur30 bingAlbumPage">
    <div class="sliverBar">
      <img id="blurred" class="coverArt" :src="albumInfo.cover" />
      <img class="coverArt" :src="albumInfo.cover" />
      <div class="sliverBarFooter">
        <div class="groupedCard_info">
          <p class="groupedInfo_title">
            {{ albumInfo.name }}
          </p>
          <p class="groupedInfo_subtitle">
            by {{ albumInfo.tracks[0].artist.name }}
          </p>
        </div>
      </div>
      <base-button
        id="backToUnfilteredItems"
        icon="caret-left"
        icon-weight="regular"
        @click.native="$emit('clearAlbumResults')"
      />
    </div>
    <div>
      <div class="results trackResults">
        <div class="sectionHeading">
          <p>Tracks</p>
          <div class="line" />
          <p>{{ albumInfo.tracks.length }}</p>
        </div>
        <div class="cardsWrapper">
          <bing-track
            v-for="track in albumInfo.tracks"
            :key="track.id"
            :track-info="track"
            :override-cover-art="albumInfo.cover"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BingAlbumPage',

  props: {
    albumInfo: Object
  },
  data() {
    return {
      tracks: []
    };
  },
  mounted() {
    console.log(this.albumInfo);
  }
};
</script>

<style lang="scss">
.widgetVisible {
  .bingAlbumPage {
    width: 76%;
  }
}
.bingAlbumPage {
  z-index: 5 !important;
  width: 100%;
  .cardsWrapper {
    height: 50%;
    padding: 40px;
    padding-right: 60px;
    padding-top: 10px;
    overflow: hidden;
    overflow-y: scroll;
  }
}
</style>
