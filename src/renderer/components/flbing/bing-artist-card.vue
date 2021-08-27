<template>
  <div class="bing_artist bing_card groupCard" @click="getArtistData">
    <img class="coverArt" :src="artistInfo.picture" alt />
    <div class="groupedCard_info">
      <p class="groupedInfo_title">
        {{ artistInfo.name }}
      </p>
    </div>
    <div v-if="loading" class="loading">
      <div class="loadingIndicator" />
    </div>
  </div>
</template>

<script>
import { removeDuplicates } from '@/shared-utils';

export default {
  name: 'BingArtistCard',

  props: {
    artistInfo: Object
  },
  data() {
    return {
      loading: false,
      artistData: {
        name: null,
        cover: null,
        tracks: [],
        albums: []
      }
    };
  },
  methods: {
    getArtistData() {
      this.getTheirTracks();
    },
    getTheirTracks() {
      this.loading = true;
      const requestOptions = {
        method: 'GET',
        redirect: 'follow'
      };

      fetch(
        `https://api.deezer.com/artist/${this.artistInfo.id}/top?limit=50`,
        requestOptions
      )
        .then(response => response.text())
        .then(result => {
          const tracks = JSON.parse(result).data;
          const albums = removeDuplicates(
            tracks.map(track => track.album),
            'title'
          );
          const artistData = {
            id: this.artistInfo.id,
            name: this.artistInfo.name,
            picture: this.artistInfo.picture,
            tracks,
            albums
          };
          this.loading = false;
          this.$emit('selectedArtist', artistData);
        })
        .catch(error => console.log('error', error));
    }
  }
};
</script>

<style lang="scss">
.bing_card {
  position: relative;
  break-inside: avoid;
  .loading {
    background: var(--accentColor);
    position: absolute;
    top: 0px;
    left: 0px;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 15px;
    div {
      transform: translate(10px, 10px);
    }
  }
}
</style>
