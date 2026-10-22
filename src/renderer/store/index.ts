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
    appIsOnline: false,
    sortParameter: 'dateAdded',
    flipSortOrder: false
  },
  mutations: {
    seIstOnlineState (state: any, payload: boolean) {
      state.appIsOnline = payload;
    },
    changeSortParameter (state: any, payload) {
      state.sortParameter = payload;
    },
    reverseSortOrder (state: any) {
      state.flipSortOrder = !state.flipSortOrder;
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
      const selectedLocations = TrackSelector.state.selectedTracks.map(
        (selectedTrack: TrackType) => selectedTrack.fileLocation
      );
      const { tabsData } = TabsManager.state;
      tabsData.addedTracks = tabsData.addedTracks.filter(
        (track: TrackType) => !selectedLocations.includes(track.fileLocation)
      );
      tabsData.recentlyPlayedTracks = tabsData.recentlyPlayedTracks.filter(
        (track: TrackType) => !selectedLocations.includes(track.fileLocation)
      );
      tabsData.playlists.forEach((playlist) => {
        playlist.tracks = playlist.tracks.filter(
          (track: TrackType) => !selectedLocations.includes(track.fileLocation)
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
