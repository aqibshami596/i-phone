import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Captions,
  Cast,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  Gauge,
  History,
  Home,
  ListVideo,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  Pause,
  Play,
  Radio,
  Search,
  Settings2,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Tv,
  UserCheck,
  X,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { fastFetchJson } from '../os/networkManager';
import { SEED_YOUTUBE_VIDEOS } from '../os/seedData';
import { YouTubeVideo } from '../os/types';

type YTTab = 'home' | 'shorts' | 'subs' | 'library';
type SearchMode = 'all' | 'videos' | 'channels' | 'playlists' | 'live' | 'shorts';

interface YTChannel {
  id: string;
  title: string;
  handle: string;
  subscribers: string;
  description: string;
  avatarUrl: string;
  verified?: boolean;
}

interface YTPlaylist {
  id: string;
  title: string;
  channel: string;
  videoCount: string;
  thumbnailUrl: string;
  playlistUrl: string;
}

interface YTCommentItem {
  id: string;
  author: string;
  text: string;
  time: string;
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlaybackQuality: () => string;
  setPlaybackQuality: (quality: string) => void;
  getAvailableQualityLevels: () => string[];
  loadModule: (mod: string) => void;
  unloadModule: (mod: string) => void;
  setOption: (mod: string, option: string, value: unknown) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId?: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayerInstance }) => void;
            onStateChange?: (e: { data: number; target: YTPlayerInstance }) => void;
            onPlaybackQualityChange?: (e: { data: string }) => void;
            onError?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      resolve();
    };
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
    // Safety resolve if script already loaded or offline
    window.setTimeout(() => resolve(), 5000);
  });
  return ytApiPromise;
}

const CATEGORY_CONFIG: Record<string, { query: string; type: SearchMode }> = {
  Trending: { query: '', type: 'all' },
  All: { query: 'trending technology music science gaming 2026', type: 'all' },
  Music: { query: 'official music video 2026', type: 'music' as SearchMode },
  Live: { query: 'live stream news music space earth cam', type: 'live' },
  Gaming: { query: 'official game trailer gameplay walkthrough', type: 'all' },
  Tech: { query: 'MKBHD technology smartphone review', type: 'all' },
  Science: { query: 'NASA SpaceX astronomy 4k documentary', type: 'all' },
  Movies: { query: 'official movie trailer 4k 2026', type: 'all' },
  Sports: { query: 'official sports highlights top plays', type: 'all' },
};

const QUALITY_LABELS: Record<string, string> = {
  auto: 'Auto',
  hd2160: '2160p 4K',
  hd1440: '1440p HD',
  hd1080: '1080p HD',
  hd720: '720p HD',
  large: '480p',
  medium: '360p',
  small: '240p',
};

const QUICK_SEARCH_TOPICS = [
  'MKBHD',
  'Lofi Girl Live',
  'NASA 4K Space',
  'Apple Keynote',
  'TypeScript Course Playlist',
  'Blender Open Movies',
];

function extractYouTubeTarget(raw: string): { videoId?: string; playlistId?: string } | null {
  const s = raw.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return { videoId: s };
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    if (!u.hostname.includes('youtube.com') && !u.hostname.includes('youtu.be')) return null;
    const listId = u.searchParams.get('list');
    const v = u.searchParams.get('v');
    if (u.hostname.includes('youtu.be')) {
      const vid = u.pathname.slice(1, 12);
      return vid ? { videoId: vid, playlistId: listId || undefined } : null;
    }
    if (listId && !v) return { playlistId: listId };
    if (v) return { videoId: v.slice(0, 11), playlistId: listId || undefined };
    const parts = u.pathname.split('/');
    const embedIdx = parts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live');
    if (embedIdx >= 0 && parts[embedIdx + 1]) {
      return { videoId: parts[embedIdx + 1].slice(0, 11), playlistId: listId || undefined };
    }
  } catch {
    return null;
  }
  return null;
}

