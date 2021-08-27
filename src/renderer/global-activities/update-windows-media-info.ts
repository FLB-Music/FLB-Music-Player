import { TrackType } from '@/types';

export function updateMediaInfo (trackInfo: TrackType) {
  const window_ = window as any;
  window_.navigator.mediaSession.metadata = new window_.MediaMetadata({
    title: trackInfo.defaultTitle,
    artist: trackInfo.defaultArtist,
    album: trackInfo.album
    // artwork: [
    //     { src: trackInfo.albumArt, sizes: '500x500', type: 'image/jpeg' },
    // ]
  }) as any;
}
