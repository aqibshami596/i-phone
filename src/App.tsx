import React from 'react';
import {
  BatteryCharging,
  Bell,
  BellOff,
  Layers,
  Lock,
  Mic,
  MicOff,
  Moon,
  Power,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Unlock,
} from 'lucide-react';
import { OSProvider, useOS } from './os/OSContext';
import { TitaniumFinish } from './os/types';
import { IPhoneFrame } from './components/os/IPhoneFrame';

const StudioWorkspace: React.FC = () => {
  const {
    state,
    updateSettings,
    isLocked,
    lockDevice,
    unlockDevice,
    toggleAlwaysOn,
    toggleCharging,
    isLandscape,
    rotateDevice,
    setControlCenterOpen,
    setAppSwitcherOpen,
    setSiriOpen,
    openApp,
    toggleSilentMode,
    toggleMicrophoneHardware,
    micHardwareActive,
  } = useOS();

  const finishes: Array<{ id: TitaniumFinish; label: string; dot: string }> = [
    { id: 'obsidian', label: 'Obsidian', dot: 'bg-zinc-900 border-zinc-600' },
    { id: 'silver', label: 'Silver', dot: 'bg-zinc-200 border-zinc-400' },
    { id: 'glacier', label: 'Glacier', dot: 'bg-sky-200 border-cyan-300' },
    { id: 'burgundy', label: 'Burgundy', dot: 'bg-rose-900 border-rose-400' },
  ];

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,#181c2b_0%,#09090b_65%)] text-zinc-100 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 px-4 py-4 overflow-x-hidden">
      {/* Left Studio Controls Rail (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight text-white">iPhone 18 Pro Max</h1>
          <p className="text-[11px] font-medium text-sky-400">
            6.9&quot; Super Retina XDR · 440 × 956 pt (163.0 × 77.6 mm)
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Interactive Liquid Glass OS simulator with App Store, Google Play Store, Camera, YouTube, Safari, and Siri.
          </p>
        </div>

        {/* Titanium Finish Picker */}
        <div className="rounded-2xl bg-zinc-900/70 border border-white/10 p-4 space-y-2.5">
          <p className="text-xs font-semibold text-zinc-300">Titanium Finish</p>
          <div className="grid grid-cols-2 gap-2">
            {finishes.map((f) => (
              <button
                key={f.id}
                onClick={() => updateSettings({ finish: f.id })}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  state.settings.finish === f.id
                    ? 'border-blue-500 bg-blue-500/15 text-white'
                    : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border ${f.dot}`} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hardware & OS Quick Actions */}
        <div className="rounded-2xl bg-zinc-900/70 border border-white/10 p-4 space-y-2.5">
          <p className="text-xs font-semibold text-zinc-300">Hardware &amp; Gestures</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => (isLocked ? unlockDevice() : lockDevice())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              {isLocked ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              {isLocked ? 'Unlock' : 'Lock'}
            </button>

            <button
              onClick={toggleAlwaysOn}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <Power className="w-3.5 h-3.5 text-sky-400" />
              Always-On
            </button>

            <button
              onClick={toggleCharging}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${
                state.isCharging ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              {state.isCharging ? 'Charging' : 'MagSafe'}
            </button>

            <button
              onClick={() => rotateDevice()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors ${
                isLandscape
                  ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200'
                  : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
              title="Rotate iPhone between Portrait and Landscape"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
              {isLandscape ? 'Portrait' : 'Rotate'}
            </button>

            <button
              onClick={() => {
                if (isLocked) unlockDevice();
                setControlCenterOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              Controls
            </button>

            <button
              onClick={() => {
                if (isLocked) unlockDevice();
                setAppSwitcherOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Multitask
            </button>

            <button
              onClick={() => {
                if (isLocked) unlockDevice();
                setSiriOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Ask Siri
            </button>

            <button
              onClick={() => updateSettings({ darkMode: !state.settings.darkMode })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              {state.settings.darkMode ? <Moon className="w-3.5 h-3.5 text-indigo-300" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
              {state.settings.darkMode ? 'Dark UI' : 'Light UI'}
            </button>

            <button
              onClick={toggleSilentMode}
              className={`col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border transition-colors ${
                state.settings.silentMode
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200'
              }`}
            >
              {state.settings.silentMode ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5 text-emerald-400" />}
              {state.settings.silentMode ? 'Silent Mode: ON' : 'Silent Switch (Ring)'}
            </button>

            <button
              onClick={toggleMicrophoneHardware}
              className={`col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border transition-colors ${
                state.settings.microphoneEnabled === false
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : micHardwareActive
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200'
              }`}
            >
              {state.settings.microphoneEnabled === false ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {state.settings.microphoneEnabled === false
                ? 'Microphone Hardware: OFF'
                : micHardwareActive
                ? 'Microphone Hardware: ACTIVE'
                : 'Microphone Hardware: READY'}
            </button>
          </div>
        </div>

        {/* Instant Jump Shortcuts */}
        <div className="rounded-2xl bg-zinc-900/70 border border-white/10 p-4 space-y-2">
          <p className="text-xs font-semibold text-zinc-300">Quick Launch</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ['appstore', 'App Store'],
              ['playstore', 'Play Store'],
              ['google', 'Google'],
              ['youtube', 'YouTube'],
              ['camera', 'Camera'],
              ['safari', 'Safari'],
              ['games', 'Games'],
              ['settings', 'Settings'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  if (isLocked) unlockDevice();
                  openApp(id);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-[11px] font-medium text-zinc-200 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Center Hero: iPhone 18 Pro Max */}
      <main className="flex flex-col items-center justify-center">
        <IPhoneFrame />
        {/* Mobile quick controls bar (shown below phone on smaller screens) */}
        <div className="flex lg:hidden items-center justify-center gap-2 mt-3 flex-wrap">
          <button
            onClick={() => (isLocked ? unlockDevice() : lockDevice())}
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs font-medium"
          >
            {isLocked ? 'Unlock' : 'Lock'}
          </button>
          <button
            onClick={() => rotateDevice()}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 ${
              isLandscape
                ? 'bg-indigo-600/80 border-indigo-400/40 text-white'
                : 'bg-zinc-900 border-white/10 text-zinc-100'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-300" />
            {isLandscape ? 'Portrait' : 'Rotate'}
          </button>
          <button
            onClick={() => {
              if (isLocked) unlockDevice();
              setControlCenterOpen(true);
            }}
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs font-medium"
          >
            Control Center
          </button>
          <button
            onClick={() => {
              if (isLocked) unlockDevice();
              setSiriOpen(true);
            }}
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs font-medium"
          >
            Siri AI
          </button>
          <button
            onClick={() => {
              if (isLocked) unlockDevice();
              openApp('playstore');
            }}
            className="px-3 py-1.5 rounded-full bg-emerald-600/80 border border-emerald-400/30 text-xs font-medium text-white"
          >
            Play Store
          </button>
        </div>
      </main>
    </div>
  );
};

export function App() {
  return (
    <OSProvider>
      <StudioWorkspace />
    </OSProvider>
  );
}

export default App;
