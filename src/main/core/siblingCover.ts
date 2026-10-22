import { TrackType } from "@/types";
import { isCoverArtUsable } from "./coverArt";

/**
 * Looks for a track of the library that already has a cover art and shares
 * the album (or the artist) with the given track. Plenty of albums only
 * have the cover art embedded in some of their files.
 */
export function findSiblingCoverArt(
  track: TrackType,
  tracks: TrackType[]
): string {
  const album = (track.album || "").toLowerCase().trim();
  const artist = (track.artist || "").toLowerCase().trim();
  if (!album && !artist) return "";

  let sameAlbumAndArtist = "";
  let sameAlbum = "";
  let sameArtist = "";

  for (const other of tracks) {
    if (!other || other.fileLocation === track.fileLocation) continue;
    if (!other.albumArt || !isCoverArtUsable(other.albumArt)) continue;

    const otherAlbum = (other.album || "").toLowerCase().trim();
    const otherArtist = (other.artist || "").toLowerCase().trim();

    if (album && otherAlbum === album) {
      if (artist && otherArtist === artist) {
        sameAlbumAndArtist = other.albumArt;
        break;
      }
      if (!sameAlbum) sameAlbum = other.albumArt;
    }

    if (artist && otherArtist === artist && !sameArtist) {
      sameArtist = other.albumArt;
    }
  }

  return sameAlbumAndArtist || sameAlbum || sameArtist;
}
