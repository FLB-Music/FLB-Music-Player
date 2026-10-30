import { ipcRenderer } from "electron";
import { ActionTree } from "vuex";
import {
  PartyGuestInfoType,
  PartyQueuePayloadType,
  PartyTrackDTOType,
} from "@/types";

/**
 * Party mode state. The host of the party never talks to the network, the
 * renderer only pushes queue snapshots to the main process. The guest is the
 * one making requests to the host over http + sse, always with the room code
 * and a guest id, and the host enforces what a guest is allowed to do.
 */

interface PartyHostInfo {
  code: string;
  lanUrl: string;
  qrDataUrl: string;
}

interface PartyManagerStateInterface {
  mode: "none" | "host" | "guest";
  hostInfo: PartyHostInfo | null;
  guests: PartyGuestInfoType[];
  connection: "idle" | "connecting" | "connected" | "error";
  connectionError: string;
  joinedRoom: { code: string; hostName: string; hostUrl: string } | null;
  guestId: string | null;
  queue: PartyTrackDTOType[];
  nowPlaying: PartyTrackDTOType | null;
  playing: boolean;
  searchQuery: string;
  searchResults: PartyTrackDTOType[];
  searchTotal: number;
  searching: boolean;
  uploading: boolean;
  uploadProgress: number;
}

const state: PartyManagerStateInterface = {
  mode: "none",
  hostInfo: null,
  guests: [],
  connection: "idle",
  connectionError: "",
  joinedRoom: null,
  guestId: null,
  queue: [],
  nowPlaying: null,
  playing: false,
  searchQuery: "",
  searchResults: [],
  searchTotal: 0,
  searching: false,
  uploading: false,
  uploadProgress: 0,
};

// The live connection of this app when it is a guest of someone else's party
let eventSource: EventSource | null = null;

const mutations = {
  setHostInfo(state: PartyManagerStateInterface, info: PartyHostInfo | null) {
    state.hostInfo = info;
  },
  setGuests(state: PartyManagerStateInterface, guests: PartyGuestInfoType[]) {
    state.guests = guests;
  },
  setJoinedRoom(
    state: PartyManagerStateInterface,
    room: PartyManagerStateInterface["joinedRoom"]
  ) {
    state.joinedRoom = room;
  },
  setGuestId(state: PartyManagerStateInterface, guestId: string | null) {
    state.guestId = guestId;
  },
  setMode(state: PartyManagerStateInterface, mode: PartyManagerStateInterface["mode"]) {
    state.mode = mode;
  },
  setConnection(
    state: PartyManagerStateInterface,
    payload: { connection: PartyManagerStateInterface["connection"]; error?: string }
  ) {
    state.connection = payload.connection;
    state.connectionError = payload.error || "";
  },
  applyQueue(state: PartyManagerStateInterface, payload: PartyQueuePayloadType) {
    state.queue = payload.queue || [];
    state.nowPlaying = payload.nowPlaying || null;
    state.playing = !!payload.playing;
  },
  setSearch(
    state: PartyManagerStateInterface,
    payload: { query?: string; results?: PartyTrackDTOType[]; total?: number; searching?: boolean }
  ) {
    if (payload.query !== undefined) state.searchQuery = payload.query;
    if (payload.results !== undefined) state.searchResults = payload.results;
    if (payload.total !== undefined) state.searchTotal = payload.total;
    if (payload.searching !== undefined) state.searching = payload.searching;
  },
  setUploading(state: PartyManagerStateInterface, payload: { uploading: boolean; progress?: number }) {
    state.uploading = payload.uploading;
    if (payload.progress !== undefined) state.uploadProgress = payload.progress;
  },
  resetParty(state: PartyManagerStateInterface) {
    state.mode = "none";
    state.hostInfo = null;
    state.guests = [];
    state.connection = "idle";
    state.connectionError = "";
    state.joinedRoom = null;
    state.guestId = null;
    state.queue = [];
    state.nowPlaying = null;
    state.playing = false;
    state.searchQuery = "";
    state.searchResults = [];
    state.searchTotal = 0;
    state.searching = false;
    state.uploading = false;
    state.uploadProgress = 0;
  },
};

