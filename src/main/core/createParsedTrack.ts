import fs from "fs";
import path from "path";
import NodeID3 from "node-id3";
import { TrackType } from "@/types";
import { extractTitleAndArtist, formatTime } from "../utils";
import { pickBestPicture, writeCoverArt } from "./coverArt";
const mm = require("music-metadata");

interface ParsedTags {
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  duration?: number | null;
  pictures: any[];
}

/**
 * Names commonly used for the cover art that sits next to the audio files.
 * Used when a track does not carry an embedded picture.
 */
const FALLBACK_COVER_NAMES = [
  "cover",
  "folder",
  "front",
  "album",
  "albumart",
  "albumartsmall",
  "thumb",
];

function findFolderCoverArt(fileLocation: string): Buffer | null {
  try {
    const folder = path.dirname(fileLocation);
    const entries = fs.readdirSync(folder);
    for (const entry of entries) {
      const extension = path.extname(entry).toLowerCase();
      if (![".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"].includes(extension)) {
        continue;
      }
      const name = path.basename(entry, extension).toLowerCase();
      if (FALLBACK_COVER_NAMES.includes(name)) {
        return fs.readFileSync(path.join(folder, entry));
      }
    }
  } catch (error) {
    // The folder may not be readable, no big deal.
  }
  return null;
}

/**
 * Reads the tags of a file. music-metadata handles almost every container,
 * node-id3 is only used as a fallback for plain mp3 files.
 */
async function readTags(fileLocation: string): Promise<ParsedTags> {
  try {
    const metadata = await mm.parseFile(fileLocation);
    return {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      duration: metadata.format ? metadata.format.duration : null,
      pictures: metadata.common.picture || [],
    };
  } catch (error) {
    console.error("Could not read tags with music-metadata:", fileLocation);
    console.error(error.message);
  }

  // Fallback: ID3 tags (mp3 only)
  try {
    const tags = await new Promise<any>((resolve) => {
      NodeID3.read(fileLocation, (error: any, id3Tags: any) => {
        resolve(error || !id3Tags ? null : id3Tags);
      });
    });
    if (tags) {
      return {
        title: tags.title,
        artist: tags.artist,
        album: tags.album,
        duration: null,
        pictures:
          tags.image && tags.image.imageBuffer
            ? [{ format: tags.image.mime, data: tags.image.imageBuffer }]
            : [],
      };
    }
  } catch (error) {
    console.error("Could not read tags with node-id3:", fileLocation);
  }

  return { pictures: [] };
}

/**
 * Extracts the cover art of a track and stores it in the album art folder.
 * Never throws, a track without a cover art is perfectly valid.
 */
async function extractCoverArt(
  fileLocation: string,
  pictures: any[]
): Promise<string> {
  const bestPicture = pickBestPicture(pictures);
  if (bestPicture && bestPicture.data) {
    const albumArtPath = await writeCoverArt(fileLocation, bestPicture.data);
    if (albumArtPath) return albumArtPath;
  }

  // No embedded picture, look for a cover file sitting next to the track.
  const folderCover = findFolderCoverArt(fileLocation);
  if (folderCover) {
    return await writeCoverArt(fileLocation, folderCover);
  }

  return "";
}

export async function createParsedTrack(
  fileLocation: string
): Promise<TrackType> {
  const track: TrackType = {
    r_fileLocation: "",
    fileLocation: "",
    albumArt: "",
    album: "",
    title: "",
    artist: "",
    extractedTitle: "",
    defaultTitle: "",
    extractedArtist: "",
    defaultArtist: "",
    fileName: "",
    formattedLength: "",
    duration: "",
    dateAdded: 0,
    folderInfo: {
      name: path.parse(path.parse(fileLocation).dir).base,
      path: path.parse(fileLocation).dir,
    },
  };

  track.fileLocation = fileLocation;
  track.r_fileLocation = "file://" + fileLocation;
  track.fileName = path.parse(fileLocation).name;
  console.log("Parsing: " + track.fileName);

  const tags = await readTags(fileLocation);

  track.title = tags.title || null;
  track.extractedTitle = extractTitleAndArtist(track.fileName).title;

  track.artist = tags.artist || null;
  track.extractedArtist = extractTitleAndArtist(track.fileName).artist;

  track.album = tags.album || "unknown";

  track.defaultTitle = track.title || track.extractedTitle || track.fileName;
  track.defaultArtist = track.artist || track.extractedArtist;

  track.duration = tags.duration || 0;
  track.formattedLength = formatTime(track.duration);

  track.albumArt = await extractCoverArt(fileLocation, tags.pictures);

  try {
    const stats = fs.statSync(track.fileLocation);
    track.dateAdded = stats.ctimeMs;
  } catch (error) {
    track.dateAdded = Date.now();
  }

  return track;
}
