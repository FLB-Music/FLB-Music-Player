import axios from "axios";
import { TrackType } from "@/types";
import { detectImageFormat, writeCoverArt } from "./coverArt";

function normalize(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

interface WantedInfo {
  album: string;
  artist: string;
  title: string;
}

/**
 * Rates how well a search result fits the track. The album of a search
 * result does not always carry the artist, the artist of the track itself is
 * used as well.
 */
function scoreResult(item: any, wanted: WantedInfo): number {
  if (!item || !item.album) return 0;

  const albumName = normalize(item.album.title);
  const artistName = normalize(
    item.artist ? item.artist.name : item.album.artist ? item.album.artist.name : ""
  );
  const trackTitle = normalize(item.title);
  let score = 0;

  if (wanted.album) {
    if (albumName === wanted.album) score += 4;
    else if (albumName.includes(wanted.album) || wanted.album.includes(albumName)) {
      score += 2;
    }
  }

  if (wanted.artist) {
    if (artistName === wanted.artist) score += 3;
    else if (artistName && (artistName.includes(wanted.artist) || wanted.artist.includes(artistName))) {
      score += 1;
    }
  }

  if (wanted.title) {
    if (albumName === wanted.title) score += 3;
    else if (albumName.includes(wanted.title) || wanted.title.includes(albumName)) {
      score += 1;
    }
    if (trackTitle === wanted.title) score += 2;
    else if (trackTitle.includes(wanted.title)) score += 2;
  }

  return score;
}

function pickResult(results: any[], wanted: WantedInfo): any | null {
  let best: any = null;
  let bestScore = 0;

  for (const item of results) {
    const score = scoreResult(item, wanted);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  if (best && bestScore >= 2) return best;

  // Without any information to match against we take the first result that
  // has an album
  if (!wanted.album && !wanted.artist && !wanted.title) {
    return results.find((item: any) => !!item.album) || null;
  }
  return null;
}

/**
 * Searches the cover art of a track online. Used for the tracks that do not
 * carry any embedded picture.
 */
export async function fetchOnlineCoverArt(track: TrackType): Promise<string> {
  const clean = (value: string) => {
    const trimmed = (value || "").trim();
    return trimmed.toLowerCase() === "unknown" ? "" : trimmed;
  };

  const artist = clean(track.artist || "");
  const album = clean(track.album || "");
  const title = clean(track.defaultTitle || "");
  // "Bring Me To Life (Official Video) ft. Paul McCoy" -> "Bring Me To Life"
  const simpleTitle = title
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(feat|ft|featuring)\.?\s.*$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Some files carry the whole file name as the title, the interesting part
  // of it is often one of its parts
  const titleParts = simpleTitle
    .split(/\s+-\s+|\s+–\s+/)
    .map((part) => part.trim())
    .filter((part) => part.split(" ").length >= 2);

  const wanted: WantedInfo = {
    album: normalize(album),
    artist: normalize(artist.split(/,|&|\bfeat\.?\b|\bft\.?\b|\bwith\b|\bx\b/i)[0] || ""),
    title: normalize(simpleTitle || title),
  };

  // The artist field regularly holds more than one artist
  const artistParts = artist
    .split(/,|&|\bfeat\.?\b|\bft\.?\b|\bwith\b|\bx\b/i)
    .map((part) => part.trim())
    .filter((part) => part && part !== "unknown");

  // Every search knows which title it is looking for, the title of a file
  // that carries the whole file name is split into its parts
  const searches: { query: string; title: string }[] = [];
  for (const part of artistParts) {
    if (album) {
      searches.push({ query: `${part} ${album}`, title: wanted.title });
    }
    if (simpleTitle) {
      searches.push({ query: `${part} ${simpleTitle}`, title: wanted.title });
    }
  }
  if (album) {
    searches.push({ query: album, title: wanted.title });
  }
  if (simpleTitle) {
    searches.push({ query: simpleTitle, title: normalize(simpleTitle) });
  }
  for (const part of titleParts) {
    if (part !== simpleTitle) {
      searches.push({ query: part, title: normalize(part) });
    }
  }
  if (title && title !== simpleTitle) {
    searches.push({ query: title, title: wanted.title });
  }

  for (const search of searches) {
    const query = search.query;
    try {
      const response = await axios.get(
        `https://api.deezer.com/search?q=${encodeURIComponent(query)}`,
        { timeout: 10000 }
      );
      const results =
        response.data && response.data.data ? response.data.data : [];
      if (!results.length) continue;

      const match = pickResult(results, { ...wanted, title: search.title });
      if (!match || !match.album) continue;

      const coverUrl = match.album.cover_xl || match.album.cover_big;
      if (!coverUrl) continue;

      const imageResponse = await axios.get(coverUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
      });
      const imageBuffer = Buffer.from(imageResponse.data);
      if (detectImageFormat(imageBuffer) === "unknown") {
        console.log("The downloaded cover is not a valid image");
        continue;
      }
      return await writeCoverArt(track.fileLocation, imageBuffer);
    } catch (error) {
      console.log("Could not fetch the cover art of", track.fileLocation);
      console.log(error.message);
    }
  }

  return "";
}
