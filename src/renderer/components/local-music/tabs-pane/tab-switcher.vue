<template>
  <div class="Tabswitcher">
    <div
      v-for="tab in tabs"
      :id="tab.name"
      :key="tab.name"
      :class="[currentTab === tab.name ? 'activeTab' : '', 'tabBtn bg1']"
      @click="routeTo(tab)"
    >
      <base-icon :icon="tab.icon" class="icon" :size="16" />
      <p>{{ tab.name }}</p>
    </div>
  </div>
</template>

<script lang="js">
import { mapMutations } from 'vuex';
import { ipcRenderer } from 'electron';

export default {
  name: 'TabSwitcher',


  data() {
    return {
      tabs: [
          { name: 'Home', path: '/', icon: 'house' },
          { name: 'Tracks', path: '/Tracks', icon: 'music-note-simple' },
          { name: 'Recents', path: '/Recents', icon: 'clock-clockwise' },
          { name: 'Playlists', path: '/Playlists', icon: 'playlist' },
          { name: 'Artists', path: '/Artists', icon: 'user' },
          { name: 'Albums', path: '/Albums', icon: 'disc' },
          { name: 'Folders', path: '/Folders', icon: 'folder-simple' }
      ]
    };
  },
  computed: {
    currentTab() {
      return this.$store.state.UIController.UIProperties.currentMainTab;
    },
    defaultTab() {
      return this.$store.state.SettingsManager.settings.defaultTab;
    }
  },
  methods: {
    ...mapMutations(['deSelectGroup', 'clearSelectedTracks', 'UIcontrollerSetPropertyValue']),
    routeTo(tab) {
      this.clearSelectedTracks();
      this.deSelectGroup();
      if (tab.path !== this.$route.path) this.$router.push(tab.path);
      this.UIcontrollerSetPropertyValue({ property: 'currentMainTab', newValue: tab.name });
    }
  },
  mounted() {
    ipcRenderer.on('userSettings', (e, payload) => {
      setTimeout(() => {
        const defaultTabIndex = this.tabs.findIndex(tab => tab.name === this.defaultTab);
        this.routeTo(this.tabs[defaultTabIndex]);
      }, 100);
    });
  }
};
</script>

<style lang="scss">
.Tabswitcher {
  display: flex;
  gap: 10px;
  justify-content: center;
  position: relative;
  z-index: 10;
  margin-bottom: 10px;
  margin-top: 10px;
  .tabBtn {
    text-align: center;
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    color: white;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    transition: 0.4s ease border-radius;
    p {
      font-size: 0.9rem;
      font-family: inherit;
    }
    &:hover {
      background: rgba(255, 255, 255, 0.062);
    }
  }
  .activeTab {
    background: var(--accentColor) !important;
    // border-radius: 20px;
    // padding-left: 5px;
    // padding-right: 5px;
    // p {
    //   width: 0px;
    //   margin-left: -5px;
    //   opacity: 0;
    // }
  }
  .activeTab:hover {
    background: var(--accentColor);
  }
}
// @media (max-width: 700px) {
//   .Tabswitcher {
//     display: none;
//   }
// }
</style>
