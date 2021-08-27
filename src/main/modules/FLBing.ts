import fs from 'fs';
import path from 'path';
import https from 'https';

import { win, writeTags } from '../../background';
import { paths } from './Paths';
import { deleteFile, sendMessageToRenderer } from '../utils';
import { createParsedTrack } from '../core/createParsedTrack';
import { BingDownloadingTrack } from '@/types/FLBing/BingTypes';

export class FLBing {
  downloadQueue: Array<any> = [];
  downloadState: 'downloading' | 'empty' = 'empty';
  downloadCanceled = false;
  currentlyDownloadingTrackInfo: BingDownloadingTrack = {
    fileStream: null,
    trackInfo: null
  };
  addToDownloadQueue (payload: any) {
    const newTrackToDownload = {
      payload,
      trackLocation: path.join(paths.flbingFolder, payload.tags.title) + '.mp3'
    };
    this.downloadQueue.push(newTrackToDownload);
    if (this.downloadState === 'empty') {
      sendMessageToRenderer('updatePendingTrackState', {
        id: payload.trackID,
        stateCode: 3
      });
      console.log('Queue is empty, beginning download');
      this.downloadFirstTrackInTheQueue();
    } else {
      sendMessageToRenderer('updatePendingTrackState', {
        id: payload.trackID,
        stateCode: 4
      });
      console.log("There's something downloading let me wait");
    }
  }
  removeFromDownloadQueue (id: string) {
    this.downloadQueue = this.downloadQueue.filter(track => track.id !== id);
  }
  downloadFirstTrackInTheQueue () {
    // get download info from the first track in the queue
    const trackToDownload = this.downloadQueue[0];
    // remove the task from the queue after its download starts
    this.downloadQueue.shift();
    // Notify the user download has started
    sendMessageToRenderer(
      'normalMsg',
      `Downloading ${trackToDownload.payload.tags.title} by ${trackToDownload.payload.tags.artist}`
    );

    const fileStream = fs.createWriteStream(trackToDownload.trackLocation);
    this.currentlyDownloadingTrackInfo.trackInfo = trackToDownload;
    this.currentlyDownloadingTrackInfo.fileStream = fileStream;
    this.downloadState = 'downloading';

    this.downloadCanceled = false;

    https
      .get(trackToDownload.payload.trackURL, response => {
        let fileSize = 0;
        let percent = 0;
        let downloaded = 0;

        sendMessageToRenderer('updatePendingTrackState', {
          id: trackToDownload.payload.trackID,
          stateCode: 5
        });

        response.on('readable', () => {
          fileSize = parseInt(response.headers['content-length']!);
          let chunk;
          while ((chunk = response.read(2048))) {
            if (this.downloadCanceled) {
              break;
            } else {
              fileStream.write(chunk);
              downloaded += 2048;
              percent = Math.trunc((downloaded / fileSize) * 100);
              this.sendDownloadProgress(
                trackToDownload.payload.trackID,
                percent
              );
              console.log('Downloaded ' + percent + '%');
            }
          }
        });
        response.on('end', () => {
          fileStream.end();
          fileStream.close();
          this.writeTrackTags(
            trackToDownload.trackLocation,
            trackToDownload.payload.tags
          );
          sendMessageToRenderer(
            'successMsg',
            `${trackToDownload.payload.tags.title} by ${trackToDownload.payload.tags.artist} Downloaded 🚀`
          );
          sendMessageToRenderer('bingTrackDownloaded', trackToDownload.trackID);
          console.log('Track Downloaded 🚀');
          this.moveToNextDownload();
        });
        response.on('error', () => {
          sendMessageToRenderer('updatePendingTrackState', {
            id: trackToDownload.payload.trackID,
            stateCode: 7
          });
          console.log('Error in Downloading');
          fileStream.end();
          fileStream.close();
          deleteFile(trackToDownload.trackLocation, true);
          sendMessageToRenderer(
            'dangerMsg',
            `Error Downloading ${trackToDownload.payload.tags.title} by ${trackToDownload.payload.tags.artist}`
          );
          this.moveToNextDownload();
        });
      })
      .on('error', () => {
        sendMessageToRenderer('updatePendingTrackState', {
          id: trackToDownload.payload.trackID,
          stateCode: 7
        });
        win.webContents.send(
          'dangerMsg',
          `Error Downloading ${trackToDownload.payload.tags.title} by ${trackToDownload.payload.tags.artist}`
        );
        console.log('Error in Downloading');
        this.cancelCurrentDownload();
      });

    fileStream.on('error', () => {
      console.log('Error while downloading');
      sendMessageToRenderer(
        'dangerMsg',
        `An Error occurred while downloading ${trackToDownload.payload.tags.title}`
      );
      this.cancelCurrentDownload();
    });
  }
  moveToNextDownload () {
    if (this.downloadQueue[0]) {
      this.downloadFirstTrackInTheQueue();
      console.log('Moving on to the next track');
    } else {
      this.downloadState = 'empty';
    }
  }

  sendDownloadProgress (trackID: any, progress: any) {
    win.webContents.send('bingDownloadProgress', {
      id: trackID,
      progress
    });
  }
  async writeTrackTags (location: any, tags: any) {
    const success = writeTags(location, tags, true);
    console.log('Writing tags first');
    console.log(tags);
    console.log(location);
    console.log('Tag write is ' + success);
    if ((await success) === true) {
      createParsedTrack(location)
        .then(track => {
          console.log('Sending Downloaded track');
          win.webContents.send('downloadedTrack', track);
          win.webContents.send('newTrack', track);
        })
        .catch(err => {
          console.log('Some error while parsing the downloaded track');
        });
    }
  }
  handleInternetLost () {
    this.cancelCurrentDownload();
    sendMessageToRenderer('updatePendingTrackState', {
      id: this.currentlyDownloadingTrackInfo.trackInfo.trackID || 0,
      stateCode: 2
    });
  }
  cancelCurrentDownload () {
    this.downloadCanceled = true;
    if (this.currentlyDownloadingTrackInfo.fileStream) {
      this.currentlyDownloadingTrackInfo.fileStream.end();
      this.currentlyDownloadingTrackInfo.fileStream.close();
      deleteFile(
        this.currentlyDownloadingTrackInfo.trackInfo.trackLocation,
        true
      );
    }
    // this.moveToNextDownload()
  }
}
