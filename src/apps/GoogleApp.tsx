import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  ExternalLink,
  Globe,
  Mic,
  MicOff,
  Newspaper,
  PlayCircle,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { fastFetchJson } from '../os/networkManager';

interface GoogleSearchResult {
  title: string;
  url: string;
  displayUrl: string;
  domain: string;
  snippet: string;
  publishedAt?: string;
  source: string;
}

type GoogleTab = 'all' | 'web' | 'news' | 'videos';

const TRENDING_SEARCHES = [
  'iPhone 18 Pro Max specs',
  'SpaceX Starship latest launch news',
  'Top AI coding tools 2026',
  'NASA Artemis mission updates',
  'Apple Liquid Glass iOS features',
  'Best mechanical keyboards 2026',
];

export const GoogleApp: React.FC = () => {
  const { state, appSubRoute, openApp } = useOS();
  const [queryInput, setQueryInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [activeTab, setActiveTab] = useState<GoogleTab>('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOverview, setAiOverview] = useState('');
  const [results, setResults] = useState<GoogleSearchResult[]>([]);
  const [relatedQueries, setRelatedQueries] = useState<string[]>([]);
  const [sourceLabel, setSourceLabel] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Apple news',
    'Weather Cupertino',
    'React 19 docs',
  ]);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  // In-app web viewer state
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [viewingTitle, setViewingTitle] = useState<string>('');
  const [readerMode, setReaderMode] = useState(false);
  const [readerData, setReaderData] = useState<{ title: string; description: string; excerpt: string } | null>(null);
  const [loadingReader, setLoadingReader] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const suggestTimer = useRef<number | null>(null);

  const runGoogleSearch = async (rawQuery: string, tab: GoogleTab = activeTab) => {
    const q = rawQuery.trim();
    if (!q) return;
    setActiveQuery(q);
    setQueryInput(q);
    setShowSuggestions(false);
    setViewingUrl(null);
    setReaderMode(false);
    setError(null);
    setLoading(true);
    setRecentSearches((prev) => [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8));

    try {
      const data = await fastFetchJson(`/api/google/search?q=${encodeURIComponent(q)}&tab=${encodeURIComponent(tab)}`);
      if (data?.error) {
        setError(data?.error || 'Google Search request failed.');
        setResults([]);
        setAiOverview('');
        setRelatedQueries([]);
      } else {
        setAiOverview(data.aiOverview || '');
        setResults(Array.isArray(data.results) ? data.results : []);
        setRelatedQueries(Array.isArray(data.relatedQueries) ? data.relatedQueries : []);
        setSourceLabel(data.source || 'google-search');
      }
    } catch {
      setError('Unable to reach Google Search service right now.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appSubRoute && appSubRoute.trim()) {
      runGoogleSearch(appSubRoute.trim(), 'all');
    }
  }, [appSubRoute]);

  const handleInputChange = (val: string) => {
    setQueryInput(val);
    setVoiceError('');
    if (suggestTimer.current) window.clearTimeout(suggestTimer.current);
    const trimmed = val.trim();
    if (!trimmed) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestTimer.current = window.setTimeout(async () => {
      try {
        const data = await fastFetchJson(`/api/google/suggest?q=${encodeURIComponent(trimmed)}`, 300_000);
        if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
          setShowSuggestions(data.suggestions.length > 0);
        }
      } catch {
        // ignore autocomplete errors
      }
    }, 180);
  };

  const startVoiceSearch = () => {
    setVoiceError('');
    if (state.settings.microphoneEnabled === false) {
      setVoiceError('Microphone hardware switch is turned OFF.');
      return;
    }
    const Win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };
    const SR = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SR) {
      setVoiceError('Voice Search requires a browser with Web Speech support.');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      setListening(false);
      if (transcript) runGoogleSearch(transcript);
    };
    rec.onerror = () => {
      setListening(false);
      setVoiceError('Could not capture voice query.');
    };
    rec.onend = () => setListening(false);
    rec.start();
  };

  const openResultInPhone = async (url: string, title: string) => {
    setViewingUrl(url);
    setViewingTitle(title);
    setReaderMode(false);
    setReaderData(null);
    setIframeKey((k) => k + 1);
  };

  const loadReaderView = async (url: string) => {
    setReaderMode(true);
    setLoadingReader(true);
    try {
      const data = await fastFetchJson(`/api/safari/fetch?url=${encodeURIComponent(url)}`);
      setReaderData({
        title: data?.title || viewingTitle || url,
        description: data?.description || '',
        excerpt: data?.excerpt || 'Unable to extract article text.',
      });
    } catch {
      setReaderData({
        title: viewingTitle || url,
        description: '',
        excerpt: 'Unable to fetch Reader View from this site.',
      });
    } finally {
      setLoadingReader(false);
    }
  };

  if (viewingUrl) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-900">
          <button
            onClick={() => {
              setViewingUrl(null);
              setReaderMode(false);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Results
          </button>
          <p className="text-[11px] font-medium truncate text-zinc-600 dark:text-zinc-300 flex-1 text-center">
            {viewingTitle || viewingUrl}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => (readerMode ? setReaderMode(false) : loadReaderView(viewingUrl))}
              className={`p-1.5 rounded-lg ${readerMode ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200'}`}
              title="Reader View"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openApp('safari', viewingUrl)}
              className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              title="Open in Safari"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              title="Reload"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900/70 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
          <span className="truncate">{viewingUrl}</span>
          <button
            onClick={() => loadReaderView(viewingUrl)}
            className="text-blue-500 font-semibold shrink-0 ml-2"
          >
            If blank, tap Reader View
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative bg-white dark:bg-zinc-950">
          {readerMode ? (
            <div className="h-full overflow-y-auto no-scrollbar p-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                Google In-Phone Reader
              </span>
              {loadingReader ? (
                <p className="text-xs text-zinc-500">Extracting page content...</p>
              ) : (
                <>
                  <h2 className="text-base font-bold">{readerData?.title}</h2>
                  {readerData?.description && (
                    <p className="text-xs font-medium text-zinc-500">{readerData.description}</p>
                  )}
                  <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                    {readerData?.excerpt}
                  </p>
                </>
              )}
            </div>
          ) : (
            <iframe
              key={iframeKey}
              src={viewingUrl}
              title={viewingTitle}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      {/* Header + Search Bar */}
      <div className={`px-4 ${activeQuery ? 'pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800' : 'pt-7 pb-3'} space-y-3`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setActiveQuery('');
              setQueryInput('');
              setResults([]);
              setAiOverview('');
              setError(null);
            }}
            className="text-2xl font-bold tracking-tight select-none"
          >
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </button>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            Open Web Search
          </span>
        </div>

        <div className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runGoogleSearch(queryInput);
            }}
            className="flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 shadow-xs"
          >
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              value={queryInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Search Google across the web..."
              className="flex-1 bg-transparent text-xs outline-none"
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => {
                  setQueryInput('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={startVoiceSearch}
              title="Voice Search"
              className={`p-1 rounded-full ${
                listening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : state.settings.microphoneEnabled === false
                    ? 'text-rose-500'
                    : 'text-blue-500 hover:bg-blue-500/10'
              }`}
            >
              {state.settings.microphoneEnabled === false ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => openApp('qrscanner')}
              title="Google Lens / QR Scanner"
              className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-full"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => runGoogleSearch(sug)}
                  className="w-full px-3.5 py-2.5 text-left text-xs flex items-center gap-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{sug}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {voiceError && <p className="text-[11px] text-rose-500 font-medium">{voiceError}</p>}

        {/* Filter Tabs when searching */}
        {activeQuery && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {(
              [
                ['all', 'All', Globe],
                ['web', 'Web', Search],
                ['news', 'News', Newspaper],
                ['videos', 'Videos', PlayCircle],
              ] as Array<[GoogleTab, string, React.ComponentType<{ className?: string }>]>
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  runGoogleSearch(activeQuery, id);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shrink-0 ${
                  activeTab === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-4">
        {!activeQuery ? (
          <>
            {/* Quick Google Shortcuts */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Top News', query: 'latest world technology news', color: 'text-rose-500 bg-rose-500/10', tab: 'news' as GoogleTab },
                { label: 'Videos', query: 'Apple iPhone Pro showcase', color: 'text-sky-500 bg-sky-500/10', tab: 'videos' as GoogleTab },
                { label: 'Sports', query: 'live football scores today', color: 'text-emerald-500 bg-emerald-500/10', tab: 'all' as GoogleTab },
                { label: 'Finance', query: 'AAPL stock market today', color: 'text-amber-500 bg-amber-500/10', tab: 'all' as GoogleTab },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveTab(item.tab);
                    runGoogleSearch(item.query, item.tab);
                  }}
                  className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-2.5 flex flex-col items-center gap-1.5 text-center"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.color}`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-500">Recent Searches</p>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => runGoogleSearch(term)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Web Searches */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                Trending on Google (Full Web)
              </p>
              <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
                {TRENDING_SEARCHES.map((trend) => (
                  <button
                    key={trend}
                    onClick={() => runGoogleSearch(trend)}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-medium flex items-center justify-between hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                  >
                    <span>{trend}</span>
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : loading ? (
          <div className="space-y-3 pt-2">
            <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 space-y-2">
            <p className="text-xs font-bold text-rose-500">Search Error</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">{error}</p>
          </div>
        ) : (
          <>
            {/* Google Search Grounding AI Overview */}
            {aiOverview && (
              <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 via-sky-500/10 to-emerald-500/10 border border-blue-500/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    Google Search AI Overview
                  </span>
                  <span className="text-[10px] text-zinc-500">{sourceLabel}</span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line">
                  {aiOverview}
                </p>
              </div>
            )}

            {/* Organic Open Web Results (outside Wikipedia) */}
            {results.length === 0 ? (
              <p className="text-xs text-zinc-500">No web results returned for &ldquo;{activeQuery}&rdquo;.</p>
            ) : (
              <div className="space-y-3">
                {results.map((item, idx) => (
                  <div
                    key={`${item.url}-${idx}`}
                    className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {item.domain?.[0]?.toUpperCase() || 'G'}
                        </div>
                        <span className="text-[11px] text-zinc-500 truncate">{item.displayUrl}</span>
                      </div>
                      <button
                        onClick={() => openApp('safari', item.url)}
                        className="text-[10px] font-semibold text-zinc-400 hover:text-blue-500 shrink-0"
                        title="Open in Safari"
                      >
                        Safari ↗
                      </button>
                    </div>
                    <button
                      onClick={() => openResultInPhone(item.url, item.title)}
                      className="text-left text-sm font-semibold text-blue-600 dark:text-sky-400 hover:underline leading-snug block"
                    >
                      {item.title}
                    </button>
                    {item.snippet && (
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                        {item.snippet}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Related Searches */}
            {relatedQueries.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-zinc-500">People also search for</p>
                <div className="flex flex-wrap gap-1.5">
                  {relatedQueries.map((rq) => (
                    <button
                      key={rq}
                      onClick={() => runGoogleSearch(rq)}
                      className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium hover:border-blue-500"
                    >
                      {rq}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
