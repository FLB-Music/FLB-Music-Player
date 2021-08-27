<template>
  <div
    class="bing_card groupCard"
    @click="getAlbumTracks"
  >
    <img
      class="coverArt"
      :src="albumInfo.cover"
      alt
    >
    <div class="groupedCard_info">
      <p class="groupedInfo_title">
        {{ albumInfo.title }}
      </p>
    </div>
    <div
      v-if="loading"
      class="loading"
    >
      <div class="loadingIndicator" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'BingAlbumCard',

  props: {
    albumInfo: Object
  },
  data() {
    return {
      loading: false,
      albumData: {
        name: null,
        cover: null,
        tracks: []
      }
    };
  },
  methods: {
    getAlbumTracks() {
      this.loading = true;
      const requestOptions = {
        method: 'GET',
        redirect: 'follow'
      };

      fetch(
        `https://api.deezer.com/album/${this.albumInfo.id}/tracks`,
        requestOptions
      )
        .then(response => response.text())
        .then(result => {
          const trackResults = JSON.parse(result).data;
          const tracksWithAlbumInfo = trackResults.map(track => ({
            ...track,
            album: this.albumInfo
          }));
          console.log(tracksWithAlbumInfo);
          const albumData = {
            name: this.albumInfo.title,
            cover: this.albumInfo.cover,
            tracks: tracksWithAlbumInfo
          };
          this.loading = false;
          this.$emit('selectedAlbum', albumData);
        })
        .catch(error => console.log('error', error));
    }
  }
};
</script>

<style lang="scss"></style>
