import os from 'os';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
const APP_DATA_FOLDER = app.getPath('userData');
const ALBUM_ART_FOLDER = path.join(APP_DATA_FOLDER, 'Album Art');
const ARTIST_PICTURE_FOLDER = path.join(APP_DATA_FOLDER, 'Artist Pictures');
const MUSIC_FOLDER = path.join(os.homedir(), 'Music');
const FLBING_FOLDER = path.join(MUSIC_FOLDER, 'FLBing');
try {

  if (!fs.existsSync(ALBUM_ART_FOLDER)) {
    fs.mkdirSync(ALBUM_ART_FOLDER);
  }
  if (!fs.existsSync(ARTIST_PICTURE_FOLDER)) {
    fs.mkdirSync(ARTIST_PICTURE_FOLDER);
  }
} catch (error) {
  console.log("Error Creating Folders");
  console.log(error);
}

export const paths = {
  appFolder: APP_DATA_FOLDER,
  albumArtFolder: ALBUM_ART_FOLDER,
  artistPictureFolder: ARTIST_PICTURE_FOLDER,
  musicFolder: MUSIC_FOLDER,
  flbingFolder: FLBING_FOLDER,
  filesTrackerLocation: path.join(APP_DATA_FOLDER, 'processedFiles.json'),
  playlistsLocation: path.join(APP_DATA_FOLDER, 'Playlists.json'),
  playbackStatsLocation: path.join(APP_DATA_FOLDER, 'PlaybackStats.json'),
  settingsLocation: path.join(APP_DATA_FOLDER, 'Settings.json'),
  usageData: path.join(APP_DATA_FOLDER, 'UsageData.json'),
};
