<template>
  <div class="tab RecentsTab scroll_y">
    <div
      v-if="recentlyPlayedTracks.length === 0"
      class="centerContents"
      style="height: 100%"
    >
      <img width="300px" src="@img/no_recents.svg" />
      <p style="font-family: inherit">You still haven't played anything</p>
    </div>
    <div @click="addTracksToQueue">
      <track-card
        v-for="track in recentlyPlayedTracks"
        :key="track.fileLocation"
        :source="track"
        :index="0"
      />
    </div>
  </div>
</template>
<script>
import { mapMutations } from 'vuex';
export default {
  name: 'RecentsTab',

  data() {
    return {};
  },
  computed: {
    recentlyPlayedTracks() {
      return this.$store.state.TabsManager.tabsData.recentlyPlayedTracks;
    }
  },
  methods: {
    ...mapMutations(['overWriteCustomQueue']),
    addTracksToQueue() {
      this.overWriteCustomQueue(this.recentlyPlayedTracks);
    }
  }
};
</script>

<style>
.RecentsTab {
  overflow: hidden;
  overflow-y: scroll;
  height: 100%;
  padding-right: 10px;
}
</style>
