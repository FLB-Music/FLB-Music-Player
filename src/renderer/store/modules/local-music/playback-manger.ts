import { getSong } from "genius-lyrics-api";
import { ActionTree } from "vuex";
import { ipcRenderer } from "electron";
import UIController from "./uicontroller";
import TabsManager from "./tabs-manager";
import TrackSelector from "./track-selector";
import { sendMessageToNode } from "@/renderer/utils";
import { removeDuplicates, sortArrayOfObjects } from "@/shared-utils";
import { geniusSongType, TrackLyricsType, TrackType } from "@/types";
import { updateMediaInfo } from "@/renderer/global-activities/update-windows-media-info";

interface PlayingTrackPayload {
  track: TrackType;
  index: number;
}

/**
 * Tracks of the party that a guest uploaded and that were playing when the
 * guest disconnected. They finish playing before the file is deleted.
 */
const departedGuestPlayingFiles = new Set<string>();
interface PlaybackManagerStateInterface {
  playingTrackInfo: {
    track: TrackType | null;
  };
  audioState: {
    playing: boolean;
    repeat: boolean;
    shuffle: boolean;
  };
  allLyrics: TrackLyricsType[];
  lyricsSearching: boolean;
  lyricsMissedTrack: string;
  playingQueue: TrackType[];
  customQueue: TrackType[];
}
const state: PlaybackManagerStateInterface = {
  playingTrackInfo: {
    track: null,
  },
  audioState: {
    playing: false,
    repeat: false,
    shuffle: false,
  },
  allLyrics: [],
  lyricsSearching: false,
  lyricsMissedTrack: "",
  playingQueue: [],
  customQueue: [],
};
const mutations = {
  setPlayingTrack: (
    state: PlaybackManagerStateInterface,
    payload: PlayingTrackPayload
  ) => {
    // A track uploaded by a guest of the party is allowed to finish even
    // after the guest is gone, it leaves the queue once the next one starts
    const previousTrack = state.playingTrackInfo.track;
    if (previousTrack && departedGuestPlayingFiles.has(previousTrack.fileLocation)) {
      state.customQueue = state.customQueue.filter(
        (track) => track.fileLocation !== previousTrack.fileLocation
      );
      departedGuestPlayingFiles.delete(previousTrack.fileLocation);
    }
    if (payload?.track?.defaultTitle) {
      state.playingTrackInfo.track = payload.track;
      state.audioState.playing = true;
      if (
        UIController.state.UIProperties.currentMainTab !== "Recents" &&
        UIController.state.UIProperties.currentPage === "My Music"
      ) {
        TabsManager.state.tabsData.recentlyPlayedTracks.unshift(payload.track);
        TabsManager.state.tabsData.recentlyPlayedTracks =
          TabsManager.state.tabsData.recentlyPlayedTracks.slice(0, 20);
        TabsManager.state.tabsData.recentlyPlayedTracks = removeDuplicates(
          TabsManager.state.tabsData.recentlyPlayedTracks,
          "defaultTitle"
        );
      }
      if (state.customQueue.length === 0) {
        state.customQueue.push(state.playingTrackInfo.track);
      }
      sendMessageToNode("playingTrack", payload.track);
      updateMediaInfo(payload.track);
      localStorage.setItem("lastPlayedTrack", JSON.stringify(payload.track));
    }
  },
  setSelectedTrackToPlayNext(state: PlaybackManagerStateInterface) {
    const indexOfPlayingTrack = state.customQueue.findIndex(
      (track) =>
        track.fileLocation === state.playingTrackInfo.track?.fileLocation
    );
    state.customQueue = removeDuplicates(
      [
        ...state.customQueue.slice(0, indexOfPlayingTrack + 1),
        TrackSelector.state.selectedTracks[0],
        ...state.customQueue.slice(indexOfPlayingTrack + 1),
      ],
      "fileLocation"
    );
    TrackSelector.state.selectedTracks.shift();
  },
  addSelectedTrackToCustomQueue(state: any) {
    TrackSelector.state.selectedTracks.forEach((track: TrackType) => {
      state.customQueue.push(track);
    });
    state.customQueue = removeDuplicates(state.customQueue, "fileLocation");
  },
  removeTrackFromCustomQueue(state: any, index: number) {
    state.customQueue.splice(index, 1);
  },
  clearCustomQueue(state: any) {
    state.customQueue = [];
  },
  overWriteCustomQueue(state: any, payload: Array<TrackType>) {
    const copyOfPayload = [...payload];
    state.customQueue = copyOfPayload;
  },
  reorderQueue(state: any, payload: Array<TrackType>) {
    const copyOfPayload = [...payload];
    state.customQueue = copyOfPayload;
  },
  /**
   * Puts the tracks suggested by a guest of the party into the queue of the
   * host, the same way the host adds its own tracks.
   */
  queueTracksFromGuest(state: any, payload: Array<TrackType>) {
    payload.forEach((track: TrackType) => {
      const alreadyQueued = state.customQueue.some(
        (queued: TrackType) => queued.fileLocation === track.fileLocation
      );
      if (!alreadyQueued) state.customQueue.push(track);
    });
  },
  /**
   * Removes every track a guest left in the queue when they disconnect. The
   * track of that guest that is playing right now stays until it finishes,
   * its file is deleted by the main process afterwards.
   */
  removeQueuedTracksByGuest(state: any, guestId: string) {
    const playingNow = state.playingTrackInfo.track;
    const guestIsStillPlaying =
      !!playingNow && playingNow.suggestedBy?.guestId === guestId;

    state.customQueue = state.customQueue.filter((track: TrackType) => {
      if (track.suggestedBy?.guestId !== guestId) return true;
      if (guestIsStillPlaying && track.fileLocation === playingNow.fileLocation) {
        return true;
      }
      return false;
    });

    if (guestIsStillPlaying) {
      departedGuestPlayingFiles.add(playingNow.fileLocation);
    }
  },
  /**
   * When the party ends the files the guests uploaded are gone, so their
   * tracks leave the queue as well. The one that is playing right now is
   * kept until the next track starts, its file is deleted by then.
   */
  clearGuestTracksFromQueue(state: any) {
    const playingNow = state.playingTrackInfo.track;
    state.customQueue = state.customQueue.filter((track: TrackType) => {
      if (!track.suggestedBy) return true;
      if (playingNow && track.fileLocation === playingNow.fileLocation) {
        departedGuestPlayingFiles.add(track.fileLocation);
        return true;
      }
      return false;
    });
  },
  setPlayState(state: any, payload: "play" | "pause") {
    if (payload === "play") {
      state.audioState.playing = true;
      document.querySelector("audio")?.play();
    } else {
      state.audioState.playing = false;
      document.querySelector("audio")?.pause();
    }
  },
  setPlayingState(state: any, payload: boolean) {
    state.audioState.playing = payload;
  },
};

