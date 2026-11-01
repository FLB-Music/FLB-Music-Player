import { ipcRenderer } from "electron";
import { ActionTree } from "vuex";
import {
  PartyBlockedInfoType,
  PartyEntryModeType,
  PartyGuestInfoType,
  PartyPendingDTOType,
  PartyQueuePayloadType,
  PartySubmissionType,
  PartyTrackDTOType,
  TrackType,
} from "@/types";

/**
 * Party mode state. The host of the party never talks to the network, the
 * renderer only pushes queue snapshots to the main process. The guest is the
 * one making requests to the host over http + sse, always with the room code
 * and a guest id, and the host enforces what a guest is allowed to do.
 */

/** How many suggestions a guest may have waiting for approval. */
export const PARTY_PENDING_LIMIT = 10;

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
  /** Name of the party, chosen by the host when it was created. */
  roomName: string;
  entryMode: PartyEntryModeType;
  queue: PartyTrackDTOType[];
  nowPlaying: PartyTrackDTOType | null;
  playing: boolean;
  position: number;
  duration: number;
  volume: number;
  /** When the last playback update arrived, to keep the bar moving. */
  receivedAt: number;
  searchQuery: string;
  searchResults: PartyTrackDTOType[];
  searchTotal: number;
  searching: boolean;
  uploading: boolean;
  uploadProgress: number;
  /** Only filled on the machine of the host. */
  pendingList: PartyPendingDTOType[];
  blockedList: PartyBlockedInfoType[];
  /** What this machine has sent to the party and how it ended. */
  mySubmissions: PartySubmissionType[];
}

const state: PartyManagerStateInterface = {
  mode: "none",
  hostInfo: null,
  guests: [],
  connection: "idle",
  connectionError: "",
  joinedRoom: null,
  guestId: null,
  roomName: "",
  entryMode: "free",
  queue: [],
  nowPlaying: null,
  playing: false,
  position: 0,
  duration: 0,
  volume: 1,
  receivedAt: 0,
  searchQuery: "",
  searchResults: [],
  searchTotal: 0,
  searching: false,
  uploading: false,
  uploadProgress: 0,
  pendingList: [],
  blockedList: [],
  mySubmissions: [],
};

// The live connection of this app when it is a guest of someone else's party
let eventSource: EventSource | null = null;

/**
 * A random id that stays the same for this install of the app. It is what
 * a block points at, so changing the name of the guest does not get past
 * a block.
 */
function deviceToken(): string {
  const key = "flbPartyDeviceToken";
  let token = localStorage.getItem(key);
  if (!token) {
    token =
      Math.random().toString(36).slice(2) +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2);
    localStorage.setItem(key, token.slice(0, 64));
  }
  return token.slice(0, 64);
}

interface UploadOutcome {
  ok: boolean;
  pending?: boolean;
  pendingId?: string;
  track?: PartyTrackDTOType;
  reason?: string;
}

/** Sends one blob of audio to the host over the same route as always. */
function uploadBlobToHost(
  room: { hostUrl: string },
  guestId: string,
  blob: Blob,
  fileName: string,
  onProgress: (percent: number) => void
): Promise<UploadOutcome> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `${room.hostUrl}/api/upload?name=${encodeURIComponent(fileName)}`
    );
    request.setRequestHeader("x-guest-id", guestId);
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status === 200) {
        resolve({ ok: true });
      } else if (request.status === 202) {
        let data: any = {};
        try {
          data = JSON.parse(request.responseText);
        } catch (error) {
          // The decision screen still works without the track info
        }
        resolve({
          ok: true,
          pending: true,
          pendingId: data.pendingId,
          track: data.track,
        });
      } else if (request.status === 409) {
        resolve({ ok: false, reason: "duplicate" });
      } else if (request.status === 429) {
        let data: any = {};
        try {
          data = JSON.parse(request.responseText);
        } catch (error) {
          // Treated as a plain slow down below
        }
        resolve({
          ok: false,
          reason: data.error === "pending_limit" ? "limit" : "slow",
        });
      } else {
        resolve({ ok: false });
      }
    };
    request.onerror = () => {
      resolve({ ok: false });
    };
    request.send(blob);
  });
}

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
  setPartyRoomName(state: PartyManagerStateInterface, name: string) {
    state.roomName = name || "";
  },
  setPartyEntryMode(state: PartyManagerStateInterface, mode: PartyEntryModeType) {
    state.entryMode = mode === "approval" ? "approval" : "free";
  },
  setPendingList(state: PartyManagerStateInterface, list: PartyPendingDTOType[]) {
    state.pendingList = list || [];
  },
  setBlockedList(state: PartyManagerStateInterface, list: PartyBlockedInfoType[]) {
    state.blockedList = list || [];
  },
  addSubmission(state: PartyManagerStateInterface, submission: PartySubmissionType) {
    state.mySubmissions.push(submission);
  },
  removeSubmission(state: PartyManagerStateInterface, submissionId: string) {
    state.mySubmissions = state.mySubmissions.filter(
      (item) => item.id !== submissionId
    );
  },
  updateSubmissionStatus(
    state: PartyManagerStateInterface,
    payload: { id: string; status: PartySubmissionType["status"] }
  ) {
    const item = state.mySubmissions.find((entry) => entry.id === payload.id);
    if (item) item.status = payload.status;
  },
  applyQueue(state: PartyManagerStateInterface, payload: PartyQueuePayloadType) {
    state.queue = payload.queue || [];
    state.nowPlaying = payload.nowPlaying || null;
    state.playing = !!payload.playing;
    state.position = Number(payload.position) || 0;
    state.duration = Number(payload.duration) || 0;
    state.volume = typeof payload.volume === "number" ? payload.volume : 1;
    state.receivedAt = Date.now();
    if (payload.roomName) state.roomName = payload.roomName;
    // The host may switch the mode at any moment, this is how the guests
    // find out
    if (payload.entryMode) {
      state.entryMode = payload.entryMode === "approval" ? "approval" : "free";
    }
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
    state.roomName = "";
    state.entryMode = "free";
    state.queue = [];
    state.nowPlaying = null;
    state.playing = false;
    state.position = 0;
    state.duration = 0;
    state.volume = 1;
    state.receivedAt = 0;
    state.searchQuery = "";
    state.searchResults = [];
    state.searchTotal = 0;
    state.searching = false;
    state.uploading = false;
    state.uploadProgress = 0;
    state.pendingList = [];
    state.blockedList = [];
    state.mySubmissions = [];
  },
};

