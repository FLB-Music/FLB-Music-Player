import { win } from "@/background";
import path from 'path';
import { TrackType } from "@/types";
import { FilesTracker } from "../modules/FilesTracker";
import { PlaybackStats } from "../modules/PlaybackStats";
import { PlaylistsTracker } from "../modules/PlaylistTracker";
import { sendNotificationToRenderer } from "../reusables/messageToRenderer";
import { deleteFile, isValidFileType, sendMessageToRenderer } from "../utils";
import { createParsedTrack } from "./createParsedTrack";
import parseFolder from "./parseFolder";
import { app } from "electron";
import { paths } from "../modules/Paths";

async function getParsedTracks(folders: string[] = []) {

    let allTracks: string[] = [];
    const allParsedTracks: TrackType[] = [];
    for (const folder of folders) {
        const tracks = parseFolder(folder);
        allTracks = [...allTracks, ...tracks]
    }
    for (const [index, track] of allTracks.entries()) {
        sendNotificationToRenderer("Loading songs", `${index + 1}/${allTracks.length}`, 'normal', true)
        const parsedTrack = await createParsedTrack(track)
        allParsedTracks.push(parsedTrack)
    }
    sendMessageToRenderer("closeNotification", 'Loading songs')
    console.log(allParsedTracks.length + " tracks parsed");
    return allParsedTracks
}

export async function initializeApp(fileTracker: FilesTracker, playlistsTracker: PlaylistsTracker, playbackStats: PlaybackStats) {
    // Handle Open With FLB. Parse the files that is called as a second argument when running FLB
    const firstArgument = process.argv[1];
    if (firstArgument) {
        if (isValidFileType(firstArgument)) {
            const newTrack = await createParsedTrack(process.argv[1]);
            win.webContents.send('newTrack', newTrack);
            win.webContents.send('playThisTrack', newTrack);
        }
        if (path.parse(firstArgument).ext == '') {
            const tracks = await getParsedTracks([firstArgument])
            fileTracker.addMultipleTracks(tracks);
            sendMessageToRenderer("addMultipleTracks", tracks)
        }
    }
    const processedFiles = fileTracker.getTracks;
    const playlists = playlistsTracker.getPlaylists;
    const recentlyPlayedTracks = playbackStats.recentlyPlayedTracks;
    if (processedFiles.length > 0) {
        win.webContents.send('processedFiles', processedFiles);
        win.webContents.send('userPlaylists', playlists);
        win.webContents.send('recentlyPlayed', recentlyPlayedTracks);
        win.webContents.send('playStats', playbackStats.getPlayStats);
    }
}

export async function resetApp() {
    deleteFile(paths.filesTrackerLocation, true);
    deleteFile(paths.playbackStatsLocation, true);
    deleteFile(paths.playlistsLocation, true);
    deleteFile(paths.settingsLocation, true);
    sendNotificationToRenderer('Resetting FLB', 'Clearing all data', 'warning');
    setTimeout(() => {
        app.quit();
    }, 3000);
}