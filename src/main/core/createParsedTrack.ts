import fs from 'fs';
import path from 'path';
import NodeID3 from 'node-id3';
import { TrackType } from '@/types';
import { paths } from '../modules/Paths';
import { fileTracker } from '../../background';
import { extractTitleAndArtist, formatTime, removeMIME, writeImageBuffer } from '../utils';
const mm = require('music-metadata');

export function createParsedTrack(fileLocation: string) {
  return new Promise<TrackType>((resolve) => {
    const track: TrackType = {
      r_fileLocation: '',
      fileLocation: '',
      albumArt: '',
      album: '',
      title: '',
      artist: '',
      extractedTitle: '',
      defaultTitle: '',
      extractedArtist: '',
      defaultArtist: '',
      fileName: '',
      formattedLength: '',
      duration: '',
      dateAdded: 0,
      folderInfo: {
        name: path.parse(path.parse(fileLocation).dir).base,
        path: path.parse(fileLocation).dir
      }
    };
    track.fileLocation = fileLocation;
    track.r_fileLocation = 'file://' + fileLocation;
    track.fileName = path.parse(fileLocation).name;
    console.log('Parsing: ' + track.fileName);
    (async () => {
      try {
        const metadata = await mm.parseFile(fileLocation);
        console.log(metadata)
        track.title = metadata.common.title || null
        track.extractedTitle = extractTitleAndArtist(track.fileName).title;

        track.artist = metadata.common.artist || null
        track.extractedArtist = extractTitleAndArtist(track.fileName).artist;

        track.album = metadata.common.album || 'unknown'

        track.defaultTitle =
          track.title || track.extractedTitle || track.fileName;

        track.defaultArtist = track.artist || track.extractedArtist;

        track.duration = metadata.format.duration;
        track.formattedLength = formatTime(track.duration)

        if (metadata.common.picture) {
          const albumArtPath = path.join(
            paths.albumArtFolder,
            `${removeMIME(track.fileName)}.${metadata.common.picture[0].format.replace(/image\//g, '')}`
          );

          writeImageBuffer(metadata.common.picture[0].data, albumArtPath);
          track.albumArt = albumArtPath;

        }

        fs.stat(track.fileLocation, (err, stats) => {
          track.dateAdded = stats.ctimeMs;
        });

        fileTracker.addFile(track);
        resolve(track);

      } catch (error) {
        console.error(error.message);
        NodeID3.read(fileLocation, async (err: any, tags: any) => {
          if (tags && tags.image && tags.image.imageBuffer) {
            tags.image.mime = tags.image.mime
              ? tags.image.mime.replace(/image\//g, '')
              : 'jpg';
            const albumArtPath = path.join(
              paths.albumArtFolder,
              `${removeMIME(track.fileName)}.${tags.image.mime}`
            );
            writeImageBuffer(tags.image.imageBuffer, albumArtPath);
            track.albumArt = albumArtPath;
          }
          track.title = tags.title;
          track.extractedTitle = extractTitleAndArtist(track.fileName).title;

          track.artist = tags.artist;
          track.extractedArtist = extractTitleAndArtist(track.fileName).artist;

          track.album = tags.album || 'unknown';

          track.defaultTitle =
            track.title || track.extractedTitle || track.fileName;

          track.defaultArtist = track.artist || track.extractedArtist;

          track.duration = "0:00"
          fs.stat(track.fileLocation, (err, stats) => {
            track.dateAdded = stats.ctimeMs;
          });

          fileTracker.addFile(track);
          resolve(track);
        });
      }
    })();
    // NodeID3.read(fileLocation, async (err: any, tags: any) => {
    //   if (tags && tags.image && tags.image.imageBuffer) {
    //     tags.image.mime = tags.image.mime
    //       ? tags.image.mime.replace(/image\//g, '')
    //       : 'jpg';
    //     const albumArtPath = path.join(
    //       paths.albumArtFolder,
    //       `${removeMIME(track.fileName)}.${tags.image.mime}`
    //     );
    //     writeImageBuffer(tags.image.imageBuffer, albumArtPath);
    //     track.albumArt = albumArtPath;
    //   }
    // track.title = tags.title;
    // track.extractedTitle = extractTitleAndArtist(track.fileName).title;

    // track.artist = tags.artist;
    // track.extractedArtist = extractTitleAndArtist(track.fileName).artist;

    // track.album = tags.album || 'unknown';

    //   track.defaultTitle =
    //     track.title || track.extractedTitle || track.fileName;

    //   track.defaultArtist = track.artist || track.extractedArtist;

    //   fs.stat(track.fileLocation, (err, stats) => {
    //     track.dateAdded = stats.ctimeMs;
    //   });

    //   fileTracker.addFile(track);
    //   resolve(track);
    // });
  });
}
