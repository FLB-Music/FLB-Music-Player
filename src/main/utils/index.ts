import fs from 'fs';
import { fileTracker, win } from '../../background';
import { DownloaderHelper } from 'node-downloader-helper';
import { ipcMain, Notification } from 'electron';
import isOnline from 'is-online';

export function writeImageBuffer(imageBuffer: string, savePath: string) {
  fs.writeFileSync(savePath, imageBuffer);
}

export async function downloadFile(
  url: string,
  targetFolder: string,
  fileName: string
) {
  return new Promise<string>((resolve, reject) => {
    const dl = new DownloaderHelper(url, targetFolder, {
      fileName,
      override: false
    });
    dl.start();
    dl.on('end', () => {
      resolve(dl.getDownloadPath());
    });
    dl.on('error', () => reject('Error in downloading the cover'));
  });
}

export function deleteFile(path: string, quiet: boolean) {
  if (fs.existsSync(path)) {
    fs.unlink(path.replace('file://', ''), err => {
      if (err) {
        console.log(err);
        return win.webContents.send('errorMsg', 'Error in Deleting File');
      }
      if (!quiet) {
        win.webContents.send('normalMsg', `${path} deleted`);
      }
    });
    win.webContents.send('deleteComplete', path);
    fileTracker.deleteFile(path);
  } else {
    console.log('File does not exist');
  }
}

export function extractTitleAndArtist(trackName: string): any {
  const split = trackName.split('-');
  let artist;
  let title;
  if (trackName.includes('_-')) {
    artist = split[0];
    title = split[1];
  } else if (trackName.includes('-')) {
    artist = split[1];
    title = split[0];
  } else {
    return { artist: 'unknown', title: null };
  }
  artist = artist.replace(/_/g, ' ').trim();
  title = title
    .replace(/_/g, ' ')
    .replace(/\(.*\).*/gi, '')
    .replace(/\[.*\].*/gi, '')
    .replace(/\)/, '')
    .trim();
  return { artist, title };
}

export function isValidFileType(path: string) {
  return path.match(/\.mp3|\.webm|\.m4a|\.ogg/gi);
}

export function removeMIME(str: string) {
  return str.replace(/(\.mp3)|(\.m4a)|(\.ogg)|(\.wav)/gi, '');
}

export function sendNativeNotification(
  title: string,
  text: string,
  image: string
) {
  const options = {
    title,
    subtitle: text,
    body: text,
    silent: true,
    icon: image
  };
  const notification = new Notification(options);
  notification.show();
  notification.on('click', () => {
    win.focus();
    win.maximize();
  });
}

export function sendMessageToRenderer(listener: string, msg: any) {
  win.webContents.send(listener, msg);
}



ipcMain.handle('checkOnline', async () => {
  return isOnline()
})