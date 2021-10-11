<template>
  <div v-if="!playingTrack.fileName.match(/mp4|mkv/)" class="TrackInfo">
    <div
      class="tag"
      style="display: flex; align-items: center; justify-content: center"
    >
      <img
        v-if="playingTrack.albumArt"
        id="tag_albumArt"
        :src="'file://' + playingTrack.albumArt"
      />
      <p v-if="!playingTrack.albumArt">No Album Art</p>
    </div>
    <div class="tag">
      <p class="tag_name">Title</p>
      <p class="tag_value">
        {{ playingTrack.title || 'unknown' }}
      </p>
    </div>
    <div class="tag">
      <p class="tag_name">Artist</p>
      <p class="tag_value">
        {{ playingTrack.artist || 'unknown' }}
      </p>
    </div>
    <div class="tag">
      <p class="tag_name">Album</p>
      <p class="tag_value">
        {{ playingTrack.album }}
      </p>
    </div>
    <div v-if="playingTrack.duration" class="tag">
      <p class="tag_name">Length</p>
      <p class="tag_value">
        {{ playingTrack.formattedLength }}
      </p>
    </div>
    <div class="tag">
      <p class="tag_name">Date Added</p>
      <p class="tag_value">
        {{ new Date(playingTrack.dateAdded).toDateString() }}
      </p>
    </div>
    <div class="tag">
      <p class="tag_name">File name</p>
      <p class="tag_value">
        {{ playingTrack.fileName }}.{{
          playingTrack.fileLocation.split('.')[1]
        }}
      </p>
    </div>
    <base-button
      id="toggleTagEditor"
      title="Edit Tags"
      icon="pencil-simple"
      extra-class="shrink_icon"
      :small="true"
      @click.native="emitPlayingTrack"
    />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'TrackInfo',

  computed: {
    playingTrack() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track;
    }
  },
  methods: {
    ...mapMutations(['UIcontrollerToggleProperty', 'addToSelectedTracks']),
    emitPlayingTrack() {
      this.$emit('targetTrack', this.playingTrack);
    }
  }
};
</script>

<style lang="scss">
.TrackInfo {
  padding-top: 10px;
  position: relative;
  .tag {
    border-bottom: 1px solid rgba(255, 255, 255, 0.192);
    padding: 10px;
    .tag_name {
      font-size: 0.9rem;
    }
    .tag_value {
      font-size: 0.8rem;
      font-weight: 300;
    }
  }
  #tag_albumArt {
    width: 150px;
    border-radius: 15px;
  }
  #toggleTagEditor {
    position: absolute;
    top: 0px;
    left: 10%;
    backdrop-filter: blur(10px);
  }
}
</style>
