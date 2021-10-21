import { NotificationType } from '@/types';

interface NotificationState {
  notifications: NotificationType[]
}

const state: NotificationState = {
  notifications: []
};
const mutations = {
  pushNotification (state: NotificationState, payload: NotificationType) {
    if (payload.isPersistent) {
      const targetNotificationIndex = state.notifications.findIndex(notification => notification.title === payload.title);
      if (targetNotificationIndex === -1) {
        state.notifications.unshift(payload);
      } else {
        state.notifications[targetNotificationIndex].subTitle = payload.subTitle;
      }

    } else {
      state.notifications.unshift(payload);
    }
  },
  popNotification (state: NotificationState) {
    state.notifications.pop();
  },
  removeNotification (state: NotificationState, payload: string) {
    const targetNotificationIndex = state.notifications.findIndex(notification => notification.title === payload);
    if (targetNotificationIndex !== -1) {
      state.notifications.splice(targetNotificationIndex, 1);
    }
  }
};

export default {
  state,
  mutations
};
