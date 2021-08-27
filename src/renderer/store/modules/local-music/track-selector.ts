import {
  AlbumType,
  ArtistType,
  FolderParsedType,
  PlaylistType,
  TrackType
} from '@/types';

interface TrackSelectorStateInterface {
  selectedTracks: TrackType[];
  selectedGroup: ArtistType | AlbumType | PlaylistType | null;
}
const state: TrackSelectorStateInterface = {
  selectedTracks: [],
  selectedGroup: null
};
const mutations = {
  addToSelectedTracks: (state: any, payload: TrackType) => {
    const index = state.selectedTracks.findIndex(
      (track: TrackType) => track.fileLocation === payload.fileLocation
    );
    if (index > -1) {
      state.selectedTracks.splice(index, 1);
    } else {
      state.selectedTracks.unshift(payload);
    }
  },
  clearSelectedTracks: (state: any) => {
    state.selectedTracks = [];
  },
  selectGroup: (
    state: any,
    payload: ArtistType | AlbumType | FolderParsedType
  ) => {
    state.selectedGroup = payload;
  },
  deSelectGroup (state: any) {
    state.selectedGroup = null;
  }
};

export default {
  state,
  mutations
};
