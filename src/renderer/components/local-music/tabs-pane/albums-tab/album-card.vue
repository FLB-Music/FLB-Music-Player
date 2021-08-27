<template>
  <div
    class="groupCard albumCard"
    @click="goToAlbum(album)"
  >
    <img
      v-if="album.tracks[0].albumArt"
      class="coverArt"
      :src="'file://' + album.tracks[0].albumArt"
    >
    <img
      v-if="!album.tracks[0].albumArt"
      class="coverArt"
      src="@img/flbdefault-cover.png"
    >
    <div class="tracksCount">
      <p>
        {{ album.tracks.length }}
      </p>
    </div>
    <base-button
      id="card_playBt"
      icon="play"
      style="backdrop-filter: blur(20px)"
      @click.native.stop="$emit('playAlbum', album)"
    />
    <div class="groupedCard_info">
      <div>
        <p class="groupedInfo_title">
          {{ album.name }}
        </p>
        <p
          v-if="!hideArtist"
          class="groupedInfo_subtitle"
        >
          {{ album.tracks[0].artist }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'AlbumCard',

  methods: {
    ...mapMutations(['selectGroup']),
    goToAlbum(album) {
      document.querySelector('#Albums').click();
      this.selectGroup(album);
    }
  },
  props: {
    album: Object,
    hideArtist: Boolean
  }
};
</script>

<style lang="scss">
.albumCard {
  .coverArt {
    border-radius: 15px;
  }
  #card_playBt {
    position: absolute;
    top: 115px;
    left: 15px;
    transform: scale(0) perspective(1px);
  }
  &:hover {
    #card_playBt {
      transform: scale(0.9) perspective(1px);
      background: rgba(0, 0, 0, 0.24);
    }
  }
}
</style>
