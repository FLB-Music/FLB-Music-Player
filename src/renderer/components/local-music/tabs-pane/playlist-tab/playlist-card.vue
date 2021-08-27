<template>
  <div class="PlaylistCard bg1">
    <div
      v-if="playlist.tracks.length === 0"
      style="cursor: pointer"
      class="centerContents"
      @click="openPlaylist"
    >
      <img
        style="width: 140px"
        src="@img/add-illustration.svg"
      >
      <p style="font-family: inherit">
        Empty Playlist
      </p>
    </div>
    <div class="playlist_header">
      <p class="playlist_name bg1">
        {{ playlist.name }}
      </p>

      <div
        v-if="playlist.tracks.length !== 0"
        class="playlist_actions"
      >
        <base-button
          icon="book-open"
          title="Open Playlist"
          text="Open"
          @click.native="openPlaylist"
        />
        <base-button
          icon="play"
          title="Play All"
          text="Play"
          @click.native="playAll"
        />
      </div>
    </div>
    <div class="playlist_body">
      <over-layed-tracks
        v-if="playlist.tracks.length !== 0"
        :tracks="playlist.tracks.slice(0, 4)"
        :vertical="true"
      />
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';

export default {
  name: 'PlaylistCard',

  computed: {
    top5MixTracks() {
      return this.playlist.tracks.slice(0, 5);
    }
  },
  methods: {
    ...mapMutations([
      'setPlayingTrack',
      'overWriteCustomQueue',
      'selectGroup',
      'pushNotification'
    ]),
    playTrack(track) {
      if (document.querySelector('audio')) {
        document.querySelector('audio').muted = false;
      }
      this.setPlayingTrack({ track, index: 0 });
    },
    playAll() {
      this.setPlayingTrack({ track: this.playlist.tracks[0], index: 0 });
      this.overWriteCustomQueue(this.playlist.tracks);
      this.pushNotification({
        title: 'Playing all tracks from',
        subTitle: this.playlist.name,
        type: 'normal'
      });
    },
    openPlaylist() {
      this.selectGroup(this.playlist);
    }
  },
  props: {
    playlist: Object
  }
};
</script>

<style lang="scss">
.PlaylistCard {
  align-self: center;
  justify-self: center;
  border-radius: 20px;
  .playlist_name {
    font-size: 1rem;
    font-family: inherit;
    margin-bottom: 5px;
    text-align: center;
    padding: 10px 0px;
    border-radius: 20px 20px 0px 0px;
  }
  .playlist_actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
    justify-content: center;
  }
  // .playlist_body {
  // }
}
</style>
