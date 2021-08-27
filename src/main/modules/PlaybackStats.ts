import { paths } from './Paths';
import fs from 'fs';
import { win } from '../../background';
import { TrackStatType, TrackType } from '@/types';
import { removeDuplicates, sortArrayOfObjects } from '@/shared-utils';
export class PlaybackStats {
  playedFiles: Array<TrackType> = [];
  tracksStats: Array<TrackStatType> = [];
  constructor () {
    if (fs.existsSync(paths.playbackStatsLocation)) {
      try {
        const data = JSON.parse(
          fs.readFileSync(paths.playbackStatsLocation, 'utf-8')
        );
        this.playedFiles = data.playedFiles;
        this.tracksStats = data.tracksStats;
      } catch (error) {
        console.log('An error occurred while reading playbackStats file');
      }
    }
  }

  public addFile (file: TrackType) {
    this.playedFiles.unshift(file);
    this.playedFiles = this.playedFiles.slice(0, 100);
    this.generateStats();
  }

  private generateStats () {
    const duplicatesCounter: any = {};
    this.playedFiles.forEach(track => {
      duplicatesCounter[track.fileLocation] =
        (duplicatesCounter[track.fileLocation] || 0) + 1;
    });
    const stats: TrackStatType[] = [];
    Object.entries(duplicatesCounter).forEach(entry => {
      const playStats: TrackStatType = {
        trackLocation: entry[0],
        numberOfPlays: entry[1] as number
      };
      stats.push(playStats);
    });
    this.tracksStats = stats;
    sortArrayOfObjects(this.tracksStats, 'numberOfPlays');
    // console.log("Stats");
    // console.log(this.tracksStats[0]);
    this.saveChanges();
  }
  public saveChanges () {
    const stats = {
      playedFiles: this.playedFiles.filter(file => file !== undefined),
      tracksStats: this.tracksStats.filter(file => file !== undefined)
    };
    fs.writeFile(paths.playbackStatsLocation, JSON.stringify(stats), err => {
      if (err) console.log(err);
    });
  }

  public get recentlyPlayedTracks (): Array<TrackType> {
    let tracks = [...this.playedFiles];
    tracks = removeDuplicates(tracks, 'fileLocation');
    tracks.slice(0, 19);
    return tracks;
  }

  public get getPlayStats (): Array<TrackStatType> {
    return this.tracksStats;
  }
}
