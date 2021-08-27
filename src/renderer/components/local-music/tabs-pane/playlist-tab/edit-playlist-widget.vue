<template>
  <div class="editPlForm blurred_bg blur20">
    <input
      v-model="newPlaylistName"
      class="inputElem"
      type="text"
      placeholder="New Playlist Name"
    >
    <base-button
      v-if="newPlaylistName"
      text="Save"
      @click.native="emitNewPlaylistName"
    />
    <base-button
      text="Cancel"
      @click.native="closeWidget"
    />
  </div>
</template>

<script>
export default {
  name: 'EditPlaylistWidget',

  data() {
    return {
      newPlaylistName: ''
    };
  },
  methods: {
    closeWidget() {
      this.$emit('closeWidget');
    },
    emitNewPlaylistName() {
      this.$emit('newPlaylistName', this.newPlaylistName);
    }
  }
};
</script>

<style lang="scss">
.editPlForm {
  position: absolute;
  border-radius: 20px;
  bottom: 50px;
  right: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 10px;
  input {
    width: 90%;
  }
}
</style>
