import { sendMessageToNode } from '@/renderer/utils';
import { FolderInfoType, SettingsType } from '@/types';

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
    scannedFolders: []
  }
};
const mutations = {
  setSettingValue(state: any, payload: SettingPayloadType) {
    state.settings[payload.property] = payload.newValue;
    sendMessageToNode('updateSettings', state.settings);
  },
  restoreSettings(state: any, payload: SettingsType) {
    state.settings = payload;
  },
  setScannedFolders(state: any, payload: Array<FolderInfoType>) {
    state.settings.scannedFolders = payload;
  }
};

export default {
  state,
  mutations
};
