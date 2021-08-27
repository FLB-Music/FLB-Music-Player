import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import NotificationManager from './modules/local-music/notification-manager';
import PlaybackManger from './modules/local-music/playback-manger';
import SearchManager from './modules/local-music/search-manager';
import SettingsManager from './modules/local-music/settings-manager';
import StatsManager from './modules/local-music/stats-manager';
import TabsManager from './modules/local-music/tabs-manager';
import TrackSelector from './modules/local-music/track-selector';
import UIController from './modules/local-music/uicontroller';
import EqualizerManager from './modules/local-music/equalizer-manager';
import BingDownloadManager from './modules/flbing/bing-download-manager';

import { TrackType } from '@/types';
import { sortArrayOfObjects } from '@/shared-utils';

Vue.use(Vuex);

const store: StoreOptions<any> = {
  state: {
    appIsOnline: false
  },
  mutations: {
    seIstOnlineState (state: any, payload: boolean) {
      state.appIsOnline = payload;
    }
  },
  actions: {
    sortTracks ({ state }, payload: string) {
      sortArrayOfObjects(TabsManager.state.tabsData.addedTracks, payload);
      console.log(state);
    },
    toggleSortMode () {
      TabsManager.state.tabsData.addedTracks.reverse();
    },
    removeSelectedTracksFromAppState ({ state }) {
      TrackSelector.state.selectedTracks.forEach((selectedTrack: TrackType) => {
        state.tabsData.addedTracks.filter(
          (track: TrackType) => track.fileLocation === selectedTrack.fileLocation
        );
        state.tabsData.recentTracks.filter(
          (track: TrackType) => track.fileLocation === selectedTrack.fileLocation
        );
      });
      TrackSelector.state.selectedTracks = [];
    }
  },
  modules: {
    NotificationManager,
    PlaybackManger,
    SearchManager,
    SettingsManager,
    StatsManager,
    TabsManager,
    TrackSelector,
    EqualizerManager,
    UIController,
    BingDownloadManager
  }
};

// eslint-disable-next-line import/no-named-as-default-member
export default new Vuex.Store(store);
