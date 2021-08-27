import { ipcRenderer } from 'electron';
import { fromString } from 'css-color-converter';

const brightnessThreshold = 0.69;
const hexColorRegex = /^([\da-f]{3}){1,2}$/i;

export function sendMessageToNode (message: string, payload: any) {
  ipcRenderer.send(message, payload);
}
export function isHexColor (s = '') {
  return hexColorRegex.test(s);
}
export function isDark (color: string) {
  color = isHexColor(color) ? `#${color}` : color;
  return brightness(color) <= brightnessThreshold ? '#fff' : '#345';
}
export function brightness (color: string) {
  if (color) {
    const cssColor = fromString(color);
    if (cssColor) {
      const rgb = cssColor.toRgbaArray();
      return +((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 255000).toFixed(
        2
      );
    }
  }
  return 0;
}
export function remappedDeezerTracks (
  deezerTracks: Array<any>,
  setAlbum: string
) {
  console.log('Tracks to remap');
  console.log(deezerTracks[0]);
  interface AcceptedNetworkTrackInterface {
    id: string;
    title: string;
    artist: string;
    album: string;
    albumArt: string;
    previewURL: string;
  }
  const acceptedNetworkTracks: Array<AcceptedNetworkTrackInterface> = [];
  deezerTracks.forEach(dTrack => {
    const acceptedNetworkTrack: AcceptedNetworkTrackInterface = {
      id: dTrack.id,
      title: dTrack.title,
      artist: dTrack.artist?.name || dTrack.artist_name,
      album: dTrack.album?.title || setAlbum || 'unknown album',
      albumArt: dTrack.album?.cover_small || dTrack.album_cover,
      previewURL: dTrack.preview || null
    };
    acceptedNetworkTracks.push(acceptedNetworkTrack);
  });
  console.log('Remapped tracks 👇');
  console.log(acceptedNetworkTracks[0]);
  return acceptedNetworkTracks;
}
