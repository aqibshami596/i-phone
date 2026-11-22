export type TitaniumFinish = 'obsidian' | 'silver' | 'glacier' | 'burgundy';

export type FocusMode = 'off' | 'dnd' | 'work' | 'sleep' | 'personal';

export type WallpaperId = 'obsidian' | 'glacier' | 'burgundy' | 'aurora' | 'titanium' | string;

export type AppCategory =
  | 'Social'
  | 'Utilities'
  | 'Productivity'
  | 'Entertainment'
  | 'Photo & Video'
  | 'Music'
  | 'Games'
  | 'Lifestyle'
  | 'Navigation'
  | 'Health & Fitness'
  | 'Finance';

export interface AppReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
}

export interface AppDefinition {
  id: string;
  name: string;
  developer: string;
  subtitle: string;
  description: string;
  category: AppCategory;
  version: string;
  sizeMB: number;
  rating: number;
  ratingCount: string;
  ageRating: string;
  chartRank?: string;
  gradient: string;
  accentColor: string;
  preinstalled: boolean;
  systemApp?: boolean;
  hasUpdate?: boolean;
  releaseNotes?: string;
  whatsNewVersion?: string;
  featuredBanner?: boolean;
  arcade?: boolean;
  screenshots: Array<{ title: string; subtitle: string; gradient: string }>;
  reviews: AppReview[];
}

export interface PlayStoreReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface PlayStoreAppItem {
  packageId: string;
  name: string;
  developer: string;
  icon: string;
  rating: number;
  ratingCount?: string;
  category: string;
  price: string;
  downloads: string;
  description?: string;
  screenshots?: string[];
  playUrl: string;
  localAppId?: string;
  version?: string;
  latestVersion?: string;
  updatedOn?: string;
  sizeLabel?: string;
  installType?: 'builtin-native' | 'pwa-web' | 'play-catalog';
  webAppUrl?: string;
  reviews?: PlayStoreReview[];
}

export interface HomeFolder {
  id: string;
  name: string;
  appIds: string[];
}

export type HomeItem =
  | { kind: 'app'; appId: string }
  | { kind: 'folder'; folderId: string }
  | { kind: 'widget'; widgetId: 'weather' | 'clock' | 'battery' | 'health' | 'calendar' | 'photos' };

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  src: string;
  name: string;
  createdAt: number;
  favorite: boolean;
  deleted: boolean;
  album: string;
  durationSec?: number;
  width?: number;
  height?: number;
  edits?: {
    brightness: number;
    contrast: number;
    saturate: number;
    warmth: number;
    filter: string;
  };
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  avatarColor: string;
  favorite?: boolean;
}

export type CallTransport = 'twilio-pstn' | 'webrtc-p2p' | 'simulated-local';
export type CallStatus =
  | 'incoming'
  | 'dialing'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'on-hold'
  | 'ended'
  | 'declined'
  | 'failed';

export interface CallRecord {
  id: string;
  contactName: string;
  phoneNumber: string;
  direction: 'outgoing' | 'incoming' | 'missed';
  transport: CallTransport;
  outcome: 'connected' | 'missed' | 'declined' | 'failed';
  startedAt: number;
  durationSec: number;
  errorReason?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: number;
  mediaSrc?: string;
}

export interface ChatThread {
  id: string;
  platform: 'imessage' | 'whatsapp' | 'telegram';
  contactName: string;
  handle: string;
  avatarColor: string;
  unread: number;
  messages: ChatMessage[];
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  folder: string;
  pinned: boolean;
  updatedAt: number;
}

export interface ReminderItem {
  id: string;
  title: string;
  notes?: string;
  list: 'Today' | 'Scheduled' | 'Personal' | 'Work';
  dueDate?: string;
  priority: 'none' | 'low' | 'medium' | 'high';
  flagged: boolean;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  location?: string;
  color: string;
}

export interface VoiceMemo {
  id: string;
  title: string;
  createdAt: number;
  durationSec: number;
  audioDataUrl?: string;
}

export interface EmailItem {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: number;
  unread: boolean;
  flagged: boolean;
  folder: 'inbox' | 'sent' | 'vip';
}

export interface SafariTab {
  id: string;
  title: string;
  url: string;
  isPrivate: boolean;
}

export interface SafariBookmark {
  id: string;
  title: string;
  url: string;
}

export interface PasswordEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  notes?: string;
  updatedAt: number;
}

export interface OSNotification {
  id: string;
  appId: string;
  appName: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
  coverGradient: string;
  bpm: number;
  notes: number[];
}

export interface YouTubeVideo {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  channelHandle: string;
  avatarColor: string;
  views: string;
  uploadedAt: string;
  duration: string;
  category: string;
  description: string;
  likes: number;
  gradient: string;
  thumbnailUrl?: string;
  isShort?: boolean;
  isLive?: boolean;
}

export interface OSSettings {
  finish: TitaniumFinish;
  wallpaper: WallpaperId;
  customWallpaperSrc?: string;
  darkMode: boolean;
  brightness: number; // 20..100
  volume: number; // 0..100
  wifi: boolean;
  wifiNetwork: string;
  bluetooth: boolean;
  airplaneMode: boolean;
  cellular: boolean;
  unlimitedNetworkMode: boolean;
  focusMode: FocusMode;
  rotationLock: boolean;
  alwaysOnDisplay: boolean;
  faceIdEnabled: boolean;
  passcodeEnabled: boolean;
  passcode: string;
  silentMode: boolean;
  microphoneEnabled: boolean;
  microphoneDeviceId?: string;
  microphoneGain?: number;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  trueTone: boolean;
  lowPowerMode: boolean;
  actionButtonAction: 'silent' | 'camera' | 'flashlight' | 'siri' | 'voicememo';
  language: string;
  region: string;
  keyboardHaptics: boolean;
  reduceMotion: boolean;
  boldText: boolean;
  safariBlockPopups: boolean;
  safariPrivateDefault: boolean;
  appleIdName: string;
  appleIdEmail: string;
}
