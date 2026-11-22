import React, { useState } from 'react';
import {
  Bookmark,
  Check,
  Film,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Plus,
  RotateCw,
  Scissors,
  SkipBack,
  SkipForward,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { wallpaperBurgundy, wallpaperObsidian } from '../os/assets';
import { SEED_MUSIC_TRACKS } from '../os/seedData';

/* ==================== APPLE MUSIC / SPOTIFY ==================== */
export const MusicPlayerApp: React.FC<{ variant: 'apple' | 'spotify' }> = ({ variant }) => {
  const {
    musicPlaying,
    currentTrack,
    musicElapsed,
    toggleMusic,
    playTrack,
    nextTrack,
    prevTrack,
  } = useOS();

  const [tab, setTab] = useState<'now' | 'library'>('now');
  const isSpotify = variant === 'spotify';

  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${Math.floor(sec % 60) < 10 ? '0' : ''}${Math.floor(sec % 60)}`;

  return (
    <div className={`h-full flex flex-col ${isSpotify ? 'bg-zinc-950 text-white' : 'bg-gradient-to-b from-rose-950 via-zinc-950 to-black text-white'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className={`text-xl font-extrabold ${isSpotify ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isSpotify ? 'Spotify' : 'Music'}
        </h1>
        <div className="flex gap-1 bg-white/10 p-1 rounded-full text-xs">
          <button onClick={() => setTab('now')} className={`px-3 py-1 rounded-full ${tab === 'now' ? 'bg-white text-black font-semibold' : ''}`}>
            Now Playing
          </button>
          <button onClick={() => setTab('library')} className={`px-3 py-1 rounded-full ${tab === 'library' ? 'bg-white text-black font-semibold' : ''}`}>
            Library
          </button>
        </div>
      </div>

      {tab === 'now' ? (
        <div className="flex-1 p-5 flex flex-col justify-between items-center text-center">
          <div className={`w-56 h-56 rounded-3xl bg-gradient-to-br ${currentTrack.coverGradient} shadow-2xl flex items-center justify-center border border-white/15`}>
            <div className={`w-16 h-16 rounded-full bg-black/30 backdrop-blur flex items-center justify-center ${musicPlaying ? 'animate-pulse' : ''}`}>
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="w-full space-y-1">
            <h2 className="text-lg font-bold truncate">{currentTrack.title}</h2>
            <p className="text-xs text-zinc-400">{currentTrack.artist} · {currentTrack.album}</p>
          </div>

          <div className="w-full space-y-1.5">
            <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className={`h-full rounded-full ${isSpotify ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, (musicElapsed / currentTrack.durationSec) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono-num text-zinc-400">
              <span>{fmt(musicElapsed)}</span>
              <span>{fmt(currentTrack.durationSec)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-7 pb-3">
            <button onClick={prevTrack} className="p-2 text-zinc-300 hover:text-white">
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={toggleMusic}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                isSpotify ? 'bg-emerald-500 text-black' : 'bg-white text-black'
              }`}
            >
              {musicPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="p-2 text-zinc-300 hover:text-white">
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2.5">
          <p className="text-xs font-bold text-zinc-400">Synthesized Spatial Tracks</p>
          {SEED_MUSIC_TRACKS.map((track) => {
            const active = track.id === currentTrack.id;
            return (
              <button
                key={track.id}
                onClick={() => playTrack(track)}
                className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left ${
                  active ? 'bg-white/15 border border-white/20' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${track.coverGradient} shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{track.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{track.artist} · {track.bpm} BPM</p>
                </div>
                <span className="text-[10px] font-mono-num text-zinc-400">{fmt(track.durationSec)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ==================== NETFLIX APP ==================== */
const NETFLIX_CATALOG = [
  { id: 'nf-1', title: 'Titanium Horizon', genre: 'Sci-Fi · 2026', rating: '98% Match', seasons: '2 Seasons', desc: 'In an orbital research city above Saturn, an engineer uncovers a signal hidden inside quantum glass.', grad: 'from-red-900 via-zinc-900 to-black' },
  { id: 'nf-2', title: 'Glass Architects', genre: 'Documentary', rating: '95% Match', seasons: 'Limited Series', desc: 'Inside the studio minds reinventing industrial titanium, optics, and spatial computing.', grad: 'from-sky-900 via-slate-900 to-black' },
  { id: 'nf-3', title: 'Midnight Kyoto', genre: 'Thriller · Noir', rating: '94% Match', seasons: '1 Season', desc: 'A sound designer tracking rare analog tapes uncovers a 30-year-old mystery across Kyoto.', grad: 'from-amber-900 via-stone-900 to-black' },
  { id: 'nf-4', title: 'Apex Velocity', genre: 'Sports · Action', rating: '96% Match', seasons: 'Film · 2h 14m', desc: 'Telemetry, grit, and millisecond rivalries across endurance electric racing circuits.', grad: 'from-emerald-900 via-zinc-900 to-black' },
];

export const NetflixApp: React.FC = () => {
  const { state, setPersisted } = useOS();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState<string | null>(null);

  const selected = NETFLIX_CATALOG.find((n) => n.id === selectedId);
  const toggleMyList = (id: string) => {
    setPersisted((os) => ({
      ...os,
      netflixMyList: os.netflixMyList.includes(id)
        ? os.netflixMyList.filter((x) => x !== id)
        : [...os.netflixMyList, id],
    }));
  };

  if (playingTitle) {
    return (
      <div className="h-full bg-black text-white flex flex-col justify-between p-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-red-500">NETFLIX STREAM</span>
          <button onClick={() => setPlayingTitle(null)} className="px-3 py-1 rounded-full bg-zinc-800 text-xs">
            Exit Player
          </button>
        </div>
        <div className="text-center space-y-3">
          <Film className="w-14 h-14 text-red-600 mx-auto animate-pulse" />
          <h2 className="text-lg font-bold">{playingTitle}</h2>
          <p className="text-xs text-zinc-400">4K Dolby Vision · Spatial Audio Active</p>
        </div>
        <div className="space-y-2">
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div className="w-1/3 h-full bg-red-600" />
          </div>
          <div className="flex justify-between text-[10px] font-mono-num text-zinc-400">
            <span>14:22</span>
            <span>48:10</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white overflow-y-auto no-scrollbar p-4 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xl font-black tracking-widest text-red-600">NETFLIX</span>
        <span className="text-xs text-zinc-400">My List ({state.netflixMyList.length})</span>
      </div>

      {/* Hero */}
      <div className={`rounded-3xl bg-gradient-to-br ${NETFLIX_CATALOG[0].grad} p-5 border border-white/10 space-y-3`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Featured Original</p>
        <h2 className="text-2xl font-extrabold">{NETFLIX_CATALOG[0].title}</h2>
        <p className="text-xs text-zinc-300 leading-relaxed">{NETFLIX_CATALOG[0].desc}</p>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setPlayingTitle(NETFLIX_CATALOG[0].title)}
            className="flex-1 py-2 rounded-xl bg-white text-black text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4 fill-black" /> Play
          </button>
          <button
            onClick={() => toggleMyList(NETFLIX_CATALOG[0].id)}
            className="flex-1 py-2 rounded-xl bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5"
          >
            {state.netflixMyList.includes(NETFLIX_CATALOG[0].id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            My List
          </button>
        </div>
      </div>

      {selected && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold">{selected.title}</h3>
              <p className="text-[11px] text-emerald-400">{selected.rating} · {selected.seasons}</p>
            </div>
            <button onClick={() => setSelectedId(null)} className="text-xs text-zinc-400">Close</button>
          </div>
          <p className="text-xs text-zinc-300">{selected.desc}</p>
          <button
            onClick={() => setPlayingTitle(selected.title)}
            className="w-full py-2 rounded-xl bg-red-600 text-xs font-bold"
          >
            Watch Episode 1
          </button>
        </div>
      )}

      <div className="space-y-2.5">
        <h3 className="text-sm font-bold">Trending Now</h3>
        <div className="grid grid-cols-2 gap-3">
          {NETFLIX_CATALOG.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`h-32 rounded-2xl bg-gradient-to-br ${item.grad} p-3 text-left flex flex-col justify-end border border-white/10`}
            >
              <p className="text-xs font-bold">{item.title}</p>
              <p className="text-[10px] text-zinc-300">{item.genre}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ==================== SOCIAL MEDIA HUB ("PULSE") ==================== */
export const SocialApp: React.FC = () => {
  const { media } = useOS();
  const [posts, setPosts] = useState([
    {
      id: 'p1',
      author: 'sarah.chen',
      caption: 'Testing Liquid Glass reflections on iPhone 18 Pro Max.',
      img: wallpaperObsidian,
      likes: 128,
      liked: false,
      saved: false,
      comments: ['Clean aesthetic!', 'Love the titanium rim light.'],
    },
    {
      id: 'p2',
      author: 'atelier.maya',
      caption: 'Burgundy Titanium studio finish under warm key light.',
      img: wallpaperBurgundy,
      likes: 94,
      liked: true,
      saved: false,
      comments: ['Best color this year.'],
    },
  ]);
  const [caption, setCaption] = useState('');

  const shareFromGallery = () => {
    const photo = media.find((m) => !m.deleted && m.type === 'photo');
    if (!photo) return;
    setPosts((prev) => [
      {
        id: `p-${Date.now()}`,
        author: 'alex.mercer',
        caption: caption.trim() || 'Captured on iPhone 18 Pro Max',
        img: photo.src,
        likes: 1,
        liked: true,
        saved: false,
        comments: [],
      },
      ...prev,
    ]);
    setCaption('');
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight">Pulse</h1>
        <button onClick={shareFromGallery} className="px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold">
          + Post Photo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-200 dark:divide-zinc-800">
        {/* Quick Post Caption Bar */}
        <div className="p-3 flex gap-2">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write caption & tap + Post Photo..."
            className="flex-1 rounded-full bg-zinc-200 dark:bg-zinc-900 px-3.5 py-1.5 text-xs outline-none"
          />
        </div>

        {posts.map((post) => (
          <div key={post.id} className="p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white text-[11px] font-bold flex items-center justify-center">
                {post.author[0].toUpperCase()}
              </div>
              <span className="text-xs font-bold">{post.author}</span>
            </div>
            <img src={post.img} alt={post.caption} className="w-full h-56 object-cover rounded-2xl" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setPosts((ps) =>
                      ps.map((p) =>
                        p.id === post.id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
                      )
                    )
                  }
                >
                  <Heart className={`w-5 h-5 ${post.liked ? 'text-rose-500 fill-rose-500' : ''}`} />
                </button>
                <MessageCircle className="w-5 h-5" />
              </div>
              <button
                onClick={() =>
                  setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, saved: !p.saved } : p)))
                }
              >
                <Bookmark className={`w-5 h-5 ${post.saved ? 'fill-current' : ''}`} />
              </button>
            </div>
            <p className="text-xs">
              <span className="font-bold mr-1.5">{post.likes} likes</span>
              {post.caption}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== PHOTO EDITOR ("PIXELSTUDIO") ==================== */
export const PhotoEditorApp: React.FC = () => {
  const { media, addMedia, pushNotification } = useOS();
  const photos = media.filter((m) => !m.deleted && m.type === 'photo');
  const [selectedId, setSelectedId] = useState(photos[0]?.id || '');
  const [exposure, setExposure] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [rotation, setRotation] = useState(0);

  const active = photos.find((p) => p.id === selectedId) || photos[0];

  const applyPreset = (name: string) => {
    if (name === 'Original') { setExposure(100); setContrast(100); setSaturate(100); setSepia(0); }
    if (name === 'Vivid') { setExposure(108); setContrast(118); setSaturate(145); setSepia(0); }
    if (name === 'Noir') { setExposure(105); setContrast(135); setSaturate(0); setSepia(0); }
    if (name === 'Warm') { setExposure(104); setContrast(108); setSaturate(120); setSepia(28); }
  };

  const exportToPhotos = async () => {
    if (!active) return;
    await addMedia({
      id: `edit-${Date.now()}`,
      type: 'photo',
      src: active.src,
      name: `Edited_${active.name}`,
      createdAt: Date.now(),
      favorite: false,
      deleted: false,
      album: 'PixelStudio',
      edits: { brightness: exposure, contrast, saturate, warmth: sepia, filter: 'custom' },
    });
    pushNotification('photos', 'Exported Photo', 'Saved edited image to Photos.');
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-zinc-900">
        <h1 className="text-base font-bold">PixelStudio</h1>
        <button onClick={exportToPhotos} className="px-3 py-1 rounded-full bg-indigo-600 text-xs font-semibold">
          Save Copy
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-black overflow-hidden">
        {active ? (
          <img
            src={active.src}
            alt={active.name}
            style={{
              transform: `rotate(${rotation}deg)`,
              filter: `brightness(${exposure}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%)`,
            }}
            className="max-h-60 rounded-xl object-contain transition-all"
          />
        ) : (
          <p className="text-xs text-zinc-500">No photos available</p>
        )}
      </div>

      {/* Photo Strip */}
      <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-zinc-900">
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 ${
              active?.id === p.id ? 'border-indigo-500' : 'border-transparent'
            }`}
          >
            <img src={p.src} alt={p.name} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Presets & Sliders */}
      <div className="p-3.5 bg-zinc-900 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {['Original', 'Vivid', 'Noir', 'Warm'].map((p) => (
              <button key={p} onClick={() => applyPreset(p)} className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-[11px]">
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-1.5 rounded-full bg-zinc-800" title="Rotate 90°">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><span className="w-16 text-zinc-400">Exposure</span><input type="range" min={50} max={160} value={exposure} onChange={(e) => setExposure(Number(e.target.value))} className="flex-1 accent-indigo-500" /></div>
          <div className="flex items-center gap-2"><span className="w-16 text-zinc-400">Contrast</span><input type="range" min={50} max={160} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="flex-1 accent-indigo-500" /></div>
          <div className="flex items-center gap-2"><span className="w-16 text-zinc-400">Saturate</span><input type="range" min={0} max={200} value={saturate} onChange={(e) => setSaturate(Number(e.target.value))} className="flex-1 accent-indigo-500" /></div>
        </div>
      </div>
    </div>
  );
};

/* ==================== VIDEO EDITOR ("REELCUT") ==================== */
export const VideoEditorApp: React.FC = () => {
  const { media, pushNotification } = useOS();
  const [titleText, setTitleText] = useState('iPhone 18 Pro Max');
  const [trimEnd, setTrimEnd] = useState(85);
  const [grade, setGrade] = useState('Cinema');
  const [playing, setPlaying] = useState(false);

  const sampleImg = media.find((m) => !m.deleted)?.src || wallpaperObsidian;

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-zinc-900">
        <h1 className="text-base font-bold flex items-center gap-1.5">
          <Scissors className="w-4 h-4 text-cyan-400" /> ReelCut
        </h1>
        <button
          onClick={() => pushNotification('videoeditor', 'Reel Exported', `Exported 1080p 60fps "${titleText}" clip.`)}
          className="px-3 py-1 rounded-full bg-cyan-500 text-black text-xs font-bold flex items-center gap-1"
        >
          <Upload className="w-3 h-3" /> Export
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-between">
        <div className="relative h-56 rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
          <img
            src={sampleImg}
            alt="Timeline frame"
            style={{
              filter: grade === 'Noir' ? 'grayscale(100%)' : grade === 'Warm' ? 'sepia(35%)' : 'contrast(1.12) saturate(1.2)',
            }}
            className={`w-full h-full object-cover ${playing ? 'scale-105 transition-transform duration-1000' : ''}`}
          />
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <p className="text-lg font-extrabold tracking-tight drop-shadow-lg">{titleText}</p>
          </div>
          <button
            onClick={() => setPlaying(!playing)}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        </div>

        <div className="space-y-3 bg-zinc-900 rounded-2xl p-3.5 text-xs">
          <input
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            placeholder="Title Overlay Text"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 outline-none"
          />

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Timeline Trim</span>
              <span className="font-mono-num">00:00 — 00:{Math.round((trimEnd / 100) * 30)}</span>
            </div>
            <input type="range" min={20} max={100} value={trimEnd} onChange={(e) => setTrimEnd(Number(e.target.value))} className="w-full accent-cyan-400" />
          </div>

          <div className="flex gap-2">
            {['Cinema', 'Noir', 'Warm'].map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`flex-1 py-1.5 rounded-lg font-semibold ${grade === g ? 'bg-cyan-500 text-black' : 'bg-zinc-800'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
