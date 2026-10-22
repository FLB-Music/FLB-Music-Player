import fs from "fs";
import path from "path";
import crypto from "crypto";
import { paths } from "../modules/Paths";

export type CoverImageFormat =
  | "jpg"
  | "png"
  | "gif"
  | "bmp"
  | "webp"
  | "tiff"
  | "ico"
  | "svg"
  | "unknown";

export interface PictureLike {
  format?: string;
  data?: Buffer;
}

/**
 * Image formats the renderer (<img>) is able to decode.
 */
export const BROWSER_READABLE_FORMATS: CoverImageFormat[] = [
  "jpg",
  "png",
  "gif",
  "bmp",
  "webp",
  "svg",
];

/**
 * Formats we have to convert before the renderer can display them.
 */
export const CONVERTIBLE_FORMATS: CoverImageFormat[] = ["tiff", "ico"];

const ASCII = "ascii";

/**
 * Detects the *real* format of an image buffer by looking at its magic
 * numbers. The mime type stored inside a tag is frequently wrong or
 * non standard (FLAC files for example store "-->" as the mime type), and
 * trusting it is what makes some covers fail to render.
 */
export function detectImageFormat(buffer: Buffer): CoverImageFormat {
  if (!buffer || buffer.length < 4) return "unknown";

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // GIF: GIF87a / GIF89a
  const gifHeader = buffer.slice(0, 6).toString(ASCII);
  if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
    return "gif";
  }

  // BMP: "BM"
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return "bmp";
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString(ASCII) === "RIFF" &&
    buffer.slice(8, 12).toString(ASCII) === "WEBP"
  ) {
    return "webp";
  }

  // TIFF: "II*\0" (little endian) or "MM\0*" (big endian)
  if (
    (buffer[0] === 0x49 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x2a &&
      buffer[3] === 0x00) ||
    (buffer[0] === 0x4d &&
      buffer[1] === 0x4d &&
      buffer[2] === 0x00 &&
      buffer[3] === 0x2a)
  ) {
    return "tiff";
  }

  // ICO: 00 00 01 00
  if (
    buffer[0] === 0x00 &&
    buffer[1] === 0x00 &&
    buffer[2] === 0x01 &&
    buffer[3] === 0x00
  ) {
    return "ico";
  }

  // SVG is a text based format
  const head = buffer.slice(0, 256).toString("utf8").trim().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) {
    return "svg";
  }

  return "unknown";
}

/**
 * Removes every character that is not allowed in a file name on Windows
 * and squeezes the name so it stays readable.
 */
export function sanitizeFileName(name: string): string {
  const cleaned = (name || "")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  return (cleaned || "cover").slice(0, 80);
}

/**
 * Builds a unique name for the extracted cover art. The hash of the track
 * location is appended so two tracks sharing the same file name (very
 * common: "01 - Intro.mp3") never overwrite each other's cover.
 */
export function getCoverArtFileName(
  fileLocation: string,
  extension: string
): string {
  const base = sanitizeFileName(path.parse(fileLocation).name);
  const hash = crypto
    .createHash("sha1")
    .update(fileLocation)
    .digest("hex")
    .slice(0, 8);
  return `${base}-${hash}.${extension}`;
}

/**
 * Picks the biggest picture of a tag. The first picture is not always the
 * front cover, some taggers store a thumbnail first.
 */
export function pickBestPicture<T extends PictureLike>(
  pictures: T[]
): T | null {
  if (!pictures || !pictures.length) return null;
  let best: T | null = null;
  let bestSize = 0;
  for (const picture of pictures) {
    if (!picture || !picture.data || !picture.data.length) continue;
    if (picture.data.length > bestSize) {
      best = picture;
      bestSize = picture.data.length;
    }
  }
  return best;
}

/**
 * Converts an image the renderer cannot display into a PNG.
 * Jimp is loaded lazily so it does not slow down the app startup.
 */
export async function convertToPng(buffer: Buffer): Promise<Buffer | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Jimp = require("jimp");
    const image = await Jimp.read(buffer);
    return await image.getBufferAsync("image/png");
  } catch (error) {
    console.error("Could not convert cover art to png");
    console.error(error);
    return null;
  }
}

/**
 * Writes the cover art of a track into the album art folder and returns the
 * absolute path of the written file (empty string when there is no cover).
 */
export async function writeCoverArt(
  fileLocation: string,
  buffer: Buffer
): Promise<string> {
  if (!buffer || !buffer.length) return "";

  let data = buffer;
  let format = detectImageFormat(data);

  if (CONVERTIBLE_FORMATS.includes(format)) {
    const converted = await convertToPng(data);
    if (converted) {
      data = converted;
      format = "png";
    }
  }

  if (!BROWSER_READABLE_FORMATS.includes(format)) {
    // Last resort: try to convert whatever we got into a png.
    const converted = await convertToPng(data);
    if (!converted) {
      console.log("Unsupported cover art format for", fileLocation);
      return "";
    }
    data = converted;
    format = "png";
  }

  const savePath = path.join(
    paths.albumArtFolder,
    getCoverArtFileName(fileLocation, format)
  );

  try {
    fs.writeFileSync(savePath, data);
  } catch (error) {
    console.error("Could not write cover art");
    console.error(error);
    return "";
  }

  return savePath;
}

/**
 * Tells whether the cover art of a track can still be displayed.
 */
export function isCoverArtUsable(albumArt: string): boolean {
  if (!albumArt) return false;
  const extension = path.extname(albumArt).replace(".", "").toLowerCase();
  if (!BROWSER_READABLE_FORMATS.includes(extension as CoverImageFormat)) {
    return false;
  }
  try {
    return fs.existsSync(albumArt);
  } catch (error) {
    return false;
  }
}
