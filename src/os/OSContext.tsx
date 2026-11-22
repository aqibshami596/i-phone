import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { APP_MAP, APP_REGISTRY } from './appRegistry';
import {
  DEFAULT_SETTINGS,
  SEED_BOOKMARKS,
  SEED_CONTACTS,
  SEED_EMAILS,
  SEED_EVENTS,
  SEED_MEDIA,
  SEED_MUSIC_TRACKS,
  SEED_NOTES,
  SEED_PASSWORDS,
  SEED_REMINDERS,
  SEED_THREADS,
} from './seedData';
import { soundEngine } from './soundEngine';
import { clearAllMedia, deleteMediaItemPermanent, loadAllMedia, lsGet, lsSet, saveMediaItem } from './storage';
import {
  CallRecord,
  CallStatus,
  CallTransport,
  CalendarEvent,
  ChatThread,
  Contact,
  EmailItem,
  HomeFolder,
  HomeItem,
  MediaItem,
  MusicTrack,
  NoteItem,
  OSNotification,
  OSSettings,
  PasswordEntry,
  PlayStoreAppItem,
  ReminderItem,
  SafariBookmark,
  SafariTab,
  VoiceMemo,
} from './types';
import { OnlineVoipPeer, VoiceConfigInfo, voiceManager } from './voiceManager';
import { measureNetworkLatency, prewarmNetwork } from './networkManager';
import type { Call as TwilioCall } from '@twilio/voice-sdk';

const LS_KEY = 'iphone18_os_state_v1';

const DEFAULT_FOLDERS: Record<string, HomeFolder> = {
  utilities: {
    id: 'utilities',
    name: 'Utilities',
    appIds: ['flashlight', 'screenrecorder', 'qrscanner', 'compass', 'stopwatch', 'timer', 'converter', 'passwords', 'battery', 'storage'],
  },
  productivity: {
    id: 'productivity',
    name: 'Productivity',
    appIds: ['files', 'voicememos', 'shortcuts', 'translate', 'findmy', 'tips'],
  },
};

const DEFAULT_DOCK = ['phone', 'safari', 'messages', 'music'];

const DEFAULT_PAGES: HomeItem[][] = [
  [
    { kind: 'widget', widgetId: 'weather' },
    { kind: 'widget', widgetId: 'clock' },
    { kind: 'app', appId: 'facetime' },
    { kind: 'app', appId: 'calendar' },
    { kind: 'app', appId: 'photos' },
    { kind: 'app', appId: 'camera' },
    { kind: 'app', appId: 'mail' },
    { kind: 'app', appId: 'notes' },
    { kind: 'app', appId: 'reminders' },
    { kind: 'app', appId: 'maps' },
    { kind: 'app', appId: 'appstore' },
    { kind: 'app', appId: 'playstore' },
    { kind: 'app', appId: 'google' },
    { kind: 'app', appId: 'settings' },
  ],
  [
    { kind: 'widget', widgetId: 'health' },
    { kind: 'widget', widgetId: 'battery' },
    { kind: 'app', appId: 'youtube' },
    { kind: 'app', appId: 'spotify' },
    { kind: 'app', appId: 'netflix' },
    { kind: 'app', appId: 'whatsapp' },
    { kind: 'app', appId: 'telegram' },
    { kind: 'app', appId: 'social' },
    { kind: 'app', appId: 'games' },
    { kind: 'app', appId: 'photoeditor' },
    { kind: 'app', appId: 'videoeditor' },
    { kind: 'app', appId: 'wallet' },
  ],
  [
    { kind: 'app', appId: 'contacts' },
    { kind: 'app', appId: 'calculator' },
    { kind: 'app', appId: 'clock' },
    { kind: 'app', appId: 'weather' },
    { kind: 'app', appId: 'health' },
    { kind: 'folder', folderId: 'productivity' },
    { kind: 'folder', folderId: 'utilities' },
  ],
];

interface PersistedOSState {
  settings: OSSettings;
  installedAppIds: string[];
  installedPlayApps: Record<string, PlayStoreAppItem>;
  updatedPlayAppIds: string[];
  playSearchHistory: string[];
  updatedAppIds: string[];
  homePages: HomeItem[][];
  dockAppIds: string[];
  folders: Record<string, HomeFolder>;
  contacts: Contact[];
  callHistory: CallRecord[];
  voipExtension: string;
  threads: ChatThread[];
  emails: EmailItem[];
  notes: NoteItem[];
  reminders: ReminderItem[];
  events: CalendarEvent[];
  passwords: PasswordEntry[];
  voiceMemos: VoiceMemo[];
  safariTabs: SafariTab[];
  safariBookmarks: SafariBookmark[];
  safariHistory: Array<{ id: string; title: string; url: string; visitedAt: number }>;
  safariDownloads: Array<{ id: string; name: string; size: string; downloadedAt: number }>;
  youtubeSubs: string[];
  youtubeLiked: string[];
  youtubeHistory: string[];
  youtubeComments: Record<string, Array<{ id: string; author: string; text: string; time: string }>>;
  netflixMyList: string[];
  gameScores: Record<string, number>;
  habits: Array<{ id: string; title: string; streak: number; doneToday: boolean }>;
  healthSteps: number;
  healthWater: number;
  healthCalories: number;
  batteryLevel: number;
  isCharging: boolean;
}

function generateVoipExtension(): string {
  const num = Math.floor(1000 + Math.random() * 8999);
  return `180-${num}`;
}

const DEFAULT_PERSISTED: PersistedOSState = {
  settings: DEFAULT_SETTINGS,
  installedAppIds: APP_REGISTRY.filter((a) => a.preinstalled).map((a) => a.id),
  installedPlayApps: {},
  updatedPlayAppIds: [],
  playSearchHistory: ['Spotify', 'WhatsApp', 'Discord'],
  updatedAppIds: [],
  homePages: DEFAULT_PAGES,
  dockAppIds: DEFAULT_DOCK,
  folders: DEFAULT_FOLDERS,
  contacts: SEED_CONTACTS,
  callHistory: [],
  voipExtension: generateVoipExtension(),
  threads: SEED_THREADS,
  emails: SEED_EMAILS,
  notes: SEED_NOTES,
  reminders: SEED_REMINDERS,
  events: SEED_EVENTS,
  passwords: SEED_PASSWORDS,
  voiceMemos: [
    { id: 'vm-1', title: 'Studio Idea #1', createdAt: Date.now() - 86400000, durationSec: 18 },
  ],
  safariTabs: [
    { id: 'tab-1', title: 'Start Page', url: 'about:start', isPrivate: false },
  ],
  safariBookmarks: SEED_BOOKMARKS,
  safariHistory: [],
  safariDownloads: [
    { id: 'dl-1', name: 'iPhone_18_Pro_Max_Specs.pdf', size: '2.4 MB', downloadedAt: Date.now() - 3600000 * 6 },
  ],
  youtubeSubs: ['@BlenderFoundation', '@MKBHD', '@LofiGirl', '@NASA'],
  youtubeLiked: ['yt-1'],
  youtubeHistory: ['yt-1', 'yt-2'],
  youtubeComments: {
    'yt-1': [
      { id: 'yc1', author: 'Alex M.', text: 'Looks razor sharp on the 6.9-inch Super Retina XDR display!', time: '2h ago' },
      { id: 'yc2', author: 'Nadia K.', text: '60fps 4K stream plays back smoothly.', time: '5h ago' },
    ],
  },
  netflixMyList: ['nf-1', 'nf-3'],
  gameScores: {
    breaker: 1450,
    snake: 280,
    g2048: 1024,
    flappy: 24,
  },
  habits: [
    { id: 'hb1', title: 'Morning Hydration (500ml)', streak: 12, doneToday: true },
    { id: 'hb2', title: '30m Deep Reading', streak: 7, doneToday: false },
    { id: 'hb3', title: '8,000 Steps Target', streak: 5, doneToday: false },
  ],
  healthSteps: 6842,
  healthWater: 5,
  healthCalories: 465,
  batteryLevel: 88,
  isCharging: false,
};