const actions: ActionTree<PartyManagerStateInterface, any> = {
  /** Opens the room, only the host can do this. */
  async createParty(
    { commit, rootState },
    payload?: { name?: string; entryMode?: PartyEntryModeType }
  ) {
    const name = String((payload && payload.name) || "").trim().slice(0, 32);
    const entryMode: PartyEntryModeType =
      payload && payload.entryMode === "approval" ? "approval" : "free";
    const info: PartyHostInfo = await ipcRenderer.invoke("partyStart", {
      name,
      entryMode,
    });
    commit("setMode", "host");
    commit("setHostInfo", info);
    commit("setPartyRoomName", name || "Festa");
    commit("setPartyEntryMode", entryMode);
    commit("setPendingList", []);
    commit("setBlockedList", []);
    commit("setJoinedRoom", {
      code: info.code,
      hostName: "Você",
      hostUrl: info.lanUrl,
    });
    commit("setConnection", { connection: "connected" });

    // The queue as it is right now goes to the server so the first guest
    // that arrives does not see an empty screen.
    const playback = rootState.PlaybackManger;
    const audio = document.querySelector("audio");
    ipcRenderer.send("partyQueueUpdate", {
      queue: playback.customQueue,
      nowPlaying: playback.playingTrackInfo.track,
      playing: playback.audioState.playing,
      position: audio ? audio.currentTime || 0 : 0,
      duration: audio && audio.duration ? audio.duration : 0,
      volume: audio ? audio.volume : 1,
    });
    return info;
  },

  stopParty({ commit }) {
    ipcRenderer.send("partyStop", "");
    commit("clearGuestTracksFromQueue");
    commit("resetParty");
  },

  /** Joins the party of another machine found on the LAN. */
  async joinParty(
    { commit, dispatch },
    payload: { code: string; name: string; hostUrl?: string }
  ) {
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
      // The QR code of the host carries its address, the discovery on the
      // network is only the fallback when the code was typed by hand
      let hostUrl = String(payload.hostUrl || "").trim();
      if (!hostUrl) {
        const host = await ipcRenderer.invoke("partyDiscover");
        if (!host) {
          commit("setConnection", { connection: "error", error: "party.errorNotFound" });
          return;
        }
        hostUrl = `http://${host.ip}:${host.port}`;
      }
      const response = await fetch(`${hostUrl}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, deviceToken: deviceToken() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorKey =
          data.error === "party_closed"
            ? "party.errorClosed"
            : data.error === "blocked"
            ? "party.errorBlocked"
            : data.error === "locked"
            ? "party.errorLocked"
            : data.error === "too_many_requests"
            ? "party.errorSpam"
            : "party.errorWrongCode";
        commit("setConnection", { connection: "error", error: errorKey });
        return;
      }

      commit("setGuestId", data.guestId);
      commit("setPartyRoomName", data.roomName || "");
      commit("setPartyEntryMode", data.entryMode || "free");
      // The name is remembered, a returning guest that scans the QR only
      // has to press enter
      localStorage.setItem("flbPartyGuestName", name);
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
    stream.addEventListener("kicked", () => {
      commit("pushNotification", {
        title: "party.kickedTitle",
        subTitle: "party.kickedSubTitle",
        type: "warning",
      });
      dispatch("leaveParty");
    });
    // The host decided the fate of one of our suggestions
    stream.addEventListener("pending-decision", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        commit("updateSubmissionStatus", {
          id: data.pendingId,
          status: data.accepted ? "accepted" : "refused",
        });
        const trackTitle = data.track ? data.track.title : "";
        commit(
          "pushNotification",
          data.accepted
            ? {
                title: "party.acceptedTitle",
                subTitle: trackTitle,
                type: "success",
              }
            : {
                title: "party.refusedTitle",
                subTitle: trackTitle,
                type: "warning",
              }
        );
        if (data.accepted) dispatch("guestRefreshQueue");
      } catch (error) {
        // Same as above, a broken frame is not fatal
      }
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
      const data = await response.json().catch(() => ({}));
      if (response.status === 429 && data.error === "pending_limit") {
        commit("pushNotification", {
          title: "party.limitTitle",
          subTitle: "party.limitSubTitle",
          type: "warning",
        });
        return;
      }
      if (response.status === 429) {
        commit("pushNotification", {
          title: "party.slowDownTitle",
          subTitle: "party.slowDownSubTitle",
          type: "warning",
        });
        return;
      }
      if (response.status === 409 && data.error === "duplicate") {
        commit("pushNotification", {
          title: "party.duplicateTitle",
          subTitle: "party.duplicateSubTitle",
          type: "warning",
        });
        return;
      }
      if (!response.ok) {
        throw new Error(data.error);
      }
      // In approval mode the song waits for the host to decide
      if (data.pending) {
        commit("addSubmission", {
          id: data.pendingId,
          track: data.track,
          status: "pending",
        });
        commit("pushNotification", {
          title: "party.waitingTitle",
          subTitle: "party.waitingSubTitle",
          type: "warning",
        });
        return;
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

  /** Takes back one of our own suggestions while it is still pending. */
  async guestCancelPending({ commit, state }, pendingId: string) {
    if (!state.joinedRoom || !state.guestId) return;
    try {
      const response = await fetch(
        `${state.joinedRoom.hostUrl}/api/pending/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-guest-id": state.guestId,
          },
          body: JSON.stringify({ pendingId }),
        }
      );
      if (response.ok) commit("removeSubmission", pendingId);
    } catch (error) {
      // The host will drop it from the list anyway when it decides
    }
  },

  /**
   * Sends one track of the local library of this machine to the party. The
   * file travels over the same route as the old upload screen, so the host
   * keeps every rule (approval, limits, duplicates) without the guest
   * having to look for the file outside the app.
   */
  async guestSendLocalTrack({ commit, state, dispatch }, track: TrackType) {
    if (!state.joinedRoom || !state.guestId || state.uploading) return;
    const filePath = track.fileLocation;
    if (!filePath) return;
    commit("setUploading", { uploading: true, progress: 0 });
    try {
      // The renderer has node integration, the file is read right here
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require("fs");
      const raw: Buffer = await fs.promises.readFile(filePath);
      const blob = new Blob([new Uint8Array(raw)]);
      const fileName = filePath.split(/[\\/]/).pop() || "track.mp3";

      const result = await uploadBlobToHost(
        state.joinedRoom,
        state.guestId,
        blob,
        fileName,
        (percent) =>
          commit("setUploading", { uploading: true, progress: percent })
      );

      if (result.pending && result.pendingId) {
        commit("addSubmission", {
          id: result.pendingId,
          track: result.track || null,
          status: "pending",
        });
        commit("pushNotification", {
          title: "party.waitingTitle",
          subTitle: "party.waitingSubTitle",
          type: "warning",
        });
      } else if (result.ok) {
        commit("pushNotification", {
          title: "party.uploadedTitle",
          subTitle: "party.uploadedSubTitle",
          type: "success",
        });
        dispatch("guestRefreshQueue");
      } else if (result.reason === "duplicate") {
        commit("pushNotification", {
          title: "party.duplicateTitle",
          subTitle: "party.duplicateSubTitle",
          type: "warning",
        });
      } else if (result.reason === "limit") {
        commit("pushNotification", {
          title: "party.limitTitle",
          subTitle: "party.limitSubTitle",
          type: "warning",
        });
      } else if (result.reason === "slow") {
        commit("pushNotification", {
          title: "party.slowDownTitle",
          subTitle: "party.slowDownSubTitle",
          type: "warning",
        });
      } else {
        commit("pushNotification", {
          title: "party.errorUploadTitle",
          subTitle: "",
          type: "danger",
        });
      }
    } catch (error) {
      commit("pushNotification", {
        title: "party.errorUploadTitle",
        subTitle: "",
        type: "danger",
      });
    }
    commit("setUploading", { uploading: false, progress: 0 });
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
