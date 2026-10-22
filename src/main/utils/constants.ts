/**
 * Audio containers the app is able to *scan and list* in the library.
 */
export const SUPPORTED_FORMATS = [
  ".mp3",
  ".wav",
  ".ogg",
  ".oga",
  ".opus",
  ".aac",
  ".flac",
  ".webm",
  ".m4a",
  ".m4b",
  ".mp4",
  ".wma",
  ".aiff",
  ".aif",
  ".aifc",
  ".ape",
  ".mka",
  ".mpc",
  ".mp+",
  ".wv",
  ".dsf",
  ".dff",
  ".tak",
  ".tta",
  ".spx",
];

/**
 * Containers we can read tags and embedded cover art from
 * (music-metadata / node-id3).
 */
export const TAGGABLE_FORMATS = [
  ".mp3",
  ".m4a",
  ".m4b",
  ".mp4",
  ".flac",
  ".ogg",
  ".oga",
  ".opus",
  ".wav",
  ".aiff",
  ".aif",
  ".aifc",
  ".wma",
  ".ape",
  ".mpc",
  ".mp+",
  ".wv",
];

/**
 * Containers the Chromium engine (the <audio> element) is able to play.
 * Tracks in any other format are still listed with their tags and cover art,
 * but cannot be played back.
 */
export const PLAYABLE_FORMATS = [
  ".mp3",
  ".wav",
  ".ogg",
  ".oga",
  ".opus",
  ".aac",
  ".flac",
  ".webm",
  ".m4a",
  ".m4b",
  ".mp4",
];
