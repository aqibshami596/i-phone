import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  Download,
  Gamepad2,
  Layers,
  Search,
  Sparkles,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { appStoreTodayHero } from '../os/assets';
import { APP_MAP, APP_REGISTRY, renderAppIcon } from '../os/appRegistry';
import { AppDefinition } from '../os/types';

type StoreTab = 'today' | 'games' | 'apps' | 'arcade' | 'search';

export const AppStoreApp: React.FC = () => {
  const {
    state,
    installingProgress,
    installApp,
    uninstallApp,
    updateApp,
    openApp,
  } = useOS();

  const [tab, setTab] = useState<StoreTab>('today');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [showAccount, setShowAccount] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [customReviews, setCustomReviews] = useState<Record<string, AppDefinition['reviews']>>({});
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const isInstalled = (id: string) => state.installedAppIds.includes(id);
  const needsUpdate = (app: AppDefinition) =>
    Boolean(app.hasUpdate && isInstalled(app.id) && !state.updatedAppIds.includes(app.id));

  const updatesList = useMemo(
    () => APP_REGISTRY.filter((a) => needsUpdate(a)),
    [state.installedAppIds, state.updatedAppIds]
  );

  const renderActionButton = (app: AppDefinition, compact = false) => {
    const progress = installingProgress[app.id];
    if (progress !== undefined) {
      return (
        <div className="flex items-center justify-center w-16 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 relative">
          <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(59,130,246,0.25)" strokeWidth="2.5" />
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeDasharray="56.5"
              strokeDashoffset={56.5 - (56.5 * progress) / 100}
              strokeLinecap="round"
            />
          </svg>
          <span className="ml-1 text-[10px] font-mono-num font-semibold text-blue-500">{progress}%</span>
        </div>
      );
    }
    if (needsUpdate(app)) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateApp(app.id);
          }}
          className={`rounded-full bg-blue-500/15 text-blue-500 hover:bg-blue-500 hover:text-white font-bold uppercase tracking-wide transition-colors ${
            compact ? 'px-3.5 py-1 text-[11px]' : 'px-5 py-1.5 text-xs'
          }`}
        >
          Update
        </button>
      );
    }
    if (isInstalled(app.id)) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openApp(app.id);
          }}
          className={`rounded-full bg-zinc-200 dark:bg-zinc-800 text-blue-500 hover:bg-blue-500 hover:text-white font-bold uppercase tracking-wide transition-colors ${
            compact ? 'px-4 py-1 text-[11px]' : 'px-5 py-1.5 text-xs'
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
        className={`rounded-full bg-blue-600 text-white hover:bg-blue-500 font-bold uppercase tracking-wide transition-colors ${
          compact ? 'px-4 py-1 text-[11px]' : 'px-5 py-1.5 text-xs'
        }`}
      >
        Get
      </button>
    );
  };

  const selectedApp = selectedAppId ? APP_MAP[selectedAppId] : null;

  // ACCOUNT / UPDATES SHEET
  if (showAccount) {
    return (
      <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-bold">Account</h2>
          <button onClick={() => setShowAccount(false)} className="text-sm font-semibold text-blue-500">
            Done
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center">
              AM
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{state.settings.appleIdName}</p>
              <p className="text-xs text-zinc-500 truncate">{state.settings.appleIdEmail}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Available Updates ({updatesList.length})</h3>
              {updatesList.length > 0 && (
                <button
                  onClick={() => updatesList.forEach((a) => updateApp(a.id))}
                  className="text-xs font-semibold text-blue-500"
                >
                  Update All
                </button>
              )}
            </div>
            {updatesList.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">All installed apps are up to date.</p>
            ) : (
              updatesList.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    setShowAccount(false);
                    setSelectedAppId(app.id);
                  }}
                  className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                        {renderAppIcon(app.id, 'sm')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{app.name}</p>
                        <p className="text-[11px] text-zinc-500">v{app.whatsNewVersion || app.version} · {app.sizeMB} MB</p>
                      </div>
                    </div>
                    {renderActionButton(app, true)}
                  </div>
                  {app.releaseNotes && (
                    <p className="text-[11px] text-zinc-500 whitespace-pre-line">{app.releaseNotes}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Installed Apps ({state.installedAppIds.length})</h3>
              <button
                onClick={() => openApp('storage')}
                className="text-xs font-semibold text-blue-500"
              >
                Manage Storage
              </button>
            </div>
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
              {state.installedAppIds.map((id) => {
                const app = APP_MAP[id];
                if (!app) return null;
                return (
                  <div key={id} className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                        {renderAppIcon(id, 'xs')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{app.name}</p>
                        <p className="text-[10px] text-zinc-500">{app.sizeMB} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openApp(id)}
                        className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-blue-500"
                      >
                        Open
                      </button>
                      {!app.systemApp && (
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
      </div>
    );
  }

  // APP DETAIL VIEW
  if (selectedApp) {
    const allReviews = [...(customReviews[selectedApp.id] || []), ...selectedApp.reviews];
    return (
      <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <div className="px-3 pt-2 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setSelectedAppId(null)}
            className="flex items-center gap-0.5 text-sm font-medium text-blue-500"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <span className="text-xs font-semibold truncate max-w-[160px]">{selectedApp.name}</span>
          <div className="w-12" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-20 h-20 rounded-[22px] overflow-hidden shadow-lg shrink-0">
              {renderAppIcon(selectedApp.id, 'lg')}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold leading-tight">{selectedApp.name}</h1>
              <p className="text-xs text-zinc-500 mt-0.5">{selectedApp.subtitle}</p>
              <p className="text-[11px] text-blue-500 font-medium mt-0.5">{selectedApp.developer}</p>
              <div className="mt-3 flex items-center gap-2">
                {renderActionButton(selectedApp)}
                {isInstalled(selectedApp.id) && !selectedApp.systemApp && (
                  <button
                    onClick={() => uninstallApp(selectedApp.id)}
                    className="px-3 py-1.5 rounded-full bg-rose-500/12 text-rose-500 text-xs font-semibold hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    Uninstall
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info Metrics Strip */}
          <div className="grid grid-cols-4 gap-2 py-3 border-y border-zinc-200 dark:border-zinc-800 text-center">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase">{selectedApp.ratingCount} Ratings</p>
              <p className="text-sm font-bold font-mono-num mt-0.5">{selectedApp.rating} ★</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase">Age</p>
              <p className="text-sm font-bold mt-0.5">{selectedApp.ageRating}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase">Category</p>
              <p className="text-xs font-bold mt-1 truncate">{selectedApp.category}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase">Size</p>
              <p className="text-sm font-bold font-mono-num mt-0.5">{selectedApp.sizeMB} MB</p>
            </div>
          </div>

          {/* Screenshots */}
          {selectedApp.screenshots.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold">Preview</h3>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {selectedApp.screenshots.map((shot, i) => (
                  <div
                    key={i}
                    className={`w-[210px] h-[145px] shrink-0 rounded-2xl bg-gradient-to-br ${shot.gradient} p-4 text-white flex flex-col justify-end shadow-md`}
                  >
                    <p className="text-sm font-bold">{shot.title}</p>
                    <p className="text-[11px] text-white/80 mt-0.5">{shot.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold">About This App</h3>
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{selectedApp.description}</p>
            <p className="text-[11px] text-zinc-500 pt-1">
              Version {selectedApp.version} {selectedApp.chartRank ? `· ${selectedApp.chartRank}` : ''}
            </p>
          </div>

          {/* Ratings & Reviews */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-bold">Ratings & Reviews</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reviewText.trim()) return;
                setCustomReviews((prev) => ({
                  ...prev,
                  [selectedApp.id]: [
                    {
                      id: `rev-${Date.now()}`,
                      author: state.settings.appleIdName,
                      rating: reviewRating,
                      title: 'Verified User Review',
                      body: reviewText.trim(),
                      date: 'Just now',
                    },
                    ...(prev[selectedApp.id] || []),
                  ],
                }));
                setReviewText('');
              }}
              className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Write a Review</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewRating(n)}>
                      <Star className={`w-3.5 h-3.5 ${n <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-1.5 text-xs outline-none"
                />
                <button type="submit" className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold">
                  Post
                </button>
              </div>
            </form>

            {allReviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">{rev.title}</p>
                  <span className="text-[10px] text-zinc-500">{rev.date}</span>
                </div>
                <p className="text-[11px] text-amber-400">{'★'.repeat(rev.rating)}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">{rev.body}</p>
                <p className="text-[10px] text-zinc-400">by {rev.author}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const downloadableApps = APP_REGISTRY.filter((a) => !a.preinstalled);
  const gamesList = APP_REGISTRY.filter((a) => a.category === 'Games' || a.arcade);
  const appsList = APP_REGISTRY.filter(
    (a) => a.category !== 'Games' && (categoryFilter === 'All' || a.category === categoryFilter)
  );
  const searchResults = APP_REGISTRY.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAppRow = (app: AppDefinition, rank?: number) => (
    <div
      key={app.id}
      onClick={() => setSelectedAppId(app.id)}
      className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 rounded-xl px-1 transition-colors"
    >
      {rank !== undefined && (
        <span className="w-4 text-xs font-bold font-mono-num text-zinc-500 text-center">{rank}</span>
      )}
      <div className="w-12 h-12 rounded-[14px] overflow-hidden shadow-sm shrink-0">
        {renderAppIcon(app.id, 'sm')}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate">{app.name}</p>
        <p className="text-[11px] text-zinc-500 truncate">{app.subtitle}</p>
      </div>
      {renderActionButton(app, true)}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight capitalize">{tab}</h1>
        <button
          onClick={() => setShowAccount(true)}
          className="relative w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow"
          title="Account & Updates"
        >
          <User className="w-4 h-4" />
          {updatesList.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center">
              {updatesList.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 space-y-5">
        {tab === 'today' && (
          <>
            {/* Editorial Today Hero Card */}
            <div
              onClick={() => setSelectedAppId('sketchpad')}
              className="relative h-[220px] rounded-3xl overflow-hidden shadow-xl cursor-pointer group"
            >
              <img
                src={appStoreTodayHero}
                alt="App Store Today Feature"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-4 flex flex-col justify-end text-white">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300">App of the Day</p>
                <h2 className="text-lg font-bold leading-snug">SketchPad Pro & Spatial Tools</h2>
                <p className="text-xs text-zinc-200 mt-0.5">Create, draw, and export directly to Photos</p>
              </div>
            </div>

            {/* Ready to Install Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">New & Installable Apps</h3>
                <span className="text-[11px] text-blue-500 font-medium">Tap Get to Install</span>
              </div>
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                {downloadableApps.map((app) => renderAppRow(app))}
              </div>
            </div>

            {/* Essential Top Charts */}
            <div className="space-y-2">
              <h3 className="text-base font-bold">Must-Have Essentials</h3>
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                {['instagram', 'tiktok', 'youtube', 'spotify', 'whatsapp', 'chrome', 'gmail', 'netflix', 'uber', 'amazon'].map((id, i) => {
                  const app = APP_MAP[id];
                  return app ? renderAppRow(app, i + 1) : null;
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'games' && (
          <div className="space-y-4">
            <div
              onClick={() => setSelectedAppId('games')}
              className="rounded-3xl bg-gradient-to-br from-orange-500 via-rose-500 to-purple-700 p-4 text-white shadow-lg cursor-pointer"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Featured Game Hub</p>
              <h2 className="text-lg font-bold mt-1">Arcade Hub · 4 Playable Classics</h2>
              <p className="text-xs text-white/85 mt-1">Nebula Breaker, Titanium Snake, 2048 Glass, and Flappy Orb.</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {gamesList.map((app, i) => renderAppRow(app, i + 1))}
            </div>
          </div>
        )}

        {tab === 'apps' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {['All', 'Social', 'Photo & Video', 'Entertainment', 'Music', 'Productivity', 'Utilities', 'Navigation', 'Lifestyle'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {appsList.map((app, i) => renderAppRow(app, i + 1))}
            </div>
          </div>
        )}

        {tab === 'arcade' && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-zinc-900 to-indigo-950 border border-white/10 p-5 text-white text-center space-y-2">
              <Gamepad2 className="w-10 h-10 text-rose-400 mx-auto" />
              <h2 className="text-lg font-bold">Apple Arcade Simulation</h2>
              <p className="text-xs text-zinc-300">Zero ads. Instant 60fps playable mini-games with high score persistence.</p>
              <button
                onClick={() => openApp('games')}
                className="mt-2 px-5 py-2 rounded-full bg-white text-zinc-950 text-xs font-bold"
              >
                Launch Arcade Hub
              </button>
            </div>
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3">
              {downloadableApps.map((app) => renderAppRow(app))}
            </div>
          </div>
        )}

        {tab === 'search' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 px-3 py-2">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Games, Apps, Stories and More"
                className="flex-1 bg-transparent text-xs outline-none"
              />
            </div>

            {!searchQuery && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-500">Discover</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Instagram', 'TikTok', 'Chrome', 'Gmail', 'Discord', 'Uber', 'Amazon', 'Duolingo'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="text-left px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-blue-500"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {searchResults.map((app) => renderAppRow(app))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md grid grid-cols-5 py-1.5 text-[10px] font-medium">
        {(
          [
            ['today', 'Today', Sparkles],
            ['games', 'Games', Gamepad2],
            ['apps', 'Apps', Layers],
            ['arcade', 'Arcade', Check],
            ['search', 'Search', Search],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-0.5 py-1 ${
              tab === id ? 'text-blue-500' : 'text-zinc-500 dark:text-zinc-400'
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
