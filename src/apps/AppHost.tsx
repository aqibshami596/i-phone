import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Globe, Layers, RefreshCw, ShieldCheck } from 'lucide-react';
import { useOS } from '../os/OSContext';
import { AppStoreApp } from './AppStoreApp';
import { YouTubeApp } from './YouTubeApp';
import { CameraApp } from './CameraApp';
import { PhotosApp } from './PhotosApp';
import { SafariApp } from './SafariApp';
import { GoogleApp } from './GoogleApp';
import { SettingsApp } from './SettingsApp';
import { ContactsApp, FaceTimeApp, MailApp, MessagingApp, PhoneApp } from './CommunicationApps';
import { WhatsAppApp } from './WhatsAppApp';
import { MusicPlayerApp, NetflixApp, PhotoEditorApp, SocialApp, VideoEditorApp } from './MediaEntertainmentApps';
import { GamesApp } from './GamesApp';
import {
  CalculatorApp,
  CalendarApp,
  ClockApp,
  FilesApp,
  FindMyApp,
  HealthApp,
  MapsApp,
  NotesApp,
  RemindersApp,
  ShortcutsApp,
  TipsApp,
  TranslateApp,
  VoiceMemosApp,
  WalletApp,
  WeatherApp,
} from './AppleCoreApps';
import {
  BatteryApp,
  CompassApp,
  ConverterApp,
  FlashlightApp,
  FlowFocusApp,
  HabitStreakApp,
  MetronomeApp,
  PasswordsApp,
  QRScannerApp,
  ScreenRecorderApp,
  SketchPadApp,
  StorageApp,
} from './UtilityApps';
import { PlayStoreApp } from './PlayStoreApp';
import {
  AmazonApp,
  ChromeApp,
  DiscordApp,
  DuolingoApp,
  GmailApp,
  GoogleDriveApp,
  InstagramApp,
  NotionApp,
  PinterestApp,
  RedditApp,
  SnapchatApp,
  TikTokApp,
  TwitterXApp,
  UberApp,
} from './RealWorldApps';

