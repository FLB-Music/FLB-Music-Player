import { win, writeTags } from '@/background';
import { DownloadProgressInfo } from '@/types/FLBing/BingTypes';
import { createParsedTrack } from '../core/createParsedTrack';
import { sendMessageToRenderer } from '../utils';
import { DownloaderHelper } from 'node-downloader-helper';
import { paths } from './Paths';

export class DownloadManager {
  downloads = [] as any[];
  downloadTrack(payload: any) {
    // const destination = path.join(paths.flbingFolder, payload.tags.title) + '.mp3'
    const source = payload.trackURL;
    const newDownloadInstance = new SparkDownload(source, payload);
    this.downloads.push(newDownloadInstance);
    newDownloadInstance.start();
  }
}

class SparkDownload {
  newDownload: any;
  id: string;
  payloadInfo: any;
  constructor(source: string, payload: any) {
    const dConfig = {
      fileName: {
        name: payload.tags.title,
        ext: '.mp3'
      },
      retry: {
        maxRetries: 3,
        delay: 1000
      },
      removeOnStop: true,
      removeOnFail: true
    };
    this.payloadInfo = payload;
    this.id = payload.trackID;
    this.newDownload = new DownloaderHelper(
      source,
      paths.flbingFolder,
      dConfig
    );

    this.newDownload.on('start', () => {
      sendMessageToRenderer('updatePendingTrackState', {
        id: this.id,
        stateCode: 5
      });
    });

    this.newDownload.on('progress', (progressData: any) => {
      sendDownloadProgress(this.id, progressData);
    });

    this.newDownload.on('end', (downloadInfo: any) => {
      writeTrackTags(downloadInfo.filePath, this.payloadInfo.tags);
      sendMessageToRenderer(
        'successMsg',
        `${this.payloadInfo.tags.title} by ${this.payloadInfo.tags.artist} Downloaded 🚀`
      );
      setTimeout(() => {
        sendMessageToRenderer('bingTrackDownloaded', this.id);
      }, 1000);
    });

    this.newDownload.on('retry', () => {
      sendMessageToRenderer(
        'successMsg',
        `🔁Retrying ${this.payloadInfo.tags.title} by ${this.payloadInfo.tags.artist} Downloaded 🚀`
      );
    });

    this.newDownload.on('stop', () => {
      sendMessageToRenderer(
        'dangerMsg',
        `💀 Failed to download ${this.payloadInfo.tags.title} by ${this.payloadInfo.tags.artist} Downloaded 🚀`
      );
      sendMessageToRenderer('updatePendingTrackState', {
        id: this.id,
        stateCode: 7
      });
    });
  }
  start() {
    this.newDownload.start();
  }
  pause() {
    this.newDownload.pause();
  }
  resume() {
    this.newDownload.pause();
  }
  stop() {
    this.newDownload.stop();
  }
  getTotalSize() {
    this.newDownload.getTotalSize();
  }
  isResumable() {
    this.newDownload.isResumable();
  }
}

function sendDownloadProgress(
  trackID: any,
  progressInfo: DownloadProgressInfo
) {
  progressInfo.progress = Math.trunc(progressInfo.progress);
  win.webContents.send('bingDownloadProgress', {
    id: trackID,
    progressInfo
  });
}

async function writeTrackTags(location: any, tags: any) {
  const success = writeTags(location, tags);
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
