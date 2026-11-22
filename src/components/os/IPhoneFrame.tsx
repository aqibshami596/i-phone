import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { WALLPAPERS } from '../../os/seedData';
import { TitaniumFinish } from '../../os/types';
import { StatusBar } from './StatusBar';
import { LockScreen } from './LockScreen';
import { HomeScreen } from './HomeScreen';
import { ControlCenter } from './ControlCenter';
import { NotificationCenter } from './NotificationCenter';
import { SpotlightSearch } from './SpotlightSearch';
import { AppSwitcher } from './AppSwitcher';
import { SiriOverlay } from './SiriOverlay';
import { CallOverlay } from './CallOverlay';
import { AppHost } from '../../apps/AppHost';

const FINISH_STYLES: Record<TitaniumFinish, { outer: string; inner: string; button: string; label: string }> = {
  obsidian: {
    outer: 'from-zinc-700 via-zinc-900 to-zinc-800 border-zinc-600/60',
    inner: 'bg-black',
    button: 'bg-zinc-700 hover:bg-zinc-600',
    label: 'Obsidian Black',
  },
  silver: {
    outer: 'from-zinc-200 via-slate-300 to-zinc-400 border-white/70',
    inner: 'bg-zinc-950',
    button: 'bg-zinc-300 hover:bg-zinc-200',
    label: 'Natural Silver',
  },
  glacier: {
    outer: 'from-sky-100 via-slate-300 to-cyan-200 border-white/80',
    inner: 'bg-zinc-950',
    button: 'bg-sky-200 hover:bg-sky-100',
    label: 'Glacier Titanium',
  },
  burgundy: {
    outer: 'from-rose-950 via-stone-800 to-rose-900 border-rose-400/35',
    inner: 'bg-black',
    button: 'bg-rose-900 hover:bg-rose-800',
    label: 'Burgundy Titanium',
  },
};

