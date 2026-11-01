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
  /**
   * Only set on tracks that entered the queue of a party through a guest:
   * either uploaded by them or suggested from the library of the host.
   */
  suggestedBy?: PartySuggestedByType;
}
export interface PartySuggestedByType {
  guestId: string;
  guestName: string;
}
export interface PartyGuestInfoType {
  id: string;
  name: string;
  addedTracks: number;
  joinedAt: number;
}
/**
 * How the suggestions of the guests enter the queue: straight in ("free")
 * or waiting for the host to accept them ("approval").
 */
export type PartyEntryModeType = "free" | "approval";
/** One device blocked by the host, kept only while the party lasts. */
export interface PartyBlockedInfoType {
  token: string;
  name: string;
}
/** A suggestion of a guest waiting for the host to decide. */
export interface PartyPendingDTOType {
  id: string;
  guestId: string;
  guestName: string;
  submittedAt: number;
  track: PartyTrackDTOType;
  /** Only sent to the host renderer, the path of the cover on this machine. */
  localArt?: string;
}
/** What a guest has sent, so their screen can show the state of each one. */
export interface PartySubmissionType {
  id: string;
  track: PartyTrackDTOType | null;
  status: "pending" | "accepted" | "refused";
}
/** The shape of a track a guest of the party is allowed to see. */
export interface PartyTrackDTOType {
  /** Public id of the track, used to ask the host to add it. */
  id: string | null;
  title: string;
  artist: string;
  album: string;
  formattedLength: string;
  duration: number;
  artId: string | null;
  suggestedBy?: PartySuggestedByType;
}
export interface PartyQueuePayloadType {
  queue: PartyTrackDTOType[];
  nowPlaying: PartyTrackDTOType | null;
  playing: boolean;
  /** Playback position in seconds, so the guests can follow the progress. */
  position: number;
  duration: number;
  volume: number;
  roomName: string;
  entryMode: PartyEntryModeType;
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
export type audioStateType = "playing" | "repeat" | "shuffle";
export type tabType =
  | "Home"
  | "Tracks"
  | "Recents"
  | "Folders"
  | "Playlists"
  | "Discover"
  | "Albums"
  | "Artists";
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
  type: NotificationTypes;
  isPersistent: true;
  values?: Record<string, string | number>;
}
export type NotificationTypes = "normal" | "success" | "warning";
export type UIcontrollerPropertiesType =
  | "showSettings"
  | "showTagEditor"
  | "showPlaylistWidget";

export interface SettingsType {
  includeVideo: boolean;
  desktopNotifications: boolean;
  defaultTab: tabType;
  theme: ThemeType;
  accentColor: string;
  dynamicAccentColor: boolean;
  volume: 1;
  volumeBoost: boolean;
  foldersToScan: Array<string>;
  enableEqualizer: boolean;
  language: LanguageType;
}

export type ThemeType =
  | "fancy"
  | "dark"
  | "black"
  | "light"
  | "nord"
  | "solarized"
  | "amoled"
  | "synthwave";

export type LanguageType = "en" | "pt-BR";

export type SettingsPropertiesType =
  | "includeVideo"
  | "desktopNotifications"
  | "defaultTab"
  | "theme"
  | "accentColor"
  | "volume";

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
  app_launches: string[];
}

export interface DeezerArtistData {
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

export interface UpdateDataPayload {
  updatedData: {
    tracks: TrackType[];
    playlists: PlaylistType[];
    recents: TrackType[];
  };
  path: string;
}
