import { NotificationType } from '@/types';
import { translate, LanguageType } from '@/renderer/i18n';
import { currentLanguage } from './settings-manager';

interface NotificationState {
  notifications: NotificationType[]
}

const state: NotificationState = {
  notifications: []
};
const mutations = {
  pushNotification (state: NotificationState, payload: NotificationType) {
    // the main process sends the translation keys of the notifications
    const language = currentLanguage.value as LanguageType;
    const title = translate(language, payload.title);
    const subTitle = payload.subTitle
      ? translate(language, payload.subTitle, payload.values || {})
      : payload.subTitle;
    const notification = { ...payload, title, subTitle };

    if (payload.isPersistent) {
      const targetNotificationIndex = state.notifications.findIndex(notification => notification.title === title);
      if (targetNotificationIndex === -1) {
        state.notifications.unshift(notification);
      } else {
        state.notifications[targetNotificationIndex].subTitle = subTitle;
      }

    } else {
      state.notifications.unshift(notification);
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
