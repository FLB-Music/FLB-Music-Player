export interface TrackType {
  r_fileLocation: string;
  fileLocation: string;
  albumArt: string;
  album: string;
  title: string | null;
  artist: string | null;
  extractedTitle: string | null;
  defaultTitle: string;
  extractedArtist: string;
  defaultArtist: string;
  fileName: string;
  formattedLength: string;
  duration: any;
  dateAdded: number;
  folderInfo: FolderInfoType;
}
export interface TrackStatType {
  trackLocation: string;
  numberOfPlays: number;
}
export interface geniusSongType {
  id: any;
  url: any;
  albumArt: any;
  lyrics: any;
}
export interface TrackLyricsType {
  trackName: string;
  lyrics: string[];
}
export interface PlaylistType {
  name: string;
  tracks: Array<TrackType>;
}

export interface AlbumType {
  name: string;
  artist: string;
  tracks: Array<TrackType>;
}
export interface ArtistType {
  name: string;
  picture: string | null;
  tracks: Array<TrackType>;
  albums: Array<AlbumType>;
}
export interface FolderParsedType {
  name: string;
  path: string;
  tracks: Array<TrackType>;
}
export interface FolderType {
  name: string;
  path: string;
  tracks: Array<string>;
}
export interface FolderInfoType {
  name: string;
  path: string;
}
export interface processedFolderType {
  name: string;
  path: string;
  tracks: Array<TrackType>;
  videos: Array<TrackType>;
}
export interface TagChangesType {
  title?: string;
  artist?: string;
  album?: string;
  imageUrl?: string;
  APIC: string;
}
export interface AudioStateType {
  playing: boolean;
  repeat: boolean;
  shuffle: boolean;
}
export type audioStateType = 'playing' | 'repeat' | 'shuffle';
export type tabType =
  | 'Home'
  | 'Tracks'
  | 'Recents'
  | 'Folders'
  | 'Playlists'
  | 'Discover'
  | 'Albums'
  | 'Artists';
export interface BingDataType {
  tracks: Array<TrackType>;
  artists: Array<ArtistType>;
  albums: Array<AlbumType>;
}

export interface SearchResultsType {
  tracks: Array<TrackType>;
  artists: Array<ArtistType>;
  albums: Array<AlbumType>;
}

export interface NotificationType {
  title: string;
  subTitle: string | null;
  type: 'normal' | 'success' | 'warning';
}
export type UIcontrollerPropertiesType =
  | 'showSettings'
  | 'showTagEditor'
  | 'showPlaylistWidget';

export interface SettingsType {
  includeVideo: boolean;
  desktopNotifications: boolean;
  defaultTab: tabType;
  theme: 'fancy' | 'dark' | 'light';
  accentColor: string;
  dynamicAccentColor: boolean;
  volume: 1;
  foldersToScan: Array<string>;
}

export type SettingsPropertiesType =
  | 'includeVideo'
  | 'desktopNotifications'
  | 'defaultTab'
  | 'theme'
  | 'accentColor'
  | 'volume';

export interface mixTyping {
  name: string;
  info: string;
  tracks: TrackType[];
}

export interface ArtistInfoInterface {
  name: string;
  picture: any;
}


export interface UserInfo {
  id: string;
  cpu_no: number;
  free_memory: number;
  total_memory: number;
  host_name: string;
  architecture: string;
  os_release: string;
  os_type: string;
  app_launches: string[]
}
