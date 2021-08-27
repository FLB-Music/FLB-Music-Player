import { removeDuplicates } from '@/shared-utils';
import { TrackType } from '@/types';
import fs from 'fs';
import { paths } from './Paths';

export class FilesTracker {
  private processedFiles: Array<TrackType> = [];

  constructor () {
    if (fs.existsSync(paths.filesTrackerLocation)) {
      try {
        const data = JSON.parse(
          fs.readFileSync(paths.filesTrackerLocation, 'utf-8')
        );
        this.processedFiles = data;
        this.checkForDeletedTracks();
      } catch (error) {
        console.log('Error in reading the file tracker file');
      }
    }
  }
  addFile (track: TrackType) {
    this.processedFiles.unshift(track);
  }
  updateFile (track: TrackType) {
    const index = this.processedFiles.findIndex(
      track => track.fileLocation === track.fileLocation
    );
    this.processedFiles[index] = track;
    this.saveChanges();
  }
  checkForDeletedTracks () {
    console.log('Checking for deleted tracks');
    const deletedTracks = this.processedFiles.filter(
      track => !fs.existsSync(track.fileLocation)
    );
    deletedTracks
      .map(track => track.fileLocation)
      .forEach(path => this.deleteFile(path));
  }
  deleteFile (pathToTrack: string) {
    const indexOfDeletedTrack = this.processedFiles.findIndex(
      track => track.fileLocation === pathToTrack
    );
    this.processedFiles.splice(indexOfDeletedTrack, 1);
    this.saveChanges();
  }
  clearData () {
    this.processedFiles = [];
  }
  saveChanges () {
    fs.writeFile(
      paths.filesTrackerLocation,
      JSON.stringify(removeDuplicates(this.processedFiles, 'fileLocation')),
      err => {
        if (err) console.log(err);
      }
    );
  }

  public get getTracks (): Array<TrackType> {
    return this.processedFiles;
  }
}
