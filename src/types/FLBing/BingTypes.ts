import { TrackType } from '..';

export interface BingTrackState {
  code: number;
  description: string;
}

export interface BingDownloadManagerState {
  pendingDownloads: BingPendingTrack[];
  completedDownloads: TrackType[];
}

export interface BingArtist {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  tracklist: string;
  type: string;
}

export interface BingAlbum {
  id: number;
  title: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  md5_image: string;
  tracklist: string;
  type: string;
}

export interface BingTrack {
  id: number;
  readable: boolean;
  title: string;
  title_short: string;
  title_version: string;
  link: string;
  duration: number;
  rank: number;
  explicit_lyrics: boolean;
  explicit_content_lyrics: number;
  explicit_content_cover: number;
  preview: string;
  md5_image: string;
  artist: BingArtist;
  album: BingAlbum;
  type: string;
}

export interface BingTrackSearchResult {
  data: BingTrack[];
  total: number;
  next: string;
}

export interface DownloadProgressInfo {
  total: number;
  name: string;
  downloaded: number;
  progress: number;
  speed: number;
}

export interface BingPendingTrack extends BingTrack {
  downloadURL: string;
  progressInfo: DownloadProgressInfo;
  state: BingTrackState;
}

export interface BingTrackDownloadProgress {
  id: number;
  progressInfo: DownloadProgressInfo;
}

export interface BingTrackStatePayload {
  id: number;
  stateCode: number;
}

export interface BingTrackURLPayload {
  id: number;
  url: string;
}

export interface BingDownloadingTrack {
  fileStream: any;
  trackInfo: any;
}