export interface ActiveCallState {
  id: string;
  contactName: string;
  handle: string;
  isVideo: boolean;
  direction: 'outgoing' | 'incoming';
  transport: CallTransport;
  status: CallStatus;
  startedAt: number;
  connectedAt?: number;
  muted: boolean;
  speaker: boolean;
  onHold: boolean;
  remoteOnHold?: boolean;
  minimized: boolean;
  dtmfSent: string;
  errorMessage?: string;
}

export interface PendingCallChoice {
  contactName: string;
  handle: string;
  isVideo: boolean;
}

interface OSContextValue {
  // Persisted state
  state: PersistedOSState;
  updateSettings: (patch: Partial<OSSettings>) => void;
  setPersisted: React.Dispatch<React.SetStateAction<PersistedOSState>>;

  // Media (IndexedDB)
  media: MediaItem[];
  addMedia: (item: MediaItem) => Promise<void>;
  updateMedia: (id: string, patch: Partial<MediaItem>) => Promise<void>;
  removeMediaPermanent: (id: string) => Promise<void>;

  // Hardware & Shell state
  isLocked: boolean;
  isAlwaysOn: boolean;
  lockDevice: () => void;
  unlockDevice: () => void;
  toggleAlwaysOn: () => void;
  toggleCharging: () => void;
  isLandscape: boolean;
  setIsLandscape: (v: boolean) => void;
  rotateDevice: (targetLandscape?: boolean) => void;
  flashlightOn: boolean;
  flashlightLevel: number;
  setFlashlightLevel: (lvl: number) => void;
  toggleFlashlight: () => void;
  volumeHudVisible: boolean;
  adjustVolume: (delta: number) => void;
  silentHud: 'silent' | 'ring' | null;
  toggleSilentMode: () => void;
  micHardwareActive: boolean;
  toggleMicrophoneHardware: () => void;
  startMicHardwareTest: () => Promise<{ ok: boolean; error?: string }>;
  stopMicHardwareTest: () => void;
  networkLatencyMs: number | null;
  refreshNetworkLatency: () => Promise<number | null>;

  // Navigation & Overlays
  activeAppId: string | null;
  recentAppIds: string[];
  appSubRoute: string | null;
  openApp: (appId: string, subRoute?: string) => void;
  closeApp: () => void;
  closeBackgroundApp: (appId: string) => void;
  appSwitcherOpen: boolean;
  setAppSwitcherOpen: (v: boolean) => void;
  controlCenterOpen: boolean;
  setControlCenterOpen: (v: boolean) => void;
  notificationCenterOpen: boolean;
  setNotificationCenterOpen: (v: boolean) => void;
  spotlightOpen: boolean;
  setSpotlightOpen: (v: boolean) => void;
  siriOpen: boolean;
  setSiriOpen: (v: boolean) => void;
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  jiggleMode: boolean;
  setJiggleMode: (v: boolean) => void;
  currentHomePage: number;
  setCurrentHomePage: (page: number) => void;

