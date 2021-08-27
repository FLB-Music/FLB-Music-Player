<template>
  <div class="bingTrack">
    <div class="info">
      <img class="coverArt" :src="trackInfo.album.cover" />
      <div class="flex-col">
        <p style="font-family: inherit" class="trackTitle">
          {{ trackInfo.title }}
        </p>
        <p style="font-size: 0.9rem" class="artist" @click="getArtistData">
          {{ trackInfo.artist.name }}
        </p>
      </div>
    </div>
    <div class="trackActions">
      <base-button
        icon="play"
        :small="true"
        @click.native="searchTrackInYouTube"
      />
      <base-button
        v-if="!trackAlreadyDownloaded"
        icon="archive-box"
        :small="true"
        :loading="isBeingDownloaded"
        @click.native="getTrackDownloadURL"
      />
      <base-button v-else icon="check" :small="true" />
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import { ipcRenderer } from 'electron';
import { cleanUpText } from '@/shared-utils';
import searchYoutube from 'youtube-api-v3-search';
export default {
  name: 'BingTrack',

  data() {
    return {
      downloadURL: '',
      artistData: {
        name: null,
        cover: null,
        tracks: [],
        albums: []
      },
      requestOptions: {
        method: 'GET',
        redirect: 'follow'
      }
    };
  },
  computed: {
    isBeingDownloaded() {
      return (
        this.$store.state.BingDownloadManager.pendingDownloads.findIndex(
          track => track.id === this.trackInfo.id
        ) !== -1
      );
    },
    trackAlreadyDownloaded() {
      const index =
        this.$store.state.TabsManager.tabsData.addedTracks.findIndex(
          track =>
            track.defaultTitle === this.trackInfo.title &&
            track.defaultArtist === this.trackInfo.artist.name
        );
      if (index > -1) {
        return true;
      }
      return false;
    }
  },
  methods: {
    ...mapMutations([
      'setPlayingTrack',
      'setTrackDownloadURL',
      'addTrackToPendingDownloads',
      'updatePendingTrackState',
      'removeTrackFromPendingDownloads'
    ]),
    playPreview() {
      const remappedTrack = {};
      remappedTrack.defaultTitle = this.trackInfo.title;
      remappedTrack.defaultArtist = this.trackInfo.artist.name;
      remappedTrack.album = this.trackInfo.album.title;
      remappedTrack.albumArt = this.trackInfo.album.cover;
      remappedTrack.previewURL = this.trackInfo.preview;
      console.log(remappedTrack);
      this.setPlayingTrack({
        track: remappedTrack,
        index: -10
      });
    },
    getArtistData() {
      fetch(
        `https://api.deezer.com/artist/${this.trackInfo.artist_id}`,
        this.requestOptions
      )
        .then(response => response.text())
        .then(result => {
          this.artistData.name = JSON.parse(result).name;
          this.artistData.cover = JSON.parse(result).picture_big;
          fetch(
            `https://api.deezer.com/artist/${this.trackInfo.artist_id}/top?limit=50`,
            this.requestOptions
          )
            .then(response => response.text())
            .then(result => {
              this.artistData.tracks = JSON.parse(result).data;
            })
            .catch(error => console.log('error', error));
          fetch(
            `https://api.deezer.com/artist/${this.trackInfo.artist_id}/albums`,
            this.requestOptions
          )
            .then(response => response.text())
            .then(result => {
              this.artistData.albums = JSON.parse(result).data;
              this.setBingArtistInfo(this.artistData);
              document.body.classList.remove('loading');
            })
            .catch(error => console.log('error', error));
        })
        .catch(error => {
          document.body.classList.remove('loading');
          console.log('error', error);
        });
    },
    async searchTrackInYouTube() {
      const searchQuery = `${this.trackInfo.title} by ${this.trackInfo.artist.name}`;

      const result = await searchYoutube(
        'AIzaSyDWHSG_xfUwWHUdrirVFr41gd23LO-VnEc',
        {
          q: searchQuery,
          part: 'snippet',
          type: 'music'
        }
      );
      // console.log(result);
      console.log(result.items[0].snippet.title);
    },
    getTrackDownloadURL() {
      // this.openDownloadsWidget();
      this.addTrackToPendingDownloads({
        ...this.trackInfo,
        progressInfo: {
          speed: 0,
          total: 0,
          progress: 0
        },
        downloadURL: ''
      });

      const searchQuery = `${encodeURI(
        cleanUpText(this.trackInfo.title)
      )} ${encodeURI(cleanUpText(this.trackInfo.artist.name))}`;

      const myHeaders = new Headers();
      myHeaders.append('accept', 'application/json');
      myHeaders.append('X-API-KEY', 'RPHGBA-YTUUDP-FUZWMW-YBAEGW-ARQ');
      const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
      };

      fetch(
        `https://thearq.tech/deezer?query=${searchQuery}&count=1`,
        requestOptions
      )
        .then(response => response.text())
        .then(result => {
          const responseRes = JSON.parse(result);
          if (responseRes.result === 'list index out of range') {
            this.updatePendingTrackState({
              id: this.trackInfo.id,
              stateCode: 1
            });
          } else {
            const targetTrack = responseRes.result[0];
            this.downloadURL = targetTrack.url;
            this.setTrackDownloadURL({
              id: this.trackInfo.id,
              url: this.downloadURL
            });

            this.sendTrackForDownload();
          }
        })
        .catch(error => {
          this.updatePendingTrackState({
            id: this.trackInfo.id,
            stateCode: 2
          });
        });
    },
    sendTrackForDownload() {
      const tags = {
        title: this.trackInfo.title.replace(/(")|(\/)/g, ''),
        artist: this.trackInfo.artist.name,
        album: this.trackInfo.album.title,
        APIC: this.trackInfo.album.cover_big
      };
      const artistInfo = {
        name: this.trackInfo.artist.name,
        picture: this.trackInfo.artist.picture
      };
      ipcRenderer.send('downloadBingTrack', {
        trackURL: this.downloadURL,
        trackID: this.trackInfo.id,
        tags,
        artistInfo
      });
    },
    openDownloadsWidget() {
      if (
        !document
          .querySelector('.BingDownloadsWidget')
          .classList.contains('showDownloadWidget')
      ) {
        document.querySelector('.widgetToggleBt').click();
      }
    }
  },
  props: {
    trackInfo: Object
  }
};
</script>

<style lang="scss">
.bingTrack {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.377);
  .info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  p {
    font-size: 0.95rem;
    font-family: inherit;
  }
  .coverArt {
    width: 35px;
  }
  .trackBt {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0);
    padding: 5px;
    border-radius: 15px;
    margin-top: 5px;
    margin-bottom: 5px;
    margin-right: 10px;
  }
  .artist {
    font-size: 1em;
  }
  .trackActions {
    display: flex;
  }
}
.track:hover {
  cursor: default !important;
  .trackBt:hover {
    cursor: pointer;
    border: 1px solid rgb(255, 255, 255);
  }
}
</style>