/**
 * Lyrics service that needs no account. It answers with plain text and with
 * the timestamped version when it has one, like the covers, the search runs
 * online and the answer is kept in a file in the app data folder.
 */
const LYRICS_SERVICE_URL = "https://lrclib.net/api";
// stops the panel and the playback from searching the same track twice
let lyricsRequestRunning = false;
// the tracks that were searched and had no lyrics, they are not searched
// again until the user asks for it explicitly
const tracksWithoutLyrics = new Set<string>();

interface StoredLyricsType {
  trackName: string;
  artist: string;
  lyrics: string;
}

async function fetchJsonWithTimeout(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function splitVerses(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((verse) => verse.trim())
    .filter((verse) => verse !== "");
}

/**
 * The track is searched with the title as it is and without what the tags
 * usually carry around it: "(feat. ...)", "[Remastered]", "(Official
 * Video)", ... Those additions rarely exist in the lyrics services.
 */
function titleCandidates(title: string): string[] {
  const cleanTitle = (value: string) =>
    value
      .replace(/\([^)]*\)/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const trimmedTitle = title.trim();
  const candidates = [trimmedTitle];
  const cleanedTitle = cleanTitle(trimmedTitle);
  if (cleanedTitle && cleanedTitle !== trimmedTitle) {
    candidates.push(cleanedTitle);
  }
  return candidates;
}

/**
 * Comparison that does not mind the case, the spaces or the accents, so
 * "Beyoncé - Baby Boy" is the same as "beyonce - baby boy".
 */
function normalized(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Of the answers of the search, the one that really looks like the track is
 * kept: same title, and same artist when the answer says it.
 */
function pickBestMatch(matches: any[], title: string, artist: string): any {
  const wantedTitle = normalized(title);
  const matchesWithTheTitle = matches.filter(
    (match) => normalized(match.trackName) === wantedTitle
  );
  const pool = matchesWithTheTitle.length ? matchesWithTheTitle : matches;
  if (artist) {
    const matchesWithTheArtist = pool.filter(
      (match) => normalized(match.artistName) === normalized(artist)
    );
    if (matchesWithTheArtist.length) return matchesWithTheArtist[0];
  }
  return pool[0] || null;
}

async function findLyricsOnline(track: TrackType): Promise<string[]> {
  const artist = track.defaultArtist || "";
  const candidates = titleCandidates(track.defaultTitle);

  // 1. the exact match of the service that needs no account
  for (const title of candidates) {
    const query = new URLSearchParams({
      track_name: title,
      artist_name: artist,
    });
    const song = await fetchJsonWithTimeout(
      `${LYRICS_SERVICE_URL}/get?${query.toString()}`
    );
    const text = song && (song.plainLyrics || song.syncedLyrics);
    if (text) return splitVerses(String(text));
  }

  // 2. the search of the same service, for the titles written differently
  for (const title of candidates) {
    const query = new URLSearchParams({
      track_name: title,
      artist_name: artist,
    });
    const matches = await fetchJsonWithTimeout(
      `${LYRICS_SERVICE_URL}/search?${query.toString()}`
    );
    if (!Array.isArray(matches) || !matches.length) continue;
    const bestMatch = pickBestMatch(matches, title, artist);
    const text = bestMatch && (bestMatch.plainLyrics || bestMatch.syncedLyrics);
    if (text) return splitVerses(String(text));
  }

  // 3. Genius as the last source
  for (const title of candidates) {
    try {
      // the options live in a variable, the way the original code did it,
      // the library accepts more options than its own types declare
      const options = {
        apiKey:
          "OvIJKwGiXVXykOca4Yr5V4ys0wReNjxazasnInKUqGItUzgih9uQjrYK6YmSSzeS",
        title,
        artist,
        optimizeQuery: true,
      };
      const geniusSong: geniusSongType = await getSong(options);
      if (geniusSong && geniusSong.lyrics) {
        return splitVerses(String(geniusSong.lyrics));
      }
    } catch (error) {
      console.log("Genius could not find the lyrics of", track.defaultTitle);
    }
  }
  return [];
}

/**
 * The saved lyrics live in files in the app data folder, the same way the
 * covers do. The lyrics of the old versions of the app, that lived in the
 * browser storage, are moved to files here the first time they are needed.
 */
async function loadSavedLyrics(state: any): Promise<void> {
  try {
    const loadedLyrics: StoredLyricsType[] = await ipcRenderer.invoke(
      "loadLyricsFiles"
    );
    if (loadedLyrics.length) {
      state.allLyrics = loadedLyrics.map((entry) => ({
        trackName: entry.trackName,
        lyrics: splitVerses(entry.lyrics),
      }));
      return;
    }
    const legacyLyrics = localStorage.getItem("lyrics");
    if (!legacyLyrics) return;
    const parsedLyrics = JSON.parse(legacyLyrics);
    if (!Array.isArray(parsedLyrics) || !parsedLyrics.length) return;
    const lyricsBatch: StoredLyricsType[] = parsedLyrics
      .filter(
        (entry: any) => entry && entry.trackName && Array.isArray(entry.lyrics)
      )
      .map((entry: any) => ({
        trackName: entry.trackName,
        artist: "",
        lyrics: entry.lyrics.join("\n\n"),
      }));
    state.allLyrics = parsedLyrics;
    const migrated = await ipcRenderer.invoke("saveLyricsBatch", lyricsBatch);
    if (migrated) localStorage.removeItem("lyrics");
  } catch (error) {
    console.log("Could not load the saved lyrics", error);
  }
}

async function saveLyricsToFile(
  track: TrackType,
  verses: string[]
): Promise<void> {
  try {
    await ipcRenderer.invoke("saveLyricsFile", {
      trackName: track.defaultTitle,
      artist: track.defaultArtist || "",
      lyrics: verses.join("\n\n"),
    });
  } catch (error) {
    console.log("Could not save the lyrics of", track.defaultTitle, error);
  }
}

const actions: ActionTree<PlaybackManagerStateInterface, any> = {
  toggleIsPlaying({ state }) {
    state.audioState.playing = !state.audioState.playing;
    if (state.audioState.playing) {
      document.querySelector("audio")?.play();
    } else {
      document.querySelector("audio")?.pause();
    }
  },
  toggleRepeat({ state }) {
    state.audioState.repeat = !state.audioState.repeat;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector("audio")!.loop = state.audioState.repeat;
  },
  toggleShuffler({ state }) {
    state.audioState.shuffle = !state.audioState.shuffle;
  },
  /**
   * Searches the lyrics of the track that is playing, the same way the covers
   * are searched online. The answer is saved in a file in the app data
   * folder and only a track without lyrics is looked up again.
   */
  async getLyrics({ state }, payload: { force?: boolean } = {}) {
    // the saved lyrics of every track come from the files
    if (!state.allLyrics.length) {
      await loadSavedLyrics(state);
    }

    const track = state.playingTrackInfo.track;
    if (!track || !track.defaultTitle || lyricsRequestRunning) return;

    const hasLyrics = state.allLyrics.some(
      (trackLyricInfo) => trackLyricInfo.trackName === track.defaultTitle
    );
    if (hasLyrics) return;

    const trackKey = `${track.defaultTitle}|${track.defaultArtist || ""}`;
    if (!payload.force && tracksWithoutLyrics.has(trackKey)) return;
    if (!navigator.onLine) return;

    lyricsRequestRunning = true;
    state.lyricsSearching = true;
    state.lyricsMissedTrack = "";
    try {
      const verses = await findLyricsOnline(track);
      if (verses.length) {
        // the panel can ask for the same track while the request is running
        const stillMissing = !state.allLyrics.some(
          (trackLyricInfo) => trackLyricInfo.trackName === track.defaultTitle
        );
        if (stillMissing) {
          state.allLyrics.push({
            trackName: track.defaultTitle,
            lyrics: verses,
          });
        }
        state.lyricsMissedTrack = "";
        tracksWithoutLyrics.delete(trackKey);
        // the answer is kept in a file, the same way the covers are
        saveLyricsToFile(track, verses);
      } else {
        state.lyricsMissedTrack = track.defaultTitle;
        tracksWithoutLyrics.add(trackKey);
      }
    } catch (error) {
      console.log("Could not search the lyrics", error);
    } finally {
      state.lyricsSearching = false;
      lyricsRequestRunning = false;
    }
  },
  /**
   * The lyrics the user writes by hand for the track that is playing, the
   * option shown in the panel when the search finds nothing. They are shown
   * right away and saved in a file like the downloaded ones.
   */
  async saveManualLyrics({ state }, payload: { text: string }) {
    const track = state.playingTrackInfo.track;
    if (
      !track ||
      !track.defaultTitle ||
      !payload ||
      !payload.text ||
      !payload.text.trim()
    ) {
      return;
    }
    const verses = splitVerses(payload.text);
    if (!verses.length) return;
    const storedLyrics = { trackName: track.defaultTitle, lyrics: verses };
    const currentIndex = state.allLyrics.findIndex(
      (trackLyricInfo) => trackLyricInfo.trackName === track.defaultTitle
    );
    if (currentIndex === -1) {
      state.allLyrics.push(storedLyrics);
    } else {
      state.allLyrics.splice(currentIndex, 1, storedLyrics);
    }
    state.lyricsMissedTrack = "";
    const trackKey = `${track.defaultTitle}|${track.defaultArtist || ""}`;
    tracksWithoutLyrics.delete(trackKey);
    await saveLyricsToFile(track, verses);
  },
  determineNextTrack({ state, commit, rootState }, direction) {
    const playingTrack = state.playingTrackInfo.track;
    if (!playingTrack) return;

    if (state.audioState.repeat) {
      const audio = document.querySelector("audio") as HTMLAudioElement;
      if (audio) audio.currentTime = 0;
      return;
    }

    const indexIn = (list: TrackType[]) =>
      list.findIndex(
        (track) => track.fileLocation === playingTrack.fileLocation
      );
    const hasNext = (list: TrackType[], index: number) =>
      direction === "next" ? index + 1 < list.length : index - 1 >= 0;

    // The playback follows the queue, but the queue regularly does not have
    // the track that is playing or the next one. When that happens the
    // library is used so the buttons keep working.
    let list: TrackType[] = state.customQueue;
    let index = indexIn(list);

    if (index === -1 || !hasNext(list, index)) {
      const library = [...TabsManager.state.tabsData.addedTracks];
      sortArrayOfObjects(library, rootState.sortParameter);
      if (rootState.flipSortOrder) library.reverse();
      const libraryIndex = indexIn(library);
      if (libraryIndex !== -1 && hasNext(library, libraryIndex)) {
        list = library;
        index = libraryIndex;
      }
    }

    if (index === -1) return;

    if (state.audioState.shuffle) {
      let randomIndex = Math.floor(Math.random() * list.length);
      if (randomIndex === index) {
        randomIndex = (randomIndex + 1) % list.length;
      }
      commit("setPlayingTrack", {
        track: list[randomIndex],
        index: randomIndex,
      });
      return;
    }

    if (direction === "next") {
      if (index === list.length - 1) {
        // last track of the list
        return;
      }
      commit("setPlayingTrack", {
        track: list[index + 1],
        index: index + 1,
      });
      return;
    }

    if (direction === "prev") {
      if (index === 0) {
        // restart the track that is playing
        const audio = document.querySelector("audio") as HTMLAudioElement;
        if (audio) audio.currentTime = 0;
        return;
      }
      commit("setPlayingTrack", {
        track: list[index - 1],
        index: index - 1,
      });
      return;
    }
  },
};
export default {
  state,
  mutations,
  actions,
};
