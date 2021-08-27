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
import { ipcRenderer, ipc } from 'electron';
import { mapActions, mapMutations } from 'vuex';
import { removeDuplicates } from '@/shared-utils';
import { sendMessageToNode } from '@/renderer/utils';

export default {
  name: 'IpcListener',
  methods: {
    ...mapMutations([
      'addTrack',
      'updateTrack',
      'deleteTrack',
      'restoreTracks',
      'restoreRecentlyPlayed',
      'restorePlaylists',
      'restoreSettings',
      'setPlayStats',
      'popNotification',
      'setDownloadedArtistInfo',
      'removeTrackFromPendingDownloads',
      'updateTrackDownloadProgress',
      'addToCompletedDownloads',
      'updatePendingTrackState',
      'seIstOnlineState',
      'setPlayingTrack'
    ]),
    ...mapActions([
      'generateAlbumsData',
      'generateArtistsData',
      'generateFoldersData',
      'sortTracks',
      'removeSelectedTracksFromAppState',
      'fetchArtistsInfo',
      'getLyrics'
    ])
  },
  computed: {
    appIsOnline() {
      return this.$store.state.appIsOnline;
    }
  },
  mounted() {
    ipcRenderer.send('initializeSettings');
    ipcRenderer.send('initializeApp');
    ipcRenderer.on('newTrack', (e, newTrack) => {
      this.addTrack(newTrack);
    });
    ipcRenderer.on('playThisTrack', (e, track) => {
      if (document.querySelector('audio')) {
        document.querySelector('audio').muted = false;
      }
      this.setPlayingTrack({ track, index: 0 });
    });

    ipcRenderer.on('updateTrack', (e, updatedTrack) => {
      this.updateTrack(updatedTrack);
    });
    ipcRenderer.on('deleteComplete', (e, pathToTrack) => {
      this.deleteTrack(pathToTrack);
    });
    ipcRenderer.on('processedFiles', (e, tracks) => {
      this.hideOnboard = true;
      this.restoreTracks(tracks);
      this.generateAlbumsData();
      this.generateArtistsData();
      this.generateFoldersData();
      if (this.appIsOnline) {
        this.fetchArtistsInfo();
        this.getLyrics();
      }
    });
    ipcRenderer.on('playStats', (e, tracks) => {
      this.setPlayStats(tracks);
    });
    ipcRenderer.on('recentlyPlayed', (e, tracks) => {
      this.restoreRecentlyPlayed(tracks);
    });
    ipcRenderer.on('userPlaylists', (e, playlists) => {
      this.restorePlaylists(playlists);
    });
    ipcRenderer.on('userSettings', (e, payload) => {
      this.restoreSettings(payload);
    });
    ipcRenderer.on('foldersToScan', (e, folders) => {
      this.setScannedFolders(folders);
    });
    ipcRenderer.on('removeSelectedTracks', () => {
      this.removeSelectedTracksFromAppState();
    });
    ipcRenderer.on('playFirstTrack', () => {
      this.playFirstTrack();
    });
    ipcRenderer.on('parsingDone', () => {
      this.generateAlbumsData();
      this.generateArtistsData();
      this.generateFoldersData();
      this.sortTracks('dateAdded');
      this.hideOnboard = true;
      this.popNotification();
    });
    ipcRenderer.on('parsingProgress', (e, [currentIndex, total]) => {
      if (currentIndex === 100) {
        this.hideOnboard = true;
        console.log(total);
      }
    });
    const dbInfo = localStorage.getItem('downloadedArtists');
    let downloadedArtists = [];
    if (dbInfo) {
      downloadedArtists = JSON.parse(dbInfo);
    }
    ipcRenderer.on('downloadedArtistPictureInfo', (e, payload) => {
      downloadedArtists.push(payload);
      downloadedArtists = removeDuplicates(downloadedArtists, 'name');
      localStorage.setItem(
        'downloadedArtists',
        JSON.stringify(removeDuplicates(downloadedArtists, 'name'))
      );
      this.setDownloadedArtistInfo(downloadedArtists);
    });

    // FLBING LISTENERS
    ipcRenderer.on('bingDownloadProgress', (e, payload) => {
      this.updateTrackDownloadProgress(payload);
    });
    ipcRenderer.on('bingTrackDownloaded', (e, payload) => {
      this.removeTrackFromPendingDownloads(payload);
    });
    ipcRenderer.on('downloadedTrack', (e, payload) => {
      console.log("I've received the newly downloaded track");
      console.log(payload);
      this.addToCompletedDownloads(payload);
      setTimeout(() => {
        this.generateFoldersData();
      }, 1000);
    });
    ipcRenderer.on('updatePendingTrackState', (e, payload) => {
      console.log('updating Pending Track State to');
      console.table(payload);
      this.updatePendingTrackState(payload);
    });
    ipcRenderer.on('isOnline', (e, payload) => {
      console.log(payload);
    });
    // window.addEventListener('online', () => {
    //   this.getLyrics();
    //   this.fetchArtistsInfo();
    // });

    // Record that the app has been launched

    if (localStorage.getItem('launches')) {
      let launches = localStorage.getItem('launches');
      launches += 1;
      localStorage.setItem('launches', launches);
    } else {
      localStorage.setItem('launches', 1);
    }
    setInterval(() => {
      ipcRenderer.invoke('checkOnline').then(result => {
        this.seIstOnlineState(result);
      });
    }, 3000);
    setTimeout(() => {
      console.log('App is ' + this.appIsOnline);
      if (this.appIsOnline) {
        // sendMessageToNode('sendUsageStats');
      }
    }, 4000);
  }
};
</script>
