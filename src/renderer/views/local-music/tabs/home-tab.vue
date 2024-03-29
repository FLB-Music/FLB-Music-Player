<template>
  <div class="home tab scroll_y">
    <div class="stats">
      <div class="stats_title">
        <h1>Library Stats</h1>
      </div>
      <div class="statsWrapper">
        <div class="statCard" @click="routeTo('Tracks')">
          <h2>{{ tabsData.addedTracks.length }}</h2>
          <p>Tracks</p>
          <base-icon
            class="fade_to_7 stat_icon"
            icon="music-note-simple"
            :size="40"
          />
        </div>
        <div class="statCard" @click="routeTo('Albums')">
          <h2>{{ tabsData.albums.length }}</h2>
          <p>Albums</p>
          <base-icon class="fade_to_7 stat_icon" :size="40" icon="disc" />
        </div>
        <div class="statCard stat_icon" @click="routeTo('Artists')">
          <h2>{{ tabsData.artists.length }}</h2>
          <p>Artists</p>
          <base-icon icon="user" :size="40" class="stat_icon fade_to_7" />
        </div>
        <div class="statCard" @click="routeTo('Folders')">
          <h2>{{ tabsData.folders.length }}</h2>
          <p>Folders</p>
          <base-icon
            icon="folder-simple"
            :size="40"
            class="stat_icon fade_to_7"
          />
        </div>
      </div>
    </div>
    <hr />
    <div class="stats">
      <div class="stats_title">
        <h1>Daily Mixes</h1>
      </div>
      <div class="mixesWrapper">
        <mix-card
          v-for="mix in mixes"
          :key="mix.name"
          :card-title="mix.name"
          :card-content="mix.info"
          :tracks="mix.tracks"
        />
        <div style="font-size: 0.8rem; font-family: inherit">
          * More Daily Mashups will come as you keep on listening *
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import { MixGenerator } from "@/renderer/utils/mix-generator";
import {ipcRenderer} from 'electron'
export default {
  name: "HomeTab",

  data() {
    return {
      mixes: [],
    };
  },
  computed: {
    tabsData() {
      return this.$store.state.TabsManager.tabsData;
    },
    playStats() {
      return this.$store.state.StatsManager.stats.playStats;
    },
  },
  methods: {
    ...mapMutations([
      "setPlayingTrack",
      "addToSelectedTracks",
      "clearSelectedTracks",
      "overWriteCustomQueue",
      "UIcontrollerSetPropertyValue",
    ]),
    routeTo(tab) {
      this.UIcontrollerSetPropertyValue({
        property: "currentMainTab",
        newValue: tab,
      });
      const path = tab === "Home" ? "/" : `/${tab}`;
      this.$router.push(path);
    },
    async intializeMixes(){
      const playStats = await ipcRenderer.invoke('getPlaybackStats');
      const mixGen = new MixGenerator(
        playStats,
        this.tabsData.addedTracks,
        this.tabsData.recentlyPlayedTracks
      );
      this.mixes = mixGen.allMixes;
      }
  },
  mounted() {
    setTimeout(() => {
    this.intializeMixes()
    
    }, 1000);
  },
};
</script>

<style lang="scss">
.home {
  overflow: hidden;
  .stats {
  padding-right: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
  overflow-y: scroll;
    .stats_title {
      margin-left: 5px;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 1.2rem;
      font-weight: 600;
    }
    .statsWrapper {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 10px;
      align-items: center;
      justify-content: center;
      
    }
    .statCard {
      background: var(--accentColor);
      padding: 10px;
      width: 90%;
      max-width: 190px;
      align-self: center;
      justify-self: center;
      border-radius: 15px;
      margin-bottom: 10px;
      position: relative;
      cursor: pointer;
      .stat_icon {
        position: absolute;
        width: 40px;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
      }
      h2 {
        font-size: 1.6rem;
        margin-bottom: 5px;
      }
      p {
        font-size: var(--baseFontSize);
        font-family: inherit;
      }
      h2,
      p {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }
      &:hover {
        border-radius: 20px;
      }
    }
  }
}
</style>
