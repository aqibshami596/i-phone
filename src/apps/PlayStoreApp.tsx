import React, { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  ExternalLink,
  Gamepad2,
  Globe,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { fastFetchJson } from '../os/networkManager';
import { APP_MAP, APP_REGISTRY, renderAppIcon } from '../os/appRegistry';
import { AppDefinition, PlayStoreAppItem, PlayStoreReview } from '../os/types';

type PlayTab = 'apps' | 'games' | 'search' | 'manage';
type AppFilterPill = 'all' | 'charts' | 'pwa' | 'Social' | 'Productivity' | 'Utilities' | 'Entertainment';
type LibraryFilter = 'all' | 'builtin' | 'pwa' | 'preview';

const GOOGLE_ESSENTIAL_IDS = ['chrome', 'gmail', 'googledrive', 'youtube', 'maps', 'translate'];
const POPULAR_REAL_IDS = [
  'instagram',
  'tiktok',
  'twitterx',
  'discord',
  'reddit',
  'whatsapp',
  'spotify',
  'netflix',
  'uber',
  'amazon',
  'notion',
  'pinterest',
  'duolingo',
  'snapchat',
];

const QUICK_PLAY_SEARCHES = [
  'Spotify',
  'ChatGPT',
  'Roblox',
  'Canva',
  'CapCut',
  'Zoom',
  'Wikipedia',
  'Subway Surfers',
];

// Curated 100% Free legitimate Web Apps & PWAs that install to the Home Screen and run interactively inside AppHost
const WEB_PWA_CATALOG: PlayStoreAppItem[] = [
  {
    packageId: 'org.wikipedia.pwa',
    name: 'Wikipedia PWA',
    developer: 'Wikimedia Foundation',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/240px-Wikipedia-logo-v2.svg.png',
    rating: 4.9,
    ratingCount: '2.1M',
    category: 'Productivity',
    price: 'Free',
    downloads: '100M+',
    version: '4.12.0',
    latestVersion: '4.12.0',
    updatedOn: 'Current',
    sizeLabel: 'Web App · 2.4 MB',
    installType: 'pwa-web',
    webAppUrl: 'https://en.m.wikipedia.org',
    playUrl: 'https://play.google.com/store/apps/details?id=org.wikipedia',
    description:
      'Free encyclopedia built by volunteers worldwide. Runs live as an interactive Web App / PWA right on your iPhone Home Screen — zero money required.',
    reviews: [
      {
        id: 'w1',
        author: 'Maya R.',
        rating: 5,
        date: 'This week',
        text: 'Opens instantly as a clean mobile web app with full article search.',
      },
      {
        id: 'w2',
        author: 'Daniel K.',
        rating: 5,
        date: 'Last month',
        text: '100% free and reliable reference right on my home screen.',
      },
    ],
  },
  {
    packageId: 'com.excalidraw.pwa',
    name: 'Excalidraw Whiteboard',
    developer: 'Excalidraw Open Source',
    icon: 'https://excalidraw.com/apple-touch-icon.png',
    rating: 4.8,
    ratingCount: '89K',
    category: 'Productivity',
    price: 'Free',
    downloads: '5M+',
    version: '2.9.4',
    latestVersion: '3.0.0',
    updatedOn: 'Today',
    sizeLabel: 'Web App · 3.1 MB',
    installType: 'pwa-web',
    webAppUrl: 'https://excalidraw.com',
    playUrl: 'https://excalidraw.com',
    description:
      'Virtual collaborative whiteboard for sketching hand-drawn diagrams, wireframes, and system architecture live in your simulator.',
    reviews: [
      {
        id: 'ex1',
        author: 'Priya S.',
        rating: 5,
        date: '2 days ago',
        text: 'Sketching works super smoothly inside the PWA container.',
      },
    ],
  },
  {
    packageId: 'com.photopea.pwa',
    name: 'Photopea Studio',
    developer: 'Photopea Inc.',
    icon: 'https://www.photopea.com/promo/icon512.png',
    rating: 4.7,
    ratingCount: '310K',
    category: 'Utilities',
    price: 'Free',
    downloads: '10M+',
    version: '5.6.0',
    latestVersion: '5.6.0',
    updatedOn: 'Current',
    sizeLabel: 'Web App · 4.8 MB',
    installType: 'pwa-web',
    webAppUrl: 'https://www.photopea.com',
    playUrl: 'https://www.photopea.com',
    description:
      'Advanced free photo & layer editor supporting PSD, XCF, Sketch, and PNG files directly in the browser.',
    reviews: [
      {
        id: 'ph1',
        author: 'Chris T.',
        rating: 5,
        date: '5 days ago',
        text: 'Desktop-grade image layers and masks for free with no subscription.',
      },
    ],
  },
  {
    packageId: 'org.lichess.pwa',
    name: 'Lichess Free Chess',
    developer: 'lichess.org',
    icon: 'https://lichess1.org/assets/logo/lichess-favicon-256.png',
    rating: 4.9,
    ratingCount: '420K',
    category: 'Games',
    price: 'Free',
    downloads: '10M+',
    version: '8.4.1',
    latestVersion: '8.5.0',
    updatedOn: '3 days ago',
    sizeLabel: 'Web App · 3.6 MB',
    installType: 'pwa-web',
    webAppUrl: 'https://lichess.org',
    playUrl: 'https://play.google.com/store/apps/details?id=org.lichess.mobileapp',
    description:
      'Forever free, open-source chess server with live puzzles, Stockfish analysis, and online blitz matches.',
    reviews: [
      {
        id: 'li1',
        author: 'Arjun P.',
        rating: 5,
        date: 'Yesterday',
        text: 'No ads, no paywalls, instant chess puzzles and analysis.',
      },
    ],
  },
  {
    packageId: 'org.openstreetmap.pwa',
    name: 'OpenStreetMap Live',
    developer: 'OpenStreetMap Foundation',
    icon: 'https://www.openstreetmap.org/assets/osm_logo-d4979005d8a03d67bbf051b4e7e6ef1b26c6a34a521e7ae71e7b863e75f286dc.svg',
    rating: 4.7,
    ratingCount: '190K',
    category: 'Utilities',
    price: 'Free',
    downloads: '50M+',
    version: '3.2.0',
    latestVersion: '3.2.0',
    updatedOn: 'Current',
    sizeLabel: 'Web App · 1.9 MB',
    installType: 'pwa-web',
    webAppUrl: 'https://www.openstreetmap.org',
    playUrl: 'https://www.openstreetmap.org',
    description:
      'Community-driven free world map with street-level detail, cycling layers, and open geographic search.',
  },
  {
    packageId: 'com.play2048.pwa',
    name: '2048 Classic Web',
    developer: 'Gabriele Cirulli',
    icon: 'https://play2048.co/favicon.ico',
    rating: 4.6,
    ratingCount: '540K',
    category: 'Games',
    price: 'Free',
    downloads: '50M+',
    version: '1.4.2',
    latestVersion: '1.4.2',
    updatedOn: 'Current',
    sizeLabel: 'Web App · 1.2 MB',
    installType: 'pwa-web',
    webAppUrl: 'https://play2048.co',
    playUrl: 'https://play2048.co',
    description:
      'Join the numbers and get to the 2048 tile in this classic free browser puzzle game.',
  },
];

const isFreeItem = (item: PlayStoreAppItem) =>
  !item.price || item.price.trim().toLowerCase() === 'free' || item.price === '$0' || item.price === '$0.00';

export const PlayStoreApp: React.FC = () => {
  const {
    state,
    setPersisted,
    installingProgress,
    installApp,
    installPlayApp,
    uninstallApp,
    updateApp,
    updatePlayApp,
    addPlaySearchHistory,
    clearPlaySearchHistory,
    pushNotification,
    openApp,
  } = useOS();

  const [tab, setTab] = useState<PlayTab>('apps');
  const [appFilter, setAppFilter] = useState<AppFilterPill>('all');
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveApps, setLiveApps] = useState<PlayStoreAppItem[]>([]);
  const [liveGames, setLiveGames] = useState<PlayStoreAppItem[]>([]);
  const [searchResults, setSearchResults] = useState<PlayStoreAppItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [searching, setSearching] = useState(false);

  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null);
  const [selectedPlayApp, setSelectedPlayApp] = useState<PlayStoreAppItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Custom PWA installer modal
  const [showCustomPwa, setShowCustomPwa] = useState(false);
  const [customPwaName, setCustomPwaName] = useState('');
  const [customPwaUrl, setCustomPwaUrl] = useState('https://');
  const [customPwaCategory, setCustomPwaCategory] = useState('Productivity');
  const [customPwaError, setCustomPwaError] = useState('');

  // Local user review composer
  const [userReviews, setUserReviews] = useState<Record<string, PlayStoreReview[]>>({});
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const getEffectiveId = (item: PlayStoreAppItem) =>
    item.localAppId && APP_MAP[item.localAppId] ? item.localAppId : `play:${item.packageId}`;

  const isInstalledId = (id: string) => state.installedAppIds.includes(id);

  const needsLocalUpdate = (app: AppDefinition) =>
    Boolean(app.hasUpdate && isInstalledId(app.id) && !state.updatedAppIds.includes(app.id));

  const playUpdatesList = useMemo(() => {
    const installedPlay = Object.entries(state.installedPlayApps || {});
    return installedPlay
      .map(([id, app]) => {
        const pwaMatch = WEB_PWA_CATALOG.find((p) => p.packageId === app.packageId);
        const targetLatest = app.latestVersion || pwaMatch?.latestVersion;
        const hasNewVersion =
          Boolean(targetLatest && app.version && targetLatest !== app.version) &&
          !(state.updatedPlayAppIds || []).includes(id);
        return { id, app, hasNewVersion, targetLatest };
      })
      .filter((entry) => entry.hasNewVersion);
  }, [state.installedPlayApps, state.updatedPlayAppIds]);

  const updatesList = useMemo(
    () => APP_REGISTRY.filter((a) => needsLocalUpdate(a)),
    [state.installedAppIds, state.updatedAppIds]
  );

  // Fetch live free Google Play Store feeds on mount
  useEffect(() => {
    let active = true;
    setLoadingFeed(true);
    Promise.all([
      fastFetchJson('/api/playstore/search?category=apps').catch(() => ({ apps: [] })),
      fastFetchJson('/api/playstore/search?category=games').catch(() => ({ apps: [] })),
    ]).then(([appsData, gamesData]) => {
      if (!active) return;
      if (Array.isArray(appsData?.apps)) {
        setLiveApps(appsData.apps.filter(isFreeItem));
      }
      if (Array.isArray(gamesData?.apps)) {
        setLiveGames(gamesData.apps.filter(isFreeItem));
      }
      setLoadingFeed(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const runLiveSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    addPlaySearchHistory(trimmed);
    setSearching(true);
    try {
      const data = await fastFetchJson(`/api/playstore/search?q=${encodeURIComponent(trimmed)}&category=apps`);
      if (Array.isArray(data?.apps)) {
        setSearchResults(data.apps.filter(isFreeItem));
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (tab !== 'search') return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void runLiveSearch(trimmed);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchQuery, tab]);

  const openPlayAppDetail = async (item: PlayStoreAppItem) => {
    setSelectedPlayApp(item);
    if (item.installType === 'pwa-web' && item.webAppUrl) {
      setLoadingDetails(false);
      return;
    }
    setLoadingDetails(true);
    try {
      const data = await fastFetchJson(`/api/playstore/details?id=${encodeURIComponent(item.packageId)}`);
      if (data?.details) {
        setSelectedPlayApp((prev) =>
          prev && prev.packageId === item.packageId
            ? {
                ...prev,
                ...data.details,
                price: 'Free',
              }
            : prev
        );
      }
    } catch {
      // keep summary fields
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleInstallCustomPwa = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomPwaError('');
    const name = customPwaName.trim();
    let rawUrl = customPwaUrl.trim();
    if (!name) {
      setCustomPwaError('Please enter an app name.');
      return;
    }
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = `https://${rawUrl}`;
    }
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setCustomPwaError('Only http:// or https:// web apps are allowed.');
        return;
      }
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'webapp';
      const customItem: PlayStoreAppItem = {
        packageId: `pwa.custom.${slug}.${Date.now().toString(36)}`,
        name,
        developer: parsed.hostname,
        icon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=128`,
        rating: 5.0,
        ratingCount: 'PWA',
        category: customPwaCategory,
        price: 'Free',
        downloads: 'Web App',
        version: '1.0.0',
        latestVersion: '1.0.0',
        updatedOn: 'Today',
        sizeLabel: 'Web App · PWA',
        installType: 'pwa-web',
        webAppUrl: parsed.toString(),
        playUrl: parsed.toString(),
        description: `Custom Free Web App / PWA installed from ${parsed.hostname}. Zero money required.`,
      };
      installPlayApp(customItem);
      setShowCustomPwa(false);
      setCustomPwaName('');
      setCustomPwaUrl('https://');
    } catch {
      setCustomPwaError('Enter a valid URL (for example https://excalidraw.com).');
    }
  };

  const recommendedLocalApps = useMemo(() => {
    const installedCategories = new Set(
      state.installedAppIds.map((id) => APP_MAP[id]?.category).filter(Boolean)
    );
    const notInstalled = APP_REGISTRY.filter(
      (a) => a.id !== 'playstore' && !state.installedAppIds.includes(a.id)
    );
    const matchingCat = notInstalled.filter((a) => installedCategories.has(a.category));
    const base = matchingCat.length >= 4 ? matchingCat : [...matchingCat, ...notInstalled];
    const unique = Array.from(new Map(base.map((a) => [a.id, a])).values());
    return unique.slice(0, 6);
  }, [state.installedAppIds]);

  const filteredLiveApps = useMemo(() => {
    if (appFilter === 'all' || appFilter === 'charts') return liveApps;
    if (appFilter === 'pwa') return [];
    const term = appFilter.toLowerCase();
    return liveApps.filter(
      (a) =>
        a.category.toLowerCase().includes(term) ||
        (term === 'utilities' && a.category.toLowerCase().includes('tool'))
    );
  }, [liveApps, appFilter]);

  const filteredPwas = useMemo(() => {
    if (appFilter === 'all' || appFilter === 'pwa') return WEB_PWA_CATALOG;
    if (appFilter === 'charts') return [];
    const term = appFilter.toLowerCase();
    return WEB_PWA_CATALOG.filter(
      (a) =>
        a.category.toLowerCase().includes(term) ||
        (term === 'tools' && a.category.toLowerCase().includes('utilities'))
    );
  }, [appFilter]);

  const pwaMatchingSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return WEB_PWA_CATALOG.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.developer.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const localMatchingSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return APP_REGISTRY.filter(
      (a) =>
        a.id !== 'playstore' &&
        (a.name.toLowerCase().includes(q) ||
          a.developer.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const activeDownloads = Object.entries(installingProgress);

  const usedStorageMB = useMemo(() => {
    const localMB = state.installedAppIds.reduce((sum, id) => sum + (APP_MAP[id]?.sizeMB || 0), 0);
    const playMB = Object.keys(state.installedPlayApps || {}).length * 14;
    return localMB + playMB;
  }, [state.installedAppIds, state.installedPlayApps]);

  const renderLocalActionBtn = (app: AppDefinition, full = false) => {
    const progress = installingProgress[app.id];
    if (progress !== undefined) {
      return (
        <div
          className={`flex items-center justify-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold text-xs ${
            full ? 'w-full py-2.5' : 'px-3.5 py-1.5'
          }`}
        >
          <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="font-mono-num">{progress}%</span>
        </div>
      );
    }
    if (needsLocalUpdate(app)) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateApp(app.id);
          }}
          className={`rounded-full bg-[#01875f] hover:bg-[#01704f] text-white font-semibold transition-colors ${
            full ? 'w-full py-2.5 text-sm' : 'px-4 py-1.5 text-xs'
          }`}
        >
          Update
        </button>
      );
    }
    if (isInstalledId(app.id)) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openApp(app.id);
          }}
          className={`rounded-full border border-[#01875f]/40 bg-emerald-500/10 text-[#01875f] dark:text-emerald-400 hover:bg-[#01875f] hover:text-white font-semibold transition-colors ${
            full ? 'w-full py-2.5 text-sm' : 'px-4 py-1.5 text-xs'
          }`}
        >
          Open
        </button>
      );
    }
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          installApp(app.id);
        }}
        className={`rounded-full bg-[#01875f] hover:bg-[#01704f] text-white font-semibold transition-colors ${
          full ? 'w-full py-2.5 text-sm' : 'px-4 py-1.5 text-xs'
        }`}
      >
        Install Free
      </button>
    );
  };

  const renderRemoteActionBtn = (item: PlayStoreAppItem, full = false) => {
    const effId = getEffectiveId(item);
    const progress = installingProgress[effId];
    const installedItem = state.installedPlayApps?.[effId];
    const hasUpdate =
      installedItem &&
      item.latestVersion &&
      installedItem.version &&
      item.latestVersion !== installedItem.version &&
      !(state.updatedPlayAppIds || []).includes(effId);

    if (progress !== undefined) {
      return (
        <div
          className={`flex items-center justify-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold text-xs ${
            full ? 'w-full py-2.5' : 'px-3.5 py-1.5'
          }`}
        >
          <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="font-mono-num">{progress}%</span>
        </div>
      );
    }
    if (hasUpdate) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            updatePlayApp(effId, item.latestVersion);
          }}
          className={`rounded-full bg-[#01875f] hover:bg-[#01704f] text-white font-semibold transition-colors ${
            full ? 'w-full py-2.5 text-sm' : 'px-4 py-1.5 text-xs'
          }`}
        >
          Update
        </button>
      );
    }
    if (isInstalledId(effId)) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openApp(effId);
          }}
          className={`rounded-full border border-[#01875f]/40 bg-emerald-500/10 text-[#01875f] dark:text-emerald-400 hover:bg-[#01875f] hover:text-white font-semibold transition-colors ${
            full ? 'w-full py-2.5 text-sm' : 'px-4 py-1.5 text-xs'
          }`}
        >
          Open
        </button>
      );
    }
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          installPlayApp(item);
        }}
        className={`rounded-full bg-[#01875f] hover:bg-[#01704f] text-white font-semibold transition-colors ${
          full ? 'w-full py-2.5 text-sm' : 'px-4 py-1.5 text-xs'
        }`}
      >
        Install Free
      </button>
    );
  };

  // PLAY STORE / PWA APP DETAIL SHEET
  if (selectedPlayApp) {
    const effId = getEffectiveId(selectedPlayApp);
    const installed = isInstalledId(effId);
    const distType =
      selectedPlayApp.localAppId && APP_MAP[selectedPlayApp.localAppId]
        ? 'builtin-native'
        : selectedPlayApp.installType || 'play-catalog';
    const combinedReviews = [
      ...(userReviews[selectedPlayApp.packageId] || []),
      ...(selectedPlayApp.reviews || []),
    ];

    return (
      <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <div className="px-3 pt-2.5 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setSelectedPlayApp(null)}
            className="flex items-center gap-1 text-sm font-medium text-[#01875f] dark:text-emerald-400"
          >
            <ChevronLeft className="w-5 h-5" />
            Google Play
          </button>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/12 text-[#01875f] dark:text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Free · Zero Cost
          </span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md shrink-0 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              {selectedPlayApp.icon ? (
                <img
                  src={selectedPlayApp.icon}
                  alt={selectedPlayApp.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                renderAppIcon('playstore', 'lg')
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold leading-tight">{selectedPlayApp.name}</h1>
              <p className="text-xs font-medium text-[#01875f] dark:text-emerald-400 mt-0.5">
                {selectedPlayApp.developer}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {distType === 'builtin-native' && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-[#01875f] dark:text-emerald-400 text-[10px] font-bold">
                    Built-In Full App
                  </span>
                )}
                {distType === 'pwa-web' && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-bold">
                    Free Web App / PWA
                  </span>
                )}
                {distType === 'play-catalog' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    Simulated Play Store Preview · No APK Downloaded
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 py-2.5 border-y border-zinc-200 dark:border-zinc-800 text-center text-xs">
            <div>
              <p className="font-bold font-mono-num flex items-center justify-center gap-0.5">
                {selectedPlayApp.rating} <Star className="w-3 h-3 fill-current" />
              </p>
              <p className="text-[10px] text-zinc-500 truncate">{selectedPlayApp.ratingCount || 'Reviews'}</p>
            </div>
            <div>
              <p className="font-bold font-mono-num truncate">{selectedPlayApp.downloads}</p>
              <p className="text-[10px] text-zinc-500">Downloads</p>
            </div>
            <div>
              <p className="font-bold font-mono-num truncate">v{selectedPlayApp.version || '1.0'}</p>
              <p className="text-[10px] text-zinc-500">{selectedPlayApp.updatedOn || 'Updated'}</p>
            </div>
            <div>
              <p className="font-bold text-[#01875f] dark:text-emerald-400">Free</p>
              <p className="text-[10px] text-zinc-500 truncate">{selectedPlayApp.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">{renderRemoteActionBtn(selectedPlayApp, true)}</div>
            {installed && !APP_MAP[effId]?.systemApp && (
              <button
                onClick={() => uninstallApp(effId)}
                className="px-4 py-2.5 rounded-full border border-rose-500/40 text-rose-500 text-xs font-semibold hover:bg-rose-500 hover:text-white transition-colors"
              >
                Uninstall
              </button>
            )}
          </div>

          {distType === 'play-catalog' && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
              This is a legitimate Google Play catalog listing. No unauthorized APK files are downloaded; installing places a simulated preview card on your Home Screen with direct access to the official Play Store page.
            </div>
          )}

          {loadingDetails && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#01875f]" />
              <span>Loading Google Play screenshots, version &amp; reviews...</span>
            </div>
          )}

          {selectedPlayApp.screenshots && selectedPlayApp.screenshots.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Screenshots</h3>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {selectedPlayApp.screenshots.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`${selectedPlayApp.name} screenshot ${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="h-44 w-auto rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <h3 className="text-sm font-bold">About this app</h3>
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-line">
              {selectedPlayApp.description || 'Verified free listing from Google Play Catalog.'}
            </p>
            <p className="text-[11px] text-zinc-500 pt-1">
              Package: <span className="font-mono">{selectedPlayApp.packageId}</span> · Version {selectedPlayApp.version || 'Latest'} · Updated {selectedPlayApp.updatedOn || 'Current'}
            </p>
          </div>

          {/* Ratings & Reviews */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-bold">Ratings &amp; Reviews</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reviewText.trim()) return;
                const entry: PlayStoreReview = {
                  id: `u-rev-${Date.now()}`,
                  author: state.settings.appleIdName || 'You',
                  rating: reviewRating,
                  date: 'Just now',
                  text: reviewText.trim(),
                };
                setUserReviews((prev) => ({
                  ...prev,
                  [selectedPlayApp.packageId]: [entry, ...(prev[selectedPlayApp.packageId] || [])],
                }));
                setReviewText('');
              }}
              className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold">Write a review</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share feedback about this app..."
                  className="flex-1 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#01875f] text-white text-xs font-semibold"
                >
                  Post
                </button>
              </div>
            </form>

            {combinedReviews.length > 0 ? (
              <div className="space-y-2">
                {combinedReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{rev.author}</span>
                      <span className="text-[10px] text-zinc-500">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{rev.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Be the first to leave a review on this simulator listing.</p>
            )}
          </div>

          <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 p-3 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Installs directly to this iPhone Home Screen</span>
            <span className="font-semibold text-[#01875f] dark:text-emerald-400">In-Phone Only</span>
          </div>
        </div>
      </div>
    );
  }

  // BUILT-IN APP DETAIL SHEET
  const selectedLocalApp = selectedLocalId ? APP_MAP[selectedLocalId] : null;
  if (selectedLocalApp) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <div className="px-3 pt-2.5 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setSelectedLocalId(null)}
            className="flex items-center gap-1 text-sm font-medium text-[#01875f] dark:text-emerald-400"
          >
            <ChevronLeft className="w-5 h-5" />
            Google Play
          </button>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/12 text-[#01875f] dark:text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Free · Built-In Full App
          </span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md shrink-0">
              {renderAppIcon(selectedLocalApp.id, 'lg')}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold leading-tight">{selectedLocalApp.name}</h1>
              <p className="text-xs font-medium text-[#01875f] dark:text-emerald-400 mt-0.5">
                {selectedLocalApp.developer}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{selectedLocalApp.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 py-2.5 border-y border-zinc-200 dark:border-zinc-800 text-center text-xs">
            <div>
              <p className="font-bold font-mono-num">{selectedLocalApp.rating} ★</p>
              <p className="text-[10px] text-zinc-500">{selectedLocalApp.ratingCount}</p>
            </div>
            <div>
              <p className="font-bold font-mono-num">{selectedLocalApp.sizeMB} MB</p>
              <p className="text-[10px] text-zinc-500">Size</p>
            </div>
            <div>
              <p className="font-bold font-mono-num">v{selectedLocalApp.version}</p>
              <p className="text-[10px] text-zinc-500">Version</p>
            </div>
            <div>
              <p className="font-bold text-[#01875f] dark:text-emerald-400">Free</p>
              <p className="text-[10px] text-zinc-500">{selectedLocalApp.ageRating}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">{renderLocalActionBtn(selectedLocalApp, true)}</div>
            {isInstalledId(selectedLocalApp.id) && !selectedLocalApp.systemApp && (
              <button
                onClick={() => uninstallApp(selectedLocalApp.id)}
                className="px-4 py-2.5 rounded-full border border-rose-500/40 text-rose-500 text-xs font-semibold hover:bg-rose-500 hover:text-white transition-colors"
              >
                Uninstall
              </button>
            )}
          </div>

          {selectedLocalApp.screenshots.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {selectedLocalApp.screenshots.map((sc, i) => (
                <div
                  key={i}
                  className={`w-44 h-28 rounded-2xl bg-gradient-to-br ${sc.gradient} p-3 flex flex-col justify-end text-white shrink-0 shadow`}
                >
                  <p className="text-xs font-bold leading-tight">{sc.title}</p>
                  <p className="text-[10px] text-white/80">{sc.subtitle}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <h3 className="text-sm font-bold">About this app</h3>
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              {selectedLocalApp.description}
            </p>
          </div>

          {selectedLocalApp.reviews.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold">Reviews</h3>
              {selectedLocalApp.reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{r.title}</span>
                    <span className="text-amber-500">{r.rating} ★</span>
                  </div>
                  <p className="text-zinc-500 text-[10px]">
                    {r.author} · {r.date}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-300">{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderPlayRow = (item: PlayStoreAppItem, rank?: number) => (
    <div
      key={item.packageId}
      onClick={() => openPlayAppDetail(item)}
      className="flex items-center gap-3 py-2.5 px-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
    >
      {rank !== undefined && (
        <span className="w-4 text-xs font-bold font-mono-num text-zinc-500 text-center">{rank}</span>
      )}
      <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-zinc-100 dark:bg-zinc-900">
        {item.icon ? (
          <img src={item.icon} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        ) : (
          renderAppIcon('playstore', 'sm')
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold truncate">{item.name}</p>
          {item.installType === 'pwa-web' && (
            <span className="px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[9px] font-bold shrink-0">
              PWA
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 truncate">
          {item.category} · {item.developer}
        </p>
        <p className="text-[10px] text-zinc-400">
          {item.rating} ★ · {item.downloads} · <span className="text-[#01875f] dark:text-emerald-400 font-semibold">Free</span>
        </p>
      </div>
      {renderRemoteActionBtn(item)}
    </div>
  );

  const renderLocalRow = (app: AppDefinition, rank?: number) => (
    <div
      key={app.id}
      onClick={() => setSelectedLocalId(app.id)}
      className="flex items-center gap-3 py-2.5 px-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
    >
      {rank !== undefined && (
        <span className="w-4 text-xs font-bold font-mono-num text-zinc-500 text-center">{rank}</span>
      )}
      <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm shrink-0">
        {renderAppIcon(app.id, 'sm')}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate">{app.name}</p>
        <p className="text-[11px] text-zinc-500 truncate">{app.developer}</p>
        <p className="text-[10px] text-zinc-400">
          {app.rating} ★ · {app.sizeMB} MB · <span className="text-[#01875f] dark:text-emerald-400 font-semibold">Free</span>
        </p>
      </div>
      {renderLocalActionBtn(app)}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white relative">
      {/* Header + Quick Search Omnibar */}
      <div className="px-4 pt-3 pb-2.5 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden shadow-sm">{renderAppIcon('playstore', 'xs')}</div>
            <div>
              <h1 className="text-base font-bold leading-none">Google Play</h1>
              <p className="text-[10px] font-semibold text-[#01875f] dark:text-emerald-400 mt-0.5">
                100% Free Catalog · Sponsored by Google
              </p>
            </div>
          </div>

          <button
            onClick={() => setTab('manage')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/12 text-[#01875f] dark:text-emerald-400 text-[10px] font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {updatesList.length + playUpdatesList.length > 0
              ? `${updatesList.length + playUpdatesList.length} Updates`
              : 'No Cost'}
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTab('search');
            runLiveSearch(searchQuery);
          }}
          className="flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            value={searchQuery}
            onFocus={() => setTab('search')}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (tab !== 'search') setTab('search');
            }}
            placeholder="Search free Google Play apps, games & PWAs..."
            className="flex-1 bg-transparent text-xs outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="text-zinc-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="px-2.5 py-0.5 rounded-full bg-[#01875f] text-white text-[10px] font-semibold"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
        {tab === 'apps' && (
          <>
            {/* Zero-Cost Google Essentials Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-[#01875f] via-emerald-700 to-teal-900 p-4 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                  Free Forever · Zero Money Required
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-snug">Original Google Play &amp; Web Apps</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Discover top charts, launch real built-in apps, or install live Free Web Apps / PWAs to your Home Screen.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {['chrome', 'gmail', 'googledrive', 'youtube'].map((id) => (
                  <button
                    key={id}
                    onClick={() => setSelectedLocalId(id)}
                    className="bg-white/12 hover:bg-white/20 rounded-2xl p-2 flex flex-col items-center gap-1 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden">{renderAppIcon(id, 'xs')}</div>
                    <span className="text-[10px] font-medium truncate w-full text-center">
                      {APP_MAP[id]?.name.replace('Google ', '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {(
                [
                  ['all', 'All Free'],
                  ['charts', 'Top Charts'],
                  ['pwa', 'Web Apps / PWAs'],
                  ['Social', 'Social'],
                  ['Productivity', 'Productivity'],
                  ['Utilities', 'Tools'],
                  ['Entertainment', 'Entertainment'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setAppFilter(key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                    appFilter === key
                      ? 'bg-[#01875f] text-white'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Recommended For You */}
            {appFilter === 'all' && recommendedLocalApps.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">Recommended for You</h3>
                  <span className="text-[10px] text-zinc-500">Free Picks</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {recommendedLocalApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedLocalId(app.id)}
                      className="w-32 shrink-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm">
                        {renderAppIcon(app.id, 'sm')}
                      </div>
                      <div>
                        <p className="text-xs font-semibold truncate">{app.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          {app.rating} ★ · Free
                        </p>
                      </div>
                      {renderLocalActionBtn(app, true)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Installable Web Apps / PWAs */}
            {filteredPwas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-sky-500" />
                      Installable Free Web Apps &amp; PWAs
                    </h3>
                    <p className="text-[10px] text-zinc-500">Run live right inside your simulator</p>
                  </div>
                  <button
                    onClick={() => setShowCustomPwa(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/12 text-sky-600 dark:text-sky-400 text-[10px] font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Add URL
                  </button>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
                  {filteredPwas.map((item) => renderPlayRow(item))}
                </div>
              </div>
            )}

            {/* Live Top Free Charts on Google Play */}
            {appFilter !== 'pwa' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">Top Free Charts on Google Play</h3>
                  <span className="text-[10px] font-semibold text-[#01875f] dark:text-emerald-400">Live Free</span>
                </div>
                {loadingFeed && liveApps.length === 0 ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-xs text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#01875f]" />
                    <span>Loading free Google Play charts...</span>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
                    {filteredLiveApps.slice(0, 12).map((item, idx) => renderPlayRow(item, idx + 1))}
                  </div>
                )}
              </div>
            )}

            {/* Built-in Full Apps & Google Suite */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold">Built-In Full Apps &amp; Google Essentials</h3>
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
                {[...GOOGLE_ESSENTIAL_IDS, ...POPULAR_REAL_IDS]
                  .map((id) => APP_MAP[id])
                  .filter((a): a is AppDefinition => Boolean(a))
                  .filter((a) =>
                    appFilter === 'all' || appFilter === 'charts' || appFilter === 'pwa'
                      ? true
                      : a.category.toLowerCase().includes(appFilter.toLowerCase())
                  )
                  .map((app) => renderLocalRow(app))}
              </div>
            </div>
          </>
        )}

        {tab === 'games' && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-800 p-4 text-white shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                Google Play Games · 100% Free
              </p>
              <h2 className="text-lg font-bold mt-0.5">Top Free Games &amp; Browser Arcade</h2>
              <p className="text-xs text-purple-100 mt-0.5">
                Zero money required — play built-in arcade mini-games, Free Chess &amp; 2048 PWAs, or browse free Google Play hits.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase text-zinc-500">Playable Instant Games &amp; PWAs</h3>
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
                {APP_MAP['games'] && renderLocalRow(APP_MAP['games'])}
                {WEB_PWA_CATALOG.filter((g) => g.category === 'Games').map((g) => renderPlayRow(g))}
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase text-zinc-500">Top Free on Google Play Games</h3>
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
                {liveGames.slice(0, 15).map((item, idx) => renderPlayRow(item, idx + 1))}
              </div>
            </div>
          </div>
        )}

        {tab === 'search' && (
          <div className="space-y-4">
            {/* Persistent Search History */}
            {(state.playSearchHistory || []).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Recent Searches
                  </p>
                  <button
                    onClick={clearPlaySearchHistory}
                    className="text-[11px] font-semibold text-rose-500"
                  >
                    Clear History
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(state.playSearchHistory || []).map((term) => (
                    <div
                      key={term}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
                    >
                      <button
                        onClick={() => {
                          setSearchQuery(term);
                          runLiveSearch(term);
                        }}
                        className="font-medium hover:text-[#01875f]"
                      >
                        {term}
                      </button>
                      <button
                        onClick={() =>
                          setPersisted((os) => ({
                            ...os,
                            playSearchHistory: (os.playSearchHistory || []).filter((x) => x !== term),
                          }))
                        }
                        className="text-zinc-400 hover:text-rose-500"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!searchQuery && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-500">Popular Free Searches</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PLAY_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearchQuery(term);
                        runLiveSearch(term);
                      }}
                      className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-[#01875f] dark:text-emerald-400 text-xs font-semibold"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searching && (
              <div className="flex items-center justify-center py-8 gap-2 text-xs text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#01875f]" />
                <span>Searching free Google Play listings for &ldquo;{searchQuery}&rdquo;...</span>
              </div>
            )}

            {!searching && pwaMatchingSearch.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-sky-500">Installable Free Web Apps &amp; PWAs</p>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
                  {pwaMatchingSearch.map((item) => renderPlayRow(item))}
                </div>
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-500">Google Play Free Results</p>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
                  {searchResults.map((item) => renderPlayRow(item))}
                </div>
              </div>
            )}

            {!searching && localMatchingSearch.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-500">Built-In Simulator Apps</p>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
                  {localMatchingSearch.map((app) => renderLocalRow(app))}
                </div>
              </div>
            )}

            {!searching &&
              searchQuery.trim() &&
              searchResults.length === 0 &&
              localMatchingSearch.length === 0 &&
              pwaMatchingSearch.length === 0 && (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center space-y-2.5">
                  <p className="text-xs font-semibold">
                    No free Play Store matches returned for &ldquo;{searchQuery.trim()}&rdquo;
                  </p>
                  <button
                    onClick={() => {
                      setCustomPwaName(searchQuery.trim());
                      setCustomPwaUrl('https://');
                      setShowCustomPwa(true);
                    }}
                    className="px-4 py-2 rounded-full bg-[#01875f] text-white text-xs font-bold"
                  >
                    Install &ldquo;{searchQuery.trim()}&rdquo; as Free Web App
                  </button>
                </div>
              )}
          </div>
        )}

        {tab === 'manage' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-7 h-7 text-[#01875f] dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Play Protect: No harmful apps found</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {state.installedAppIds.length} apps verified · Zero paid billing
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  pushNotification(
                    'playstore',
                    'Update Check Complete',
                    updatesList.length + playUpdatesList.length > 0
                      ? `${updatesList.length + playUpdatesList.length} free update(s) ready in Google Play.`
                      : 'All installed apps and PWAs are up to date.'
                  )
                }
                className="p-2 rounded-full bg-emerald-500/15 text-[#01875f] dark:text-emerald-400"
                title="Check for Update Notifications"
              >
                <BellRing className="w-4 h-4" />
              </button>
            </div>

            {/* Active Downloads Queue */}
            {activeDownloads.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-[#01875f]" /> Active Downloads ({activeDownloads.length})
                </h3>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-2.5">
                  {activeDownloads.map(([id, pct]) => {
                    const label = APP_MAP[id]?.name || state.installedPlayApps?.[id]?.name || id.replace('play:', '');
                    return (
                      <div key={id} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="truncate">{label}</span>
                          <span className="font-mono-num text-[#01875f]">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-[#01875f] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Storage Summary */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>Simulator App Storage</span>
                <span className="font-mono-num text-zinc-500">{usedStorageMB} MB used</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#01875f] to-teal-400"
                  style={{ width: `${Math.min(92, Math.max(8, Math.round((usedStorageMB / 8192) * 100)))}%` }}
                />
              </div>
            </div>

            {/* Available Updates */}
            {(updatesList.length > 0 || playUpdatesList.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-zinc-500">
                    Available Updates ({updatesList.length + playUpdatesList.length})
                  </h3>
                  <button
                    onClick={() => {
                      updatesList.forEach((a) => updateApp(a.id));
                      playUpdatesList.forEach((p) => updatePlayApp(p.id, p.targetLatest));
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#01875f] dark:text-emerald-400"
                  >
                    <RefreshCw className="w-3 h-3" /> Update all
                  </button>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
                  {updatesList.map((app) => renderLocalRow(app))}
                  {playUpdatesList.map((p) =>
                    renderPlayRow({ ...p.app, latestVersion: p.targetLatest })
                  )}
                </div>
              </div>
            )}

            {/* Installed App Library */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-zinc-500">App Library</h3>
                <div className="flex gap-1">
                  {(
                    [
                      ['all', 'All'],
                      ['builtin', 'Built-In'],
                      ['pwa', 'PWA'],
                      ['preview', 'Previews'],
                    ] as const
                  ).map(([k, l]) => (
                    <button
                      key={k}
                      onClick={() => setLibraryFilter(k)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        libraryFilter === k
                          ? 'bg-[#01875f] text-white'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
                {state.installedAppIds.map((id) => {
                  const local = APP_MAP[id];
                  const play = state.installedPlayApps?.[id];
                  if (!local && !play) return null;
                  if (local?.id === 'playstore') return null;

                  const kind: LibraryFilter = local
                    ? 'builtin'
                    : play?.installType === 'pwa-web'
                    ? 'pwa'
                    : 'preview';
                  if (libraryFilter !== 'all' && libraryFilter !== kind) return null;

                  const name = local ? local.name : play!.name;
                  const sub = local
                    ? `${local.sizeMB} MB · v${local.version} · Built-In`
                    : `${play!.developer} · ${
                        play!.installType === 'pwa-web' ? 'Web App / PWA' : 'Play Preview'
                      }`;
                  const isSys = Boolean(local?.systemApp);
                  return (
                    <div key={id} className="flex items-center justify-between gap-2 p-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
                          {renderAppIcon(id, 'xs', play?.icon)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{sub}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openApp(id)}
                          className="px-3 py-1 rounded-full bg-emerald-500/12 text-[#01875f] dark:text-emerald-400 text-[11px] font-semibold"
                        >
                          Open
                        </button>
                        {!isSys && (
                          <button
                            onClick={() => uninstallApp(id)}
                            className="p-1.5 rounded-full text-rose-500 hover:bg-rose-500/10"
                            title="Uninstall"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Web App / PWA Installer Modal */}
      {showCustomPwa && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleInstallCustomPwa}
            className="w-full rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Install Free Web App / PWA</h3>
              <button type="button" onClick={() => setShowCustomPwa(false)} className="text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Add any legitimate website or Progressive Web App directly to your iPhone Home Screen — 100% free, no APKs required.
            </p>
            <input
              value={customPwaName}
              onChange={(e) => setCustomPwaName(e.target.value)}
              placeholder="App Name (e.g. Excalidraw)"
              className="w-full p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs outline-none"
            />
            <input
              value={customPwaUrl}
              onChange={(e) => setCustomPwaUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs outline-none"
            />
            <select
              value={customPwaCategory}
              onChange={(e) => setCustomPwaCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs outline-none"
            >
              <option value="Productivity">Productivity</option>
              <option value="Utilities">Utilities</option>
              <option value="Games">Games</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Social">Social</option>
            </select>
            {customPwaError && <p className="text-[11px] text-rose-500 font-medium">{customPwaError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#01875f] text-white text-xs font-bold"
            >
              Install Free Web App to Home Screen
            </button>
          </form>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md grid grid-cols-4 py-1.5 text-[10px] font-semibold">
        {(
          [
            ['games', 'Games', Gamepad2],
            ['apps', 'Apps', Sparkles],
            ['search', 'Search', Search],
            ['manage', 'Manage', Layers],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-0.5 py-1 transition-colors relative ${
              tab === id ? 'text-[#01875f] dark:text-emerald-400' : 'text-zinc-500'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {id === 'manage' && updatesList.length + playUpdatesList.length > 0 && (
              <span className="absolute top-1 right-6 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
