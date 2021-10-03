<template>
  <div class="sliverBarActions">
    <base-button
      icon="queue"
      text="Queue"
      extra-class="blurred_bg"
      @click.native="$emit('addPlaylistToQueue')"
    />
    <base-button
      v-if="playlistName !== 'Favorites' && !editorOn"
      icon="pencil-simple"
      text="Edit"
      extra-class="blurred_bg"
      @click.native="$emit('showPlaylistEditor')"
    />
    <base-button
      v-if="editorOn"
      icon="pencil-simple"
      text="Close"
      extra-class="blurred_bg"
      @click.native="$emit('closePlaylistEditor')"
    />
    <base-button
      v-if="playlistName !== 'Favorites'"
      icon="trash-simple"
      text="Delete"
      extra-class="blurred_bg"
      @click.native="$emit('deleteCurrentPlaylist')"
    />
  </div>
</template>

<script>
export default {
  props: {
    playlistName: {
      type: String
    },
    editorOn: {
      type: Boolean
    }
  }
};
</script>

<style>
</style>