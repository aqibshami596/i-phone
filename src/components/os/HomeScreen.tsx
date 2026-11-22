import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BatteryCharging,
  CloudSun,
  Heart,
  Minus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { APP_MAP, APP_REGISTRY, renderAppIcon } from '../../os/appRegistry';
import { HomeItem } from '../../os/types';

export const HomeScreen: React.FC = () => {
  const {
    state,
    isLandscape,
    openApp,
    jiggleMode,
    setJiggleMode,
    currentHomePage,
    setCurrentHomePage,
    activeFolderId,
    setActiveFolderId,
    setSpotlightOpen,
    setAppSwitcherOpen,
    setSiriOpen,
    uninstallApp,
    moveHomeApp,
    moveAppToDock,
    removeAppFromDock,
    renameFolder,
    installingProgress,
  } = useOS();

  const [contextAppId, setContextAppId] = useState<{ appId: string; inDock?: boolean } | null>(null);
  const [dragSource, setDragSource] = useState<{ page: number; index: number } | null>(null);
  const [libraryFilter, setLibraryFilter] = useState('');
  const [swipeDx, setSwipeDx] = useState(0);
  const pressTimer = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number; fromDock: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const totalPages = state.homePages.length + 1; // +1 for App Library

  const unreadMessagesCount = useMemo(
    () => state.threads.filter((t) => t.platform === 'imessage').reduce((sum, t) => sum + t.unread, 0),
    [state.threads]
  );
  const unreadWhatsApp = useMemo(
    () => state.threads.filter((t) => t.platform === 'whatsapp').reduce((sum, t) => sum + t.unread, 0),
    [state.threads]
  );
  const unreadTelegram = useMemo(
    () => state.threads.filter((t) => t.platform === 'telegram').reduce((sum, t) => sum + t.unread, 0),
    [state.threads]
  );
  const unreadMail = useMemo(() => state.emails.filter((e) => e.unread).length, [state.emails]);
  const updatesCount = useMemo(
    () => APP_REGISTRY.filter((a) => a.hasUpdate && state.installedAppIds.includes(a.id) && !state.updatedAppIds.includes(a.id)).length,
    [state.installedAppIds, state.updatedAppIds]
  );

  const getBadge = (appId: string): number => {
    if (appId === 'messages') return unreadMessagesCount;
    if (appId === 'whatsapp') return unreadWhatsApp;
    if (appId === 'telegram') return unreadTelegram;
    if (appId === 'mail') return unreadMail;
    if (appId === 'appstore') return updatesCount;
    return 0;
  };

  const startLongPress = (appId: string, inDock = false) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    longPressTriggeredRef.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setContextAppId({ appId, inDock });
    }, 460);
  };

  const cancelLongPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const renderWidget = (widgetId: string) => {
    const widgetH = isLandscape ? 'h-[110px]' : 'h-[142px]';
    if (widgetId === 'weather') {
      return (
        <button
          onClick={() => openApp('weather')}
          className={`col-span-2 ${widgetH} rounded-[26px] bg-gradient-to-br from-sky-500/80 via-blue-600/80 to-indigo-800/85 backdrop-blur-xl border border-white/25 p-3.5 text-left text-white flex flex-col justify-between shadow-lg active:scale-[0.98] transition-transform`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold">Cupertino</p>
              <p className={`${isLandscape ? 'text-2xl' : 'text-3xl'} font-light font-mono-num mt-0.5`}>72°</p>
            </div>
            <CloudSun className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <p className="text-xs font-medium">Partly Cloudy</p>
            <p className="text-[10px] text-white/80">H:76° · L:58°</p>
          </div>
        </button>
      );
    }

    if (widgetId === 'clock') {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const day = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      return (
        <button
          onClick={() => openApp('clock')}
          className={`col-span-2 ${widgetH} rounded-[26px] liquid-glass-dark p-3.5 text-left text-white flex flex-col justify-between shadow-lg active:scale-[0.98] transition-transform`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-400">Local Time</span>
            <span className="text-[11px] text-zinc-400">{day}</span>
          </div>
          <p className={`${isLandscape ? 'text-2xl' : 'text-3xl'} font-bold font-mono-num tracking-tight`}>{time}</p>
          <p className="text-[11px] text-zinc-300">Tokyo +17h · London +8h</p>
        </button>
      );
    }

    if (widgetId === 'health') {
      return (
        <button
          onClick={() => openApp('health')}
          className={`col-span-2 ${widgetH} rounded-[26px] liquid-glass-dark p-3.5 text-left text-white flex flex-col justify-between shadow-lg active:scale-[0.98] transition-transform`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-current" /> Activity
            </span>
            <span className="text-[11px] font-mono-num text-zinc-300">{state.healthSteps.toLocaleString()} steps</span>
          </div>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 44 44" className="w-10 h-10 -rotate-90">
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(244,63,94,0.2)" strokeWidth="4" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="#f43f5e" strokeWidth="4" strokeDasharray="113" strokeDashoffset="28" strokeLinecap="round" />
              <circle cx="22" cy="22" r="12" fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth="4" />
              <circle cx="22" cy="22" r="12" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray="75" strokeDashoffset="18" strokeLinecap="round" />
            </svg>
            <div className="text-[11px] space-y-0.5">
              <p className="text-rose-300 font-medium">{state.healthCalories} / 600 kcal</p>
              <p className="text-emerald-300 font-medium">24 / 30 min</p>
            </div>
          </div>
        </button>
      );
    }

    // Battery Widget
    return (
      <button
        onClick={() => openApp('battery')}
        className={`col-span-2 ${widgetH} rounded-[26px] liquid-glass-dark p-3.5 text-left text-white flex flex-col justify-between shadow-lg active:scale-[0.98] transition-transform`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <BatteryCharging className="w-4 h-4" /> Batteries
          </span>
          <span className="text-[11px] text-zinc-400">{state.isCharging ? 'MagSafe' : 'On Battery'}</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className={`${isLandscape ? 'text-2xl' : 'text-3xl'} font-bold font-mono-num`}>{state.batteryLevel}%</p>
            <p className="text-[11px] text-zinc-300">iPhone 18 Pro Max</p>
          </div>
          <div className="text-right text-[11px] text-zinc-400">
            <p>AirPods Pro 3 · 96%</p>
            <p>Watch Ultra · 84%</p>
          </div>
        </div>
      </button>
    );
  };

  const resolveAppMeta = (appId: string) => {
    const builtIn = APP_MAP[appId];
    if (builtIn) return { name: builtIn.name, category: builtIn.category, systemApp: builtIn.systemApp, customIcon: undefined };
    const play = state.installedPlayApps?.[appId];
    if (play) return { name: play.name, category: play.category, systemApp: false, customIcon: play.icon };
    return null;
  };

  const renderAppTile = (appId: string, pageIndex?: number, itemIndex?: number, inDock = false) => {
    const def = resolveAppMeta(appId);
    if (!def || !state.installedAppIds.includes(appId)) return null;
    const badge = getBadge(appId);
    const prog = installingProgress[appId];

    return (
      <div
        key={`${appId}-${inDock ? 'dock' : pageIndex}-${itemIndex}`}
        draggable={jiggleMode && !inDock}
        onDragStart={() => {
          if (pageIndex !== undefined && itemIndex !== undefined) {
            setDragSource({ page: pageIndex, index: itemIndex });
          }
        }}
        onDragOver={(e) => {
          if (jiggleMode && !inDock) e.preventDefault();
        }}
        onDrop={() => {
          if (jiggleMode && dragSource && pageIndex !== undefined && itemIndex !== undefined) {
            moveHomeApp(dragSource.page, dragSource.index, pageIndex, itemIndex);
            setDragSource(null);
          }
        }}
        onPointerDown={() => startLongPress(appId, inDock)}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextAppId({ appId, inDock });
        }}
        className={`relative flex flex-col items-center gap-1 select-none ${
          jiggleMode ? 'animate-ios-jiggle' : ''
        }`}
      >
        <button
          onClick={() => {
            if (longPressTriggeredRef.current) {
              longPressTriggeredRef.current = false;
              return;
            }
            if (jiggleMode) return;
            openApp(appId);
          }}
          className={`relative ${
            isLandscape ? 'w-[48px] h-[48px] rounded-[13px]' : 'w-[60px] h-[60px] rounded-[16px]'
          } overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.35)] active:scale-90 transition-transform`}
        >
          {renderAppIcon(appId, 'md', def.customIcon)}
          {prog !== undefined && (
            <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
              <span className="text-[11px] font-bold font-mono-num text-white">{prog}%</span>
            </div>
          )}
        </button>

        {/* Notification Badge */}
        {!jiggleMode && badge > 0 && (
          <span className="absolute -top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold font-mono-num flex items-center justify-center shadow">
            {badge}
          </span>
        )}

        {/* Delete Badge in Jiggle Mode */}
        {jiggleMode && !def.systemApp && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              uninstallApp(appId);
            }}
            className="absolute -top-1.5 left-0.5 w-5 h-5 rounded-full bg-zinc-200 text-zinc-900 shadow flex items-center justify-center hover:bg-red-500 hover:text-white"
            aria-label={`Uninstall ${def.name}`}
          >
            <Minus className="w-3 h-3" strokeWidth={3} />
          </button>
        )}

        {!inDock && (
          <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] truncate w-[68px] text-center">
            {def.name}
          </span>
        )}
      </div>
    );
  };

  const renderFolderTile = (folderId: string) => {
    const folder = state.folders[folderId];
    if (!folder) return null;
    const validApps = folder.appIds.filter((id) => state.installedAppIds.includes(id));

    return (
      <div key={folderId} className="flex flex-col items-center gap-1 select-none">
        <button
          onClick={() => setActiveFolderId(folderId)}
          className={`${
            isLandscape ? 'w-[48px] h-[48px] rounded-[13px] p-1' : 'w-[60px] h-[60px] rounded-[16px] p-1.5'
          } liquid-glass grid grid-cols-3 gap-1 shadow-lg active:scale-90 transition-transform`}
        >
          {validApps.slice(0, 9).map((id) => (
            <div key={id} className="w-full h-full rounded-[4px] overflow-hidden">
              {renderAppIcon(id, 'xs')}
            </div>
          ))}
        </button>
        <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] truncate w-[68px] text-center">
          {folder.name}
        </span>
      </div>
    );
  };

  const activeFolder = activeFolderId ? state.folders[activeFolderId] : null;
  const installedCatalog = useMemo(() => {
    const builtIn = APP_REGISTRY.filter((a) => state.installedAppIds.includes(a.id)).map((a) => ({
      id: a.id,
      name: a.name,
      customIcon: undefined as string | undefined,
    }));
    const external = Object.entries(state.installedPlayApps || {})
      .filter(([id]) => state.installedAppIds.includes(id))
      .map(([id, item]) => ({
        id,
        name: item.name,
        customIcon: item.icon,
      }));
    const all = [...builtIn, ...external];
    if (!libraryFilter.trim()) return all;
    return all.filter((a) => a.name.toLowerCase().includes(libraryFilter.toLowerCase()));
  }, [state.installedAppIds, state.installedPlayApps, libraryFilter]);

  const handleSwipeEnd = (clientX: number, clientY: number) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    setSwipeDx(0);
    if (!start || jiggleMode) return;

    const dx = clientX - start.x;
    const dy = clientY - start.y;

    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
      if (dx < 0 && currentHomePage < totalPages - 1) setCurrentHomePage(currentHomePage + 1);
      else if (dx > 0 && currentHomePage > 0) setCurrentHomePage(currentHomePage - 1);
    } else if (dy > 60 && Math.abs(dy) > Math.abs(dx)) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
      setSpotlightOpen(true);
    } else if (dy < -55 && Math.abs(dy) > Math.abs(dx) && start.fromDock) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
      setAppSwitcherOpen(true);
    }
  };

  return (
    <div
      className={`relative flex-1 flex flex-col justify-between ${
        isLandscape ? 'pt-1 pb-2.5 px-6' : 'pt-2 pb-4 px-4'
      } overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing`}
      onClickCapture={(e) => {
        if (suppressClickRef.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onPointerDown={(e) => {
        if (jiggleMode || activeFolderId || contextAppId) return;
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const fromDock = e.clientY - rect.top > rect.height - 110;
        pointerStartRef.current = { x: e.clientX, y: e.clientY, fromDock };
      }}
      onPointerMove={(e) => {
        if (!pointerStartRef.current || jiggleMode) return;
        const dx = e.clientX - pointerStartRef.current.x;
        const dy = e.clientY - pointerStartRef.current.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          cancelLongPress();
        }
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
          suppressClickRef.current = true;
          const isEdge =
            (currentHomePage === 0 && dx > 0) ||
            (currentHomePage === totalPages - 1 && dx < 0);
          setSwipeDx(isEdge ? dx * 0.25 : dx * 0.72);
        }
      }}
      onPointerUp={(e) => {
        handleSwipeEnd(e.clientX, e.clientY);
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 60);
      }}
      onPointerCancel={() => {
        pointerStartRef.current = null;
        setSwipeDx(0);
      }}
      onPointerLeave={(e) => {
        if (pointerStartRef.current) {
          handleSwipeEnd(e.clientX, e.clientY);
        }
      }}
    >
      {/* Top Jiggle Done Bar */}
      {jiggleMode && (
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-xs font-medium text-white/80">Drag icons to reorder</span>
          <button
            onClick={() => setJiggleMode(false)}
            className="px-3.5 py-1 rounded-full liquid-glass text-xs font-semibold text-white"
          >
            Done
          </button>
        </div>
      )}

      {/* Main Page Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentHomePage < state.homePages.length ? (
            <motion.div
              key={`page-${currentHomePage}`}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: swipeDx }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className={
                isLandscape
                  ? 'grid grid-cols-6 gap-x-2.5 gap-y-2 pt-0.5 content-start'
                  : 'grid grid-cols-4 gap-x-3 gap-y-4 pt-1 content-start'
              }
            >
              {state.homePages[currentHomePage].map((item: HomeItem, idx: number) => {
                if (item.kind === 'widget') {
                  return <React.Fragment key={`${item.widgetId}-${idx}`}>{renderWidget(item.widgetId)}</React.Fragment>;
                }
                if (item.kind === 'folder') {
                  return renderFolderTile(item.folderId);
                }
                return renderAppTile(item.appId, currentHomePage, idx, false);
              })}
            </motion.div>
          ) : (
            /* Final Page: App Library */
            <motion.div
              key="app-library"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: swipeDx }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="h-full flex flex-col gap-3 pt-1 overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center gap-2 liquid-glass-dark rounded-2xl px-3 py-2">
                <Search className="w-4 h-4 text-zinc-400" />
                <input
                  value={libraryFilter}
                  onChange={(e) => setLibraryFilter(e.target.value)}
                  placeholder="App Library"
                  className="flex-1 bg-transparent text-xs text-white placeholder-zinc-400 outline-none"
                />
                {libraryFilter && (
                  <button onClick={() => setLibraryFilter('')} className="text-zinc-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3 pb-4">
                {installedCatalog.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => openApp(app.id)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-14 h-14 rounded-[15px] overflow-hidden shadow-md active:scale-90 transition-transform">
                      {renderAppIcon(app.id, 'md', app.customIcon)}
                    </div>
                    <span className="text-[10px] text-white/90 truncate w-full text-center">{app.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Page Indicator Dots + Search Pill + Siri Quick Trigger */}
      <div className={isLandscape ? 'flex items-center justify-between gap-4 pt-1' : 'space-y-2.5 pt-1'}>
        <div className={isLandscape ? 'flex items-center gap-3' : 'space-y-2.5'}>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentHomePage(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentHomePage === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={idx === totalPages - 1 ? 'App Library' : `Page ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setSpotlightOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-full liquid-glass text-[11px] font-medium text-white/95 hover:bg-white/25 transition-colors"
            >
              <Search className="w-3 h-3" />
              Search
            </button>
            <button
              onClick={() => setSiriOpen(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full liquid-glass text-[11px] font-medium text-sky-200 hover:bg-white/25 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Siri
            </button>
          </div>
        </div>

        {/* Liquid Glass Dock */}
        <div
          className={`liquid-glass grid grid-cols-4 items-center ${
            isLandscape ? 'rounded-[22px] px-3 py-1.5 gap-3' : 'rounded-[28px] px-3.5 py-2.5 gap-3'
          }`}
        >
          {state.dockAppIds.map((appId, idx) => renderAppTile(appId, -1, idx, true))}
        </div>
      </div>

      {/* Folder Modal */}
      <AnimatePresence>
        {activeFolder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            onClick={() => setActiveFolderId(null)}
            className="absolute inset-0 z-40 bg-black/55 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <input
              value={activeFolder.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => renameFolder(activeFolder.id, e.target.value)}
              className="mb-4 bg-transparent text-center text-2xl font-bold text-white outline-none border-b border-transparent focus:border-white/40 pb-1"
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[300px] liquid-glass-dark rounded-[34px] p-5 grid grid-cols-3 gap-4"
            >
              {activeFolder.appIds
                .filter((id) => state.installedAppIds.includes(id))
                .map((id) => (
                  <button
                    key={id}
                    onClick={() => openApp(id)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-14 h-14 rounded-[16px] overflow-hidden shadow-md active:scale-90 transition-transform">
                      {renderAppIcon(id, 'md')}
                    </div>
                    <span className="text-[11px] text-white/90 truncate w-full text-center">
                      {APP_MAP[id]?.name}
                    </span>
                  </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Long-Press App Context Menu */}
      <AnimatePresence>
        {contextAppId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setContextAppId(null)}
            className="absolute inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-64 liquid-glass-dark rounded-3xl p-2 text-white shadow-2xl space-y-1"
            >
              <div className="flex items-center gap-3 p-2.5 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                  {renderAppIcon(contextAppId.appId, 'sm', resolveAppMeta(contextAppId.appId)?.customIcon)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{resolveAppMeta(contextAppId.appId)?.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{resolveAppMeta(contextAppId.appId)?.category}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const target = contextAppId.appId;
                  setContextAppId(null);
                  openApp(target);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-white/10"
              >
                Open App
              </button>

              <button
                onClick={() => {
                  setContextAppId(null);
                  setJiggleMode(true);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-white/10"
              >
                Edit Home Screen
              </button>

              {!contextAppId.inDock && state.dockAppIds.length < 4 && (
                <button
                  onClick={() => {
                    moveAppToDock(contextAppId.appId);
                    setContextAppId(null);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-white/10"
                >
                  Move to Dock
                </button>
              )}

              {contextAppId.inDock && (
                <button
                  onClick={() => {
                    removeAppFromDock(contextAppId.appId);
                    setContextAppId(null);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-white/10"
                >
                  Remove from Dock
                </button>
              )}

              {!APP_MAP[contextAppId.appId]?.systemApp && (
                <button
                  onClick={() => {
                    uninstallApp(contextAppId.appId);
                    setContextAppId(null);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/15 flex items-center justify-between"
                >
                  <span>Delete App</span>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