const actions: ActionTree<PartyManagerStateInterface, any> = {
  /** Opens the room, only the host can do this. */
  async createParty({ commit, rootState }) {
    const info: PartyHostInfo = await ipcRenderer.invoke("partyStart");
    commit("setMode", "host");
    commit("setHostInfo", info);
    commit("setJoinedRoom", {
      code: info.code,
      hostName: "Você",
      hostUrl: info.lanUrl,
    });
    commit("setConnection", { connection: "connected" });

    // The queue as it is right now goes to the server so the first guest
    // that arrives does not see an empty screen.
    const playback = rootState.PlaybackManger;
    ipcRenderer.send("partyQueueUpdate", {
      queue: playback.customQueue,
      nowPlaying: playback.playingTrackInfo.track,
      playing: playback.audioState.playing,
    });
    return info;
  },

  stopParty({ commit }) {
    ipcRenderer.send("partyStop", "");
    commit("clearGuestTracksFromQueue");
    commit("resetParty");
  },

  /** Joins the party of another machine found on the LAN. */
  async joinParty({ commit, dispatch }, payload: { code: string; name: string }) {
    const code = String(payload.code || "").replace(/\D/g, "").slice(0, 6);
    const name = String(payload.name || "").trim().slice(0, 24);
    if (code.length !== 6) {
      commit("setConnection", { connection: "error", error: "party.errorCode" });
      return;
    }
    if (!name) {
      commit("setConnection", { connection: "error", error: "party.errorName" });
      return;
    }

    commit("setConnection", { connection: "connecting" });
    try {
      const host = await ipcRenderer.invoke("partyDiscover");
      if (!host) {
        commit("setConnection", { connection: "error", error: "party.errorNotFound" });
        return;
      }
      const hostUrl = `http://${host.ip}:${host.port}`;
      const response = await fetch(`${hostUrl}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorKey =
          data.error === "party_closed"
            ? "party.errorClosed"
            : data.error === "locked"
            ? "party.errorLocked"
            : data.error === "too_many_requests"
            ? "party.errorSpam"
            : "party.errorWrongCode";
        commit("setConnection", { connection: "error", error: errorKey });
        return;
      }

      commit("setGuestId", data.guestId);
      commit("setJoinedRoom", {
        code,
        hostName: data.hostName || "",
        hostUrl,
      });
      commit("setMode", "guest");
      dispatch("openEventStream");
      dispatch("guestSearchTracks", "");
      commit("setConnection", { connection: "connected" });
    } catch (error) {
      commit("setConnection", { connection: "error", error: "party.errorNotFound" });
    }
  },

  openEventStream({ commit, state, dispatch }) {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (!state.joinedRoom || !state.guestId) return;

    const stream = new EventSource(
      `${state.joinedRoom.hostUrl}/api/events?guestId=${state.guestId}`
    );
    eventSource = stream;

    stream.addEventListener("queue", (event) => {
      try {
        commit("applyQueue", JSON.parse((event as MessageEvent).data));
      } catch (error) {
        // A broken frame is not worth breaking the screen for
      }
    });
    stream.addEventListener("session-ended", () => {
      commit("pushNotification", {
        title: "party.endedTitle",
        subTitle: "party.endedSubTitle",
        type: "warning",
      });
      dispatch("leaveParty");
    });
    stream.onerror = () => {
      if (stream.readyState === EventSource.CLOSED) {
        commit("setConnection", { connection: "error", error: "party.errorLost" });
      }
    };
  },

  async guestSearchTracks({ commit, state }, query?: string) {
    if (!state.joinedRoom || !state.guestId) return;
    const search = typeof query === "string" ? query : state.searchQuery;
    commit("setSearch", { query: search, searching: true });
    try {
      const url = `${state.joinedRoom.hostUrl}/api/tracks?q=${encodeURIComponent(
        search
      )}&limit=60`;
      const response = await fetch(url, {
        headers: { "x-guest-id": state.guestId },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      commit("setSearch", { results: data.tracks, total: data.total, searching: false });
    } catch (error) {
      commit("setSearch", { results: [], total: 0, searching: false });
    }
  },

  /** Asks the host to add one of its own tracks to the queue. */
  async guestAddTrack({ commit, state, dispatch }, trackId: string) {
    if (!state.joinedRoom || !state.guestId) return;
    try {
      const response = await fetch(`${state.joinedRoom.hostUrl}/api/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-guest-id": state.guestId,
        },
        body: JSON.stringify({ trackId }),
      });
      if (response.status === 429) {
        commit("pushNotification", {
          title: "party.slowDownTitle",
          subTitle: "party.slowDownSubTitle",
          type: "warning",
        });
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error);
      }
      commit("pushNotification", {
        title: "party.addedTitle",
        subTitle: "party.addedSubTitle",
        type: "success",
      });
      // The host pushes the new queue over sse, the refresh is a fallback
      dispatch("guestRefreshQueue");
    } catch (error) {
      commit("pushNotification", {
        title: "party.errorAddTitle",
        subTitle: "",
        type: "danger",
      });
    }
  },

  async guestRefreshQueue({ commit, state }) {
    if (!state.joinedRoom || !state.guestId) return;
    try {
      const response = await fetch(`${state.joinedRoom.hostUrl}/api/queue`, {
        headers: { "x-guest-id": state.guestId },
      });
      if (response.ok) commit("applyQueue", await response.json());
    } catch (error) {
      // The event stream will bring the queue back
    }
  },

  /** Sends local audio files to the host, one request per file. */
  async guestUploadFiles({ commit, state, dispatch }, files: File[]) {
    if (!state.joinedRoom || !state.guestId || !files.length) return;
    commit("setUploading", { uploading: true, progress: 0 });
    let done = 0;

    const room = state.joinedRoom;
    const guestId = state.guestId;
    for (const file of files) {
      const uploaded = await new Promise<boolean>((resolve) => {
        const request = new XMLHttpRequest();
        request.open(
          "POST",
          `${room.hostUrl}/api/upload?name=${encodeURIComponent(file.name)}`
        );
        request.setRequestHeader("x-guest-id", guestId as string);
        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const fileProgress = event.loaded / event.total;
          const total = ((done + fileProgress) / files.length) * 100;
          commit("setUploading", { uploading: true, progress: Math.round(total) });
        };
        request.onload = () => {
          if (request.status === 200) {
            commit("pushNotification", {
              title: "party.uploadedTitle",
              subTitle: "party.uploadedSubTitle",
              type: "success",
            });
            resolve(true);
          } else if (request.status === 429) {
            commit("pushNotification", {
              title: "party.slowDownTitle",
              subTitle: "party.slowDownSubTitle",
              type: "warning",
            });
            resolve(false);
          } else {
            commit("pushNotification", {
              title: "party.errorUploadTitle",
              subTitle: "",
              type: "danger",
            });
            resolve(false);
          }
        };
        request.onerror = () => {
          commit("pushNotification", {
            title: "party.errorUploadTitle",
            subTitle: "",
            type: "danger",
          });
          resolve(false);
        };
        request.send(file);
      });

      done += 1;
      if (!uploaded) break;
    }

    commit("setUploading", { uploading: false, progress: 0 });
    dispatch("guestRefreshQueue");
  },

  leaveParty({ commit, state }) {
    if (state.joinedRoom && state.guestId) {
      fetch(`${state.joinedRoom.hostUrl}/api/leave`, {
        method: "POST",
        headers: { "x-guest-id": state.guestId },
      }).catch(() => undefined);
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    commit("resetParty");
  },
};

export default {
  state,
  mutations,
  actions,
};
