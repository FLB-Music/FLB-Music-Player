import { TrackStatType } from '@/types';

const state = {
  stats: {
    playStats: []
  }
};
const mutations = {
  setPlayStats (state: any, payload: TrackStatType[]) {
    state.stats.playStats = payload;
  }
};

export default {
  state,
  mutations
};
