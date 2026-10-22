import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ArtistInfoInterface } from "@/types";
import { paths } from "../modules/Paths";
import { downloadFile } from "../utils";
import { sanitizeFileName } from "../core/coverArt";
import { win } from "@/background";

/**
 * Builds a safe and unique file name for the picture of an artist.
 * Artist names regularly contain characters that are not allowed on Windows
 * ("AC/DC", "Simon & Garfunkel", ...) and would break the download.
 */
function getArtistPictureFileName(artistName: string): string {
  const base = sanitizeFileName(artistName);
  const hash = crypto
    .createHash("sha1")
    .update(artistName)
    .digest("hex")
    .slice(0, 8);
  return `${base}-${hash}.jpg`;
}

export async function downloadArtistPicture (artistInfo: ArtistInfoInterface) {
  const fileName = getArtistPictureFileName(artistInfo.name);
  const savePath = path.join(
    paths.artistPictureFolder,
    fileName
  );
  if (!fs.existsSync(savePath)) {
    const downloadedFileLocation = await downloadFile(
      artistInfo.picture,
      paths.artistPictureFolder,
      fileName
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
