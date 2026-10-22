"use strict";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  protocol,
  screen,
  shell,
} from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import fs from "fs";
import path from "path";
import { autoUpdater } from "electron-updater";
import NodeID3 from "node-id3";
import { paths } from "./main/modules/Paths";
import { PlaylistsTracker } from "./main/modules/PlaylistTracker";
import { FilesTracker } from "./main/modules/FilesTracker";
import { PlaybackStats } from "./main/modules/PlaybackStats";
import { Settings } from "./main/modules/Settings";
import { createParsedTrack } from "./main/core/createParsedTrack";
import {
  deleteFile,
  downloadFile,
  sendMessageToRenderer,
  sendNativeNotification,
  writeJsonFile,
} from "./main/utils";
import {
  SettingsType,
  TagChangesType,
  TrackType,
  UpdateDataPayload,
} from "@/types";
import { downloadArtistPicture } from "./main/services";
import { SUPPORTED_FORMATS } from "./main/utils/constants";
import { UsageManager } from "./main/modules/UsageStatistics";
import parseFolder from "./main/core/parseFolder";
import { sendNotificationToRenderer } from "./main/reusables/messageToRenderer";
import { initializeApp, resetApp } from "./main/core/utils";
import {
  getCoverArtFileName,
  isCoverArtUsable,
} from "./main/core/coverArt";
import { findSiblingCoverArt } from "./main/core/siblingCover";
import { fetchOnlineCoverArt } from "./main/core/onlineCover";
 
console.log(paths.appFolder);

dialog.showErrorBox = function (title, content) {
  sendMessageToRenderer(`dangerMsg`, `⚠Error⚠ 👉${title} ${content}`);
  console.log(`An Error Occurred ⚠`);
  console.log(`${title}\n ${content}`);
};

let appIsFocused = true;
export const fileTracker = new FilesTracker();
const playlistsTracker = new PlaylistsTracker();
const playbackStats = new PlaybackStats();
const settings = new Settings();
const usageTracker = new UsageManager();

console.log(paths.appFolder);
console.log(__dirname);

const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);
// Globally accessible window object

