import { sendMessageToNode } from '@/renderer/utils';
import { removeDuplicates, sortArrayOfObjects } from '@/shared-utils';
import {
  AlbumType,
  ArtistInfoInterface,
  ArtistType,
  FolderInfoType,
  FolderParsedType,
  PlaylistType,
  TrackType
} from '@/types';
import { ActionTree } from 'vuex';
import TrackSelector from './track-selector';
import PlaybackManger from './playback-manger';

interface TabsManagerStateInterface {
  tabsData: {
    addedTracks: Array<TrackType>;
    recentlyPlayedTracks: Array<TrackType>;
    artists: Array<ArtistType>;
    albums: Array<AlbumType>;
    playlists: Array<PlaylistType>;
    folders: Array<FolderParsedType>;
  };
  downloadedArtistPictures: Array<ArtistInfoInterface>;
}
const state: TabsManagerStateInterface = {
  tabsData: {
    addedTracks: [],
    recentlyPlayedTracks: [],
    artists: [],
    albums: [],
    playlists: [
      {
        name: 'Favorites',
        tracks: []
      }
    ],
    folders: []
  },
  downloadedArtistPictures: []
};
const mutations = {
  addTrack (state: TabsManagerStateInterface, payload: TrackType) {
    const trackAlreadyAdded = state.tabsData.addedTracks.some(
      (track: TrackType) => track.fileLocation === payload.fileLocation
    );
    if (!trackAlreadyAdded) {
      state.tabsData.addedTracks.push(payload);
    }
  },
  updateTrack (state: TabsManagerStateInterface, payload: TrackType) {
    const indexOfUpdatedTrack = state.tabsData.addedTracks.findIndex(
      track => track.fileLocation === payload.fileLocation
    );
    state.tabsData.addedTracks.splice(indexOfUpdatedTrack, 1);
    state.tabsData.addedTracks.unshift(payload);
    if (
      PlaybackManger.state.playingTrackInfo.track?.fileLocation ===
      payload.fileLocation
    ) {
      PlaybackManger.state.playingTrackInfo.track = payload;
    }
  },
  deleteTrack (state: TabsManagerStateInterface, payload: string) {
    const indexOfDeletedTrack = state.tabsData.addedTracks.findIndex(
      track => track.fileLocation === payload
    );
    state.tabsData.addedTracks.splice(indexOfDeletedTrack, 1);
  },
  restoreTracks (state: TabsManagerStateInterface, payload: Array<TrackType>) {
    state.tabsData.addedTracks = payload;
  },
  restoreRecentlyPlayed (
    state: TabsManagerStateInterface,
    payload: Array<TrackType>
  ) {
    state.tabsData.recentlyPlayedTracks = payload;
  },
  restorePlaylists (
    state: TabsManagerStateInterface,
    payload: Array<PlaylistType>
  ) {
    state.tabsData.playlists = payload;
  },
  createPlaylist (state: TabsManagerStateInterface, payload: string) {
    const newPlaylist: PlaylistType = {
      name: payload,
      tracks: []
    };
    state.tabsData.playlists.push(newPlaylist);
    sendMessageToNode('updatePlaylists', state.tabsData.playlists);
  },
  renameCurrentPlaylist (state: TabsManagerStateInterface, payload: string) {
    state.tabsData.playlists.forEach((playlist: PlaylistType) => {
      if (playlist.name === TrackSelector.state.selectedGroup?.name) {
        playlist.name = payload;
      }
    });
    sendMessageToNode('updatePlaylists', state.tabsData.playlists);
  },
  deletePlaylist (state: TabsManagerStateInterface, payload: string) {
    state.tabsData.playlists.forEach(
      (playlist: PlaylistType, index: number) => {
        if (playlist.name === payload) {
          state.tabsData.playlists.splice(index, 1);
        }
      }
    );
    sendMessageToNode('updatePlaylists', state.tabsData.playlists);
  },
  addSelectedTracksToPlaylist (
    state: TabsManagerStateInterface,
    payload: string
  ) {
    if (payload === 'Favorites') {
      TrackSelector.state.selectedTracks.forEach((track: TrackType) => {
        state.tabsData.playlists[0].tracks.push(track);
      });
      sendMessageToNode('updatePlaylists', state.tabsData.playlists);
      return;
    }
    state.tabsData.playlists.forEach(
      (playlist: PlaylistType, index: number) => {
        if (playlist.name === payload) {
          TrackSelector.state.selectedTracks.forEach((track: TrackType) => {
            state.tabsData.playlists[index].tracks.push(track);
            state.tabsData.playlists[index].tracks = removeDuplicates(
              state.tabsData.playlists[index].tracks,
              'fileLocation'
            );
          });
        }
      }
    );
    sendMessageToNode('updatePlaylists', state.tabsData.playlists);
  },
  deleteSelectedTrackFromPlaylist (
    state: TabsManagerStateInterface,
    payload?: TrackType
  ) {
    // Deletes from the favorites playlist
    if (payload) {
      state.tabsData.playlists[0].tracks.forEach(() => {
        const tindex = state.tabsData.playlists[0].tracks.findIndex(
          track => track.fileLocation === payload.fileLocation
        );
        state.tabsData.playlists[0].tracks.splice(tindex, 1);
      });
      sendMessageToNode('updatePlaylists', state.tabsData.playlists);
      return;
    }
    // deletes from other playlists
    state.tabsData.playlists.forEach(
      (playlist: PlaylistType, pindex: number) => {
        if (playlist.name === TrackSelector.state.selectedGroup?.name) {
          playlist.tracks.forEach(() => {
            TrackSelector.state.selectedTracks.forEach(
              (selectedTrack: TrackType) => {
                const tindex = playlist.tracks.findIndex(
                  track => track.fileLocation === selectedTrack.fileLocation
                );
                state.tabsData.playlists[pindex].tracks.splice(tindex, 1);
              }
            );
          });
        }
      }
    );
    sendMessageToNode('updatePlaylists', state.tabsData.playlists);
  },
  setDownloadedArtistInfo (
    state: TabsManagerStateInterface,
    payload: ArtistInfoInterface[]
  ) {
    state.downloadedArtistPictures = payload;
  }
};
const actions: ActionTree<TabsManagerStateInterface, any> = {
  generateArtistsData: ({ state }) => {
    // clear the current data
    state.tabsData.artists = [];

    // Begin generation algorithm
    // Get a list of artistNames
    const artistNames: Set<string> = new Set(
      state.tabsData.addedTracks
        .map((track: TrackType) => track.artist || track.extractedArtist)
        .filter((artist: string) => artist)
    );

    // Algorithm 👇 to break down artist collabos eg. ['mane','rick,jin'] to ['mane',rick','jin']
    // const artistNamesWithoutCollabos = Array.from(artistNames)
    //     .map(item => item.split(','))
    //     .join()
    //     .split(',')
    // Still debating on whether to do this or a better alternative

    // Loop through each artist to generate artistInfo objects
    artistNames.forEach(artist => {
      const artistInfo: ArtistType = {
        name: artist,
        picture: null,
        tracks: [],
        albums: []
      };

      const tracksFromCurrentArtist = state.tabsData.addedTracks.filter(
        (track: TrackType) =>
          track.artist === artist || track.extractedArtist === artist
      );
      artistInfo.tracks = tracksFromCurrentArtist;

      const albumsFromCurrentArtist: string[] = tracksFromCurrentArtist
        .map((track: TrackType) => track.album)
        .filter((album: string) => album);

      albumsFromCurrentArtist.forEach(album => {
        const newAlbum: AlbumType = {
          name: album,
          artist,
          tracks: tracksFromCurrentArtist.filter(
            (track: TrackType) => track.album === album
          )
        };
        artistInfo.albums.push(newAlbum);
      });
      state.tabsData.artists.unshift(artistInfo);
    });
    sortArrayOfObjects(state.tabsData.artists, 'name');
  },
  generateAlbumsData: ({ state }) => {
    state.tabsData.albums = [];

    const albumNames: Set<string> = new Set(
      state.tabsData.addedTracks
        .map((track: TrackType) => track.album)
        .filter((album: string) => album)
    );

    albumNames.forEach(album => {
      const albumInfo: AlbumType = {
        name: album,
        artist: '',
        tracks: []
      };
      const tracks: TrackType[] = state.tabsData.addedTracks.filter(
        (track: TrackType) => track.album === album
      );
      albumInfo.tracks = tracks;
      albumInfo.artist = tracks[0].artist || tracks[0].extractedArtist;
      state.tabsData.albums.unshift(albumInfo);
    });
    sortArrayOfObjects(state.tabsData.albums, 'name');
  },
  generateFoldersData: ({ state }) => {
    state.tabsData.folders = [];
    let folders: Array<FolderInfoType> = state.tabsData.addedTracks.map(
      (track: TrackType) => track.folderInfo
    );
    folders = removeDuplicates(folders, 'path');
    folders.forEach(folder => {
      const folderInfo: FolderParsedType = {
        name: folder.name,
        path: folder.path,
        tracks: []
      };
      const tracks = state.tabsData.addedTracks.filter(
        (track: TrackType) => track.folderInfo.path === folder.path
      );
      folderInfo.tracks = tracks;
      state.tabsData.folders.unshift(folderInfo);
    });
    sortArrayOfObjects(state.tabsData.folders, 'name');
  },
  findAndGoToArtist ({ state, commit }, payload: string) {
    state.tabsData.artists.forEach((artist: ArtistType) => {
      if (payload === artist.name) {
        commit('selectGroup', artist);
      }
    });
  },
  fetchArtistsInfo ({ state }) {
    const artistsData: ArtistInfoInterface[] = [];
    if (navigator.onLine) {
      const dbInfo = localStorage.getItem('downloadedArtists');
      let downloadedArtists: ArtistInfoInterface[] = [];
      if (dbInfo) {
        downloadedArtists = JSON.parse(dbInfo);
        state.downloadedArtistPictures = downloadedArtists;
      }
      const artists = state.tabsData.artists.map(
        (artist: ArtistType) => artist.name
      );
      artists.forEach((artist: string) => {
        if (
          downloadedArtists.findIndex(
            artistsInfo => artistsInfo.name === artist
          ) !== -1
        )
          return;
        fetch(
          `https://flbing.herokuapp.com/search/?category=artists&query=${artist}`,
          { method: 'GET' }
        )
          .then(response => response.text())
          .then(result => {
            const res = JSON.parse(result).results.slice(0, 1)[0];
            if (res && res.name !== 'X UNDEFINED') {
              if (res.name === artist) {
                const artistInfo = {
                  name: artist,
                  picture: res.picture
                };
                artistsData.push(artistInfo);
                sendMessageToNode('downloadArtistPicture', artistInfo);
              }
            }
          })
          .catch(error => console.log('error', error));
      });
    }
  }
};

export default {
  state,
  actions,
  mutations
};
