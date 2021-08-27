import { UIcontrollerPropertiesType } from '@/types';

interface PropertyPayload {
  property: string | number;
  newValue: any;
}
interface UIControllerStateInterface {
  UIProperties: {
    showSettings: boolean;
    showTagEditor: boolean;
    showPlaylistWidget: boolean;
    showEqualizerWidget: boolean;
    showImageSearcher: boolean;
    showFeedbackWidget: boolean;
    miniMode: boolean;
    currentPage: 'My Music' | 'Deezer' | 'Spotify' | 'Podcasts' | 'FLBing';
    currentMainTab:
      | 'Tracks'
      | 'Recents'
      | 'Playlists'
      | 'Home'
      | 'Albums'
      | 'Artists';
    currentSidePaneTab: 'Info' | 'Lyrics' | 'Queue';
    currentPodcastsTab: 'Discover' | 'Subscriptions' | 'Downloads';
    multiSelectMode: boolean;
  };
}
const state: UIControllerStateInterface = {
  UIProperties: {
    showSettings: false,
    showTagEditor: false,
    showPlaylistWidget: false,
    showEqualizerWidget: false,
    showImageSearcher: false,
    showFeedbackWidget: false,
    miniMode: false,
    currentPage: 'My Music',
    currentMainTab: 'Home',
    currentSidePaneTab: 'Info',
    currentPodcastsTab: 'Discover',
    multiSelectMode: false
  }
};
const mutations = {
  UIcontrollerToggleProperty: (
    state: UIControllerStateInterface,
    property: UIcontrollerPropertiesType
  ) => {
    state.UIProperties[property] = !state.UIProperties[property];
  },
  UIcontrollerSetPropertyValue: (state: any, payload: PropertyPayload) => {
    state.UIProperties[payload.property] = payload.newValue;
  }
};

export default {
  state,
  mutations
};
