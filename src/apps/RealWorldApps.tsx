import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  Camera,
  Car,
  CheckCircle2,
  Cloud,
  Compass,
  FileText,
  Flame,
  Folder,
  Hash,
  Heart,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Package,
  Plus,
  RefreshCw,
  Repeat2,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useOS } from '../os/OSContext';

// 1. INSTAGRAM
export const InstagramApp: React.FC = () => {
  const { pushNotification } = useOS();
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [posts, setPosts] = useState([
    {
      id: 'ig1',
      handle: 'apple.design',
      location: 'Apple Park, Cupertino',
      gradient: 'from-amber-400 via-rose-500 to-purple-700',
      caption: 'Liquid Glass meets Natural Titanium on the 6.9-inch Super Retina XDR display.',
      likes: 18420,
    },
    {
      id: 'ig2',
      handle: 'shotoniphone',
      location: 'Big Sur Coastline',
      gradient: 'from-cyan-500 via-blue-600 to-indigo-900',
      caption: 'Captured in 48MP ProRAW with 4x Optical Telephoto at golden hour.',
      likes: 9312,
    },
  ]);
  const [captionInput, setCaptionInput] = useState('');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-lg font-bold tracking-tight italic">Instagram</h1>
        <span className="text-[11px] font-semibold text-pink-500">Live Feed</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4">
        {/* Stories Row */}
        <div className="flex gap-3 px-4 pt-3 overflow-x-auto no-scrollbar">
          {['Your Story', 'marcus', 'chloe.ui', 'mkbhd', 'iosdev'].map((name, i) => (
            <div key={name} className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-14 h-14 rounded-full p-[2.5px] ${i === 0 ? 'bg-zinc-400' : 'bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600'}`}>
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">
                  {name[0].toUpperCase()}
                </div>
              </div>
              <span className="text-[10px] text-zinc-500 truncate w-14 text-center">{name}</span>
            </div>
          ))}
        </div>

        {/* Quick Post Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!captionInput.trim()) return;
            setPosts((prev) => [
              {
                id: `ig-${Date.now()}`,
                handle: 'alex.mercer',
                location: 'iPhone 18 Pro Max',
                gradient: 'from-emerald-500 via-teal-600 to-sky-700',
                caption: captionInput.trim(),
                likes: 1,
              },
              ...prev,
            ]);
            setCaptionInput('');
            pushNotification('instagram', 'Instagram', 'Your post is now live on your feed.');
          }}
          className="mx-4 flex gap-2"
        >
          <input
            value={captionInput}
            onChange={(e) => setCaptionInput(e.target.value)}
            placeholder="Share a quick caption..."
            className="flex-1 rounded-full bg-zinc-100 dark:bg-zinc-900 px-3.5 py-1.5 text-xs outline-none"
          />
          <button type="submit" className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold">
            Post
          </button>
        </form>

        {/* Feed Posts */}
        {posts.map((p) => {
          const isLiked = liked[p.id];
          const isSaved = saved[p.id];
          return (
            <div key={p.id} className="space-y-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <div className="px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
                    {p.handle[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{p.handle}</p>
                    <p className="text-[10px] text-zinc-500">{p.location}</p>
                  </div>
                </div>
              </div>

              <div
                onDoubleClick={() => setLiked((prev) => ({ ...prev, [p.id]: true }))}
                className={`h-[240px] bg-gradient-to-br ${p.gradient} flex flex-col items-center justify-center text-white p-6 text-center cursor-pointer`}
              >
                <Camera className="w-10 h-10 opacity-75 mb-2" />
                <p className="text-xs font-medium max-w-[240px]">{p.caption}</p>
              </div>

              <div className="px-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setLiked((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}>
                    <Heart className={`w-5 h-5 ${isLiked ? 'text-rose-500 fill-rose-500' : ''}`} />
                  </button>
                  <button onClick={() => pushNotification('instagram', 'Instagram', `${p.handle} liked your comment!`)}>
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => pushNotification('instagram', 'Instagram', 'Reel link copied to clipboard')}>
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <button onClick={() => setSaved((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}>
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>
              <p className="px-4 text-xs font-bold font-mono-num">
                {(p.likes + (isLiked ? 1 : 0)).toLocaleString()} likes
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 2. TIKTOK
export const TikTokApp: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [likedIds, setLikedIds] = useState<Record<number, boolean>>({});
  const clips = [
    { creator: '@techtitanium', title: 'Unboxing iPhone 18 Pro Max Liquid Glass UI!', likes: '428K', gradient: 'from-rose-600 via-fuchsia-800 to-slate-950' },
    { creator: '@designstudio', title: 'How 120Hz ProMotion micro-interactions feel', likes: '189K', gradient: 'from-cyan-600 via-blue-800 to-zinc-950' },
    { creator: '@spatialsound', title: 'Dolby Atmos headphones test on mobile #audio', likes: '92K', gradient: 'from-amber-500 via-orange-700 to-zinc-950' },
  ];
  const clip = clips[idx];

  return (
    <div className={`h-full relative flex flex-col justify-between bg-gradient-to-b ${clip.gradient} text-white p-4`}>
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-bold tracking-wide bg-black/35 px-3 py-1 rounded-full">For You</span>
        <button
          onClick={() => setMuted((m) => !m)}
          className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
          aria-label="Toggle Sound"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-end justify-between gap-3 pb-4">
        <div className="space-y-1.5 flex-1">
          <p className="text-sm font-bold">{clip.creator}</p>
          <p className="text-xs text-white/90 leading-snug">{clip.title}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-white/80">
            <Music2 className="w-3.5 h-3.5 animate-spin" />
            <span>Original Sound - {clip.creator}</span>
          </div>
          <div className="pt-2 flex gap-2">
            {clips.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                  idx === i ? 'bg-white text-black' : 'bg-white/20 text-white'
                }`}
              >
                Clip {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setLikedIds((p) => ({ ...p, [idx]: !p[idx] }))}
            className="flex flex-col items-center gap-0.5"
          >
            <Heart className={`w-7 h-7 ${likedIds[idx] ? 'text-rose-400 fill-rose-400' : 'text-white'}`} />
            <span className="text-[10px] font-semibold">{clip.likes}</span>
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % clips.length)} className="px-3 py-2 rounded-full bg-white/20 text-[10px] font-bold">
            Next ↓
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. X (TWITTER)
export const TwitterXApp: React.FC = () => {
  const [posts, setPosts] = useState([
    { id: 'x1', author: 'Marcus Vance', handle: '@mvance', time: '12m', body: 'Swiping the iPhone 18 Pro Max Control Board from the top-right feels effortlessly smooth.', likes: 412, reposts: 38 },
    { id: 'x2', author: 'Apple Silicon News', handle: '@silicon', time: '1h', body: 'A20 Pro efficiency cores deliver all-day battery life even under 120Hz workloads.', likes: 1204, reposts: 192 },
  ]);
  const [draft, setDraft] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [reposted, setReposted] = useState<Record<string, boolean>>({});

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-lg font-black">𝕏</span>
        <span className="text-xs text-zinc-400 font-semibold">For you</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          setPosts((p) => [
            { id: `x-${Date.now()}`, author: 'Alex Mercer', handle: '@alexmercer', time: 'now', body: draft.trim(), likes: 0, reposts: 0 },
            ...p,
          ]);
          setDraft('');
        }}
        className="p-3 border-b border-zinc-800 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What is happening?!"
          className="flex-1 bg-zinc-900 rounded-full px-3.5 py-2 text-xs outline-none"
        />
        <button type="submit" className="px-4 py-1.5 rounded-full bg-sky-500 text-white text-xs font-bold">
          Post
        </button>
      </form>

      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-800">
        {posts.map((post) => (
          <div key={post.id} className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold">{post.author}</span>
              <span className="text-zinc-500">{post.handle} · {post.time}</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-100">{post.body}</p>
            <div className="flex items-center gap-6 pt-1 text-zinc-500 text-xs">
              <button
                onClick={() => setReposted((r) => ({ ...r, [post.id]: !r[post.id] }))}
                className={`flex items-center gap-1 ${reposted[post.id] ? 'text-emerald-400' : ''}`}
              >
                <Repeat2 className="w-4 h-4" />
                <span>{post.reposts + (reposted[post.id] ? 1 : 0)}</span>
              </button>
              <button
                onClick={() => setLiked((l) => ({ ...l, [post.id]: !l[post.id] }))}
                className={`flex items-center gap-1 ${liked[post.id] ? 'text-rose-500' : ''}`}
              >
                <Heart className={`w-4 h-4 ${liked[post.id] ? 'fill-current' : ''}`} />
                <span>{post.likes + (liked[post.id] ? 1 : 0)}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. DISCORD
export const DiscordApp: React.FC = () => {
  const [channel, setChannel] = useState<'general' | 'showcase' | 'voice'>('general');
  const [msgs, setMsgs] = useState<Record<string, Array<{ user: string; text: string }>>>({
    general: [
      { user: 'NovaDev', text: 'Welcome to iOS Builders! Try swiping the Control Board.' },
      { user: 'PixelCraft', text: 'Google Play Store & App Store are both synced cleanly!' },
    ],
    showcase: [
      { user: 'Elena', text: 'Just shipped 120fps animations on iPhone 18 Pro Max.' },
    ],
    voice: [{ user: 'System', text: 'Connected to Lounge Voice · 48kbps Opus Audio' }],
  });
  const [input, setInput] = useState('');

  return (
    <div className="h-full flex flex-col bg-[#1e1f22] text-zinc-100">
      <div className="px-4 pt-3 pb-2 bg-[#2b2d31] border-b border-black/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-bold">{channel}</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5865f2] text-white font-semibold">Online · 24</span>
      </div>

      <div className="flex gap-1.5 p-2 bg-[#2b2d31] border-b border-black/20">
        {(['general', 'showcase', 'voice'] as const).map((ch) => (
          <button
            key={ch}
            onClick={() => setChannel(ch)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              channel === ch ? 'bg-[#5865f2] text-white' : 'bg-white/5 text-zinc-400'
            }`}
          >
            #{ch}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
        {(msgs[channel] || []).map((m, idx) => (
          <div key={idx} className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#5865f2] text-white text-xs font-bold flex items-center justify-center shrink-0">
              {m.user[0]}
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-300">{m.user}</p>
              <p className="text-xs text-zinc-200">{m.text}</p>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          setMsgs((prev) => ({
            ...prev,
            [channel]: [...(prev[channel] || []), { user: 'Alex', text: input.trim() }],
          }));
          setInput('');
        }}
        className="p-3 bg-[#2b2d31] flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message #${channel}`}
          className="flex-1 rounded-full bg-[#1e1f22] px-3.5 py-2 text-xs outline-none"
        />
        <button type="submit" className="p-2 rounded-full bg-[#5865f2] text-white">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

// 5. REDDIT
export const RedditApp: React.FC = () => {
  const [sub, setSub] = useState('All');
  const [votes, setVotes] = useState<Record<string, number>>({ rd1: 1, rd2: 0 });
  const threads = [
    { id: 'rd1', sub: 'r/iPhone', title: 'iPhone 18 Pro Max gesture navigation tips you need to know', score: 2840, comments: 194 },
    { id: 'rd2', sub: 'r/technology', title: 'Open web video & instant app sandboxes in mobile browsers', score: 1520, comments: 87 },
    { id: 'rd3', sub: 'r/design', title: 'Liquid Glass depth layering in modern mobile OS design', score: 940, comments: 45 },
  ].filter((t) => sub === 'All' || t.sub === sub);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-base font-extrabold text-[#ff4500]">reddit</span>
        <div className="flex gap-1">
          {['All', 'r/iPhone', 'r/technology'].map((s) => (
            <button
              key={s}
              onClick={() => setSub(s)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                sub === s ? 'bg-[#ff4500] text-white' : 'bg-zinc-100 dark:bg-zinc-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-200 dark:divide-zinc-800">
        {threads.map((t) => {
          const delta = votes[t.id] || 0;
          return (
            <div key={t.id} className="p-4 space-y-2">
              <p className="text-[11px] font-bold text-[#ff4500]">{t.sub}</p>
              <p className="text-sm font-semibold leading-snug">{t.title}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-full px-2 py-1">
                  <button onClick={() => setVotes((v) => ({ ...v, [t.id]: delta === 1 ? 0 : 1 }))}>
                    <ThumbsUp className={`w-3.5 h-3.5 ${delta === 1 ? 'text-[#ff4500]' : ''}`} />
                  </button>
                  <span className="font-mono-num font-bold px-1">{t.score + delta}</span>
                  <button onClick={() => setVotes((v) => ({ ...v, [t.id]: delta === -1 ? 0 : -1 }))}>
                    <ThumbsDown className={`w-3.5 h-3.5 ${delta === -1 ? 'text-indigo-500' : ''}`} />
                  </button>
                </div>
                <span>{t.comments} comments</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 6. GOOGLE CHROME
export const ChromeApp: React.FC = () => {
  const [urlInput, setUrlInput] = useState('https://www.google.com');
  const [activeUrl, setActiveUrl] = useState('https://www.google.com');
  const [readerTitle, setReaderTitle] = useState<string | null>(null);
  const [readerText, setReaderText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    query: string;
    aiOverview: string;
    results: Array<{ title: string; url: string; displayUrl: string; snippet: string }>;
  } | null>({
    query: '',
    aiOverview: '',
    results: [],
  });

  const extractGoogleQuery = (rawUrl: string): string | null => {
    try {
      const u = new URL(rawUrl);
      if (u.hostname === 'www.google.com' || u.hostname === 'google.com') {
        return u.searchParams.get('q') ?? '';
      }
    } catch {
      // ignore
    }
    return null;
  };

  const loadPage = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const isUrl = /^https?:\/\//i.test(trimmed) || (trimmed.includes('.') && !trimmed.includes(' '));
    const target = isUrl
      ? trimmed.startsWith('http')
        ? trimmed
        : `https://${trimmed}`
      : `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;

    setUrlInput(target);
    setActiveUrl(target);
    setReaderText(null);
    setLoading(true);

    const gq = extractGoogleQuery(target);
    if (gq !== null) {
      if (!gq) {
        setSearchResults({ query: '', aiOverview: '', results: [] });
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/google/search?q=${encodeURIComponent(gq)}&tab=all`);
        const data = await res.json();
        setSearchResults({
          query: gq,
          aiOverview: data.aiOverview || '',
          results: Array.isArray(data.results) ? data.results : [],
        });
      } catch {
        setSearchResults({ query: gq, aiOverview: '', results: [] });
      } finally {
        setLoading(false);
      }
      return;
    }

    setSearchResults(null);
    try {
      const r = await fetch(`/api/safari/fetch?url=${encodeURIComponent(target)}`);
      const d = await r.json();
      if (d?.title) {
        setReaderTitle(d.title);
        setReaderText(d.excerpt || d.content || '');
      }
    } catch {
      // keep iframe fallback
    } finally {
      setLoading(false);
    }
  };

  const isGoogleView = extractGoogleQuery(activeUrl) !== null;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-3 pt-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span className="font-bold text-blue-500">Google Chrome</span>
          <span className="text-[10px] text-zinc-400">Open Web · No Wikipedia Lock-in</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadPage(urlInput);
          }}
          className="flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Search Google or type URL"
            className="flex-1 bg-transparent text-xs outline-none"
          />
          <button type="submit" className="text-zinc-500">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      <div className="flex-1 relative overflow-y-auto no-scrollbar">
        {isGoogleView ? (
          <div className="p-4 space-y-4">
            <div className="pt-2 text-center">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </span>
            </div>
            {!searchResults?.query ? (
              <div className="space-y-3">
                <input
                  placeholder="Search Google..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) loadPage(val);
                    }
                  }}
                  className="w-full rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs outline-none"
                />
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {['Tech news today', 'YouTube', 'GitHub', 'Apple iPhone'].map((q) => (
                    <button
                      key={q}
                      onClick={() => loadPage(q)}
                      className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-[11px] font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <p className="text-xs text-center text-zinc-500">Searching Google...</p>
            ) : (
              <div className="space-y-3">
                {searchResults.aiOverview && (
                  <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 text-xs leading-relaxed">
                    {searchResults.aiOverview}
                  </div>
                )}
                {searchResults.results.map((r, i) => (
                  <div key={`${r.url}-${i}`} className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-3 space-y-1">
                    <p className="text-[10px] text-zinc-500 truncate">{r.displayUrl}</p>
                    <button
                      onClick={() => loadPage(r.url)}
                      className="text-left text-xs font-bold text-blue-500 hover:underline block"
                    >
                      {r.title}
                    </button>
                    {r.snippet && <p className="text-[11px] text-zinc-500 line-clamp-2">{r.snippet}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <iframe src={activeUrl} title="Chrome Tab" className="w-full flex-1 border-0 bg-white" />
            {readerText && (
              <div className="bg-zinc-950/90 text-white px-3 py-2 text-[10px] border-t border-zinc-800 truncate">
                Chrome Reader: <span className="font-semibold">{readerTitle}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 7. GMAIL
export const GmailApp: React.FC = () => {
  const { state, setPersisted, pushNotification } = useOS();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const selected = state.emails.find((e) => e.id === selectedId);

  const handleMarkRead = (id: string) => {
    setPersisted((prev) => ({
      ...prev,
      emails: prev.emails.map((em) => (em.id === id ? { ...em, unread: false } : em)),
    }));
  };

  const handleSend = () => {
    if (!to.trim() || !subject.trim()) return;
    setPersisted((prev) => ({
      ...prev,
      emails: [
        {
          id: `gm-${Date.now()}`,
          from: state.settings.appleIdName,
          fromEmail: state.settings.appleIdEmail,
          subject: subject.trim(),
          preview: body.trim().slice(0, 60) || subject.trim(),
          body: body.trim(),
          timestamp: Date.now(),
          unread: false,
          flagged: false,
          folder: 'sent',
        },
        ...prev.emails,
      ],
    }));
    pushNotification('gmail', 'Gmail', `Message sent to ${to.trim()}`);
    setTo('');
    setSubject('');
    setBody('');
    setComposeOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-red-500" />
          <div>
            <h1 className="text-base font-bold leading-none">Mail Sandbox</h1>
            <p className="text-[10px] text-zinc-500 mt-0.5">Local Simulator · Gmail API Disabled</p>
          </div>
        </div>
        <button
          onClick={() => setComposeOpen((c) => !c)}
          className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Compose
        </button>
      </div>

      {composeOpen ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 space-y-2.5"
        >
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 px-3 py-2 text-xs outline-none" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 px-3 py-2 text-xs outline-none" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Compose email" className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 px-3 py-2 text-xs outline-none" />
          <button type="submit" className="w-full py-2 rounded-full bg-red-500 text-white text-xs font-bold">Send via Gmail</button>
        </form>
      ) : selected ? (
        <div className="p-4 space-y-3 flex-1 overflow-y-auto no-scrollbar">
          <button onClick={() => setSelectedId(null)} className="text-xs font-semibold text-red-500">← Back to Inbox</button>
          <h2 className="text-base font-bold">{selected.subject}</h2>
          <p className="text-xs text-zinc-500">
            {selected.from} · {new Date(selected.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs leading-relaxed whitespace-pre-line pt-2">{selected.body}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-100 dark:divide-zinc-900">
          {state.emails.map((email) => (
            <button
              key={email.id}
              onClick={() => {
                handleMarkRead(email.id);
                setSelectedId(email.id);
              }}
              className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
            >
              <div className="w-9 h-9 rounded-full bg-red-500/15 text-red-500 font-bold text-xs flex items-center justify-center shrink-0">
                {email.from[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between">
                  <p className={`text-xs truncate ${email.unread ? 'font-bold' : 'font-medium'}`}>{email.from}</p>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs truncate">{email.subject}</p>
                <p className="text-[11px] text-zinc-500 truncate">{email.preview}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 8. GOOGLE DRIVE
export const GoogleDriveApp: React.FC = () => {
  const [files, setFiles] = useState([
    { id: 'gd1', name: 'Q4 Product Launch Deck.slides', size: '14.2 MB', type: 'Slides', starred: true },
    { id: 'gd2', name: 'Design System Spec.docs', size: '2.8 MB', type: 'Docs', starred: false },
    { id: 'gd3', name: 'App Analytics Forecast.sheets', size: '4.1 MB', type: 'Sheets', starred: true },
  ]);
  const [newFile, setNewFile] = useState('');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-emerald-500" />
          <h1 className="text-base font-bold">Google Drive</h1>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono-num">4.2 / 15 GB</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newFile.trim()) return;
          setFiles((f) => [{ id: `gd-${Date.now()}`, name: newFile.trim(), size: '1.2 MB', type: 'Doc', starred: false }, ...f]);
          setNewFile('');
        }}
        className="p-3 flex gap-2 border-b border-zinc-100 dark:border-zinc-900"
      >
        <input
          value={newFile}
          onChange={(e) => setNewFile(e.target.value)}
          placeholder="Create new Drive file..."
          className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none"
        />
        <button type="submit" className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold">
          Upload
        </button>
      </form>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
        {files.map((file) => (
          <div key={file.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Folder className="w-5 h-5 text-sky-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{file.name}</p>
                <p className="text-[10px] text-zinc-500">{file.type} · {file.size}</p>
              </div>
            </div>
            <button
              onClick={() => setFiles((fs) => fs.map((x) => (x.id === file.id ? { ...x, starred: !x.starred } : x)))}
            >
              <Star className={`w-4 h-4 ${file.starred ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 9. UBER
export const UberApp: React.FC = () => {
  const { pushNotification } = useOS();
  const [dest, setDest] = useState('Apple Park Visitor Center');
  const [tier, setTier] = useState<'UberX' | 'Comfort' | 'Black'>('UberX');
  const [booked, setBooked] = useState(false);

  const tiers = [
    { name: 'UberX' as const, eta: '3 min away', price: '$14.80' },
    { name: 'Comfort' as const, eta: '5 min away', price: '$19.40' },
    { name: 'Black' as const, eta: '4 min away', price: '$32.00' },
  ];

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-800 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">Uber</h1>
        <span className="text-xs text-emerald-400 font-semibold">Cupertino, CA</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        <div className="h-36 rounded-3xl bg-gradient-to-br from-slate-800 via-zinc-900 to-emerald-950 border border-white/10 p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <MapPin className="w-4 h-4" />
            <span>Pickup: Infinite Loop · Live GPS</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>Destination: {dest}</span>
          </div>
        </div>

        <input
          value={dest}
          onChange={(e) => {
            setDest(e.target.value);
            setBooked(false);
          }}
          placeholder="Where to?"
          className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs outline-none"
        />

        <div className="space-y-2">
          {tiers.map((t) => (
            <button
              key={t.name}
              onClick={() => setTier(t.name)}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                tier === t.name ? 'border-white bg-white/10' : 'border-zinc-800 bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <Car className="w-6 h-6 text-white" />
                <div>
                  <p className="text-xs font-bold">{t.name}</p>
                  <p className="text-[11px] text-zinc-400">{t.eta}</p>
                </div>
              </div>
              <span className="text-sm font-bold font-mono-num">{t.price}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setBooked(true);
            pushNotification('uber', `${tier} Confirmed`, `Driver arriving in 3 min to ${dest}`);
          }}
          className="w-full py-3 rounded-2xl bg-white text-black text-sm font-bold"
        >
          {booked ? `${tier} En Route (3 min) ✓` : `Request ${tier}`}
        </button>
      </div>
    </div>
  );
};

// 10. AMAZON
export const AmazonApp: React.FC = () => {
  const { pushNotification } = useOS();
  const [query, setQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const items = [
    { id: 'am1', title: 'AirPods Pro 3 (USB-C)', price: '$249.00', rating: '4.9' },
    { id: 'am2', title: 'MagSafe Charger 25W Titanium', price: '$39.00', rating: '4.8' },
    { id: 'am3', title: 'Apple Watch Ultra Milanese Loop', price: '$199.00', rating: '4.9' },
    { id: 'am4', title: 'Belkin 3-in-1 Qi2 Charging Dock', price: '$129.00', rating: '4.7' },
  ].filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="bg-slate-900 text-white px-4 pt-3 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold tracking-tight">amazon <span className="text-amber-400">prime</span></span>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
            <ShoppingCart className="w-4 h-4" /> {cartCount}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white text-zinc-900 px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Amazon"
            className="flex-1 text-xs outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2.5">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{item.title}</p>
                <p className="text-xs font-bold font-mono-num text-amber-600 dark:text-amber-400">{item.price}</p>
                <p className="text-[10px] text-sky-500 font-semibold">prime Free Same-Day Delivery</p>
              </div>
            </div>
            <button
              onClick={() => {
                setCartCount((c) => c + 1);
                pushNotification('amazon', 'Amazon Cart', `Added ${item.title} to your bag.`);
              }}
              className="px-3 py-1.5 rounded-full bg-amber-400 text-zinc-950 text-[11px] font-bold shrink-0"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 11. NOTION
export const NotionApp: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: 'n1', text: 'Ship Liquid Glass iOS 26 UI', done: true },
    { id: 'n2', text: 'Connect Google Play Store + App Store', done: true },
    { id: 'n3', text: 'Record launch keynote demo', done: false },
  ]);
  const [input, setInput] = useState('');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        <h1 className="text-sm font-bold">Notion · Product Roadmap</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            setTasks((t) => [...t, { id: `nt-${Date.now()}`, text: input.trim(), done: false }]);
            setInput('');
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a to-do block..."
            className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 px-3 py-2 text-xs outline-none"
          />
          <button type="submit" className="px-3 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold">
            Add
          </button>
        </form>

        <div className="space-y-1.5">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => setTasks((list) => list.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
              className="w-full p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900 flex items-center gap-2.5 text-left"
            >
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${t.done ? 'text-emerald-500' : 'text-zinc-400'}`} />
              <span className={`text-xs ${t.done ? 'line-through text-zinc-400' : ''}`}>{t.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 12. PINTEREST
export const PinterestApp: React.FC = () => {
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const pins = [
    { id: 'p1', title: 'Minimal Titanium Desk', gradient: 'from-zinc-700 to-stone-900', h: 'h-44' },
    { id: 'p2', title: 'Kyoto Sunset Alley', gradient: 'from-rose-500 to-amber-600', h: 'h-36' },
    { id: 'p3', title: 'Glassmorphism Widgets', gradient: 'from-sky-500 to-indigo-700', h: 'h-36' },
    { id: 'p4', title: 'Nordic Architecture', gradient: 'from-emerald-600 to-teal-900', h: 'h-44' },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-base font-extrabold text-rose-600">Pinterest</span>
        <span className="text-xs text-zinc-500">Saved: {Object.values(savedIds).filter(Boolean).length}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 grid grid-cols-2 gap-3 content-start">
        {pins.map((pin) => (
          <div key={pin.id} className="space-y-1.5">
            <div className={`${pin.h} rounded-2xl bg-gradient-to-br ${pin.gradient} p-3 flex flex-col justify-end text-white relative`}>
              <button
                onClick={() => setSavedIds((s) => ({ ...s, [pin.id]: !s[pin.id] }))}
                className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  savedIds[pin.id] ? 'bg-zinc-900 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {savedIds[pin.id] ? 'Saved' : 'Save'}
              </button>
              <p className="text-xs font-bold">{pin.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 13. DUOLINGO
export const DuolingoApp: React.FC = () => {
  const [xp, setXp] = useState(40);
  const [qIdx, setQIdx] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const questions = [
    { prompt: 'Translate "Good morning" to Spanish:', options: ['Buenos días', 'Buenas noches', 'Hasta luego'], answer: 'Buenos días' },
    { prompt: 'Translate "Thank you" to French:', options: ['Bonjour', 'Merci', 'S’il vous plaît'], answer: 'Merci' },
    { prompt: 'Translate "Water" to Japanese:', options: ['Mizu', 'Kaze', 'Sora'], answer: 'Mizu' },
  ];
  const q = questions[qIdx];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 justify-between">
      <div className="flex items-center justify-between pt-1">
        <span className="text-base font-extrabold text-[#58cc02]">duolingo</span>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
          <Flame className="w-4 h-4 fill-current" />
          <span className="font-mono-num">{xp} XP</span>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Question {qIdx + 1} of {questions.length}</p>
        <h2 className="text-base font-bold">{q.prompt}</h2>
        <div className="space-y-2">
          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                if (opt === q.answer) {
                  setXp((x) => x + 15);
                  setFeedback('Correct! +15 XP');
                } else {
                  setFeedback(`Try again — answer is "${q.answer}"`);
                }
              }}
              className="w-full p-3.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-[#58cc02] text-left text-xs font-bold transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
        {feedback && <p className="text-xs font-bold text-[#58cc02]">{feedback}</p>}
      </div>

      <button
        onClick={() => {
          setFeedback(null);
          setQIdx((i) => (i + 1) % questions.length);
        }}
        className="w-full py-3 rounded-2xl bg-[#58cc02] text-white text-sm font-extrabold"
      >
        Next Lesson
      </button>
    </div>
  );
};

// 14. SNAPCHAT
export const SnapchatApp: React.FC = () => {
  const { addMedia, pushNotification } = useOS();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [lens, setLens] = useState<'Normal' | 'Warm' | 'Neon'>('Normal');
  const [streaks, setStreaks] = useState([
    { friend: 'Jordan', days: 142 },
    { friend: 'Maya', days: 89 },
  ]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {
          // fallback lens studio preview
        });
    }
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const lensFilter =
    lens === 'Warm' ? 'sepia(0.35) saturate(1.5)' : lens === 'Neon' ? 'hue-rotate(120deg) contrast(1.2)' : 'none';

  return (
    <div className="h-full relative flex flex-col justify-between bg-zinc-950 text-white overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ filter: lensFilter }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 px-4 pt-3 flex items-center justify-between">
        <span className="px-3 py-1 rounded-full bg-black/50 text-xs font-bold text-yellow-300">Snapchat Camera</span>
        <span className="px-2.5 py-1 rounded-full bg-black/50 text-[11px]">{lens} Lens</span>
      </div>

      <div className="relative z-10 p-4 space-y-3 bg-gradient-to-t from-black/80 via-black/35 to-transparent">
        <div className="flex gap-2 justify-center">
          {(['Normal', 'Warm', 'Neon'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLens(l)}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                lens === l ? 'bg-yellow-400 text-black' : 'bg-black/50 text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[11px] space-y-0.5">
            {streaks.map((s) => (
              <p key={s.friend}>🔥 {s.friend} · {s.days}</p>
            ))}
          </div>
          <button
            onClick={() => {
              const canvas = document.createElement('canvas');
              canvas.width = 400;
              canvas.height = 500;
              const ctx = canvas.getContext('2d');
              if (ctx && videoRef.current && videoRef.current.videoWidth > 0) {
                ctx.filter = lensFilter;
                ctx.drawImage(videoRef.current, 0, 0, 400, 500);
              } else if (ctx) {
                ctx.fillStyle = '#facc15';
                ctx.fillRect(0, 0, 400, 500);
                ctx.fillStyle = '#18181b';
                ctx.font = 'bold 28px sans-serif';
                ctx.fillText(`Snap · ${lens} Lens`, 70, 250);
              }
              addMedia({
                id: `snap-${Date.now()}`,
                type: 'photo',
                src: canvas.toDataURL('image/png'),
                name: `Snap_${lens}.png`,
                createdAt: Date.now(),
                favorite: false,
                deleted: false,
                album: 'Recents',
              });
              setStreaks((prev) => prev.map((x) => ({ ...x, days: x.days + 1 })));
              pushNotification('snapchat', 'Snapchat', 'Snap saved to Photos & streak updated!');
            }}
            className="w-16 h-16 rounded-full border-4 border-yellow-300 bg-white/25 hover:bg-white/40 transition-colors"
            aria-label="Capture Snap"
          />
          <div className="w-16 text-right text-[10px] text-zinc-300">
            <Sparkles className="w-4 h-4 inline mr-0.5 text-yellow-300" /> Lenses
          </div>
        </div>
      </div>
    </div>
  );
};
