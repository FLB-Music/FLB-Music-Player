import { sendMessageToNode } from '@/renderer/utils';
import { FolderInfoType, SettingsType } from '@/types';
import { LanguageType } from '@/renderer/i18n';
import Vue from 'vue';

/**
 * The language of the app. It lives in its own reactive object because the
 * settings object is replaced when the settings are restored, the components
 * that show a translated text would not be updated otherwise.
 */
export const currentLanguage = Vue.observable({ value: 'en' as LanguageType });

interface SettingPayloadType {
  property: string;
  newValue: any;
}
const state = {
  settings: {
    includeVideo: false,
    desktopNotifications: true,
    videoSupport: false,
    defaultTab: 'Tracks',
    theme: 'Fancy',
    accentColor: 'accent_blue',
    dynamicAccentColor: false,
    volume: 1,
    volumeBoost: false,
    scannedFolders: [],
    enableEqualizer: false,
    language: 'en',
  }
};
const mutations = {
  setSettingValue (state: any, payload: SettingPayloadType) {
    // Vue.set is needed for the settings that were not part of the file yet
    Vue.set(state.settings, payload.property, payload.newValue);
    if (payload.property === 'language') {
      currentLanguage.value = payload.newValue;
    }
    sendMessageToNode('updateSettings', state.settings);
  },
  restoreSettings (state: any, payload: SettingsType) {
    // the settings of an older version do not have every option, the missing
    // ones keep their default value
    state.settings = { ...state.settings, ...payload };
    currentLanguage.value = state.settings.language || 'en';
  },
  setScannedFolders (state: any, payload: Array<FolderInfoType>) {
    Vue.set(state.settings, 'scannedFolders', payload);
  }
};

export default {
  state,
  mutations
};
