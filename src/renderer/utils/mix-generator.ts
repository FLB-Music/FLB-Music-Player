import {
  removeDuplicates,
  shuffleArray,
  sortArrayOfObjects
} from '@/shared-utils';
import { mixTyping, TrackStatType, TrackType } from '@/types';

export class MixGenerator {
  allTracks: TrackType[];
  mixes: mixTyping[] = [];
  recentlyPlayedTracks: TrackType[];
  playStats: TrackStatType[];
  constructor (
    playStats: Array<TrackStatType>,
    allTracks: Array<TrackType>,
    recentlyPlayedTracks: Array<TrackType>
  ) {
    this.playStats = playStats;
    this.allTracks = [...allTracks];
    this.recentlyPlayedTracks = [...recentlyPlayedTracks];
    this.favoriteTracks();
    this.recentlyAddedTracks();
    this.twoArtistMashUp();
    this.tenForgottenTracks();
  }
  favoriteTracks () {
    if (this.playStats) {
      const topTwentyPlays = this.playStats
        .slice(0, 20)
        .map(playStat => playStat.trackLocation)
        .join(',');
      const favoriteTracks = this.allTracks.filter(track =>
        topTwentyPlays.includes(track.fileLocation)
      );
      if (favoriteTracks[0] && favoriteTracks[1]) {
        const mix: mixTyping = {
          name: "Tracks you've fallen for 💘",
          info: `Your Most Played tracks like 👉 | ${favoriteTracks[0].defaultTitle} |  and  | ${favoriteTracks[1].defaultTitle} |`,
          tracks: removeDuplicates(favoriteTracks, 'defaultTitle')
        };
        this.mixes.push(mix);
      }
    }
  }
  twoArtistMashUp () {
    const topTwentyPlays = this.playStats
      .slice(0, 20)
      .map(playStat => playStat.trackLocation)
      .join(',');
    const favoriteTracks = this.allTracks.filter(track =>
      topTwentyPlays.includes(track.fileLocation)
    );
    const favoriteArtists = favoriteTracks.map(track => track.defaultArtist);
    const twoRandomArtists = shuffleArray(favoriteArtists).slice(0, 2);
    if (twoRandomArtists[1] && twoRandomArtists[1] !== twoRandomArtists[0]) {
      const firstArtistTracks = this.allTracks.filter(
        track => track.defaultArtist === twoRandomArtists[0]
      );
      const secondArtistTracks = this.allTracks.filter(
        track => track.defaultArtist === twoRandomArtists[1]
      );
      const mashedTracks = shuffleArray([
        ...firstArtistTracks,
        ...secondArtistTracks
      ]);
      const mix: mixTyping = {
        name: 'Power Duo 🎭',
        info: `Bangers from 🎤 ${twoRandomArtists[0]} and 🎤${twoRandomArtists[1]}`,
        tracks: mashedTracks
      };
      this.mixes.push(mix);
    }
  }
  tenForgottenTracks () {
    const titlesOfRecentlyPlayedTracks = this.recentlyPlayedTracks.map(
      track => track.defaultTitle
    );
    const shuffledTracks = shuffleArray(this.allTracks);
    let forgottenTracks: TrackType[] = [];
    shuffledTracks.forEach(track => {
      if (!titlesOfRecentlyPlayedTracks.includes(track.defaultTitle)) {
        forgottenTracks.push(track);
      }
    });
    forgottenTracks = forgottenTracks.splice(0, 10);
    if (forgottenTracks.length > 0) {
      const mix: mixTyping = {
        name: 'Tracks you might have forgotten 🤯',
        info: `Remember 👉 ${forgottenTracks[0].defaultTitle}, ${forgottenTracks[1].defaultTitle} and others...`,
        tracks: forgottenTracks
      };
      this.mixes.push(mix);
    }
  }
  recentlyAddedTracks () {
    const allTracksCopy = [...this.allTracks];
    sortArrayOfObjects(allTracksCopy, 'dateAdded');
    allTracksCopy.reverse();
    const topTenRecentlyAddedTracks = allTracksCopy.splice(0, 10);
    if (topTenRecentlyAddedTracks.length > 0) {
      const mix: mixTyping = {
        name: 'Fresh and Juicy 🧃',
        info: `Newly added tracks like 👉 ${topTenRecentlyAddedTracks[0].defaultTitle}, ${topTenRecentlyAddedTracks[1].defaultTitle} and others...`,
        tracks: removeDuplicates(topTenRecentlyAddedTracks, 'defaultTitle')
      };
      this.mixes.push(mix);
    }
  }
  clearDataToSaveRam () {
    setTimeout(() => {
      this.recentlyPlayedTracks = [];
      this.allTracks = [];
    }, 2000);
  }
  public get allMixes (): mixTyping[] {
    this.clearDataToSaveRam();
    return this.mixes;
  }
}