export const IPhoneFrame: React.FC = () => {
  const {
    state,
    isLocked,
    isAlwaysOn,
    lockDevice,
    unlockDevice,
    toggleAlwaysOn,
    isLandscape,
    adjustVolume,
    volumeHudVisible,
    flashlightOn,
    flashlightLevel,
    activeAppId,
    controlCenterOpen,
    setControlCenterOpen,
    notificationCenterOpen,
    setNotificationCenterOpen,
    spotlightOpen,
    appSwitcherOpen,
    siriOpen,
    setSiriOpen,
    openApp,
    toggleFlashlight,
    toggleSilentMode,
    micHardwareActive,
    toggleMicrophoneHardware,
  } = useOS();

  const topPullRef = React.useRef<{ x: number; y: number; side: 'left' | 'right' } | null>(null);

  const finish = FINISH_STYLES[state.settings.finish] || FINISH_STYLES.obsidian;

  const wp = WALLPAPERS.find((w) => w.id === state.settings.wallpaper);
  const wallpaperSrc =
    state.settings.wallpaper === 'custom' && state.settings.customWallpaperSrc
      ? state.settings.customWallpaperSrc
      : wp?.src || WALLPAPERS[0].src;

  const handleActionButton = () => {
    const act = state.settings.actionButtonAction;
    if (act === 'camera') {
      if (isLocked) unlockDevice();
      openApp('camera');
    } else if (act === 'flashlight') {
      toggleFlashlight();
    } else if (act === 'siri') {
      if (isLocked) unlockDevice();
      setSiriOpen(true);
    } else if (act === 'voicememo') {
      if (isLocked) unlockDevice();
      openApp('voicememos');
    } else {
      toggleSilentMode();
    }
  };

  const handlePowerButton = () => {
    if (isLocked) {
      toggleAlwaysOn();
    } else {
      lockDevice();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Flashlight Ambient Glow Behind Chassis */}
      {flashlightOn && (
        <div
          className="pointer-events-none absolute -inset-12 rounded-full blur-3xl transition-opacity"
          style={{
            background: 'radial-gradient(circle, rgba(253,230,138,0.45) 0%, transparent 70%)',
            opacity: flashlightLevel * 0.25,
          }}
        />
      )}

      {/* Hardware Body — Original iPhone Pro Max 440×956 pt (163.0 × 77.6 mm) proportions */}
      <div
        className={`relative p-[10px] rounded-[56px] bg-gradient-to-br ${finish.outer} border shadow-[0_30px_90px_rgba(0,0,0,0.75)] transition-all duration-300`}
        style={{
          width: isLandscape
            ? 'min(956px, 95vw, calc(88dvh * 956 / 440))'
            : 'min(440px, 94vw, calc(94dvh * 440 / 956))',
          aspectRatio: isLandscape ? '956 / 440' : '440 / 956',
        }}
      >
        {!isLandscape ? (
          <>
            {/* Left Physical Buttons (Action, Vol Up, Vol Down) */}
            <button
              onClick={handleActionButton}
              title={`Silent / Action Button (${state.settings.actionButtonAction === 'silent' ? (state.settings.silentMode ? 'Silent ON' : 'Ring') : state.settings.actionButtonAction})`}
              aria-label="Silent / Action Button"
              className={`absolute -left-[6px] top-[128px] w-[6px] h-[34px] rounded-l-md transition-colors cursor-pointer ${
                state.settings.silentMode ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.65)]' : finish.button
              }`}
            />
            <button
              onClick={() => adjustVolume(10)}
              title="Volume Up"
              className={`absolute -left-[5px] top-[182px] w-[4px] h-[54px] rounded-l-sm ${finish.button} transition-colors`}
            />
            <button
              onClick={() => adjustVolume(-10)}
              title="Volume Down"
              className={`absolute -left-[5px] top-[248px] w-[4px] h-[54px] rounded-l-sm ${finish.button} transition-colors`}
            />

            {/* Right Physical Buttons (Power + Camera Control) */}
            <button
              onClick={handlePowerButton}
              title="Power / Lock / Always-On"
              className={`absolute -right-[5px] top-[198px] w-[4px] h-[78px] rounded-r-sm ${finish.button} transition-colors`}
            />
            <button
              onClick={() => {
                if (isLocked) unlockDevice();
                openApp('camera');
              }}
              title="Camera Control Button"
              className={`absolute -right-[5px] top-[470px] w-[4px] h-[56px] rounded-r-sm ${finish.button} transition-colors`}
            />

            {/* Top Bezel Earpiece Acoustic Mesh & Studio Mic */}
            <div
              className="pointer-events-none absolute top-[5px] left-1/2 -translate-x-1/2 w-[56px] h-[3px] rounded-full bg-zinc-900/90 border border-white/10 shadow-inner"
              aria-hidden="true"
            />

            {/* Bottom Chassis: Precision Studio Microphone Array + USB-C Port + Speaker Ports */}
            <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              <div className="flex items-center gap-[3px]" title="Left Studio Microphone Grille">
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
              </div>

              <div
                className="w-[34px] h-[5px] rounded-full bg-zinc-950 border border-white/15 shadow-inner"
                title="USB-C Connector"
              />

              <button
                onClick={toggleMicrophoneHardware}
                title={
                  state.settings.microphoneEnabled === false
                    ? 'Hardware Microphone MUTED — Click to enable Studio Mic Array'
                    : micHardwareActive
                    ? 'Studio Microphone Array ACTIVE — Click to mute hardware mic'
                    : 'Studio Microphone Array READY — Click to mute hardware mic'
                }
                aria-label="Toggle Hardware Microphone"
                className={`px-2 py-0.5 rounded-full border text-[9px] font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer ${
                  state.settings.microphoneEnabled === false
                    ? 'bg-rose-600 border-rose-400 text-white'
                    : micHardwareActive
                    ? 'bg-amber-500 border-amber-300 text-zinc-950 animate-pulse'
                    : 'bg-zinc-900/95 border-white/20 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {state.settings.microphoneEnabled === false ? (
                  <MicOff className="w-2.5 h-2.5" />
                ) : (
                  <Mic className="w-2.5 h-2.5 text-emerald-400" />
                )}
                <span>{state.settings.microphoneEnabled === false ? 'MIC OFF' : 'MIC'}</span>
              </button>

              <div className="flex items-center gap-[3px]" title="Right Studio Microphone & Speaker Grille">
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Landscape Top Edge Buttons (Action, Vol+, Vol-) */}
            <button
              onClick={handleActionButton}
              title={`Silent / Action Button (${state.settings.actionButtonAction === 'silent' ? (state.settings.silentMode ? 'Silent ON' : 'Ring') : state.settings.actionButtonAction})`}
              aria-label="Silent / Action Button"
              className={`absolute -top-[6px] left-[128px] h-[6px] w-[34px] rounded-t-md transition-colors cursor-pointer ${
                state.settings.silentMode ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.65)]' : finish.button
              }`}
            />
            <button
              onClick={() => adjustVolume(10)}
              title="Volume Up"
              className={`absolute -top-[5px] left-[182px] h-[4px] w-[54px] rounded-t-sm ${finish.button} transition-colors`}
            />
            <button
              onClick={() => adjustVolume(-10)}
              title="Volume Down"
              className={`absolute -top-[5px] left-[248px] h-[4px] w-[54px] rounded-t-sm ${finish.button} transition-colors`}
            />

            {/* Landscape Bottom Edge Buttons (Power + Camera Control) */}
            <button
              onClick={handlePowerButton}
              title="Power / Lock / Always-On"
              className={`absolute -bottom-[5px] left-[198px] h-[4px] w-[78px] rounded-b-sm ${finish.button} transition-colors`}
            />
            <button
              onClick={() => {
                if (isLocked) unlockDevice();
                openApp('camera');
              }}
              title="Camera Control Button"
              className={`absolute -bottom-[5px] left-[470px] h-[4px] w-[56px] rounded-b-sm ${finish.button} transition-colors`}
            />

            {/* Landscape Left Earpiece Mesh */}
            <div
              className="pointer-events-none absolute left-[5px] top-1/2 -translate-y-1/2 h-[56px] w-[3px] rounded-full bg-zinc-900/90 border border-white/10 shadow-inner"
              aria-hidden="true"
            />

            {/* Landscape Right Edge: Studio Microphone Array + USB-C + MIC toggle */}
            <div className="absolute -right-[7px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-20">
              <div className="flex flex-col items-center gap-[3px]" title="Studio Microphone Grille">
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
              </div>

              <div
                className="h-[34px] w-[5px] rounded-full bg-zinc-950 border border-white/15 shadow-inner"
                title="USB-C Connector"
              />

              <button
                onClick={toggleMicrophoneHardware}
                title={
                  state.settings.microphoneEnabled === false
                    ? 'Hardware Microphone MUTED — Click to enable Studio Mic Array'
                    : micHardwareActive
                    ? 'Studio Microphone Array ACTIVE — Click to mute hardware mic'
                    : 'Studio Microphone Array READY — Click to mute hardware mic'
                }
                aria-label="Toggle Hardware Microphone"
                className={`p-1.5 rounded-full border shadow-md transition-all cursor-pointer ${
                  state.settings.microphoneEnabled === false
                    ? 'bg-rose-600 border-rose-400 text-white'
                    : micHardwareActive
                    ? 'bg-amber-500 border-amber-300 text-zinc-950 animate-pulse'
                    : 'bg-zinc-900/95 border-white/20 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {state.settings.microphoneEnabled === false ? (
                  <MicOff className="w-3 h-3" />
                ) : (
                  <Mic className="w-3 h-3 text-emerald-400" />
                )}
              </button>

              <div className="flex flex-col items-center gap-[3px]" title="Right Studio Microphone & Speaker Grille">
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-950 ring-1 ring-white/15" />
              </div>
            </div>
          </>
        )}

        {/* Inner Bezel + 6.9" Super Retina XDR Display */}
        <div
          className={`relative w-full h-full rounded-[47px] ${finish.inner} p-[4px] overflow-hidden`}
        >
          <div
            onPointerDownCapture={(e) => {
              if (controlCenterOpen || notificationCenterOpen || spotlightOpen || appSwitcherOpen || isAlwaysOn) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const relY = e.clientY - rect.top;
              if (relY <= 68) {
                const relX = e.clientX - rect.left;
                topPullRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  side: relX > rect.width * 0.52 ? 'right' : 'left',
                };
              } else {
                topPullRef.current = null;
              }
            }}
            onPointerUpCapture={(e) => {
              const start = topPullRef.current;
              topPullRef.current = null;
              if (!start) return;
              const dy = e.clientY - start.y;
              const dx = e.clientX - start.x;
              if (dy > 32 && dy > Math.abs(dx) * 1.1) {
                if (start.side === 'right') {
                  setControlCenterOpen(true);
                } else if (!isLocked) {
                  setNotificationCenterOpen(true);
                }
              }
            }}
            className="relative w-full h-full rounded-[44px] overflow-hidden bg-black flex flex-col"
            style={{
              filter: `brightness(${isAlwaysOn ? 0.65 : Math.max(0.24, state.settings.brightness / 100)})`,
            }}
          >
            {/* Wallpaper Layer */}
            <img
              src={wallpaperSrc}
              alt="iPhone Wallpaper"
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            />
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />

            {/* Status Bar + Dynamic Island */}
            <StatusBar lightText={true} />

            {/* Volume HUD */}
            <AnimatePresence>
              {volumeHudVisible && (
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="absolute left-3 top-40 z-50 w-9 h-36 rounded-full liquid-glass-dark p-1.5 flex flex-col items-center justify-end gap-1.5"
                >
                  <div className="w-full flex-1 bg-white/15 rounded-full overflow-hidden flex items-end">
                    <div
                      className="w-full bg-white rounded-full transition-all"
                      style={{ height: `${state.settings.volume}%` }}
                    />
                  </div>
                  <Volume2 className="w-3.5 h-3.5 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* OS Screen Layers */}
            {isLocked ? (
              <LockScreen />
            ) : (
              <>
                <HomeScreen />
                <AnimatePresence>{activeAppId && <AppHost appId={activeAppId} />}</AnimatePresence>
              </>
            )}

            {/* Global System Overlays */}
            <AnimatePresence>{controlCenterOpen && <ControlCenter />}</AnimatePresence>
            <AnimatePresence>{notificationCenterOpen && <NotificationCenter />}</AnimatePresence>
            <AnimatePresence>{spotlightOpen && <SpotlightSearch />}</AnimatePresence>
            <AnimatePresence>{appSwitcherOpen && <AppSwitcher />}</AnimatePresence>
            <AnimatePresence>{siriOpen && <SiriOverlay />}</AnimatePresence>
            <AnimatePresence><CallOverlay /></AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
