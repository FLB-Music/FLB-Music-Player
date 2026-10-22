import { removeDuplicates } from '@/shared-utils';
import { TrackType } from '@/types';
import fs from 'fs';
import { paths } from './Paths';

export class FilesTracker {
  private processedFiles: Array<TrackType> = [];

  constructor() {
    if (fs.existsSync(paths.filesTrackerLocation)) {
      try {
        const data = JSON.parse(
          fs.readFileSync(paths.filesTrackerLocation, 'utf-8')
        );
        this.processedFiles = data;
        this.checkForDeletedTracks();
      } catch (error) {
        console.log('Error in reading the file tracker file');
        console.log(error);
      }
    }
  }
  addFile(track: TrackType) {
    this.processedFiles.unshift(track);
  }
  addMultipleTracks(tracks: TrackType[]) {
    this.processedFiles = [...this.processedFiles, ...tracks];
  }
  updateFile(track: TrackType, save = true) {
    const index = this.processedFiles.findIndex(
      processedTrack => processedTrack.fileLocation === track.fileLocation
    );
    if (index === -1) {
      this.processedFiles.unshift(track);
    } else {
      this.processedFiles[index] = track;
    }
    if (save) this.saveChanges()
  }
  checkForDeletedTracks() {
    console.log('Checking for deleted tracks');
    const deletedTracks = this.processedFiles.filter(
      track => !fs.existsSync(track.fileLocation)
    );
    deletedTracks
      .map(track => track.fileLocation)
      .forEach(path => this.deleteFile(path));
  }
  deleteFile(pathToTrack: string) {
    const indexOfDeletedTrack = this.processedFiles.findIndex(
      track => track.fileLocation === pathToTrack
    );
    if (indexOfDeletedTrack === -1) return;
    this.processedFiles.splice(indexOfDeletedTrack, 1);
  }
  clearData() {
    this.processedFiles = [];
  }
  async saveChanges() {
    try {

      fs.writeFileSync(
        paths.filesTrackerLocation,
        JSON.stringify(removeDuplicates(this.processedFiles, 'fileLocation'))
      );
      console.log("File tracker updated");
    } catch (err) {
      console.log('Error saving file tracker');
      console.log(err);
    }
  }

  public get getTracks(): Array<TrackType> {
    return this.processedFiles;
  }
}
