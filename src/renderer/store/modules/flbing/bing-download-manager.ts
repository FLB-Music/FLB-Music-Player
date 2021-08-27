import { TrackType } from '@/types';
import {
  BingDownloadManagerState,
  BingPendingTrack,
  BingTrackDownloadProgress,
  BingTrackStatePayload,
  BingTrackURLPayload
} from '@/types/FLBing/BingTypes';
import { states } from './track-state';

const state: BingDownloadManagerState = {
  pendingDownloads: [],
  completedDownloads: []
};
const mutations = {
  addTrackToPendingDownloads(
    state: BingDownloadManagerState,
    payload: BingPendingTrack
  ) {
    payload.state = states[0];
    state.pendingDownloads.push(payload);
  },
  removeTrackFromPendingDownloads(
    state: BingDownloadManagerState,
    payload: number
  ) {
    state.pendingDownloads.filter(track => track.id !== payload);
  },
  setTrackDownloadURL(
    state: BingDownloadManagerState,
    payload: BingTrackURLPayload
  ) {
    const indexOfTrack = state.pendingDownloads.findIndex(
      track => track.id === payload.id
    );
    state.pendingDownloads[indexOfTrack].downloadURL = payload.url;
    state.pendingDownloads[indexOfTrack].state = states[3];
  },
  updateTrackDownloadProgress(
    state: BingDownloadManagerState,
    payload: BingTrackDownloadProgress
  ) {
    if (payload.progressInfo.progress > 100) return;
    const indexOfTrack = state.pendingDownloads.findIndex(
      track => track.id === payload.id
    );
    state.pendingDownloads[indexOfTrack].progressInfo = payload.progressInfo;
    if (payload.progressInfo.progress === 100) {
      state.pendingDownloads.splice(indexOfTrack, 1);
    }
  },
  updatePendingTrackState(
    state: BingDownloadManagerState,
    payload: BingTrackStatePayload
  ) {
    console.log(payload);
    const indexOfTrack = state.pendingDownloads.findIndex(
      track => track.id === payload.id
    );
    if (indexOfTrack === -1) return
    state.pendingDownloads[indexOfTrack].state = states[payload.stateCode];
  },
  addToCompletedDownloads(state: BingDownloadManagerState, payload: TrackType) {
    state.completedDownloads.unshift(payload);
  }
};

export default {
  state,
  mutations
};
