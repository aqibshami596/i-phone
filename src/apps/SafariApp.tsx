import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Copy as TabsIcon,
  Download,
  ExternalLink,
  EyeOff,
  Globe,
  History,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { fastFetchJson } from '../os/networkManager';

type PanelMode = 'none' | 'tabs' | 'bookmarks' | 'history' | 'downloads';
type SearchEngine = 'google' | 'duckduckgo' | 'bing' | 'wikipedia';

interface SearchResultItem {
  title: string;
  url: string;
  displayUrl: string;
  domain: string;
  snippet: string;
  source: string;
}

export const SafariApp: React.FC = () => {
  const { state, setPersisted, appSubRoute } = useOS();

  const [activeTabId, setActiveTabId] = useState(state.safariTabs[0]?.id || 'tab-1');
  const [addressInput, setAddressInput] = useState('');
  const [panel, setPanel] = useState<PanelMode>('none');
  const [navStack, setNavStack] = useState<Record<string, string[]>>({});
  const [navIndex, setNavIndex] = useState<Record<string, number>>({});
  const [readerMode, setReaderMode] = useState(false);
  const [readerData, setReaderData] = useState<{ title: string; description: string; excerpt: string; xFrameOptions?: string } | null>(null);
  const [loadingReader, setLoadingReader] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('google');

  // Native Google SERP inside Safari when visiting google.com / searching via Google
  const [googleResults, setGoogleResults] = useState<{
    query: string;
    aiOverview: string;
    results: SearchResultItem[];
    loading: boolean;
    error?: string;
  } | null>(null);

  const activeTab = state.safariTabs.find((t) => t.id === activeTabId) || state.safariTabs[0];

  const extractGoogleQuery = (urlStr: string): string | null => {
    try {
      const u = new URL(urlStr);
      if (u.hostname === 'www.google.com' || u.hostname === 'google.com') {
        return u.searchParams.get('q') ?? '';
      }
    } catch {
      // ignore invalid url
    }
    return null;
  };

  const runGoogleSerp = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setGoogleResults({ query: '', aiOverview: '', results: [], loading: false });
      return;
    }
    setGoogleResults({ query: trimmed, aiOverview: '', results: [], loading: true });
    try {
      const data = await fastFetchJson(`/api/google/search?q=${encodeURIComponent(trimmed)}&tab=all`);
      if (data?.error) {
        setGoogleResults({
          query: trimmed,
          aiOverview: '',
          results: [],
          loading: false,
          error: data?.error || 'Google Search failed.',
        });
      } else {
        setGoogleResults({
          query: trimmed,
          aiOverview: data.aiOverview || '',
          results: Array.isArray(data.results) ? data.results : [],
          loading: false,
        });
      }
    } catch {
      setGoogleResults({
        query: trimmed,
        aiOverview: '',
        results: [],
        loading: false,
        error: 'Unable to reach live Google Search right now.',
      });
    }
  };

  const normalizeUrlOrSearch = (raw: string): { url: string; title: string } => {
    const s = raw.trim();
    if (!s || s === 'about:start') return { url: 'about:start', title: 'Start Page' };
    if (/^https?:\/\//i.test(s)) {
      try {
        const u = new URL(s);
        const gq = extractGoogleQuery(u.toString());
        if (gq !== null) {
          return { url: u.toString(), title: gq ? `Google: ${gq}` : 'Google' };
        }
        return { url: u.toString(), title: u.hostname };
      } catch {
        // fall through
      }
    }
    if (s.includes('.') && !s.includes(' ')) {
      const full = `https://${s}`;
      const gq = extractGoogleQuery(full);
      if (gq !== null) {
        return { url: full, title: gq ? `Google: ${gq}` : 'Google' };
      }
      return { url: full, title: s };
    }
    // Primary Search Engine: Google (outside of Wikipedia), with optional engine selector
    if (searchEngine === 'duckduckgo') {
      return { url: `https://duckduckgo.com/?q=${encodeURIComponent(s)}`, title: `DuckDuckGo: ${s}` };
    }
    if (searchEngine === 'bing') {
      return { url: `https://www.bing.com/search?q=${encodeURIComponent(s)}`, title: `Bing: ${s}` };
    }
    if (searchEngine === 'wikipedia') {
      return { url: `https://en.m.wikipedia.org/w/index.php?search=${encodeURIComponent(s)}`, title: `Wikipedia: ${s}` };
    }
    return {
      url: `https://www.google.com/search?q=${encodeURIComponent(s)}`,
      title: `Google: ${s}`,
    };
  };

  const navigateTo = async (raw: string) => {
    const { url, title } = normalizeUrlOrSearch(raw);
    setAddressInput(url === 'about:start' ? '' : url);
    setPanel('none');
    setReaderMode(false);
    setReaderData(null);

    const gq = extractGoogleQuery(url);
    if (gq !== null) {
      void runGoogleSerp(gq);
    } else {
      setGoogleResults(null);
    }

    setPersisted((os) => ({
      ...os,
      safariTabs: os.safariTabs.map((t) => (t.id === activeTab.id ? { ...t, url, title } : t)),
      safariHistory:
        !activeTab.isPrivate && url !== 'about:start'
          ? [{ id: `sh-${Date.now()}`, title, url, visitedAt: Date.now() }, ...os.safariHistory].slice(0, 40)
          : os.safariHistory,
    }));

    const stack = navStack[activeTab.id] || ['about:start'];
    const idx = navIndex[activeTab.id] ?? stack.length - 1;
    const nextStack = [...stack.slice(0, idx + 1), url];
    setNavStack((prev) => ({ ...prev, [activeTab.id]: nextStack }));
    setNavIndex((prev) => ({ ...prev, [activeTab.id]: nextStack.length - 1 }));
    setIframeKey((k) => k + 1);
  };

  useEffect(() => {
    if (appSubRoute && appSubRoute.trim()) {
      void navigateTo(appSubRoute.trim());
    }
  }, [appSubRoute]);

  const fetchReaderView = async (url: string) => {
    if (!url || url === 'about:start') return;
    setLoadingReader(true);
    setReaderMode(true);
    try {
      const data = await fastFetchJson(`/api/safari/fetch?url=${encodeURIComponent(url)}`);
      setReaderData(data);
    } catch {
      setReaderData({
        title: url,
        description: 'Could not extract Reader View.',
        excerpt: 'External site blocked automated fetch.',
      });
    } finally {
      setLoadingReader(false);
    }
  };

  const goBack = () => {
    const stack = navStack[activeTab.id] || [];
    const idx = navIndex[activeTab.id] ?? 0;
    if (idx <= 0) return;
    const targetUrl = stack[idx - 1];
    setNavIndex((prev) => ({ ...prev, [activeTab.id]: idx - 1 }));
    setAddressInput(targetUrl === 'about:start' ? '' : targetUrl);
    const gq = extractGoogleQuery(targetUrl);
    if (gq !== null) {
      void runGoogleSerp(gq);
    } else {
      setGoogleResults(null);
    }
    setPersisted((os) => ({
      ...os,
      safariTabs: os.safariTabs.map((t) => (t.id === activeTab.id ? { ...t, url: targetUrl } : t)),
    }));
  };

  const goForward = () => {
    const stack = navStack[activeTab.id] || [];
    const idx = navIndex[activeTab.id] ?? 0;
    if (idx >= stack.length - 1) return;
    const targetUrl = stack[idx + 1];
    setNavIndex((prev) => ({ ...prev, [activeTab.id]: idx + 1 }));
    setAddressInput(targetUrl === 'about:start' ? '' : targetUrl);
    const gq = extractGoogleQuery(targetUrl);
    if (gq !== null) {
      void runGoogleSerp(gq);
    } else {
      setGoogleResults(null);
    }
    setPersisted((os) => ({
      ...os,
      safariTabs: os.safariTabs.map((t) => (t.id === activeTab.id ? { ...t, url: targetUrl } : t)),
    }));
  };

  const createTab = (isPrivate = false) => {
    const id = `tab-${Date.now()}`;
    setPersisted((os) => ({
      ...os,
      safariTabs: [...os.safariTabs, { id, title: isPrivate ? 'Private' : 'Start Page', url: 'about:start', isPrivate }],
    }));
    setActiveTabId(id);
    setAddressInput('');
    setPanel('none');
    setReaderMode(false);
    setGoogleResults(null);
  };

  const closeTab = (id: string) => {
    if (state.safariTabs.length <= 1) {
      navigateTo('about:start');
      return;
    }
    const remaining = state.safariTabs.filter((t) => t.id !== id);
    setPersisted((os) => ({ ...os, safariTabs: remaining }));
    if (activeTabId === id) setActiveTabId(remaining[0].id);
  };

  const addBookmark = () => {
    if (!activeTab || activeTab.url === 'about:start') return;
    if (state.safariBookmarks.some((b) => b.url === activeTab.url)) return;
    setPersisted((os) => ({
      ...os,
      safariBookmarks: [{ id: `bm-${Date.now()}`, title: activeTab.title, url: activeTab.url }, ...os.safariBookmarks],
    }));
  };

  const activeGoogleQuery = activeTab?.url ? extractGoogleQuery(activeTab.url) : null;

  return (
    <div className={`h-full flex flex-col ${activeTab?.isPrivate ? 'bg-zinc-950 text-white' : 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white'}`}>
      {/* Top Info Bar */}
      {activeTab?.isPrivate && (
        <div className="px-3 py-1 bg-purple-950/70 text-purple-200 text-[10px] font-semibold flex items-center justify-center gap-1.5">
          <EyeOff className="w-3 h-3" /> Private Browsing Active · History Not Saved
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {panel === 'tabs' ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Tabs ({state.safariTabs.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => createTab(true)} className="px-2.5 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                  + Private
                </button>
                <button onClick={() => createTab(false)} className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Tab
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {state.safariTabs.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setActiveTabId(t.id);
                    setAddressInput(t.url === 'about:start' ? '' : t.url);
                    setPanel('none');
                    const gq = extractGoogleQuery(t.url);
                    if (gq !== null) void runGoogleSerp(gq);
                    else setGoogleResults(null);
                  }}
                  className={`rounded-2xl p-3 border cursor-pointer flex flex-col justify-between h-28 ${
                    t.id === activeTab.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold truncate">{t.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(t.id);
                      }}
                      className="p-0.5 rounded-full hover:bg-black/10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate">{t.url}</p>
                </div>
              ))}
            </div>
          </div>
        ) : panel === 'bookmarks' ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Bookmarks</h2>
              <button onClick={() => setPanel('none')} className="text-xs text-blue-500 font-semibold">Done</button>
            </div>
            {state.safariBookmarks.map((b) => (
              <button
                key={b.id}
                onClick={() => navigateTo(b.url)}
                className="w-full text-left p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold">{b.title}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{b.url}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            ))}
          </div>
        ) : panel === 'history' ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">History</h2>
              <button
                onClick={() => setPersisted((os) => ({ ...os, safariHistory: [] }))}
                className="text-xs text-rose-500 font-semibold"
              >
                Clear
              </button>
            </div>
            {state.safariHistory.length === 0 ? (
              <p className="text-xs text-zinc-500">No browsing history yet.</p>
            ) : (
              state.safariHistory.map((h) => (
                <button
                  key={h.id}
                  onClick={() => navigateTo(h.url)}
                  className="w-full text-left p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900"
                >
                  <p className="text-xs font-semibold truncate">{h.title}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{h.url}</p>
                </button>
              ))
            )}
          </div>
        ) : panel === 'downloads' ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Downloads</h2>
              <button onClick={() => setPanel('none')} className="text-xs text-blue-500 font-semibold">Done</button>
            </div>
            {state.safariDownloads.map((d) => (
              <div key={d.id} className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">{d.name}</p>
                  <p className="text-[10px] text-zinc-500">{d.size}</p>
                </div>
                <Download className="w-4 h-4 text-blue-500" />
              </div>
            ))}
          </div>
        ) : activeTab?.url === 'about:start' ? (
          <div className="p-5 space-y-6">
            <div className="pt-4">
              <h1 className="text-2xl font-extrabold tracking-tight">Safari</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Search Google across the full web, enter any URL, or open a bookmark.</p>
            </div>

            {/* Search Engine Chooser */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-zinc-500">Default Search Engine</p>
              <div className="flex gap-1.5 flex-wrap">
                {(
                  [
                    ['google', 'Google'],
                    ['duckduckgo', 'DuckDuckGo'],
                    ['bing', 'Bing'],
                    ['wikipedia', 'Wikipedia'],
                  ] as Array<[SearchEngine, string]>
                ).map(([eng, label]) => (
                  <button
                    key={eng}
                    onClick={() => setSearchEngine(eng)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                      searchEngine === eng
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-500">Favorites</p>
              <div className="grid grid-cols-4 gap-2.5">
                {state.safariBookmarks.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => navigateTo(b.url)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm font-bold text-blue-500">
                      {b.title[0]}
                    </div>
                    <span className="text-[10px] truncate w-full text-center">{b.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-3.5 space-y-1.5 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Browser Security &amp; Reader View</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Some websites send <code className="font-mono-num">X-Frame-Options: DENY</code> headers that prevent iframe embedding inside web apps. Google Search runs natively in Safari, and for any blocked page tap the <strong>Reader</strong> icon below!
              </p>
            </div>
          </div>
        ) : readerMode ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-500">Safari Reader View</span>
              <button onClick={() => setReaderMode(false)} className="text-xs text-zinc-400">Show Web Frame</button>
            </div>
            {loadingReader ? (
              <p className="text-xs text-zinc-500">Loading page summary...</p>
            ) : readerData ? (
              <div className="space-y-2">
                <h2 className="text-lg font-bold">{readerData.title}</h2>
                {readerData.description && <p className="text-xs font-medium text-zinc-400">{readerData.description}</p>}
                <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {readerData.excerpt || 'No readable text extracted from this page.'}
                </p>
              </div>
            ) : null}
          </div>
        ) : activeGoogleQuery !== null ? (
          <div className="p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold tracking-tight">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </div>
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-500" /> Full Web Search
              </span>
            </div>

            {!activeGoogleQuery ? (
              <div className="space-y-3 pt-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (addressInput.trim() && !addressInput.includes('google.com')) {
                      navigateTo(addressInput);
                    }
                  }}
                  className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-3 flex items-center gap-2 border border-zinc-200 dark:border-zinc-800"
                >
                  <Search className="w-4 h-4 text-zinc-400" />
                  <input
                    placeholder="Search Google outside Wikipedia..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) navigateTo(`https://www.google.com/search?q=${encodeURIComponent(val)}`);
                      }
                    }}
                    className="flex-1 bg-transparent text-xs outline-none"
                  />
                </form>
                <div className="flex flex-wrap gap-1.5">
                  {['iPhone 18 Pro Max news', 'Apple Silicon M5', 'GitHub trending', 'SpaceX launch'].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => navigateTo(`https://www.google.com/search?q=${encodeURIComponent(chip)}`)}
                      className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-[11px] font-medium"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : googleResults?.loading ? (
              <div className="space-y-2.5">
                <div className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              </div>
            ) : googleResults?.error ? (
              <p className="text-xs text-rose-500">{googleResults.error}</p>
            ) : (
              <>
                {googleResults?.aiOverview && (
                  <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      <Sparkles className="w-3.5 h-3.5" /> Google Search AI Overview
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-200 whitespace-pre-line">
                      {googleResults.aiOverview}
                    </p>
                  </div>
                )}

                <div className="space-y-2.5">
                  {(googleResults?.results || []).map((item, idx) => (
                    <div
                      key={`${item.url}-${idx}`}
                      className="rounded-2xl bg-zinc-100/70 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-3 space-y-1"
                    >
                      <p className="text-[10px] text-zinc-500 truncate">{item.displayUrl}</p>
                      <button
                        onClick={() => navigateTo(item.url)}
                        className="text-left text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline block"
                      >
                        {item.title}
                      </button>
                      {item.snippet && (
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2">{item.snippet}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px]">
              <span className="truncate text-zinc-500 max-w-[200px]">If blank, site blocks iframes</span>
              <button
                onClick={() => fetchReaderView(activeTab.url)}
                className="text-blue-500 font-semibold flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" /> Reader View
              </button>
            </div>
            <iframe
              key={iframeKey}
              src={activeTab.url}
              title={activeTab.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="w-full flex-1 border-0 bg-white"
            />
          </div>
        )}
      </div>

      {/* Bottom Address Bar + Controls */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md p-2.5 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(addressInput);
          }}
          className="flex items-center gap-2 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 px-3 py-1.5"
        >
          <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
          <input
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Search Google or enter website"
            className="flex-1 bg-transparent text-xs outline-none"
          />
          <button
            type="button"
            onClick={() => fetchReaderView(activeTab.url)}
            title="Reader View"
            className="text-zinc-500 hover:text-blue-500"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            title="Reload"
            className="text-zinc-500 hover:text-blue-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center justify-between px-2 text-zinc-600 dark:text-zinc-300">
          <button onClick={goBack} className="p-1.5 hover:text-blue-500" title="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={goForward} className="p-1.5 hover:text-blue-500" title="Forward">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={addBookmark} className="p-1.5 hover:text-blue-500" title="Add Bookmark">
            <Bookmark className="w-4 h-4" />
          </button>
          <button onClick={() => setPanel(panel === 'bookmarks' ? 'none' : 'bookmarks')} className="p-1.5 hover:text-blue-500 text-xs font-semibold">
            Saved
          </button>
          <button onClick={() => setPanel(panel === 'history' ? 'none' : 'history')} className="p-1.5 hover:text-blue-500" title="History">
            <History className="w-4 h-4" />
          </button>
          <button onClick={() => setPanel(panel === 'downloads' ? 'none' : 'downloads')} className="p-1.5 hover:text-blue-500" title="Downloads">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => setPanel(panel === 'tabs' ? 'none' : 'tabs')} className="p-1.5 hover:text-blue-500 flex items-center gap-0.5 text-xs font-mono-num" title="Tabs">
            <TabsIcon className="w-4 h-4" />
            <span>{state.safariTabs.length}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