export let win: BrowserWindow;
async function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  // Create the browser window.
  win = new BrowserWindow({
    width,
    height,
    frame: false,
    darkTheme: true,
    webPreferences: {
      // Required for Spectron testing
      webSecurity: false,
      enableRemoteModule: true,
      webviewTag: true,
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: true,
      contextIsolation: false,
      webgl: false,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
  } else {
    createProtocol("app");
    win.loadURL("app://./index.html");
    //  Load the index.html when not in development
  }

  win.on("blur", () => {
    appIsFocused = false;
  });
  win.on("focus", () => {
    appIsFocused = true;
  });
  win.on("close", () => {
    // do some stuff
  });
 
  win.webContents.on("new-window", function (e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });
  autoUpdater.on("checking-for-update", () => {
    sendNotificationToRenderer("notification.checkingForUpdate");
  });
  autoUpdater.on("update-available", () => {
    sendNotificationToRenderer("notification.updateAvailable");
    setTimeout(() => {
      sendNotificationToRenderer("Downloading available.");
    }, 1000);
  });
  autoUpdater.on("update-not-available", () => {
    sendNotificationToRenderer("notification.noUpdate");
  });
  autoUpdater.on("error", (err) => {
    sendNotificationToRenderer("notification.updateError", "", "warning");
  });
  autoUpdater.on("update-downloaded", () => {
    sendNotificationToRenderer("notification.updateDownloaded");
  });
  autoUpdater.on("download-progress", () => {
    win.webContents.send("downloadingUpdate", "");
  });
  autoUpdater.checkForUpdatesAndNotify();
}
if (process.platform === "win32") {
  app.setAppUserModelId(app.getName());
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//
let devtools = null;

app.on("ready", async () => {
  createWindow();
  protocol.registerFileProtocol("file", (request, callback) => {
    const pathname = decodeURI(request.url.replace("file:///", ""));
    callback(pathname);
  });
  if (isDevelopment) {
    devtools = new BrowserWindow();
    win.webContents.setDevToolsWebContents(devtools.webContents);

    console.log("Opening openDevTools");
    win.webContents.openDevTools({ mode: "detach" });
  }
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
ipcMain.on("initializeSettings", () => {
  win.webContents.send("userSettings", settings.getSettings);
});
ipcMain.on("getFirstTracks", async () => {
  const tracks = await getParsedTracks(settings.getSettings.foldersToScan);
  fileTracker.addMultipleTracks(tracks);
  sendMessageToRenderer("addMultipleTracks", tracks);
  fileTracker.saveChanges();
});
ipcMain.on("initializeApp", () => {
  initializeApp(fileTracker, playlistsTracker, playbackStats);
});

ipcMain.on("resetApp", () => {
  resetApp();
});

ipcMain.on("updatePlaylists", (e, payload) => {
  playlistsTracker.updatePlaylists(payload);
});

ipcMain.on("addScanFolder", () => {
  dialog
    .showOpenDialog(win, { properties: ["openDirectory"] })
    .then(async (data) => {
      if (!data.canceled) {
        const isAdded = settings.addFolderToScan(data.filePaths[0]);
        if (isAdded) {
          win.webContents.send("userSettings", settings.getSettings);
          const tracks = await getParsedTracks([data.filePaths[0]]);
          sendMessageToRenderer("addMultipleTracks", tracks);
          fileTracker.saveChanges();
        } else {
          sendNotificationToRenderer("notification.folderAlreadyAdded");
        }
      }
    });
});

ipcMain.on("removeFromScannedFolders", (e, payload: UpdateDataPayload) => {
  console.log(payload);
  payload.path = payload.path.replace(/\\/g, "\\\\");
  settings.removeFromScannedFolders(payload);
    writeJsonFile(paths.filesTrackerLocation, payload.updatedData.tracks);
    writeJsonFile(paths.playlistsLocation, payload.updatedData.playlists);
    playbackStats.playedFiles = playbackStats.playedFiles.filter(file=>file.folderInfo.path != payload.path)
    playbackStats.saveChanges()
  win.webContents.send("userSettings", settings.getSettings);
});
ipcMain.on("refresh", async () => {
  sendNotificationToRenderer("notification.refreshing", "", "success");
  const tracks = await getParsedTracks(settings.getSettings.foldersToScan);
  fileTracker.addMultipleTracks(tracks);
  sendMessageToRenderer("addMultipleTracks", tracks);
  fileTracker.saveChanges();
});

/**
 * Re extracts the cover art of every track that has no usable cover
 * (missing file, wrong format, ...). Useful after upgrading the app or
 * after clearing the album art folder.
 */
ipcMain.on("repairCovers", async () => {
  sendNotificationToRenderer("notification.repairingCovers", "", "normal");
  const allTracks = fileTracker.getTracks;
  const tracksToRepair = allTracks.filter(
    (track) => !isCoverArtUsable(track.albumArt)
  );
  const repairedTracks: TrackType[] = [];

  // 1. Extract the embedded cover art again
  for (const [index, track] of tracksToRepair.entries()) {
    sendNotificationToRenderer(
      "notification.repairingCovers",
      `${index + 1}/${tracksToRepair.length}`,
      "normal",
      true
    );
    if (!fs.existsSync(track.fileLocation)) continue;
    try {
      const repairedTrack = await createParsedTrack(track.fileLocation);
      if (!repairedTrack.albumArt) continue;
      repairedTrack.dateAdded = track.dateAdded;
      fileTracker.updateFile(repairedTrack, false);
      repairedTracks.push(repairedTrack);
    } catch (error) {
      console.log("Could not repair the cover of", track.fileLocation);
      console.log(error);
    }
  }

  // 2. Use the cover of another track of the same album
  const stillMissing = fileTracker.getTracks.filter(
    (track) => !isCoverArtUsable(track.albumArt)
  );
  for (const track of stillMissing) {
    const siblingCover = findSiblingCoverArt(track, fileTracker.getTracks);
    if (!siblingCover) continue;
    track.albumArt = siblingCover;
    fileTracker.updateFile(track, false);
    repairedTracks.push(track);
  }

  // 3. Look the cover art up online
  const withoutCover = fileTracker.getTracks.filter(
    (track) => !isCoverArtUsable(track.albumArt)
  );
  for (const [index, track] of withoutCover.entries()) {
    sendNotificationToRenderer(
      "notification.searchingCovers",
      `${index + 1}/${withoutCover.length}`,
      "normal",
      true
    );
    try {
      const onlineCover = await fetchOnlineCoverArt(track);
      if (!onlineCover) continue;
      track.albumArt = onlineCover;
      fileTracker.updateFile(track, false);
      repairedTracks.push(track);
    } catch (error) {
      console.log("Could not fetch the cover of", track.fileLocation);
    }
  }

  sendMessageToRenderer("closeNotification", "notification.repairingCovers");
  await fileTracker.saveChanges();
  win.webContents.send("coversRepaired", repairedTracks);
  sendNotificationToRenderer(
    "notification.coversRepaired",
    "notification.coversRepairedCount",
    "success",
    false,
    { count: repairedTracks.length }
  );
});

ipcMain.on("playingTrack", async (e, track: TrackType) => {
  playbackStats.addFile(track);
  if (!appIsFocused && settings.getSettings.desktopNotifications) {
    sendNativeNotification(
      track.defaultTitle,
      track.defaultArtist,
      track.albumArt
    );
  }
  // win.webContents.send("mostPlayedArtists", playbackStats.mostPlayedTracks);
});

ipcMain.on("processDroppedFiles", async (e, droppedFiles: string[]) => {
  sendNotificationToRenderer(`Processing Dropped Stuff: ${droppedFiles}`);
  // // User dropped an array of folders
  if (fs.lstatSync(droppedFiles[0]).isDirectory()) {
    console.log("User dropped folder(s)");
    const tracks = await getParsedTracks([droppedFiles[0]]);
    fileTracker.addMultipleTracks(tracks);
    sendMessageToRenderer("addMultipleTracks", tracks);
  } else {
    // User dropped an array of files
    console.log("User dropped file(s)");
    for (const file of droppedFiles) {
      const fileType = path.parse(file).ext;
      if (SUPPORTED_FORMATS.includes(fileType)) {
        const newTrack = await createParsedTrack(file);
        fileTracker.addFile(newTrack);
        win.webContents.send("newTrack", newTrack);
      }
    }
    fileTracker.saveChanges();
    win.webContents.send("playNow");
  }
});
ipcMain.on("updateSettings", async (e, payload: SettingsType) => {
  settings.updateSettings(payload);
});

ipcMain.on("updateTags", async (e, payload) => {
  win.webContents.send("removeSelectedTracks", "");
  console.log("---------Payload----------");
  console.log(payload);
  console.log("---------Payload----------");
  const isSuccess = await writeTags(
    payload.track.fileLocation,
    payload.tagChanges
  );
  if (isSuccess) {
    const updatedTrack = await createParsedTrack(payload.track.fileLocation);
    win.webContents.send("updatedTrack", updatedTrack);
    fileTracker.updateFile(updatedTrack);
    console.log("Updated Track 👇");
    console.log(updatedTrack);
  }
});
ipcMain.on("requestVersion", () =>
  win.webContents.send("appVersion", app.getVersion())
);
ipcMain.on("deleteFiles", async (e, payload: Array<TrackType>) => {
  win.webContents.send("removeSelectedTracks", "");
  payload.forEach((track) => {
    deleteFile(track.fileLocation, false);
  });
  console.log("Delete Done");
});

ipcMain.on("minimize", () => win.minimize());
ipcMain.on("maximize", () => {
  if (win.isMaximized()) {
    win.unmaximize();
    win.center();
  } else {
    win.maximize();
  }
});
ipcMain.on("closeWindow", async () => {
  await fileTracker.saveChanges();
  app.quit();
});

ipcMain.on("downloadArtistPicture", (e, payload) => {
  console.log("Downloading artist pic...");
  downloadArtistPicture(payload);
});

ipcMain.on("imageSearcherChoice", (e, sourceURL) => {
  sendMessageToRenderer("urlImage", sourceURL);
});

ipcMain.on("importCoverArt", async () => {
  const file = dialog.showOpenDialog({
    title: "Select Picture",
    filters: [
      {
        name: "Picture (.jpg, .png, .jpeg)",
        extensions: ["jpg", "png", "jpeg"],
      },
    ],
    properties: ["openFile"],
  });
  if (file) {
    for (const possibleCover of (await file).filePaths) {
      if (possibleCover.match(/\.jpeg|\.jpg|\.png/gi)) {
        win.webContents.send("importedCoverArt", possibleCover);
      }
    }
  } else {
    return;
  }
});

ipcMain.on("sendUsageStats", () => {
  usageTracker.sendUsageData();
  sendMessageToRenderer("userID", usageTracker.getUsageData.id);
});

ipcMain.on("checkForUpdate", () => {
  sendNotificationToRenderer("notification.checkingForUpdate");
  checkForUpdates();
});

ipcMain.on("toggleMiniMode", (e, payload) => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  console.log("MiniMode " + payload);
  if (payload) {
    win.unmaximize();
    win.setSize(240, 300);
    win.setPosition(width - 250, height - 300, true);
    win.setAlwaysOnTop(true);
  } else {
    win.maximize();
    win.setAlwaysOnTop(false);
  }
});

ipcMain.handle("getPlaybackStats", () => playbackStats.getPlayStats);

async function getParsedTracks(folders: string[] = []) {
  let allTracks: string[] = [];
  const allParsedTracks: TrackType[] = [];
  for (const folder of folders) {
    const tracks = parseFolder(folder);
    allTracks = [...allTracks, ...tracks];
  }
  const alreadyParsed = new Set(
    fileTracker.getTracks.map((track) => track.fileLocation)
  );
  for (const [index, track] of allTracks.entries()) {
    sendNotificationToRenderer(
      "notification.loadingSongs",
      `${index + 1}/${allTracks.length}`,
      "normal",
      true
    );
    if (!alreadyParsed.has(track)) {
      const parsedTrack = await createParsedTrack(track);
      allParsedTracks.push(parsedTrack);
    }
  }
  sendMessageToRenderer("closeNotification", "notification.loadingSongs");
  // Tracks without an embedded picture borrow the cover of another track
  // of the same album
  for (const track of allParsedTracks) {
    if (track.albumArt) continue;
    const siblingCover = findSiblingCoverArt(track, allParsedTracks);
    if (siblingCover) {
      track.albumArt = siblingCover;
    }
  }
  console.log(allParsedTracks.length + " tracks parsed");
  return allParsedTracks;
}

export async function writeTags(
  filePath: string,
  tagChanges: TagChangesType,
  silent = false
) {
  if (tagChanges.APIC && tagChanges.APIC.includes("http")) {
    console.log("downloading file");
    try {
      tagChanges.APIC = await downloadFile(
        tagChanges.APIC,
        paths.albumArtFolder,
        getCoverArtFileName(filePath, "jpeg")
      );
      sendNotificationToRenderer("Downloading Picture");
    } catch (error) {
      sendNotificationToRenderer("Error downloading Picture", "", "warning");
      console.log("errorobject");
      console.log(error);
    }
    console.log("Done downloading file");
    tagChanges.APIC = decodeURI(tagChanges.APIC);
  }
  const isSuccessFull = NodeID3.update(tagChanges, filePath);
  console.log(isSuccessFull);
  if (isSuccessFull && !silent) {
    sendNotificationToRenderer("Tags Successfully changed", "", "success");
  } else {
    sendMessageToRenderer("errorMsg", "An Error occurred while changing tags");
  }
  return isSuccessFull;
}

function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify().then((res) => {
    console.log(res);
  });
}