  // App Store & Play Store Install / Uninstall / Update Engine
  installingProgress: Record<string, number>;
  installApp: (appId: string) => void;
  installPlayApp: (app: PlayStoreAppItem) => void;
  updatePlayApp: (appId: string, nextVersion?: string) => void;
  addPlaySearchHistory: (query: string) => void;
  clearPlaySearchHistory: () => void;
  uninstallApp: (appId: string) => void;
  updateApp: (appId: string) => void;
  moveHomeApp: (fromPage: number, fromIndex: number, toPage: number, toIndex: number) => void;
  moveAppToDock: (appId: string) => void;
  removeAppFromDock: (appId: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  createFolderFromApps: (page: number, sourceAppId: string, targetAppId: string) => void;

  // Dynamic Island & Live Activities
  islandExpanded: boolean;
  setIslandExpanded: (v: boolean) => void;
  musicPlaying: boolean;
  currentTrack: MusicTrack;
  musicElapsed: number;
  toggleMusic: () => void;
  playTrack: (track: MusicTrack) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  timerRemaining: number;
  timerTotal: number;
  timerRunning: boolean;
  startTimer: (seconds: number) => void;
  pauseTimer: () => void;
  resetTimer: () => void;

  // Real VoIP & Phone Calling Engine
  voiceConfig: VoiceConfigInfo;
  wsVoipConnected: boolean;
  onlineVoipPeers: OnlineVoipPeer[];
  micLevel: number;
  activeCall: ActiveCallState | null;
  pendingCallChoice: PendingCallChoice | null;
  dismissPendingCallChoice: () => void;
  startCall: (
    contactName: string,
    handle: string,
    isVideo?: boolean,
    options?: { forceSimulated?: boolean }
  ) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => void;
  endCall: () => void;
  toggleCallMute: () => void;
  toggleCallSpeaker: () => void;
  toggleCallHold: () => void;
  sendCallDtmf: (digit: string) => void;
  setCallMinimized: (minimized: boolean) => void;
  triggerSimulatedIncomingCall: (callerName?: string, handle?: string) => void;
  clearCallHistory: () => void;
  deleteCallRecord: (id: string) => void;

  screenRecording: boolean;
  screenRecordSeconds: number;
  toggleScreenRecording: () => void;

  // Notifications
  notifications: OSNotification[];
  bannerNotification: OSNotification | null;
  pushNotification: (appId: string, title: string, body: string) => void;
  clearNotifications: () => void;
  dismissBanner: () => void;

  // Reset
  resetSimulator: () => Promise<void>;
}

const OSContext = createContext<OSContextValue | null>(null);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setPersisted] = useState<PersistedOSState>(() => {
    const saved = lsGet<Partial<PersistedOSState>>(LS_KEY, {});
    const installedAppIds = saved.installedAppIds ? [...saved.installedAppIds] : [...DEFAULT_PERSISTED.installedAppIds];
    const homePages = (saved.homePages ? saved.homePages.map((p) => [...p]) : DEFAULT_PAGES.map((p) => [...p]));
    if (!installedAppIds.includes('playstore')) {
      installedAppIds.push('playstore');
    }
    if (!installedAppIds.includes('google')) {
      installedAppIds.push('google');
    }
    const dockIds = saved.dockAppIds || DEFAULT_DOCK;
    const onPageOne = homePages[0]?.some((it) => it.kind === 'app' && it.appId === 'playstore');
    const inDock = dockIds.includes('playstore');
    if (!onPageOne && !inDock && homePages.length > 0) {
      // Remove from later pages so it cleanly lives on Page 1 next to App Store
      for (let i = 1; i < homePages.length; i++) {
        homePages[i] = homePages[i].filter((it) => !(it.kind === 'app' && it.appId === 'playstore'));
      }
      const appStoreIdx = homePages[0].findIndex((it) => it.kind === 'app' && it.appId === 'appstore');
      if (appStoreIdx >= 0) {
        homePages[0].splice(appStoreIdx + 1, 0, { kind: 'app', appId: 'playstore' });
      } else {
        homePages[0].push({ kind: 'app', appId: 'playstore' });
      }
    }
    const hasGoogleOnHome =
      homePages.some((p) => p.some((it) => it.kind === 'app' && it.appId === 'google')) ||
      dockIds.includes('google');
    if (!hasGoogleOnHome && homePages.length > 0) {
      const psIdx = homePages[0].findIndex((it) => it.kind === 'app' && it.appId === 'playstore');
      if (psIdx >= 0) {
        homePages[0].splice(psIdx + 1, 0, { kind: 'app', appId: 'google' });
      } else {
        homePages[0].push({ kind: 'app', appId: 'google' });
      }
    }
    return {
      ...DEFAULT_PERSISTED,
      ...saved,
      settings: { ...DEFAULT_SETTINGS, ...(saved.settings || {}) },
      folders: saved.folders || DEFAULT_FOLDERS,
      homePages,
      dockAppIds: saved.dockAppIds || DEFAULT_DOCK,
      installedAppIds,
    };
  });

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isAlwaysOn, setIsAlwaysOn] = useState<boolean>(false);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const rotateDevice = useCallback(
    (targetLandscape?: boolean) => {
      soundEngine.tap();
      setIsLandscape((prev) => {
        const next = typeof targetLandscape === 'boolean' ? targetLandscape : !prev;
        return next;
      });
    },
    []
  );
  const [flashlightOn, setFlashlightOn] = useState<boolean>(false);
  const [flashlightLevel, setFlashlightLevel] = useState<number>(3);
  const [volumeHudVisible, setVolumeHudVisible] = useState<boolean>(false);
  const volumeHudTimeout = useRef<number | null>(null);
  const [silentHud, setSilentHud] = useState<'silent' | 'ring' | null>(null);
  const silentHudTimeout = useRef<number | null>(null);

  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [appSubRoute, setAppSubRoute] = useState<string | null>(null);
  const [recentAppIds, setRecentAppIds] = useState<string[]>(['appstore', 'youtube', 'camera', 'safari']);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState<boolean>(false);
  const [controlCenterOpen, setControlCenterOpen] = useState<boolean>(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState<boolean>(false);
  const [spotlightOpen, setSpotlightOpen] = useState<boolean>(false);
  const [siriOpen, setSiriOpen] = useState<boolean>(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [jiggleMode, setJiggleMode] = useState<boolean>(false);
  const [currentHomePage, setCurrentHomePage] = useState<number>(0);

  const [installingProgress, setInstallingProgress] = useState<Record<string, number>>({});
  const [islandExpanded, setIslandExpanded] = useState<boolean>(false);

  // Live activities
  const [musicPlaying, setMusicPlaying] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(SEED_MUSIC_TRACKS[0]);
  const [musicElapsed, setMusicElapsed] = useState<number>(0);

  const [timerTotal, setTimerTotal] = useState<number>(0);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const activeCallRef = useRef<ActiveCallState | null>(null);
  activeCallRef.current = activeCall;
  const incomingTwilioCallRef = useRef<TwilioCall | null>(null);
  const [pendingCallChoice, setPendingCallChoice] = useState<PendingCallChoice | null>(null);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfigInfo>({
    twilioConfigured: false,
    callerId: null,
    webrtcSignalingReady: false,
    onlinePeersCount: 0,
    stunServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });
  const [wsVoipConnected, setWsVoipConnected] = useState<boolean>(false);
  const [onlineVoipPeers, setOnlineVoipPeers] = useState<OnlineVoipPeer[]>([]);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [micTestRunning, setMicTestRunning] = useState<boolean>(false);
  const [networkLatencyMs, setNetworkLatencyMs] = useState<number | null>(null);

  const refreshNetworkLatency = useCallback(async () => {
    const ms = await measureNetworkLatency();
    setNetworkLatencyMs(ms);
    return ms;
  }, []);

  useEffect(() => {
    if (state.settings.unlimitedNetworkMode !== false) {
      prewarmNetwork();
      void refreshNetworkLatency();
      const id = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          void refreshNetworkLatency();
        }
      }, 25000);
      return () => clearInterval(id);
    }
  }, [state.settings.unlimitedNetworkMode, refreshNetworkLatency]);

  const [screenRecording, setScreenRecording] = useState<boolean>(false);
  const [screenRecordSeconds, setScreenRecordSeconds] = useState<number>(0);

  const [notifications, setNotifications] = useState<OSNotification[]>([
    {
      id: 'notif-1',
      appId: 'messages',
      appName: 'Messages',
      title: 'Sarah Chen',
      body: 'Send me a shot when you capture one!',
      timestamp: Date.now() - 600000,
      read: false,
    },
    {
      id: 'notif-2',
      appId: 'appstore',
      appName: 'App Store',
      title: '3 App Updates Available',
      body: 'YouTube, WhatsApp, and Spotify have Liquid Glass updates ready.',
      timestamp: Date.now() - 1800000,
      read: false,
    },
  ]);
  const [bannerNotification, setBannerNotification] = useState<OSNotification | null>(null);
  const bannerTimer = useRef<number | null>(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    soundEngine.soundEnabled =
      state.settings.soundEnabled &&
      state.settings.focusMode !== 'dnd' &&
      !state.settings.silentMode;
    soundEngine.hapticsEnabled = state.settings.hapticsEnabled;
    soundEngine.volume = state.settings.volume / 100;
    voiceManager.setMicrophonePreferences(
      state.settings.microphoneEnabled !== false,
      state.settings.microphoneDeviceId,
      state.settings.microphoneGain
    );
  }, [state.settings]);

  // Persist OS state to localStorage
  useEffect(() => {
    lsSet(LS_KEY, state);
  }, [state]);

  // Load media from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const items = await loadAllMedia();
      if (!mounted) return;
      if (items.length === 0) {
        for (const seed of SEED_MEDIA) {
          await saveMediaItem(seed);
        }
        setMedia(SEED_MEDIA);
      } else {
        setMedia(items.sort((a, b) => b.createdAt - a.createdAt));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addMedia = useCallback(async (item: MediaItem) => {
    setMedia((prev) => [item, ...prev]);
    await saveMediaItem(item);
  }, []);

  const updateMedia = useCallback(async (id: string, patch: Partial<MediaItem>) => {
    setMedia((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...patch } : m));
      const updated = next.find((m) => m.id === id);
      if (updated) saveMediaItem(updated);
      return next;
    });
  }, []);

  const removeMediaPermanent = useCallback(async (id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
    await deleteMediaItemPermanent(id);
  }, []);

  const updateSettings = useCallback((patch: Partial<OSSettings>) => {
    setPersisted((prev) => {
      const next: OSSettings = { ...prev.settings, ...patch };
      if (patch.unlimitedNetworkMode === true) {
        next.wifi = true;
        next.cellular = true;
        next.airplaneMode = false;
      } else if (patch.airplaneMode === true) {
        next.unlimitedNetworkMode = false;
      }
      return {
        ...prev,
        settings: next,
      };
    });
  }, []);

  const pushNotification = useCallback(
    (appId: string, title: string, body: string) => {
      const appName = APP_MAP[appId]?.name || 'System';
      const notif: OSNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        appId,
        appName,
        title,
        body,
        timestamp: Date.now(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 40));
      if (state.settings.focusMode !== 'dnd' && state.settings.focusMode !== 'sleep') {
        soundEngine.notification();
        setBannerNotification(notif);
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        bannerTimer.current = window.setTimeout(() => setBannerNotification(null), 4200);
      }
    },
    [state.settings.focusMode]
  );

  const dismissBanner = useCallback(() => setBannerNotification(null), []);
  const clearNotifications = useCallback(() => setNotifications([]), []);

  // Battery simulation
  useEffect(() => {
    const id = window.setInterval(() => {
      setPersisted((prev) => {
        if (prev.isCharging) {
          if (prev.batteryLevel >= 100) return prev;
          return { ...prev, batteryLevel: Math.min(100, prev.batteryLevel + 1) };
        }
        // Slow realistic drain when screen unlocked
        if (!isLocked && prev.batteryLevel > 1) {
          const drainChance = prev.settings.lowPowerMode ? 0.2 : 0.45;
          if (Math.random() < drainChance) {
            return { ...prev, batteryLevel: Math.max(1, prev.batteryLevel - 1) };
          }
        }
        return prev;
      });
    }, 22000);
    return () => clearInterval(id);
  }, [isLocked]);

  // Music ticker
  useEffect(() => {
    if (!musicPlaying) return;
    const id = window.setInterval(() => {
      setMusicElapsed((prev) => {
        if (prev + 1 >= currentTrack.durationSec) {
          const idx = SEED_MUSIC_TRACKS.findIndex((t) => t.id === currentTrack.id);
          const next = SEED_MUSIC_TRACKS[(idx + 1) % SEED_MUSIC_TRACKS.length];
          setCurrentTrack(next);
          soundEngine.startMusic(next);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [musicPlaying, currentTrack]);

  // Timer ticker
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          soundEngine.timerRing();
          pushNotification('clock', 'Timer Done', 'Your countdown timer has finished.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, pushNotification]);

  // Screen recording ticker
  useEffect(() => {
    if (!screenRecording) return;
    const id = window.setInterval(() => {
      setScreenRecordSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [screenRecording]);

  const lockDevice = useCallback(() => {
    soundEngine.lock();
    setControlCenterOpen(false);
    setNotificationCenterOpen(false);
    setAppSwitcherOpen(false);
    setSpotlightOpen(false);
    setSiriOpen(false);
    setIsLocked(true);
    setIsAlwaysOn(false);
  }, []);

  const unlockDevice = useCallback(() => {
    soundEngine.unlock();
    setIsLocked(false);
    setIsAlwaysOn(false);
  }, []);

  const toggleAlwaysOn = useCallback(() => {
    setIsLocked(true);
    setIsAlwaysOn((prev) => !prev);
  }, []);

  const toggleCharging = useCallback(() => {
    setPersisted((prev) => {
      const nextCharging = !prev.isCharging;
      if (nextCharging) {
        soundEngine.unlock();
      }
      return { ...prev, isCharging: nextCharging };
    });
  }, []);

  const toggleFlashlight = useCallback(() => {
    soundEngine.tap();
    setFlashlightOn((prev) => !prev);
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    soundEngine.tap();
    setPersisted((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        volume: Math.max(0, Math.min(100, prev.settings.volume + delta)),
      },
    }));
    setVolumeHudVisible(true);
    if (volumeHudTimeout.current) clearTimeout(volumeHudTimeout.current);
    volumeHudTimeout.current = window.setTimeout(() => setVolumeHudVisible(false), 1800);
  }, []);

  const toggleSilentMode = useCallback(() => {
    soundEngine.haptic(18);
    setPersisted((prev) => {
      const nextSilent = !prev.settings.silentMode;
      soundEngine.soundEnabled = prev.settings.soundEnabled && prev.settings.focusMode !== 'dnd' && !nextSilent;
      if (!nextSilent) {
        soundEngine.unlock();
      }
      setSilentHud(nextSilent ? 'silent' : 'ring');
      if (silentHudTimeout.current) clearTimeout(silentHudTimeout.current);
      silentHudTimeout.current = window.setTimeout(() => setSilentHud(null), 2200);
      return {
        ...prev,
        settings: {
          ...prev.settings,
          silentMode: nextSilent,
        },
      };
    });
  }, []);

  const openApp = useCallback((appId: string, subRoute?: string) => {
    soundEngine.tap();
    // Handle direct stopwatch/timer aliases inside Clock
    if (appId === 'stopwatch' || appId === 'timer') {
      setActiveAppId('clock');
      setAppSubRoute(appId);
      setRecentAppIds((prev) => ['clock', ...prev.filter((x) => x !== 'clock')].slice(0, 12));
    } else {
      setActiveAppId(appId);
      setAppSubRoute(subRoute || null);
      setRecentAppIds((prev) => [appId, ...prev.filter((x) => x !== appId)].slice(0, 12));
    }
    setActiveFolderId(null);
    setSpotlightOpen(false);
    setAppSwitcherOpen(false);
    setControlCenterOpen(false);
    setNotificationCenterOpen(false);
    setJiggleMode(false);
  }, []);

  const closeApp = useCallback(() => {
    soundEngine.tap();
    setActiveAppId(null);
    setAppSubRoute(null);
    setAppSwitcherOpen(false);
    setControlCenterOpen(false);
    setNotificationCenterOpen(false);
    setSpotlightOpen(false);
    setActiveFolderId(null);
  }, []);

  const closeBackgroundApp = useCallback((appId: string) => {
    soundEngine.tap();
    setRecentAppIds((prev) => prev.filter((id) => id !== appId));
    if (activeAppId === appId) {
      setActiveAppId(null);
    }
  }, [activeAppId]);

  const installApp = useCallback(
    (appId: string) => {
      if (state.installedAppIds.includes(appId) || installingProgress[appId] !== undefined) return;
      soundEngine.tap();
      const ultraFast = state.settings.unlimitedNetworkMode !== false;
      setInstallingProgress((prev) => ({ ...prev, [appId]: ultraFast ? 45 : 5 }));
      const interval = window.setInterval(() => {
        setInstallingProgress((prev) => {
          const cur = prev[appId];
          if (cur === undefined) {
            clearInterval(interval);
            return prev;
          }
          const next = cur + (ultraFast ? 55 : Math.floor(14 + Math.random() * 18));
          if (next >= 100) {
            clearInterval(interval);
            const copy = { ...prev };
            delete copy[appId];
            setPersisted((os) => {
              if (os.installedAppIds.includes(appId)) return os;
              const newPages = os.homePages.map((p) => [...p]);
              const alreadyOnHome =
                newPages.some((p) => p.some((it) => it.kind === 'app' && it.appId === appId)) ||
                os.dockAppIds.includes(appId) ||
                Object.values(os.folders).some((f) => f.appIds.includes(appId));
              if (!alreadyOnHome) {
                const lastIdx = newPages.length - 1;
                newPages[lastIdx] = [...newPages[lastIdx], { kind: 'app', appId }];
              }
              return {
                ...os,
                installedAppIds: [...os.installedAppIds, appId],
                homePages: newPages,
              };
            });
            soundEngine.unlock();
            const appName = APP_MAP[appId]?.name || 'App';
            pushNotification('appstore', 'App Installed', `${appName} is ready on your Home Screen.`);
            return copy;
          }
          return { ...prev, [appId]: next };
        });
      }, ultraFast ? 70 : 210);
    },
    [state.installedAppIds, state.settings.unlimitedNetworkMode, installingProgress, pushNotification]
  );

  const installPlayApp = useCallback(
    (app: PlayStoreAppItem) => {
      if (app.localAppId && APP_MAP[app.localAppId]) {
        installApp(app.localAppId);
        return;
      }
      const dynamicId = `play:${app.packageId}`;
      if (state.installedAppIds.includes(dynamicId) || installingProgress[dynamicId] !== undefined) return;
      soundEngine.tap();
      const ultraFast = state.settings.unlimitedNetworkMode !== false;
      setInstallingProgress((prev) => ({ ...prev, [dynamicId]: ultraFast ? 50 : 10 }));

      const interval = window.setInterval(() => {
        setInstallingProgress((prev) => {
          const cur = prev[dynamicId];
          if (cur === undefined) {
            clearInterval(interval);
            return prev;
          }
          const next = Math.min(100, cur + (ultraFast ? 50 : Math.floor(18 + Math.random() * 20)));
          if (next >= 100) {
            clearInterval(interval);
            const copy = { ...prev };
            delete copy[dynamicId];
            setPersisted((os) => {
              if (os.installedAppIds.includes(dynamicId)) return os;
              const newPages = os.homePages.map((p) => [...p]);
              const lastPageIdx = newPages.length - 1;
              if (newPages[lastPageIdx].length < 16) {
                newPages[lastPageIdx].push({ kind: 'app', appId: dynamicId });
              } else {
                newPages.push([{ kind: 'app', appId: dynamicId }]);
              }
              return {
                ...os,
                installedAppIds: [...os.installedAppIds, dynamicId],
                installedPlayApps: { ...(os.installedPlayApps || {}), [dynamicId]: app },
                homePages: newPages,
              };
            });
            soundEngine.unlock();
            pushNotification('playstore', 'Play Store Installed', `${app.name} is ready on your Home Screen.`);
            return copy;
          }
          return { ...prev, [dynamicId]: next };
        });
      }, ultraFast ? 65 : 200);
    },
    [state.installedAppIds, state.settings.unlimitedNetworkMode, installingProgress, installApp, pushNotification]
  );

  const uninstallApp = useCallback((appId: string) => {
    const def = APP_MAP[appId];
    if (def?.systemApp) return;
    soundEngine.tap();
    setPersisted((os) => {
      const nextFolders: Record<string, HomeFolder> = {};
      for (const [k, f] of Object.entries(os.folders)) {
        nextFolders[k] = { ...f, appIds: f.appIds.filter((id) => id !== appId) };
      }
      const nextPlayApps = { ...(os.installedPlayApps || {}) };
      delete nextPlayApps[appId];
      return {
        ...os,
        installedAppIds: os.installedAppIds.filter((id) => id !== appId),
        installedPlayApps: nextPlayApps,
        dockAppIds: os.dockAppIds.filter((id) => id !== appId),
        folders: nextFolders,
        homePages: os.homePages.map((page) => page.filter((it) => !(it.kind === 'app' && it.appId === appId))),
      };
    });
    setRecentAppIds((prev) => prev.filter((id) => id !== appId));
    if (activeAppId === appId) setActiveAppId(null);
  }, [activeAppId]);

  const addPlaySearchHistory = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setPersisted((os) => ({
      ...os,
      playSearchHistory: [q, ...(os.playSearchHistory || []).filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 12),
    }));
  }, []);

  const clearPlaySearchHistory = useCallback(() => {
    setPersisted((os) => ({ ...os, playSearchHistory: [] }));
  }, []);

  const updatePlayApp = useCallback(
    (appId: string, nextVersion?: string) => {
      if (installingProgress[appId] !== undefined) return;
      soundEngine.tap();
      setInstallingProgress((prev) => ({ ...prev, [appId]: 12 }));
      const interval = window.setInterval(() => {
        setInstallingProgress((prev) => {
          const cur = prev[appId];
          if (cur === undefined) {
            clearInterval(interval);
            return prev;
          }
          const next = cur + 26;
          if (next >= 100) {
            clearInterval(interval);
            const copy = { ...prev };
            delete copy[appId];
            setPersisted((os) => {
              const existing = os.installedPlayApps?.[appId];
              const nextPlayApps = { ...(os.installedPlayApps || {}) };
              if (existing) {
                nextPlayApps[appId] = {
                  ...existing,
                  version: nextVersion || existing.latestVersion || existing.version || '2.0.0',
                  latestVersion: nextVersion || existing.latestVersion || existing.version || '2.0.0',
                };
              }
              return {
                ...os,
                installedPlayApps: nextPlayApps,
                updatedPlayAppIds: [...(os.updatedPlayAppIds || []), appId],
              };
            });
            soundEngine.unlock();
            const label = state.installedPlayApps?.[appId]?.name || APP_MAP[appId]?.name || 'App';
            pushNotification('playstore', 'Update Complete', `${label} is now up to date.`);
            return copy;
          }
          return { ...prev, [appId]: next };
        });
      }, 170);
    },
    [installingProgress, pushNotification, state.installedPlayApps]
  );

  const updateApp = useCallback((appId: string) => {
    if (installingProgress[appId] !== undefined) return;
    soundEngine.tap();
    setInstallingProgress((prev) => ({ ...prev, [appId]: 10 }));
    const interval = window.setInterval(() => {
      setInstallingProgress((prev) => {
        const cur = prev[appId];
        if (cur === undefined) {
          clearInterval(interval);
          return prev;
        }
        const next = cur + 24;
        if (next >= 100) {
          clearInterval(interval);
          const copy = { ...prev };
          delete copy[appId];
          setPersisted((os) => ({
            ...os,
            updatedAppIds: os.updatedAppIds.includes(appId) ? os.updatedAppIds : [...os.updatedAppIds, appId],
          }));
          soundEngine.unlock();
          const name = APP_MAP[appId]?.name || 'App';
          pushNotification('playstore', 'App Updated', `${name} updated cleanly.`);
          return copy;
        }
        return { ...prev, [appId]: next };
      });
    }, 180);
  }, [installingProgress, pushNotification]);

  const moveHomeApp = useCallback((fromPage: number, fromIndex: number, toPage: number, toIndex: number) => {
    setPersisted((os) => {
      const pages = os.homePages.map((p) => [...p]);
      if (!pages[fromPage] || !pages[toPage]) return os;
      const [item] = pages[fromPage].splice(fromIndex, 1);
      if (!item) return os;
      pages[toPage].splice(Math.min(toIndex, pages[toPage].length), 0, item);
      return { ...os, homePages: pages };
    });
  }, []);

  const moveAppToDock = useCallback((appId: string) => {
    setPersisted((os) => {
      if (os.dockAppIds.includes(appId) || os.dockAppIds.length >= 4) return os;
      return {
        ...os,
        dockAppIds: [...os.dockAppIds, appId],
        homePages: os.homePages.map((p) => p.filter((it) => !(it.kind === 'app' && it.appId === appId))),
      };
    });
  }, []);

  const removeAppFromDock = useCallback((appId: string) => {
    setPersisted((os) => {
      if (!os.dockAppIds.includes(appId)) return os;
      const pages = os.homePages.map((p) => [...p]);
      pages[0].push({ kind: 'app', appId });
      return {
        ...os,
        dockAppIds: os.dockAppIds.filter((id) => id !== appId),
        homePages: pages,
      };
    });
  }, []);

  const renameFolder = useCallback((folderId: string, name: string) => {
    setPersisted((os) => {
      const f = os.folders[folderId];
      if (!f) return os;
      return { ...os, folders: { ...os.folders, [folderId]: { ...f, name } } };
    });
  }, []);

  const createFolderFromApps = useCallback((page: number, sourceAppId: string, targetAppId: string) => {
    if (sourceAppId === targetAppId) return;
    setPersisted((os) => {
      const folderId = `folder-${Date.now()}`;
      const newFolder: HomeFolder = {
        id: folderId,
        name: APP_MAP[targetAppId]?.category || 'Folder',
        appIds: [targetAppId, sourceAppId],
      };
      const pages = os.homePages.map((p, idx) =>
        p
          .filter((it) => !(it.kind === 'app' && it.appId === sourceAppId))
          .map((it) => (idx === page && it.kind === 'app' && it.appId === targetAppId ? ({ kind: 'folder', folderId } as HomeItem) : it))
      );
      return {
        ...os,
        folders: { ...os.folders, [folderId]: newFolder },
        homePages: pages,
      };
    });
  }, []);

  // Music controls
  const toggleMusic = useCallback(() => {
    setMusicPlaying((prev) => {
      const next = !prev;
      if (next) soundEngine.startMusic(currentTrack);
      else soundEngine.stopMusic();
      return next;
    });
  }, [currentTrack]);

  const playTrack = useCallback((track: MusicTrack) => {
    setCurrentTrack(track);
    setMusicElapsed(0);
    setMusicPlaying(true);
    soundEngine.startMusic(track);
  }, []);

  const nextTrack = useCallback(() => {
    const idx = SEED_MUSIC_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const next = SEED_MUSIC_TRACKS[(idx + 1) % SEED_MUSIC_TRACKS.length];
    playTrack(next);
  }, [currentTrack, playTrack]);

  const prevTrack = useCallback(() => {
    const idx = SEED_MUSIC_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prev = SEED_MUSIC_TRACKS[(idx - 1 + SEED_MUSIC_TRACKS.length) % SEED_MUSIC_TRACKS.length];
    playTrack(prev);
  }, [currentTrack, playTrack]);

  // Timer controls
  const startTimer = useCallback((seconds: number) => {
    soundEngine.tap();
    setTimerTotal(seconds);
    setTimerRemaining(seconds);
    setTimerRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    soundEngine.tap();
    setTimerRunning((r) => !r);
  }, []);

  const resetTimer = useCallback(() => {
    soundEngine.tap();
    setTimerRunning(false);
    setTimerRemaining(0);
    setTimerTotal(0);
  }, []);

  const recordCallHistory = useCallback((call: ActiveCallState, outcome: CallRecord['outcome'], errorReason?: string) => {
    const dur = call.connectedAt ? Math.max(0, Math.floor((Date.now() - call.connectedAt) / 1000)) : 0;
    const entry: CallRecord = {
      id: call.id,
      contactName: call.contactName,
      phoneNumber: call.handle,
      direction: outcome === 'missed' ? 'missed' : call.direction,
      transport: call.transport,
      outcome,
      startedAt: call.startedAt,
      durationSec: dur,
      errorReason,
    };
    setPersisted((os) => ({
      ...os,
      callHistory: [entry, ...(os.callHistory || [])].slice(0, 60),
    }));
  }, []);

  // Initialize free WebRTC signaling & optional Twilio carrier engine
  useEffect(() => {
    voiceManager.init(state.voipExtension, state.settings.appleIdName, {
      onConfigUpdate: setVoiceConfig,
      onPeersUpdate: setOnlineVoipPeers,
      onWsStatusUpdate: setWsVoipConnected,
      onMicLevel: setMicLevel,
      onRemoteHold: (callId, onHold) => {
        setActiveCall((c) => (c && c.id === callId ? { ...c, remoteOnHold: onHold } : c));
      },
      onIncomingSignal: ({ callId, fromExtension, callerName, transport, twilioCall }) => {
        if (activeCallRef.current) {
          // Already in a call -> decline or log missed
          if (transport === 'webrtc-p2p') {
            voiceManager.declineWebRtcCall(callId, fromExtension);
          } else if (twilioCall) {
            try {
              twilioCall.reject();
            } catch {
              // ignore
            }
          }
          const missedEntry: CallRecord = {
            id: callId,
            contactName: callerName,
            phoneNumber: fromExtension,
            direction: 'missed',
            transport,
            outcome: 'missed',
            startedAt: Date.now(),
            durationSec: 0,
          };
          setPersisted((os) => ({
            ...os,
            callHistory: [missedEntry, ...(os.callHistory || [])].slice(0, 60),
          }));
          return;
        }

        incomingTwilioCallRef.current = twilioCall || null;
        soundEngine.startRingtone();
        setActiveCall({
          id: callId,
          contactName: callerName,
          handle: fromExtension,
          isVideo: false,
          direction: 'incoming',
          transport,
          status: 'incoming',
          startedAt: Date.now(),
          muted: false,
          speaker: false,
          onHold: false,
          minimized: false,
          dtmfSent: '',
        });
      },
      onCallStatusChange: (callId, status, extra) => {
        setActiveCall((prev) => {
          if (!prev || prev.id !== callId) return prev;
          if (status === 'ended' || status === 'declined') {
            const outcome: CallRecord['outcome'] = status === 'declined' ? 'declined' : prev.connectedAt ? 'connected' : 'missed';
            recordCallHistory(prev, outcome, extra?.errorMessage);
            incomingTwilioCallRef.current = null;
            return null;
          }
          if (status === 'failed') {
            const updated: ActiveCallState = {
              ...prev,
              status: 'failed',
              errorMessage: extra?.errorMessage || 'Call connection failed.',
            };
            recordCallHistory(updated, 'failed', updated.errorMessage);
            return updated;
          }
          return {
            ...prev,
            status,
            connectedAt: extra?.connectedAt ?? prev.connectedAt,
            errorMessage: extra?.errorMessage ?? prev.errorMessage,
          };
        });
      },
    });
    return () => {
      voiceManager.destroy();
    };
  }, [state.voipExtension, state.settings.appleIdName, recordCallHistory]);

  const dismissPendingCallChoice = useCallback(() => setPendingCallChoice(null), []);

  const startCall = useCallback(
    async (
      contactName: string,
      handle: string,
      isVideo = false,
      options?: { forceSimulated?: boolean }
    ) => {
      const cleanHandle = handle.trim();
      const matchedPeer = onlineVoipPeers.find(
        (p) =>
          p.extension.toLowerCase() === cleanHandle.toLowerCase() ||
          p.extension.replace(/\D/g, '') === cleanHandle.replace(/\D/g, '')
      );

      // 1) Free Real WebRTC Peer-to-Peer VoIP call if target extension is online
      if (matchedPeer) {
        const callId = `webrtc-${Date.now()}`;
        setPendingCallChoice(null);
        setActiveCall({
          id: callId,
          contactName: contactName || matchedPeer.name,
          handle: matchedPeer.extension,
          isVideo,
          direction: 'outgoing',
          transport: 'webrtc-p2p',
          status: 'ringing',
          startedAt: Date.now(),
          muted: false,
          speaker: isVideo,
          onHold: false,
          minimized: false,
          dtmfSent: '',
        });
        const res = await voiceManager.startWebRtcCall(callId, matchedPeer.extension);
        if (!res.ok) {
          setActiveCall((prev) =>
            prev && prev.id === callId ? { ...prev, status: 'failed', errorMessage: res.error } : prev
          );
        }
        return;
      }

      // 2) Optional Twilio Real Carrier PSTN call if configured on server
      if (voiceConfig.twilioConfigured && !options?.forceSimulated) {
        const callId = `twilio-${Date.now()}`;
        setPendingCallChoice(null);
        setActiveCall({
          id: callId,
          contactName: contactName || cleanHandle,
          handle: cleanHandle,
          isVideo,
          direction: 'outgoing',
          transport: 'twilio-pstn',
          status: 'dialing',
          startedAt: Date.now(),
          muted: false,
          speaker: isVideo,
          onHold: false,
          minimized: false,
          dtmfSent: '',
        });
        const res = await voiceManager.startTwilioPstnCall(callId, cleanHandle);
        if (!res.ok) {
          setActiveCall((prev) =>
            prev && prev.id === callId ? { ...prev, status: 'failed', errorMessage: res.error } : prev
          );
        }
        return;
      }

      // 3) Explicitly labeled Simulated Local Audio Test (requires mic permission so mic/DTMF/hold actually work!)
      if (options?.forceSimulated) {
        const callId = `sim-${Date.now()}`;
        setPendingCallChoice(null);
        setActiveCall({
          id: callId,
          contactName: contactName || cleanHandle,
          handle: cleanHandle,
          isVideo,
          direction: 'outgoing',
          transport: 'simulated-local',
          status: 'ringing',
          startedAt: Date.now(),
          muted: false,
          speaker: isVideo,
          onHold: false,
          minimized: false,
          dtmfSent: '',
        });
        const micRes = await voiceManager.requestMicrophone();
        if (!micRes.stream) {
          setActiveCall((prev) =>
            prev && prev.id === callId ? { ...prev, status: 'failed', errorMessage: micRes.error } : prev
          );
          return;
        }
        soundEngine.startRingback();
        window.setTimeout(() => {
          setActiveCall((prev) => {
            if (!prev || prev.id !== callId || prev.status !== 'ringing') return prev;
            soundEngine.stopCallTones();
            return { ...prev, status: 'connected', connectedAt: Date.now() };
          });
        }, 1800);
        return;
      }

      // 4) Never pretend a real PSTN call succeeded without WebRTC peer or Twilio! Open Phone App with honest choice
      setPendingCallChoice({ contactName: contactName || cleanHandle, handle: cleanHandle, isVideo });
      openApp('phone');
    },
    [onlineVoipPeers, voiceConfig.twilioConfigured, openApp]
  );

  const acceptIncomingCall = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call || call.status !== 'incoming') return;
    soundEngine.stopCallTones();

    if (call.transport === 'webrtc-p2p') {
      const res = await voiceManager.acceptWebRtcCall(call.id, call.handle);
      if (!res.ok) {
        setActiveCall((prev) =>
          prev && prev.id === call.id ? { ...prev, status: 'failed', errorMessage: res.error } : prev
        );
      }
      return;
    }

    if (call.transport === 'twilio-pstn' && incomingTwilioCallRef.current) {
      const res = await voiceManager.acceptTwilioIncoming(call.id, incomingTwilioCallRef.current);
      if (!res.ok) {
        setActiveCall((prev) =>
          prev && prev.id === call.id ? { ...prev, status: 'failed', errorMessage: res.error } : prev
        );
      }
      return;
    }

    // Simulated local incoming call -> request real mic
    const micRes = await voiceManager.requestMicrophone();
    if (!micRes.stream) {
      setActiveCall((prev) =>
        prev && prev.id === call.id ? { ...prev, status: 'failed', errorMessage: micRes.error } : prev
      );
      return;
    }
    setActiveCall((prev) =>
      prev && prev.id === call.id ? { ...prev, status: 'connected', connectedAt: Date.now() } : prev
    );
  }, []);

  const declineIncomingCall = useCallback(() => {
    const call = activeCallRef.current;
    if (!call) return;
    soundEngine.playCallEnded();
    if (call.transport === 'webrtc-p2p') {
      voiceManager.declineWebRtcCall(call.id, call.handle);
    } else if (call.transport === 'twilio-pstn' && incomingTwilioCallRef.current) {
      try {
        incomingTwilioCallRef.current.reject();
      } catch {
        // ignore
      }
      incomingTwilioCallRef.current = null;
    } else {
      voiceManager.cleanupMediaAndPeer();
    }
    recordCallHistory(call, 'declined');
    setActiveCall(null);
  }, [recordCallHistory]);

  const endCall = useCallback(() => {
    const call = activeCallRef.current;
    if (call) {
      if (call.status !== 'failed') {
        const outcome: CallRecord['outcome'] = call.connectedAt
          ? 'connected'
          : call.direction === 'incoming'
            ? 'missed'
            : 'missed';
        recordCallHistory(call, outcome, call.errorMessage);
      }
      voiceManager.hangup(call.id);
    }
    soundEngine.playCallEnded();
    incomingTwilioCallRef.current = null;
    setActiveCall(null);
  }, [recordCallHistory]);

  const toggleCallMute = useCallback(() => {
    soundEngine.tap();
    setActiveCall((c) => {
      if (!c) return null;
      const next = !c.muted;
      voiceManager.setMuted(next);
      return { ...c, muted: next };
    });
  }, []);

  const toggleCallSpeaker = useCallback(() => {
    soundEngine.tap();
    setActiveCall((c) => {
      if (!c) return null;
      const next = !c.speaker;
      voiceManager.setSpeaker(next);
      return { ...c, speaker: next };
    });
  }, []);

  const toggleCallHold = useCallback(() => {
    soundEngine.tap();
    setActiveCall((c) => {
      if (!c || (c.status !== 'connected' && c.status !== 'on-hold')) return c;
      const nextHold = !c.onHold;
      voiceManager.setHold(c.id, nextHold);
      return {
        ...c,
        onHold: nextHold,
        status: nextHold ? 'on-hold' : 'connected',
      };
    });
  }, []);

  const sendCallDtmf = useCallback((digit: string) => {
    voiceManager.sendDtmf(digit);
    setActiveCall((c) => (c ? { ...c, dtmfSent: (c.dtmfSent + digit).slice(-24) } : null));
  }, []);

  const setCallMinimized = useCallback((minimized: boolean) => {
    setActiveCall((c) => (c ? { ...c, minimized } : null));
  }, []);

  const triggerSimulatedIncomingCall = useCallback((callerName = 'Sarah Chen', handle = '+1 (408) 555-0142') => {
    if (activeCallRef.current) return;
    soundEngine.startRingtone();
    setActiveCall({
      id: `sim-in-${Date.now()}`,
      contactName: callerName,
      handle,
      isVideo: false,
      direction: 'incoming',
      transport: 'simulated-local',
      status: 'incoming',
      startedAt: Date.now(),
      muted: false,
      speaker: false,
      onHold: false,
      minimized: false,
      dtmfSent: '',
    });
  }, []);

  const clearCallHistory = useCallback(() => {
    setPersisted((os) => ({ ...os, callHistory: [] }));
  }, []);

  const deleteCallRecord = useCallback((id: string) => {
    setPersisted((os) => ({
      ...os,
      callHistory: (os.callHistory || []).filter((c) => c.id !== id),
    }));
  }, []);

  // Screen recording toggle
  const toggleScreenRecording = useCallback(() => {
    soundEngine.tap();
    setScreenRecording((prev) => {
      if (prev) {
        pushNotification('photos', 'Screen Recording Saved', 'Saved simulated screen capture to Photos.');
        setScreenRecordSeconds(0);
        return false;
      }
      setScreenRecordSeconds(0);
      return true;
    });
  }, [pushNotification]);

  const resetSimulator = useCallback(async () => {
    soundEngine.stopMusic();
    voiceManager.cleanupMediaAndPeer();
    localStorage.removeItem(LS_KEY);
    await clearAllMedia();
    for (const seed of SEED_MEDIA) {
      await saveMediaItem(seed);
    }
    setMedia(SEED_MEDIA);
    setPersisted(DEFAULT_PERSISTED);
    setActiveAppId(null);
    setIsLocked(true);
    setMusicPlaying(false);
    setTimerRunning(false);
    setTimerRemaining(0);
    setActiveCall(null);
    setPendingCallChoice(null);
    setScreenRecording(false);
  }, []);

  const toggleMicrophoneHardware = useCallback(() => {
    soundEngine.haptic(14);
    setPersisted((prev) => {
      const nextEnabled = !(prev.settings.microphoneEnabled !== false);
      if (!nextEnabled) {
        setMicTestRunning(false);
        voiceManager.stopHardwareMicTest();
        setActiveCall((c) => {
          if (c) {
            voiceManager.setMuted(true);
            return { ...c, muted: true };
          }
          return c;
        });
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          microphoneEnabled: nextEnabled,
        },
      };
    });
  }, []);

  const startMicHardwareTest = useCallback(async () => {
    const res = await voiceManager.startHardwareMicTest();
    setMicTestRunning(res.ok);
    return { ok: res.ok, error: res.error };
  }, []);

  const stopMicHardwareTest = useCallback(() => {
    voiceManager.stopHardwareMicTest();
    setMicTestRunning(false);
  }, []);

  const micHardwareActive =
    (state.settings.microphoneEnabled !== false) &&
    (micTestRunning || Boolean(activeCall && !activeCall.muted && activeCall.status !== 'ended' && activeCall.status !== 'failed'));

  const value = useMemo<OSContextValue>(
    () => ({
      state,
      updateSettings,
      setPersisted,
      media,
      addMedia,
      updateMedia,
      removeMediaPermanent,
      isLocked,
      isAlwaysOn,
      lockDevice,
      unlockDevice,
      toggleAlwaysOn,
      toggleCharging,
      isLandscape,
      setIsLandscape,
      rotateDevice,
      flashlightOn,
      flashlightLevel,
      setFlashlightLevel,
      toggleFlashlight,
      volumeHudVisible,
      adjustVolume,
      silentHud,
      toggleSilentMode,
      micHardwareActive,
      toggleMicrophoneHardware,
      startMicHardwareTest,
      stopMicHardwareTest,
      networkLatencyMs,
      refreshNetworkLatency,
      activeAppId,
      recentAppIds,
      appSubRoute,
      openApp,
      closeApp,
      closeBackgroundApp,
      appSwitcherOpen,
      setAppSwitcherOpen,
      controlCenterOpen,
      setControlCenterOpen,
      notificationCenterOpen,
      setNotificationCenterOpen,
      spotlightOpen,
      setSpotlightOpen,
      siriOpen,
      setSiriOpen,
      activeFolderId,
      setActiveFolderId,
      jiggleMode,
      setJiggleMode,
      currentHomePage,
      setCurrentHomePage,
      installingProgress,
      installApp,
      installPlayApp,
      updatePlayApp,
      addPlaySearchHistory,
      clearPlaySearchHistory,
      uninstallApp,
      updateApp,
      moveHomeApp,
      moveAppToDock,
      removeAppFromDock,
      renameFolder,
      createFolderFromApps,
      islandExpanded,
      setIslandExpanded,
      musicPlaying,
      currentTrack,
      musicElapsed,
      toggleMusic,
      playTrack,
      nextTrack,
      prevTrack,
      timerRemaining,
      timerTotal,
      timerRunning,
      startTimer,
      pauseTimer,
      resetTimer,
      voiceConfig,
      wsVoipConnected,
      onlineVoipPeers,
      micLevel,
      activeCall,
      pendingCallChoice,
      dismissPendingCallChoice,
      startCall,
      acceptIncomingCall,
      declineIncomingCall,
      endCall,
      toggleCallMute,
      toggleCallSpeaker,
      toggleCallHold,
      sendCallDtmf,
      setCallMinimized,
      triggerSimulatedIncomingCall,
      clearCallHistory,
      deleteCallRecord,
      screenRecording,
      screenRecordSeconds,
      toggleScreenRecording,
      notifications,
      bannerNotification,
      pushNotification,
      clearNotifications,
      dismissBanner,
      resetSimulator,
    }),
    [
      state,
      updateSettings,
      media,
      addMedia,
      updateMedia,
      removeMediaPermanent,
      isLocked,
      isAlwaysOn,
      lockDevice,
      unlockDevice,
      toggleAlwaysOn,
      toggleCharging,
      isLandscape,
      rotateDevice,
      flashlightOn,
      flashlightLevel,
      toggleFlashlight,
      volumeHudVisible,
      adjustVolume,
      silentHud,
      toggleSilentMode,
      micHardwareActive,
      toggleMicrophoneHardware,
      startMicHardwareTest,
      stopMicHardwareTest,
      networkLatencyMs,
      refreshNetworkLatency,
      activeAppId,
      recentAppIds,
      appSubRoute,
      openApp,
      closeApp,
      closeBackgroundApp,
      appSwitcherOpen,
      controlCenterOpen,
      notificationCenterOpen,
      spotlightOpen,
      siriOpen,
      activeFolderId,
      jiggleMode,
      currentHomePage,
      installingProgress,
      installApp,
      installPlayApp,
      updatePlayApp,
      addPlaySearchHistory,
      clearPlaySearchHistory,
      uninstallApp,
      updateApp,
      moveHomeApp,
      moveAppToDock,
      removeAppFromDock,
      renameFolder,
      createFolderFromApps,
      islandExpanded,
      musicPlaying,
      currentTrack,
      musicElapsed,
      toggleMusic,
      playTrack,
      nextTrack,
      prevTrack,
      timerRemaining,
      timerTotal,
      timerRunning,
      startTimer,
      pauseTimer,
      resetTimer,
      voiceConfig,
      wsVoipConnected,
      onlineVoipPeers,
      micLevel,
      activeCall,
      pendingCallChoice,
      dismissPendingCallChoice,
      startCall,
      acceptIncomingCall,
      declineIncomingCall,
      endCall,
      toggleCallMute,
      toggleCallSpeaker,
      toggleCallHold,
      sendCallDtmf,
      setCallMinimized,
      triggerSimulatedIncomingCall,
      clearCallHistory,
      deleteCallRecord,
      screenRecording,
      screenRecordSeconds,
      toggleScreenRecording,
      notifications,
      bannerNotification,
      pushNotification,
      clearNotifications,
      dismissBanner,
      resetSimulator,
    ]
  );

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
};

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used inside OSProvider');
  return ctx;
}