function formatSec(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

const YTThumb: React.FC<{ video: YouTubeVideo; className?: string; children?: React.ReactNode }> = ({
  video,
  className = '',
  children,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const src = video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${video.gradient} ${className}`}>
      {!imgFailed && (
        <img
          src={src}
          alt={video.title}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      )}
      {children}
    </div>
  );
};

export const YouTubeApp: React.FC = () => {
  const { state, setPersisted, pushNotification } = useOS();

  const [tab, setTab] = useState<YTTab>('home');
  const [category, setCategory] = useState('Trending');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

  const [feedVideos, setFeedVideos] = useState<YouTubeVideo[]>(() =>
    SEED_YOUTUBE_VIDEOS.filter((v) => !v.isShort)
  );
  const [feedChannels, setFeedChannels] = useState<YTChannel[]>([]);
  const [feedPlaylists, setFeedPlaylists] = useState<YTPlaylist[]>([]);
  const [liveShorts, setLiveShorts] = useState<YouTubeVideo[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [knownVideos, setKnownVideos] = useState<Record<string, YouTubeVideo>>(() => {
    const map: Record<string, YouTubeVideo> = {};
    for (const v of SEED_YOUTUBE_VIDEOS) map[v.id] = v;
    return map;
  });

  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingShorts, setLoadingShorts] = useState(false);

  // Watch State (Video or Playlist via official YT.Player)
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<YTPlaylist | null>(null);
  const [miniPlayer, setMiniPlayer] = useState(false);
  const [cinemaFullscreen, setCinemaFullscreen] = useState(false);

  // Channel View State
  const [activeChannel, setActiveChannel] = useState<YTChannel | null>(null);
  const [channelVideos, setChannelVideos] = useState<YouTubeVideo[]>([]);
  const [channelPlaylists, setChannelPlaylists] = useState<YTPlaylist[]>([]);
  const [loadingChannel, setLoadingChannel] = useState(false);

  // Official YouTube IFrame Player API Refs & Controls State
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const [ytApiReady, setYtApiReady] = useState(false);
  const [playerPlaying, setPlayerPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([
    'auto',
    'hd1080',
    'hd720',
    'large',
    'medium',
  ]);
  const [showSettingsMenu, setShowSettingsMenu] = useState<'none' | 'quality' | 'speed'>('none');
  const [embedErrorCode, setEmbedErrorCode] = useState<number | null>(null);

  // Remote Video Metadata & Comments
  const [remoteComments, setRemoteComments] = useState<YTCommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');

  // Shorts state
  const [shortIdx, setShortIdx] = useState(0);
  const [playShortEmbed, setPlayShortEmbed] = useState(false);

  const registerVideos = useCallback((list: YouTubeVideo[]) => {
    if (list.length === 0) return;
    setKnownVideos((prev) => {
      const next = { ...prev };
      for (const v of list) next[v.id] = v;
      return next;
    });
  }, []);

  const fetchYouTube = useCallback(
    async (
      query: string,
      type: SearchMode | 'trending' = 'all'
    ): Promise<{ videos: YouTubeVideo[]; channels: YTChannel[]; playlists: YTPlaylist[] }> => {
      try {
        const data = await fastFetchJson(
          `/api/youtube/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`
        );
        const videos = Array.isArray(data?.videos) ? (data.videos as YouTubeVideo[]) : [];
        const channels = Array.isArray(data?.channels) ? (data.channels as YTChannel[]) : [];
        const playlists = Array.isArray(data?.playlists) ? (data.playlists as YTPlaylist[]) : [];
        registerVideos(videos);
        return { videos, channels, playlists };
      } catch {
        return { videos: [], channels: [], playlists: [] };
      }
    },
    [registerVideos]
  );

  // Preload official YouTube IFrame API
  useEffect(() => {
    loadYouTubeIframeAPI().then(() => {
      if (window.YT?.Player) setYtApiReady(true);
    });
  }, []);

  // Load real YouTube feed when category changes
  useEffect(() => {
    if (activeSearchQuery.trim() || activeChannel) return;
    let cancelled = false;
    setLoadingFeed(true);
    const cfg = CATEGORY_CONFIG[category] || { query: category, type: 'all' as SearchMode };
    const fetchType = category === 'Trending' ? 'trending' : cfg.type;
    fetchYouTube(cfg.query, fetchType).then(({ videos }) => {
      if (cancelled) return;
      setFeedChannels([]);
      setFeedPlaylists([]);
      if (videos.length > 0) {
        setFeedVideos(videos);
      } else {
        setFeedVideos(SEED_YOUTUBE_VIDEOS);
      }
      setLoadingFeed(false);
    });
    return () => {
      cancelled = true;
    };
  }, [category, activeSearchQuery, activeChannel, fetchYouTube]);

  // Load real YouTube Shorts on Shorts tab
  useEffect(() => {
    if (tab !== 'shorts') return;
    let cancelled = false;
    setLoadingShorts(true);
    fetchYouTube('trending viral shorts', 'shorts').then(({ videos: shorts }) => {
      if (cancelled) return;
      if (shorts.length > 0) {
        setLiveShorts(shorts);
        setShortIdx(0);
      }
      setLoadingShorts(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab, fetchYouTube]);

  // Bind official YT.Player when watching a video or playlist
  useEffect(() => {
    const isWatching = Boolean((activeVideo || activePlaylist) && !miniPlayer);
    if (!isWatching || !playerContainerRef.current) return;

    setEmbedErrorCode(null);
    setShowSettingsMenu('none');
    setCurrentTime(0);
    setDuration(0);

    let disposed = false;
    let progressTimer: number | null = null;

    const mountPlayer = () => {
      if (disposed || !playerContainerRef.current || !window.YT?.Player) return;
      try {
        ytPlayerRef.current?.destroy();
      } catch {
        // ignore previous player destroy error
      }
      playerContainerRef.current.innerHTML = '';
      const mountEl = document.createElement('div');
      mountEl.className = 'w-full h-full';
      playerContainerRef.current.appendChild(mountEl);

      const playerVars: Record<string, string | number> = {
        autoplay: 1,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        controls: 1,
        cc_load_policy: captionsOn ? 1 : 0,
        hl: 'en',
        origin: window.location.origin,
      };
      if (activePlaylist) {
        playerVars.listType = 'playlist';
        playerVars.list = activePlaylist.id;
      }

      ytPlayerRef.current = new window.YT.Player(mountEl, {
        width: '100%',
        height: '100%',
        videoId: activePlaylist ? undefined : activeVideo?.youtubeId,
        playerVars,
        events: {
          onReady: (e) => {
            if (disposed) return;
            setYtApiReady(true);
            setPlayerPlaying(true);
            const levels = e.target.getAvailableQualityLevels?.() || [];
            if (levels.length > 0) {
              setAvailableQualities(['auto', ...levels.filter((l) => l !== 'auto')]);
            }
            if (playbackSpeed !== 1) {
              try {
                e.target.setPlaybackRate(playbackSpeed);
              } catch {
                // ignore
              }
            }
            progressTimer = window.setInterval(() => {
              if (!ytPlayerRef.current) return;
              try {
                setCurrentTime(ytPlayerRef.current.getCurrentTime() || 0);
                setDuration(ytPlayerRef.current.getDuration() || 0);
                const avail = ytPlayerRef.current.getAvailableQualityLevels?.() || [];
                if (avail.length > 0) {
                  setAvailableQualities(['auto', ...avail.filter((l) => l !== 'auto')]);
                }
              } catch {
                // ignore polling error
              }
            }, 500);
          },
          onStateChange: (e) => {
            if (disposed) return;
            setPlayerPlaying(e.data === 1 || e.data === 3);
            if (e.data === 1) {
              const avail = e.target.getAvailableQualityLevels?.() || [];
              if (avail.length > 0) {
                setAvailableQualities(['auto', ...avail.filter((l) => l !== 'auto')]);
              }
            }
          },
          onPlaybackQualityChange: (e) => {
            if (!disposed && e.data) {
              setSelectedQuality(e.data);
            }
          },
          onError: (e) => {
            if (!disposed) {
              setEmbedErrorCode(e.data || 150);
            }
          },
        },
      });
    };

    loadYouTubeIframeAPI().then(() => {
      if (!disposed && window.YT?.Player) {
        mountPlayer();
      }
    });

    return () => {
      disposed = true;
      if (progressTimer) clearInterval(progressTimer);
      try {
        ytPlayerRef.current?.destroy();
      } catch {
        // ignore
      }
      ytPlayerRef.current = null;
    };
  }, [activeVideo?.youtubeId, activePlaylist?.id, miniPlayer]);

  // Fetch video details & official YouTube Data API v3 comments when watching a video
  useEffect(() => {
    if (!activeVideo) {
      setRemoteComments([]);
      return;
    }
    let cancelled = false;
    setRemoteComments([]);
    fastFetchJson(`/api/youtube/details?videoId=${encodeURIComponent(activeVideo.youtubeId)}`)
      .then((data) => {
        if (cancelled || !data) return;
        if (data.details) {
          setActiveVideo((prev) =>
            prev && prev.youtubeId === activeVideo.youtubeId
              ? {
                  ...prev,
                  title: data.details.title || prev.title,
                  channel: data.details.channel || prev.channel,
                  description: data.details.description || prev.description,
                  views: data.details.views || prev.views,
                  likes: typeof data.details.likes === 'number' && data.details.likes > 0 ? data.details.likes : prev.likes,
                }
              : prev
          );
        }
        if (Array.isArray(data.comments)) {
          setRemoteComments(data.comments as YTCommentItem[]);
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [activeVideo?.youtubeId]);

  const openVideo = (video: YouTubeVideo) => {
    registerVideos([video]);
    setActivePlaylist(null);
    setActiveVideo(video);
    setMiniPlayer(false);
    setPersisted((os) => ({
      ...os,
      youtubeHistory: [video.id, ...os.youtubeHistory.filter((id) => id !== video.id)].slice(0, 30),
    }));

    const relatedQuery = `${video.channel} ${video.title.split(' ').slice(0, 3).join(' ')}`;
    fetchYouTube(relatedQuery, 'all').then(({ videos: list }) => {
      const filtered = list.filter((v) => v.youtubeId !== video.youtubeId);
      setRelatedVideos(filtered.length > 0 ? filtered : feedVideos.filter((v) => v.youtubeId !== video.youtubeId));
    });
  };

  const openPlaylist = (playlist: YTPlaylist) => {
    setActiveVideo(null);
    setActivePlaylist(playlist);
    setMiniPlayer(false);
  };

  const openChannelProfile = async (ch: YTChannel) => {
    setActiveChannel(ch);
    setActiveVideo(null);
    setActivePlaylist(null);
    setTab('home');
    setLoadingChannel(true);
    const [vidRes, plRes] = await Promise.all([
      fetchYouTube(ch.title, 'videos'),
      fetchYouTube(ch.title, 'playlists'),
    ]);
    setChannelVideos(vidRes.videos);
    setChannelPlaylists(plRes.playlists);
    setLoadingChannel(false);
  };

  const executeSearch = async (queryText: string, modeOverride?: SearchMode) => {
    const raw = queryText.trim();
    if (!raw) {
      setActiveSearchQuery('');
      setFeedChannels([]);
      setFeedPlaylists([]);
      return;
    }

    const directTarget = extractYouTubeTarget(raw);
    if (directTarget?.playlistId && !directTarget.videoId) {
      openPlaylist({
        id: directTarget.playlistId,
        title: `YouTube Playlist (${directTarget.playlistId.slice(0, 12)})`,
        channel: 'YouTube Playlist',
        videoCount: 'Playlist',
        thumbnailUrl: '',
        playlistUrl: `https://www.youtube.com/playlist?list=${directTarget.playlistId}`,
      });
      setSearchOpen(false);
      return;
    }
    if (directTarget?.videoId) {
      const vid = directTarget.videoId;
      const custom: YouTubeVideo = {
        id: `yt-${vid}`,
        youtubeId: vid,
        title: `YouTube Video (${vid})`,
        channel: 'YouTube',
        channelHandle: '@YouTube',
        avatarColor: 'from-red-500 to-rose-700',
        views: 'YouTube',
        uploadedAt: 'YouTube',
        duration: 'HD',
        category: 'Watch',
        description: `Loading official metadata for https://www.youtube.com/watch?v=${vid}`,
        likes: 0,
        gradient: 'from-red-700 to-zinc-950',
        thumbnailUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
      };
      registerVideos([custom]);
      openVideo(custom);
      setSearchOpen(false);
      return;
    }

    const mode = modeOverride ?? searchMode;
    setActiveChannel(null);
    setActiveSearchQuery(raw);
    setTab('home');
    setSearchOpen(false);
    setLoadingFeed(true);

    if (mode === 'channels') {
      const { channels } = await fetchYouTube(raw, 'channels');
      setFeedChannels(channels);
      setFeedVideos([]);
      setFeedPlaylists([]);
    } else if (mode === 'playlists') {
      const { playlists } = await fetchYouTube(raw, 'playlists');
      setFeedPlaylists(playlists);
      setFeedVideos([]);
      setFeedChannels([]);
    } else if (mode === 'live' || mode === 'shorts' || mode === 'videos') {
      const { videos } = await fetchYouTube(raw, mode);
      setFeedVideos(videos);
      setFeedChannels([]);
      setFeedPlaylists([]);
    } else {
      const [mainRes, chRes, plRes] = await Promise.all([
        fetchYouTube(raw, 'all'),
        fetchYouTube(raw, 'channels'),
        fetchYouTube(raw, 'playlists'),
      ]);
      const combinedChannels = mainRes.channels.length > 0 ? mainRes.channels : chRes.channels;
      const combinedPlaylists = mainRes.playlists.length > 0 ? mainRes.playlists : plRes.playlists;
      setFeedChannels(combinedChannels.slice(0, 4));
      setFeedPlaylists(combinedPlaylists.slice(0, 3));
      setFeedVideos(mainRes.videos);
    }
    setLoadingFeed(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchInput);
  };

  const toggleSub = (handle: string) => {
    setPersisted((os) => ({
      ...os,
      youtubeSubs: os.youtubeSubs.includes(handle)
        ? os.youtubeSubs.filter((h) => h !== handle)
        : [...os.youtubeSubs, handle],
    }));
  };

  const toggleLike = (videoId: string) => {
    setPersisted((os) => ({
      ...os,
      youtubeLiked: os.youtubeLiked.includes(videoId)
        ? os.youtubeLiked.filter((id) => id !== videoId)
        : [...os.youtubeLiked, videoId],
    }));
  };

  const postComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVideo || !commentInput.trim()) return;
    const text = commentInput.trim();
    setPersisted((os) => ({
      ...os,
      youtubeComments: {
        ...os.youtubeComments,
        [activeVideo.id]: [
          {
            id: `yc-${Date.now()}`,
            author: state.settings.appleIdName,
            text,
            time: 'Just now',
          },
          ...(os.youtubeComments[activeVideo.id] || []),
        ],
      },
    }));
    setCommentInput('');
  };

  const handleTogglePlayPause = () => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (playerPlaying) {
      p.pauseVideo();
      setPlayerPlaying(false);
    } else {
      p.playVideo();
      setPlayerPlaying(true);
    }
  };

  const handleToggleCaptions = () => {
    const next = !captionsOn;
    setCaptionsOn(next);
    const p = ytPlayerRef.current;
    if (!p) return;
    try {
      if (next) {
        p.loadModule('captions');
        p.setOption('captions', 'reload', true);
      } else {
        p.unloadModule('captions');
      }
    } catch {
      // ignore if stream has no captions module loaded yet
    }
  };

  const handleSelectQuality = (q: string) => {
    setSelectedQuality(q);
    setShowSettingsMenu('none');
    try {
      ytPlayerRef.current?.setPlaybackQuality(q === 'auto' ? 'default' : q);
    } catch {
      // ignore
    }
  };

  const handleSelectSpeed = (r: number) => {
    setPlaybackSpeed(r);
    setShowSettingsMenu('none');
    try {
      ytPlayerRef.current?.setPlaybackRate(r);
    } catch {
      // ignore
    }
  };

  const handleToggleFullscreen = async () => {
    const next = !cinemaFullscreen;
    setCinemaFullscreen(next);
    const el = playerWrapperRef.current;
    if (!el) return;
    try {
      if (next && el.requestFullscreen && !document.fullscreenElement) {
        await el.requestFullscreen();
      } else if (!next && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // In-frame expanded cinema mode already active
    }
  };

  const allKnownList = useMemo(() => Object.values(knownVideos), [knownVideos]);

  // FULL WATCH PAGE (OFFICIAL YOUTUBE VIDEO OR PLAYLIST)
  if ((activeVideo || activePlaylist) && !miniPlayer) {
    const isLiked = activeVideo ? state.youtubeLiked.includes(activeVideo.id) : false;
    const isSubbed = activeVideo ? state.youtubeSubs.includes(activeVideo.channelHandle) : false;
    const localComments = activeVideo ? state.youtubeComments[activeVideo.id] || [] : [];
    const mergedComments = [...localComments, ...remoteComments];
    const upNext = relatedVideos.length > 0
      ? relatedVideos
      : feedVideos.filter((v) => v.youtubeId !== activeVideo?.youtubeId);
    const externalWatchUrl = activePlaylist
      ? activePlaylist.playlistUrl
      : `https://www.youtube.com/watch?v=${activeVideo?.youtubeId}`;

    return (
      <div className="h-full flex flex-col bg-zinc-950 text-white">
        {/* Official YouTube IFrame Player API Viewport */}
        <div
          ref={playerWrapperRef}
          className={`relative w-full bg-black shrink-0 ${
            cinemaFullscreen ? 'flex-1 flex flex-col justify-center' : 'aspect-video'
          }`}
        >
          {embedErrorCode !== null ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-zinc-950">
              <p className="text-xs font-bold text-white">
                {embedErrorCode === 101 || embedErrorCode === 150
                  ? 'Playback on other websites disabled by video owner'
                  : 'Unable to embed this YouTube video'}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-[260px]">
                YouTube API error {embedErrorCode}. Per creator copyright and embed policy, open this video directly on YouTube.
              </p>
              <a
                href={externalWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 px-3.5 py-1.5 rounded-full bg-red-600 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                Watch on YouTube <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : !ytApiReady ? (
            <iframe
              key={activePlaylist ? `pl-${activePlaylist.id}` : activeVideo?.youtubeId}
              src={
                activePlaylist
                  ? `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(activePlaylist.id)}&autoplay=1&playsinline=1`
                  : `https://www.youtube.com/embed/${activeVideo?.youtubeId}?autoplay=1&playsinline=1&rel=0&cc_load_policy=${captionsOn ? 1 : 0}`
              }
              title={activePlaylist?.title || activeVideo?.title || 'YouTube'}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : null}

          <div
            ref={playerContainerRef}
            className={`w-full h-full ${embedErrorCode !== null || !ytApiReady ? 'hidden' : 'block'}`}
          />

          {/* Top Controls Overlay */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
            <button
              onClick={() => {
                setCinemaFullscreen(false);
                setMiniPlayer(true);
              }}
              className="pointer-events-auto w-8 h-8 rounded-full bg-black/65 backdrop-blur flex items-center justify-center text-white"
              title="Minimize to Mini-Player"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <a
                href={externalWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur text-[10px] font-medium border border-white/15 inline-flex items-center gap-1"
                title="Open on YouTube"
              >
                YouTube <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <button
                onClick={handleToggleFullscreen}
                className="w-8 h-8 rounded-full bg-black/65 backdrop-blur flex items-center justify-center text-white border border-white/15"
                title={cinemaFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {cinemaFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Official YouTube Player Controls Strip (Play/Pause, Seek, Quality, Captions CC, Speed) */}
        <div className="bg-zinc-900/95 border-b border-zinc-800 px-3 py-2 space-y-1.5 relative shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlayPause}
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center shrink-0"
              title={playerPlaying ? 'Pause' : 'Play'}
            >
              {playerPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            {activeVideo?.isLive ? (
              <div className="flex-1 flex items-center gap-1.5 text-[11px] font-bold text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE BROADCAST
              </div>
            ) : (
              <>
                <span className="text-[10px] font-mono-num text-zinc-400 w-9 text-right shrink-0">
                  {formatSec(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(duration, 1)}
                  value={Math.min(currentTime, Math.max(duration, 1))}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    setCurrentTime(t);
                    ytPlayerRef.current?.seekTo(t, true);
                  }}
                  className="flex-1 accent-red-600 h-1 cursor-pointer"
                />
                <span className="text-[10px] font-mono-num text-zinc-400 w-9 shrink-0">
                  {formatSec(duration)}
                </span>
              </>
            )}

            <button
              onClick={handleToggleCaptions}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                captionsOn ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'
              }`}
              title="Toggle Captions (CC)"
            >
              <Captions className="w-3.5 h-3.5" /> CC
            </button>

            <button
              onClick={() => setShowSettingsMenu((m) => (m === 'quality' ? 'none' : 'quality'))}
              className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-200 flex items-center gap-1 shrink-0"
              title="Video Quality"
            >
              <Settings2 className="w-3 h-3" />
              {QUALITY_LABELS[selectedQuality] || selectedQuality}
            </button>

            <button
              onClick={() => setShowSettingsMenu((m) => (m === 'speed' ? 'none' : 'speed'))}
              className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-200 flex items-center gap-1 shrink-0"
              title="Playback Speed"
            >
              <Gauge className="w-3 h-3" />
              {playbackSpeed}x
            </button>
          </div>

          {showSettingsMenu === 'quality' && (
            <div className="absolute right-3 top-11 z-30 w-40 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1.5 space-y-0.5">
              <p className="text-[10px] font-bold uppercase text-zinc-400 px-2 py-1">Video Quality</p>
              {availableQualities.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSelectQuality(q)}
                  className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center justify-between hover:bg-zinc-800"
                >
                  <span>{QUALITY_LABELS[q] || q}</span>
                  {selectedQuality === q && <Check className="w-3.5 h-3.5 text-red-500" />}
                </button>
              ))}
            </div>
          )}

          {showSettingsMenu === 'speed' && (
            <div className="absolute right-3 top-11 z-30 w-32 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1.5 space-y-0.5">
              <p className="text-[10px] font-bold uppercase text-zinc-400 px-2 py-1">Speed</p>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => handleSelectSpeed(r)}
                  className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center justify-between hover:bg-zinc-800"
                >
                  <span>{r}x</span>
                  {playbackSpeed === r && <Check className="w-3.5 h-3.5 text-red-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Watch Metadata + Comments + Up Next */}
        {!cinemaFullscreen && (
          <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-4">
            {activePlaylist ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-bold text-red-400 uppercase tracking-wider">
                  <ListVideo className="w-3.5 h-3.5" />
                  <span>YouTube Playlist · {activePlaylist.videoCount}</span>
                </div>
                <h2 className="text-sm font-bold leading-snug">{activePlaylist.title}</h2>
                <p className="text-xs text-zinc-400">{activePlaylist.channel}</p>
                <div className="rounded-2xl bg-zinc-900 p-3 text-xs text-zinc-300 leading-relaxed">
                  Playing official YouTube playlist queue directly inside the IFrame Player API. Use the player playlist button to browse upcoming tracks.
                </div>
              </div>
            ) : activeVideo ? (
              <>
                <div>
                  <h2 className="text-sm font-bold leading-snug">{activeVideo.title}</h2>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {activeVideo.views} · {activeVideo.uploadedAt}
                  </p>
                </div>

                {/* Channel + Subscribe */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    onClick={() =>
                      openChannelProfile({
                        id: activeVideo.channelHandle,
                        title: activeVideo.channel,
                        handle: activeVideo.channelHandle,
                        subscribers: 'YouTube Creator',
                        description: '',
                        avatarUrl: '',
                      })
                    }
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                  >
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${activeVideo.avatarColor} flex items-center justify-center text-xs font-bold shrink-0`}
                    >
                      {activeVideo.channel[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{activeVideo.channel}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{activeVideo.channelHandle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSub(activeVideo.channelHandle)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                      isSubbed ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-black'
                    }`}
                  >
                    {isSubbed ? 'Subscribed' : 'Subscribe'}
                  </button>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => toggleLike(activeVideo.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${
                      isLiked ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>
                      {activeVideo.likes > 0 || isLiked
                        ? (activeVideo.likes + (isLiked ? 1 : 0)).toLocaleString()
                        : 'Like'}
                    </span>
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-800 text-xs shrink-0">
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => pushNotification('youtube', 'Link Copied', `youtube.com/watch?v=${activeVideo.youtubeId}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-xs font-medium shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                  <button
                    onClick={() => toggleLike(activeVideo.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-xs font-medium shrink-0"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>

                {/* Description */}
                <div className="rounded-2xl bg-zinc-900 p-3 text-xs text-zinc-300 leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto no-scrollbar">
                  {activeVideo.description}
                </div>

                {/* Comments */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Comments ({mergedComments.length})</span>
                  </div>
                  <form onSubmit={postComment} className="flex gap-2">
                    <input
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 text-xs outline-none"
                    />
                    <button type="submit" className="px-3 py-1.5 rounded-full bg-red-600 text-xs font-semibold">
                      Post
                    </button>
                  </form>
                  {mergedComments.length === 0 ? (
                    <p className="text-[11px] text-zinc-500">
                      Be the first to comment here, or set YOUTUBE_API_KEY in server env to stream public YouTube comment threads.
                    </p>
                  ) : (
                    mergedComments.map((c) => (
                      <div key={c.id} className="rounded-xl bg-zinc-900/70 p-2.5 space-y-0.5">
                        <p className="text-[11px] font-semibold text-zinc-300">
                          {c.author} <span className="text-zinc-500 font-normal">· {c.time}</span>
                        </p>
                        <p className="text-xs text-zinc-200">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}

            {/* Up Next Recommendations */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <p className="text-xs font-bold text-zinc-400">Recommended Next</p>
              {upNext.map((v) => (
                <div key={v.id} onClick={() => openVideo(v)} className="flex gap-2.5 cursor-pointer">
                  <YTThumb video={v} className="w-32 aspect-video rounded-xl shrink-0 flex items-end justify-end p-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono-num ${
                        v.isLive ? 'bg-red-600 font-bold' : 'bg-black/80'
                      }`}
                    >
                      {v.duration}
                    </span>
                  </YTThumb>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold line-clamp-2">{v.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-1 truncate">{v.channel}</p>
                    <p className="text-[10px] text-zinc-500">{v.views}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white relative">
      {/* Top YouTube Bar */}
      <div className="px-3.5 pt-2.5 pb-2 flex items-center justify-between border-b border-zinc-900">
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full">
            <input
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search videos, channels, playlists, or URL..."
              className="flex-1 bg-zinc-900 rounded-full px-3.5 py-1.5 text-xs outline-none border border-zinc-800"
            />
            <button type="submit" className="px-2.5 py-1.5 rounded-full bg-red-600 text-[11px] font-semibold">
              Go
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchInput('');
                setActiveSearchQuery('');
              }}
              className="p-1.5 text-zinc-400"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : activeChannel ? (
          <div className="flex items-center gap-2.5 min-w-0 w-full">
            <button onClick={() => setActiveChannel(null)} className="p-1 -ml-1 text-zinc-300 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold truncate">{activeChannel.title}</span>
          </div>
        ) : (
          <>
            <div
              onClick={() => {
                setActiveChannel(null);
                setActiveSearchQuery('');
                setCategory('Trending');
                setTab('home');
              }}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <div className="w-7 h-5 rounded-md bg-red-600 flex items-center justify-center">
                <Play className="w-3 h-3 fill-white text-white" />
              </div>
              <span className="text-base font-extrabold tracking-tight">YouTube</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <button onClick={() => pushNotification('youtube', 'Cast', 'Looking for AirPlay / Cast TVs...')} title="Cast">
                <Cast className="w-4 h-4" />
              </button>
              <button onClick={() => pushNotification('youtube', 'Notifications', 'Subscribed channel uploads appear here.')} title="Notifications">
                <Bell className="w-4 h-4" />
              </button>
              <button onClick={() => setSearchOpen(true)} title="Search all of YouTube">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Quick Search Suggestion Chips */}
      {searchOpen && (
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-zinc-900 bg-zinc-900/50">
          {QUICK_SEARCH_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => {
                setSearchInput(topic);
                executeSearch(topic);
              }}
              className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 whitespace-nowrap shrink-0"
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {/* Search Mode Filters OR Home Category Bar */}
      {tab === 'home' && !searchOpen && !activeChannel && (
        activeSearchQuery ? (
          <div className="border-b border-zinc-900 bg-zinc-900/50">
            <div className="px-3 pt-2 pb-1 flex items-center justify-between">
              <span className="text-xs text-zinc-300 truncate">
                Results for <strong className="text-white">“{activeSearchQuery}”</strong>
              </span>
              <button
                onClick={() => {
                  setActiveSearchQuery('');
                  setSearchInput('');
                  setFeedChannels([]);
                  setFeedPlaylists([]);
                  setSearchMode('all');
                }}
                className="text-xs text-sky-400 font-medium shrink-0 ml-2"
              >
                Clear
              </button>
            </div>
            <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(
                [
                  ['all', 'All'],
                  ['videos', 'Videos'],
                  ['channels', 'Channels'],
                  ['playlists', 'Playlists'],
                  ['live', 'Live'],
                  ['shorts', 'Shorts'],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => {
                    setSearchMode(m);
                    executeSearch(activeSearchQuery, m);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    searchMode === m ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-zinc-900">
            {Object.keys(CATEGORY_CONFIG).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 ${
                  category === cat ? 'bg-white text-black' : 'bg-zinc-800/90 text-zinc-200'
                }`}
              >
                {cat === 'Live' && <Radio className="w-3 h-3 text-red-500" />}
                {cat}
              </button>
            ))}
          </div>
        )
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {tab === 'home' && activeChannel && (
          <div className="p-3.5 space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800 p-4 flex items-center gap-3">
              {activeChannel.avatarUrl ? (
                <img
                  src={activeChannel.avatarUrl}
                  alt={activeChannel.title}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover shrink-0 bg-zinc-800"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-lg font-bold shrink-0">
                  {activeChannel.title[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">
                  {activeChannel.title} {activeChannel.verified ? '✓' : ''}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {activeChannel.handle} · {activeChannel.subscribers}
                </p>
                {activeChannel.description && (
                  <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1">{activeChannel.description}</p>
                )}
              </div>
              <button
                onClick={() => toggleSub(activeChannel.handle)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
                  state.youtubeSubs.includes(activeChannel.handle) ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-black'
                }`}
              >
                {state.youtubeSubs.includes(activeChannel.handle) ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            {loadingChannel ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <span className="text-xs">Loading channel videos & playlists...</span>
              </div>
            ) : (
              <>
                {channelPlaylists.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Playlists</p>
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                      {channelPlaylists.map((pl) => (
                        <div
                          key={pl.id}
                          onClick={() => openPlaylist(pl)}
                          className="w-44 shrink-0 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden cursor-pointer"
                        >
                          <div className="relative aspect-video bg-zinc-800">
                            {pl.thumbnailUrl && (
                              <img src={pl.thumbnailUrl} alt={pl.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            )}
                            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-semibold flex items-center gap-1">
                              <ListVideo className="w-3 h-3" /> {pl.videoCount}
                            </span>
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-semibold line-clamp-2">{pl.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Videos</p>
                  {channelVideos.map((video) => (
                    <div key={video.id} onClick={() => openVideo(video)} className="flex gap-2.5 cursor-pointer">
                      <YTThumb video={video} className="w-36 aspect-video rounded-xl shrink-0 flex items-end justify-end p-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono-num ${video.isLive ? 'bg-red-600 font-bold' : 'bg-black/80'}`}>
                          {video.duration}
                        </span>
                      </YTThumb>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold line-clamp-2">{video.title}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">{video.views} · {video.uploadedAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'home' && !activeChannel && (
          <div className="p-3 space-y-4">
            {loadingFeed ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <span className="text-xs">Loading from YouTube...</span>
              </div>
            ) : (
              <>
                {/* Channels */}
                {feedChannels.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-0.5">
                      Channels
                    </p>
                    <div className="space-y-2">
                      {feedChannels.map((ch) => {
                        const isSub = state.youtubeSubs.includes(ch.handle);
                        return (
                          <div
                            key={ch.id}
                            onClick={() => openChannelProfile(ch)}
                            className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 p-3 flex items-center gap-3 cursor-pointer hover:bg-zinc-900"
                          >
                            {ch.avatarUrl ? (
                              <img
                                src={ch.avatarUrl}
                                alt={ch.title}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-full object-cover shrink-0 bg-zinc-800"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-sm font-bold shrink-0">
                                {ch.title[0]}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">
                                {ch.title} {ch.verified ? '✓' : ''}
                              </p>
                              <p className="text-[11px] text-zinc-400 truncate">
                                {ch.handle} · {ch.subscribers}
                              </p>
                              {ch.description && (
                                <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{ch.description}</p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSub(ch.handle);
                              }}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 ${
                                isSub ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-black'
                              }`}
                            >
                              {isSub ? 'Subscribed' : 'Subscribe'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Playlists */}
                {feedPlaylists.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-0.5">
                      Playlists
                    </p>
                    <div className="space-y-2">
                      {feedPlaylists.map((pl) => (
                        <div
                          key={pl.id}
                          onClick={() => openPlaylist(pl)}
                          className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 p-2.5 flex items-center gap-3 cursor-pointer hover:bg-zinc-900"
                        >
                          <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                            {pl.thumbnailUrl && (
                              <img src={pl.thumbnailUrl} alt={pl.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            )}
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-semibold flex items-center gap-0.5">
                              <ListVideo className="w-2.5 h-2.5" /> {pl.videoCount}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold line-clamp-2">{pl.title}</p>
                            <p className="text-[11px] text-zinc-400 mt-1 truncate">{pl.channel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {feedVideos.length === 0 && feedChannels.length === 0 && feedPlaylists.length === 0 ? (
                  <div className="py-16 text-center space-y-2 text-zinc-400">
                    <p className="text-sm font-semibold text-zinc-200">No results found</p>
                    <p className="text-xs">Try searching another video, channel, playlist, or YouTube URL.</p>
                  </div>
                ) : (
                  feedVideos.map((video) => (
                    <div key={video.id} onClick={() => openVideo(video)} className="space-y-2 cursor-pointer group">
                      <YTThumb video={video} className="w-full aspect-video rounded-2xl shadow-lg flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-black/55 backdrop-blur flex items-center justify-center opacity-85 group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        </div>
                        <span
                          className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono-num ${
                            video.isLive ? 'bg-red-600 font-bold' : 'bg-black/85'
                          }`}
                        >
                          {video.duration}
                        </span>
                      </YTThumb>
                      <div className="flex gap-2.5 px-0.5">
                        <div
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${video.avatarColor} flex items-center justify-center text-xs font-bold shrink-0`}
                        >
                          {video.channel[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-snug line-clamp-2">{video.title}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {video.channel} · {video.views} · {video.uploadedAt}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {tab === 'shorts' && (
          <div className="h-full p-3 flex flex-col justify-between">
            {loadingShorts && liveShorts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <span className="text-xs">Loading Shorts from YouTube...</span>
              </div>
            ) : liveShorts[shortIdx] ? (
              <div className="flex-1 rounded-3xl bg-zinc-900 relative overflow-hidden flex flex-col justify-between">
                {playShortEmbed ? (
                  <iframe
                    key={liveShorts[shortIdx].youtubeId}
                    src={`https://www.youtube.com/embed/${liveShorts[shortIdx].youtubeId}?autoplay=1&playsinline=1&rel=0`}
                    title={liveShorts[shortIdx].title}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <YTThumb video={liveShorts[shortIdx]} className="absolute inset-0 w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
                  </YTThumb>
                )}

                <div className="relative z-10 p-4 flex justify-between items-center pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 text-[11px] font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-red-500" /> Shorts
                  </span>
                  <div className="flex gap-1.5 pointer-events-auto">
                    <button
                      onClick={() => setPlayShortEmbed(!playShortEmbed)}
                      className="px-3 py-1 rounded-full bg-black/65 text-[11px] font-semibold border border-white/15"
                    >
                      {playShortEmbed ? 'Preview' : 'Play Inline'}
                    </button>
                    <button
                      onClick={() => openVideo(liveShorts[shortIdx])}
                      className="px-3 py-1 rounded-full bg-red-600 text-[11px] font-bold"
                    >
                      Watch Page
                    </button>
                  </div>
                </div>

                {!playShortEmbed && (
                  <div className="relative z-10 my-auto text-center">
                    <button
                      onClick={() => setPlayShortEmbed(true)}
                      className="w-16 h-16 rounded-full bg-black/55 border border-white/25 flex items-center justify-center mx-auto hover:scale-105 transition-transform"
                    >
                      <Play className="w-7 h-7 fill-white ml-1" />
                    </button>
                  </div>
                )}

                <div className="relative z-10 p-4 flex items-end justify-between gap-3 pointer-events-none">
                  <div className="min-w-0 flex-1 bg-black/45 backdrop-blur-sm rounded-2xl p-2.5">
                    <p className="text-xs font-bold">{liveShorts[shortIdx].channelHandle}</p>
                    <p className="text-xs font-semibold mt-0.5 line-clamp-2">{liveShorts[shortIdx].title}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 pointer-events-auto shrink-0">
                    <button
                      onClick={() => {
                        setPlayShortEmbed(false);
                        setShortIdx((shortIdx - 1 + liveShorts.length) % liveShorts.length);
                      }}
                      className="w-9 h-9 rounded-full bg-black/70 border border-white/15 flex items-center justify-center"
                      title="Previous Short"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setPlayShortEmbed(false);
                        setShortIdx((shortIdx + 1) % liveShorts.length);
                      }}
                      className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center"
                      title="Next Short"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {tab === 'subs' && (
          <div className="p-3 space-y-4">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 border-b border-zinc-900">
              {state.youtubeSubs.map((handle) => (
                <button
                  key={handle}
                  onClick={() =>
                    openChannelProfile({
                      id: handle,
                      title: handle.replace(/^@/, ''),
                      handle,
                      subscribers: 'Subscribed Channel',
                      description: '',
                      avatarUrl: '',
                    })
                  }
                  className="flex flex-col items-center gap-1 shrink-0 w-16"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-xs font-bold">
                    {handle[1]?.toUpperCase() || 'Y'}
                  </div>
                  <span className="text-[10px] text-zinc-300 truncate w-full text-center">{handle}</span>
                </button>
              ))}
            </div>
            {allKnownList
              .filter((v) => state.youtubeSubs.includes(v.channelHandle))
              .map((video) => (
                <div key={video.id} onClick={() => openVideo(video)} className="flex gap-3 cursor-pointer">
                  <YTThumb video={video} className="w-36 aspect-video rounded-xl shrink-0 flex items-center justify-center">
                    <Play className="w-5 h-5 fill-white" />
                  </YTThumb>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold line-clamp-2">{video.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">{video.channel}</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === 'library' && (
          <div className="p-3.5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <History className="w-4 h-4 text-zinc-400" />
                <span>Watch History ({state.youtubeHistory.length})</span>
              </div>
              {state.youtubeHistory.map((vidId) => {
                const v = knownVideos[vidId];
                if (!v) return null;
                return (
                  <div key={vidId} onClick={() => openVideo(v)} className="flex gap-2.5 cursor-pointer">
                    <YTThumb video={v} className="w-28 aspect-video rounded-lg shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold line-clamp-2">{v.title}</p>
                      <p className="text-[10px] text-zinc-400">{v.channel}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <div className="flex items-center gap-2 text-xs font-bold">
                <ThumbsUp className="w-4 h-4 text-zinc-400" />
                <span>Liked Videos ({state.youtubeLiked.length})</span>
              </div>
              {state.youtubeLiked.map((vidId) => {
                const v = knownVideos[vidId];
                if (!v) return null;
                return (
                  <div key={vidId} onClick={() => openVideo(v)} className="text-xs text-sky-400 cursor-pointer truncate">
                    • {v.title}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mini Player */}
      {(activeVideo || activePlaylist) && miniPlayer && (
        <div
          onClick={() => setMiniPlayer(false)}
          className="bg-zinc-900 border-t border-zinc-800 px-3 py-2 flex items-center gap-3 cursor-pointer"
        >
          {activeVideo ? (
            <YTThumb video={activeVideo} className="w-14 h-8 rounded shrink-0 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 fill-white" />
            </YTThumb>
          ) : (
            <div className="w-14 h-8 rounded bg-zinc-800 shrink-0 flex items-center justify-center">
              <ListVideo className="w-4 h-4 text-red-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{activePlaylist?.title || activeVideo?.title}</p>
            <p className="text-[10px] text-zinc-400 truncate">{activePlaylist?.channel || activeVideo?.channel}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveVideo(null);
              setActivePlaylist(null);
              setMiniPlayer(false);
            }}
            className="p-1.5 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="border-t border-zinc-900 bg-zinc-950 grid grid-cols-4 py-1.5 text-[10px] font-medium">
        {(
          [
            ['home', 'Home', Home],
            ['shorts', 'Shorts', Flame],
            ['subs', 'Subscriptions', UserCheck],
            ['library', 'You', Tv],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              if (id === 'home') setActiveChannel(null);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 ${
              tab === id ? 'text-white' : 'text-zinc-500'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
