import { SettingsType, UpdateDataPayload } from "@/types";
import fs from "fs";
import { writeJsonFile } from "../utils";
import { paths } from "./Paths";

export class Settings {
  settings: SettingsType = {
    includeVideo: false,
    desktopNotifications: true,
    defaultTab: "Home",
    theme: "fancy",
    accentColor: "accent_0",
    dynamicAccentColor: false,
    volume: 1,
    volumeBoost: false,
    foldersToScan: [paths.musicFolder],
    enableEqualizer: false,
    language: "en",
  };
  constructor() {
    if (fs.existsSync(paths.settingsLocation)) {
      try {
        const data = JSON.parse(
          fs.readFileSync(paths.settingsLocation, "utf-8")
        );
        // the settings of an older version do not have every option, the
        // missing ones keep their default value
        this.settings = { ...this.settings, ...data };
      } catch (error) {
        console.log("An error occurred while reading the settings file");
      }
    }
  }
  updateSettings(payload: SettingsType) {
    this.settings = payload;
    this.saveSettings();
  }
  addFolderToScan(folderPath: string) {
    if (this.settings.foldersToScan.indexOf(folderPath) != -1) return false;
    this.settings.foldersToScan.push(folderPath);
    this.saveSettings();
    return true;
  }
  removeFromScannedFolders(payload: UpdateDataPayload) {
    this.settings.foldersToScan.forEach((folder, index) => {
      if (
        folder.replace(/(.*)[/\\]/, "") ===
        payload.path.replace(/(.*)[/\\]/, "")
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
