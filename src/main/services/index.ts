import fs from 'fs';
import path from 'path';
import { ArtistInfoInterface } from '@/types';
import { paths } from '../modules/Paths';
import { downloadFile } from '../utils';
import { win } from '@/background';

export async function downloadArtistPicture (artistInfo: ArtistInfoInterface) {
  const savePath = path.join(
    paths.artistPictureFolder,
    artistInfo.name + '.jpg'
  );
  if (!fs.existsSync(savePath)) {
    const downloadedFileLocation = await downloadFile(
      artistInfo.picture,
      paths.artistPictureFolder,
      artistInfo.name + '.jpg'
    );
    win.webContents.send('downloadedArtistPictureInfo', {
      name: artistInfo.name,
      pathToPicture: downloadedFileLocation
    });
  } else {
    win.webContents.send('downloadedArtistPictureInfo', {
      name: artistInfo.name,
      pathToPicture: savePath
    });
  }
}
