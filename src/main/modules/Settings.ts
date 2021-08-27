import { SettingsType } from '@/types';
import fs from 'fs';
import { paths } from './Paths';

export class Settings {
  settings: SettingsType = {
    includeVideo: false,
    desktopNotifications: true,
    defaultTab: 'Home',
    theme: 'fancy',
    accentColor: 'accent_0',
    dynamicAccentColor: false,
    volume: 1,
    foldersToScan: [paths.musicFolder]
  };
  constructor() {
    if (fs.existsSync(paths.settingsLocation)) {
      try {
        const data = JSON.parse(
          fs.readFileSync(paths.settingsLocation, 'utf-8')
        );
        this.settings = data;
      } catch (error) {
        console.log('An error occurred while reading the settings file');
      }
    }
  }
  updateSettings(payload: SettingsType) {
    this.settings = payload;
    this.saveSettings();
  }
  addFolderToScan(folderPath: string) {
    this.settings.foldersToScan.push(folderPath);
    this.saveSettings();
  }
  removeFromScannedFolders(folderPath: string) {
    this.settings.foldersToScan.forEach((folder, index) => {
      if (
        folder.replace(/(.*)[/\\]/, '') === folderPath.replace(/(.*)[/\\]/, '')
      ) {
        this.settings.foldersToScan.splice(index, 1);
        return;
      }
    });
    this.saveSettings();
  }
  saveSettings() {
    fs.writeFile(
      paths.settingsLocation,
      JSON.stringify(this.settings),
      (err: any) => {
        if (err) console.log(err);
      }
    );
  }

  public get getSettings(): SettingsType {
    return this.settings;
  }
}