export const AppHost: React.FC<{ appId: string }> = ({ appId }) => {
  const { state, isLandscape, closeApp, openApp, uninstallApp, recentAppIds, setAppSwitcherOpen } = useOS();
  const gestureStart = React.useRef<{ x: number; y: number } | null>(null);
  const [dragY, setDragY] = React.useState(0);
  const [pwaReloadTick, setPwaReloadTick] = useState(0);
  const [pwaReaderMode, setPwaReaderMode] = useState(false);
  const [readerData, setReaderData] = useState<{ title: string; excerpt: string; loading: boolean } | null>(null);

  useEffect(() => {
    setPwaReaderMode(false);
    setReaderData(null);
  }, [appId]);

  const loadReaderView = async (url: string) => {
    setPwaReaderMode(true);
    setReaderData({ title: 'Loading inside iPhone...', excerpt: '', loading: true });
    try {
      const res = await fetch(`/api/safari/fetch?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      setReaderData({
        title: data?.title || url,
        excerpt: data?.excerpt || data?.description || 'Loaded inside iPhone Simulator.',
        loading: false,
      });
    } catch {
      setReaderData({
        title: url,
        excerpt: 'Unable to fetch reader text in offline sandbox.',
        loading: false,
      });
    }
  };

  const handleBarPointerUp = (clientX: number, clientY: number) => {
    const start = gestureStart.current;
    gestureStart.current = null;
    setDragY(0);
    if (!start) return;
    const dx = clientX - start.x;
    const dy = clientY - start.y;

    // Swipe up anywhere on bottom home indicator bar -> go to Home Screen (or slow pull -> App Switcher)
    if (dy < -30 && Math.abs(dy) >= Math.abs(dx) * 0.7) {
      closeApp();
      return;
    }
    // Swipe left/right along bottom bar -> switch between recent apps
    if (Math.abs(dx) > 48 && recentAppIds.length > 1) {
      const idx = recentAppIds.indexOf(appId);
      const nextIdx = dx < 0 ? (idx + 1) % recentAppIds.length : (idx - 1 + recentAppIds.length) % recentAppIds.length;
      if (recentAppIds[nextIdx] && recentAppIds[nextIdx] !== appId) {
        openApp(recentAppIds[nextIdx]);
      }
      return;
    }
    // Tap fallback still returns home
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      closeApp();
    }
  };

  const dragProgress = Math.min(1, Math.max(0, -dragY / 140));

  const renderApp = () => {
    if (appId.startsWith('play:')) {
      const playApp = state.installedPlayApps?.[appId];
      if (playApp) {
        if (playApp.installType === 'pwa-web' && playApp.webAppUrl) {
          return (
            <div className="h-full flex flex-col bg-zinc-950 text-white">
              <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={playApp.icon}
                    alt={playApp.name}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-lg object-cover shrink-0 bg-zinc-800"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate leading-tight">{playApp.name}</p>
                    <p className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" /> Installed on iPhone · Free Web App
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (pwaReaderMode) {
                        setPwaReaderMode(false);
                      } else {
                        loadReaderView(playApp.webAppUrl!);
                      }
                    }}
                    className={`p-1.5 rounded-lg ${
                      pwaReaderMode ? 'bg-sky-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                    title="In-Phone Reader View"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setPwaReaderMode(false);
                      setPwaReloadTick((t) => t + 1);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    title="Reload Inside iPhone"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => uninstallApp(appId)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-[10px] font-bold"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="flex-1 relative bg-white overflow-hidden">
                {pwaReaderMode ? (
                  <div className="h-full bg-zinc-950 text-zinc-100 p-4 overflow-y-auto no-scrollbar space-y-3">
                    <div className="text-[10px] uppercase tracking-wider text-sky-400 font-bold">
                      In-Phone Reader Mode
                    </div>
                    <h2 className="text-base font-bold">{readerData?.title}</h2>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                      {readerData?.loading ? 'Loading content inside iPhone...' : readerData?.excerpt}
                    </p>
                  </div>
                ) : (
                  <iframe
                    key={`${appId}-${pwaReloadTick}`}
                    src={playApp.webAppUrl}
                    title={playApp.name}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="h-full flex flex-col bg-zinc-950 text-white overflow-y-auto no-scrollbar p-5 space-y-5">
            <div className="flex items-center gap-4 pt-2">
              <img
                src={playApp.icon}
                alt={playApp.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover shadow-xl border border-white/15 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  <ShieldCheck className="w-3 h-3" />
                  Installed on iPhone · Play Store Preview
                </span>
                <h1 className="text-lg font-bold leading-snug">{playApp.name}</h1>
                <p className="text-xs text-zinc-400">{playApp.developer}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 text-[11px] text-amber-200 leading-relaxed">
              Installed inside your iPhone Home Screen as a Simulated Play Store Preview. No unauthorized APK was downloaded and nothing installs to Windows.
            </div>

            <div className="grid grid-cols-4 gap-2 py-3 border-y border-zinc-800 text-center text-xs">
              <div>
                <p className="font-bold font-mono-num">{playApp.rating} ★</p>
                <p className="text-[10px] text-zinc-400">Play Rating</p>
              </div>
              <div>
                <p className="font-bold font-mono-num">{playApp.downloads}</p>
                <p className="text-[10px] text-zinc-400">Downloads</p>
              </div>
              <div>
                <p className="font-bold font-mono-num">v{playApp.version || 'Latest'}</p>
                <p className="text-[10px] text-zinc-400">Version</p>
              </div>
              <div>
                <p className="font-bold text-emerald-400">Free</p>
                <p className="text-[10px] text-zinc-400 truncate">{playApp.category}</p>
              </div>
            </div>

            {playApp.screenshots && playApp.screenshots.length > 0 && (
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
                {playApp.screenshots.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`${playApp.name} preview ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="h-44 w-auto rounded-2xl object-cover border border-white/10 shrink-0"
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
              {playApp.description || `${playApp.name} by ${playApp.developer} (${playApp.packageId})`}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => openApp('google', playApp.name)}
                className="flex-1 py-2.5 rounded-full bg-blue-600 text-white text-center text-xs font-bold"
              >
                Open Web App via Google
              </button>
              <button
                onClick={() => openApp('playstore')}
                className="px-3.5 py-2.5 rounded-full bg-[#01875f] text-white text-center text-xs font-bold"
              >
                Play Store
              </button>
              <button
                onClick={() => uninstallApp(appId)}
                className="px-3.5 py-2.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold"
              >
                Uninstall
              </button>
            </div>
          </div>
        );
      }
    }
    switch (appId) {
      case 'phone': return <PhoneApp />;
      case 'contacts': return <ContactsApp />;
      case 'messages': return <MessagingApp platform="imessage" />;
      case 'whatsapp': return <WhatsAppApp />;
      case 'telegram': return <MessagingApp platform="telegram" />;
      case 'facetime': return <FaceTimeApp />;
      case 'mail': return <MailApp />;
      case 'safari': return <SafariApp />;
      case 'google': return <GoogleApp />;
      case 'camera': return <CameraApp />;
      case 'photos': return <PhotosApp />;
      case 'appstore': return <AppStoreApp />;
      case 'settings': return <SettingsApp />;
      case 'music': return <MusicPlayerApp variant="apple" />;
      case 'spotify': return <MusicPlayerApp variant="spotify" />;
      case 'youtube': return <YouTubeApp />;
      case 'netflix': return <NetflixApp />;
      case 'social': return <SocialApp />;
      case 'photoeditor': return <PhotoEditorApp />;
      case 'videoeditor': return <VideoEditorApp />;
      case 'games': return <GamesApp />;
      case 'maps': return <MapsApp />;
      case 'weather': return <WeatherApp />;
      case 'calendar': return <CalendarApp />;
      case 'clock':
      case 'stopwatch':
      case 'timer':
        return <ClockApp />;
      case 'calculator': return <CalculatorApp />;
      case 'notes': return <NotesApp />;
      case 'reminders': return <RemindersApp />;
      case 'files': return <FilesApp />;
      case 'voicememos': return <VoiceMemosApp />;
      case 'shortcuts': return <ShortcutsApp />;
      case 'wallet': return <WalletApp />;
      case 'health': return <HealthApp />;
      case 'translate': return <TranslateApp />;
      case 'findmy': return <FindMyApp />;
      case 'tips': return <TipsApp />;
      case 'flashlight': return <FlashlightApp />;
      case 'screenrecorder': return <ScreenRecorderApp />;
      case 'qrscanner': return <QRScannerApp />;
      case 'compass': return <CompassApp />;
      case 'converter': return <ConverterApp />;
      case 'passwords': return <PasswordsApp />;
      case 'battery': return <BatteryApp />;
      case 'storage': return <StorageApp />;
      case 'sketchpad': return <SketchPadApp />;
      case 'pomodoro': return <FlowFocusApp />;
      case 'habits': return <HabitStreakApp />;
      case 'metronome': return <MetronomeApp />;
      case 'playstore': return <PlayStoreApp />;
      case 'instagram': return <InstagramApp />;
      case 'tiktok': return <TikTokApp />;
      case 'twitterx': return <TwitterXApp />;
      case 'discord': return <DiscordApp />;
      case 'reddit': return <RedditApp />;
      case 'chrome': return <ChromeApp />;
      case 'gmail': return <GmailApp />;
      case 'googledrive': return <GoogleDriveApp />;
      case 'uber': return <UberApp />;
      case 'amazon': return <AmazonApp />;
      case 'notion': return <NotionApp />;
      case 'pinterest': return <PinterestApp />;
      case 'duolingo': return <DuolingoApp />;
      case 'snapchat': return <SnapchatApp />;
      default:
        return <TipsApp />;
    }
  };

  return (
    <motion.div
      key={appId}
      initial={{ opacity: 0, scale: 0.92, y: 24 }}
      animate={{
        opacity: 1,
        scale: 1 - dragProgress * 0.14,
        y: Math.min(0, dragY * 0.45),
        borderRadius: dragProgress > 0 ? `${Math.round(dragProgress * 36)}px` : '0px',
      }}
      exit={{ opacity: 0, scale: 0.88, y: 30 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={`absolute inset-0 z-20 flex flex-col bg-zinc-950 overflow-hidden ${
        isLandscape ? 'pt-9' : 'pt-11'
      }`}
    >
      <div className="flex-1 overflow-hidden relative">{renderApp()}</div>

      {/* Bottom Home Indicator Swipe Zone */}
      <div
        onPointerDown={(e) => {
          gestureStart.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!gestureStart.current) return;
          const dy = e.clientY - gestureStart.current.y;
          if (dy < 0) setDragY(dy);
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          handleBarPointerUp(e.clientX, e.clientY);
        }}
        onPointerCancel={() => {
          gestureStart.current = null;
          setDragY(0);
        }}
        className="h-7 bg-black/85 backdrop-blur flex items-center justify-center relative shrink-0 px-4 select-none touch-none cursor-grab active:cursor-grabbing"
        title="Swipe up to go Home · Swipe left/right to switch apps"
      >
        <div className="w-28 h-1.5 rounded-full bg-white/85 pointer-events-none" />
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setAppSwitcherOpen(true)}
          className="absolute right-3 p-1 text-zinc-400 hover:text-white"
          title="App Switcher"
          aria-label="Open App Switcher"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
