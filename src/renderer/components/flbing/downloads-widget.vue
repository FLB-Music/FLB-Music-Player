<template>
  <div
    :class="[
      showWidget ? 'showDownloadWidget' : '',
      'BingDownloadsWidget',
      'bg2'
    ]"
  >
    <div class="content_wrapper">
      <h3>Downloads</h3>
      <div class="tab_switcher bg1">
        <div
          :class="[tab === 'Pending' ? 'activeSwitcher' : '', 'switcher']"
          @click="tab = 'Pending'"
        >
          Pending
        </div>
        <div
          :class="[tab === 'Completed' ? 'activeSwitcher' : '', 'switcher']"
          @click="tab = 'Completed'"
        >
          Completed
        </div>
      </div>
      <div class="tab_content">
        <div v-if="tab === 'Pending'" class="pending_tracks tracks_wrapper">
          <bing-pending-track
            v-for="track in downloadQueue"
            :key="track.id"
            :track-info="track"
          />
        </div>
        <div v-if="tab !== 'Pending'" class="tracks_wrapper downloadedTracks">
          <bing-completed-track
            v-for="track in flbingFolderTracks"
            :key="track.fileLocation"
            :track="track"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DownloadsWidget',

  data() {
    return {
      tab: 'Pending',
      showWidget: false
    };
  },
  computed: {
    downloadQueue() {
      return this.$store.state.BingDownloadManager.pendingDownloads;
    },
    completedTracks() {
      return this.$store.state.BingDownloadManager.completedDownloads;
    },
    flbingFolderTracks() {
      return this.$store.state.TabsManager.tabsData.addedTracks
        .filter(track => track.folderInfo?.name === 'FLBing')
        .slice(0, 20);
    }
  },
  mounted() {}
};
</script>

<style lang="scss">
.playingPaneLoaded {
  .BingDownloadsWidget {
    height: 98%;
    border-radius: 15px;
    margin-right: 10px;
    margin-top: 10px;
  }
}
.widgetVisible {
  .BingDownloadsWidget {
    width: 370px !important;
  }
}
.BingDownloadsWidget {
  height: 100%;
  transform: translateY(-10px) translateX(10px);
  width: 0px;
  position: relative;
  overflow: hidden;
  .tab_content {
    margin: 0px 10px;
    border-radius: 15px;
    border-top-left-radius: 0px;
    overflow: hidden;
    overflow-y: scroll;
    height: 100%;
    width: 94%;
  }
  .content_wrapper {
    width: 280px;
    height: 100%;
  }
  h3 {
    text-align: center;
    font-size: 1.3rem;
    padding: 8px;
  }
  .tab_switcher {
    width: 92%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0px 10px;
    border-radius: 15px;
    overflow: hidden;
    .switcher {
      width: 100%;
      padding: 8px 12px;
      text-align: center;
      cursor: pointer;
      &:hover {
        background: rgba(255, 255, 255, 0.055);
      }
    }
    .activeSwitcher {
      background: var(--accentColor);
      pointer-events: none;
    }
  }

  .tracks_wrapper {
    overflow: hidden;
    overflow-y: scroll;
    width: 100%;
    height: 86%;
  }
  .downloadedTracks {
    gap: 5px;
    padding-left: 10px;
  }
  .pending_tracks {
    padding-left: 10px;
  }
}
.showDownloadWidget {
  height: 0%;
  transform: translateX(0%);
}
.widgetToggleBt {
  position: fixed;
  bottom: -12.5%;
  right: 5%;
  transform: translate(-40%, -50%);
  height: 40px;
  width: 40px;
  background: var(--accentColor);
  //   box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.377);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  &:hover {
    filter: brightness(90%);
  }
  img {
    width: 50%;
  }
}
</style>
