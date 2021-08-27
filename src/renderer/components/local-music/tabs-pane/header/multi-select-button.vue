<template>
  <base-button
    title="Select Multiple Tracks"
    icon="selection-background"
    text="Select"
    :active="multiSelectOn"
    @click.native="toggleMultiSelect()"
  />
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'MultiSelectButton',

  computed: {
    multiSelectOn() {
      return this.$store.state.UIController.UIProperties.multiSelectMode;
    }
  },
  methods: {
    ...mapMutations([
      'selectGroup',
      'clearSelectedTracks',
      'UIcontrollerToggleProperty'
    ]),
    toggleMultiSelect() {
      this.UIcontrollerToggleProperty('multiSelectMode');
      this.clearSelectedTracks();
      const trackOptions = document.querySelector('.trackOptions');
      if (this.multiSelectOn) {
        trackOptions.style.height = `0px`;
        trackOptions.style.top = `300px`;
        trackOptions.style.left = `600px`;
        setTimeout(() => {
          trackOptions.style.height = `225px`;
        }, 100);
      } else {
        trackOptions.style.height = `0px`;
      }
    }
  }
};
</script>

<style></style>
