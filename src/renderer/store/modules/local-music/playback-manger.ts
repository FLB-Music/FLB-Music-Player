import { getSong } from "genius-lyrics-api";
import { ActionTree } from "vuex";
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
  playingQueue: [],
  customQueue: [],
};
const mutations = {
  setPlayingTrack: (
    state: PlaybackManagerStateInterface,
    payload: PlayingTrackPayload
  ) => {
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
  getLyrics({ state }) {
    const dbLyrics = localStorage.getItem("lyrics");
    if (dbLyrics) {
      const allLyrics: TrackLyricsType[] = JSON.parse(dbLyrics);
      state.allLyrics = allLyrics;
    }
    TabsManager.state.tabsData.addedTracks.forEach((track) => {
      const options = {
        apiKey:
          "OvIJKwGiXVXykOca4Yr5V4ys0wReNjxazasnInKUqGItUzgih9uQjrYK6YmSSzeS",
        title: track.defaultTitle,
        artist: track.defaultArtist,
        optimizeQuery: true,
      };

      const indexOfLyricsForTheTrack = state.allLyrics.findIndex(
        (trackLyricsInfo) => trackLyricsInfo.trackName === track.defaultTitle
      );
      if (indexOfLyricsForTheTrack === -1 && navigator.onLine) {
        getSong(options).then((song: geniusSongType) => {
          if (song && song.lyrics) {
            const lyrics = song.lyrics.split(/\s\s/);
            lyrics.filter((lyricBlock: string) => lyricBlock.trim() === "");
            state.allLyrics.push({ trackName: track.defaultTitle, lyrics });
            localStorage.setItem("lyrics", JSON.stringify(state.allLyrics));
            // TODO: Replace above this click logic with the UIController method for switching to the lyrics tab
          }
        });
      }
    });
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
