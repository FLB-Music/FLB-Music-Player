<template>
  <div>
    <svg
      style="visibility: hidden; position: absolute"
      width="0"
      height="0"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
    >
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  </div>
</template>
<script>
import { ipcRenderer } from "electron";
import { mapActions, mapMutations } from "vuex";
import { removeDuplicates } from "@/shared-utils";
import { sendMessageToNode } from "@/renderer/utils";

export default {
  name: "IpcListener",
  data() {
    return {
      statsSent: false,
      queuePushTimer: null,
    };
  },
  methods: {
    ...mapMutations([
      "addTrack",
      "addMultipleTracks",
      "updateTrack",
      "updateTrackCover",
      "deleteTrack",
      "restoreTracks",
      "restoreRecentlyPlayed",
      "restorePlaylists",
      "restoreSettings",
      "setPlayStats",
      "popNotification",
      "pushNotification",
      "setDownloadedArtistInfo",
      "removeTrackFromPendingDownloads",
      "updateTrackDownloadProgress",
      "addToCompletedDownloads",
      "updatePendingTrackState",
      "seIstOnlineState",
      "setPlayingTrack",
      "queueTracksFromGuest",
      "removeQueuedTracksByGuest",
    ]),
    ...mapActions([
      "generateAlbumsData",
      "generateArtistsData",
      "generateFoldersData",
      "sortTracks",
      "removeSelectedTracksFromAppState",
      "fetchArtistsInfo",
      "getLyrics",
    ]),
    playLastPlayedTrack() {
      //load last played track
      const lastPlayedTrack = localStorage.getItem("lastPlayedTrack");
      if (lastPlayedTrack) {
        const trackObj = {
          track: JSON.parse(lastPlayedTrack),
          index: 0,
        };
        this.setPlayingTrack(trackObj);
        setTimeout(() => {
          document.querySelector("#toggle_play").click();
        }, 0);
        console.log("playing last track");
      }
    },
    /**
     * Sends the current queue to the main process so the party server can
     * share it with the guests. Only the host of the party pushes this.
     */
    pushPartyQueueSnapshot() {
      if (this.$store.state.PartyManager.mode !== "host") return;
      clearTimeout(this.queuePushTimer);
      this.queuePushTimer = setTimeout(() => {
        const playback = this.$store.state.PlaybackManger;
        ipcRenderer.send("partyQueueUpdate", {
          queue: playback.customQueue,
          nowPlaying: playback.playingTrackInfo.track,
          playing: playback.audioState.playing,
        });
      }, 250);
    },
  },
  computed: {
    appIsOnline() {
      return this.$store.state.appIsOnline;
    },
    /** Changes in any of these mean the party queue has to be pushed. */
    partyQueueSnapshotSource() {
      return {
        queue: this.$store.state.PlaybackManger.customQueue,
        nowPlaying: this.$store.state.PlaybackManger.playingTrackInfo.track,
        playing: this.$store.state.PlaybackManger.audioState.playing,
      };
    },
  },
  watch: {
    appIsOnline() {
      if (this.appIsOnline) {
        this.fetchArtistsInfo();
        this.getLyrics();
      }
    },
    partyQueueSnapshotSource: {
      deep: true,
      handler() {
        this.pushPartyQueueSnapshot();
      },
    },
  },
  mounted() {
    ipcRenderer.send("initializeSettings");
    ipcRenderer.send("initializeApp");

    // PARTY MODE LISTENERS
    ipcRenderer.on("partyGuestTrackRequested", (e, payload) => {
      const { fileLocation, suggestedBy, uploadedTrack } = payload;
      if (uploadedTrack) {
        this.queueTracksFromGuest([{ ...uploadedTrack, suggestedBy }]);
        return;
      }
      const track = this.$store.state.TabsManager.tabsData.addedTracks.find(
        (candidate) => candidate.fileLocation === fileLocation
      );
      if (track) this.queueTracksFromGuest([{ ...track, suggestedBy }]);
    });
    ipcRenderer.on("partyGuestLeft", (e, payload) => {
      this.removeQueuedTracksByGuest(payload.guestId);
    });
    ipcRenderer.on("partyGuestsUpdate", (e, guests) => {
      this.$store.commit("setGuests", guests);
    });

    ipcRenderer.on("newTrack", (e, newTrack) => {
      this.addTrack(newTrack);
    });
    ipcRenderer.on("userID", (e, id) => {
      localStorage.setItem("userID", id);
    });
    ipcRenderer.on("playThisTrack", (e, track) => {
      if (document.querySelector("audio")) {
        document.querySelector("audio").muted = false;
      }
      this.setPlayingTrack({ track, index: 0 });
    });

    ipcRenderer.on("addMultipleTracks", (e, payload) => {
      this.addMultipleTracks(payload);
    });

    ipcRenderer.on("updatedTrack", (e, updatedTrack) => {
      console.log("Updated Track");
      console.log(updatedTrack);
      this.updateTrack(updatedTrack);
    });
    ipcRenderer.on("coversRepaired", (e, repairedTracks) => {
      if (!repairedTracks || !repairedTracks.length) return;
      repairedTracks.forEach((track) => {
        this.updateTrackCover(track);
      });
      this.generateAlbumsData();
      this.generateArtistsData();
      this.generateFoldersData();
    });
    ipcRenderer.on("deleteComplete", (e, pathToTrack) => {
      this.deleteTrack(pathToTrack);
    });
    ipcRenderer.on("processedFiles", (e, tracks) => {
      this.hideOnboard = true;
      this.restoreTracks(tracks);
      this.generateAlbumsData();
      this.generateArtistsData();
      this.generateFoldersData();
      this.playLastPlayedTrack();
    });
    if (this.appIsOnline) {
      this.fetchArtistsInfo();
      this.getLyrics();
    }
    ipcRenderer.on("playStats", (e, tracks) => {
      this.setPlayStats(tracks);
    });
    ipcRenderer.on("recentlyPlayed", (e, tracks) => {
      this.restoreRecentlyPlayed(tracks);
    });
    ipcRenderer.on("userPlaylists", (e, playlists) => {
      this.restorePlaylists(playlists);
    });
    ipcRenderer.on("userSettings", (e, payload) => {
      this.restoreSettings(payload);
    });
    ipcRenderer.on("foldersToScan", (e, folders) => {
      this.setScannedFolders(folders);
    });
    ipcRenderer.on("removeSelectedTracks", () => {
      this.removeSelectedTracksFromAppState();
    });
    ipcRenderer.on("playFirstTrack", () => {
      this.playFirstTrack();
    });
    ipcRenderer.on("parsingDone", () => {
      this.generateAlbumsData();
      this.generateArtistsData();
      this.generateFoldersData();
      this.sortTracks("dateAdded");
      this.hideOnboard = true;
      this.popNotification();
    });
    ipcRenderer.on("parsingProgress", (e, [currentIndex, total]) => {
      if (currentIndex === 100) {
        this.hideOnboard = true;
        console.log(total);
      }
      this.pushNotification({
        title: this.t('notification.addingTracks'),
        subTitle: `${currentIndex}/${total}`,
        type: "persist",
      });
    });
    const dbInfo = localStorage.getItem("downloadedArtists");
    let downloadedArtists = [];
    if (dbInfo) {
      downloadedArtists = JSON.parse(dbInfo);
    }
    ipcRenderer.on("downloadedArtistPictureInfo", (e, payload) => {
      downloadedArtists.push(payload);
      downloadedArtists = removeDuplicates(downloadedArtists, "name");
      localStorage.setItem(
        "downloadedArtists",
        JSON.stringify(removeDuplicates(downloadedArtists, "name"))
      );
      this.setDownloadedArtistInfo(downloadedArtists);
    });

    // FLBING LISTENERS
    ipcRenderer.on("bingDownloadProgress", (e, payload) => {
      this.updateTrackDownloadProgress(payload);
    });
    ipcRenderer.on("bingTrackDownloaded", (e, payload) => {
      this.removeTrackFromPendingDownloads(payload);
    });
    ipcRenderer.on("downloadedTrack", (e, payload) => {
      console.log("I've received the newly downloaded track");
      console.log(payload);
      this.addToCompletedDownloads(payload);
      setTimeout(() => {
        this.generateFoldersData();
      }, 1000);
    });
    ipcRenderer.on("updatePendingTrackState", (e, payload) => {
      console.log("updating Pending Track State to");
      console.table(payload);
      this.updatePendingTrackState(payload);
    });
    ipcRenderer.on("isOnline", (e, payload) => {
      console.log(payload);
    });
    if (localStorage.getItem("launches")) {
      let launches = localStorage.getItem("launches");
      launches += 1;
      localStorage.setItem("launches", launches);
    } else {
      localStorage.setItem("launches", 1);
    }
    setInterval(() => {
      ipcRenderer.invoke("checkOnline").then((result) => {
        if (result && !this.statsSent) {
          sendMessageToNode("sendUsageStats");
          this.statsSent = true;
        }
        this.seIstOnlineState(result);
      });
    }, 3000);
  },
};
</script>
