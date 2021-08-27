import { NotificationType } from '@/types';

const state = {
  notifications: []
};
const mutations = {
  pushNotification (state: any, payload: NotificationType) {
    state.notifications.unshift(payload);
  },
  popNotification (state: any) {
    state.notifications.pop();
  }
};

export default {
  state,
  mutations
};
