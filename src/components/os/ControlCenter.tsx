import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Battery,
  BatteryCharging,
  Bell,
  BellOff,
  Bluetooth,
  Calculator,
  Camera,
  Cast,
  Check,
  Disc,
  Flashlight,
  Headphones,
  Lock,
  Mic,
  MicOff,
  Moon,
  Music,
  Pause,
  Plane,
  Play,
  Radio,
  RotateCcw,
  RotateCw,
  Share2,
  Signal,
  SkipBack,
  SkipForward,
  Sun,
  Volume2,
  Wifi,
  X,
} from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { FocusMode } from '../../os/types';

const FOCUS_CYCLE: FocusMode[] = ['off', 'dnd', 'work', 'sleep', 'personal'];

interface VerticalSwipeSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  icon: React.ReactNode;
  fillClass?: string;
  label: string;
}

const VerticalSwipeSlider: React.FC<VerticalSwipeSliderProps> = ({
  value,
  min,
  max,
  onChange,
  icon,
  fillClass = 'bg-white',
  label,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const updateFromClientY = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = 1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const next = Math.round(min + ratio * (max - min));
    onChange(next);
  };

  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div
      ref={trackRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        draggingRef.current = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        updateFromClientY(e.clientY);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        e.stopPropagation();
        updateFromClientY(e.clientY);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        draggingRef.current = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      className="relative liquid-glass-dark rounded-[26px] h-[142px] max-h-full overflow-hidden flex flex-col items-center justify-end p-2.5 cursor-ns-resize touch-none select-none"
    >
      <div
        className={`absolute bottom-0 left-0 right-0 ${fillClass} transition-[height] duration-75`}
        style={{ height: `${pct}%` }}
      />
      <div className="relative z-10 flex flex-col items-center gap-1 mix-blend-difference text-white pointer-events-none">
        {icon}
        <span className="text-[10px] font-mono-num font-bold">{value}%</span>
      </div>
    </div>
  );
};

const WIFI_NETWORKS = ['Apple-5GHz-Fiber', 'Studio-Mesh-6E', 'ProMax-5G-Hotspot'];

export const ControlCenter: React.FC = () => {
  const {
    state,
    updateSettings,
    setControlCenterOpen,
    flashlightOn,
    toggleFlashlight,
    screenRecording,
    toggleScreenRecording,
    openApp,
    musicPlaying,
    currentTrack,
    toggleMusic,
    nextTrack,
    toggleSilentMode,
    toggleMicrophoneHardware,
    isLandscape,
    rotateDevice,
    networkLatencyMs,
  } = useOS();

  const [boardPage, setBoardPage] = useState(0); // 0: Main, 1: Media, 2: Connectivity
  const [spatialAudio, setSpatialAudio] = useState(true);
  const [airDropMode, setAirDropMode] = useState<'Contacts Only' | 'Everyone'>('Contacts Only');
  const [hotspotOn, setHotspotOn] = useState(false);
  const [swipeOffsetY, setSwipeOffsetY] = useState(0);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const s = state.settings;

  const cycleFocus = () => {
    const idx = FOCUS_CYCLE.indexOf(s.focusMode);
    const next = FOCUS_CYCLE[(idx + 1) % FOCUS_CYCLE.length];
    updateSettings({ focusMode: next });
  };

  const handleBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dy) > Math.abs(dx) && dy < 0) {
      setSwipeOffsetY(Math.max(-180, dy * 0.65));
      setSwipeOffsetX(0);
    } else if (Math.abs(dx) > Math.abs(dy)) {
      const edge = (boardPage === 0 && dx > 0) || (boardPage === 2 && dx < 0);
      setSwipeOffsetX(edge ? dx * 0.2 : dx * 0.55);
      setSwipeOffsetY(0);
    }
  };

  const handleBoardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    setSwipeOffsetY(0);
    setSwipeOffsetX(0);
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    // Vertical swipe up dismisses Control Center
    if (dy < -55 && Math.abs(dy) > Math.abs(dx) * 0.9) {
      setControlCenterOpen(false);
      return;
    }
    // Horizontal swipe switches Control Center boards
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && boardPage < 2) setBoardPage((p) => p + 1);
      else if (dx > 0 && boardPage > 0) setBoardPage((p) => p - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -36 }}
      animate={{ opacity: 1, y: swipeOffsetY }}
      exit={{ opacity: 0, y: -36 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onPointerDown={handleBoardPointerDown}
      onPointerMove={handleBoardPointerMove}
      onPointerUp={handleBoardPointerUp}
      onPointerCancel={() => {
        swipeRef.current = null;
        setSwipeOffsetY(0);
        setSwipeOffsetX(0);
      }}
      className={`absolute inset-0 z-50 bg-black/60 backdrop-blur-2xl text-white flex flex-col justify-between select-none touch-none ${
        isLandscape ? 'p-4 pt-9 overflow-y-auto no-scrollbar' : 'p-5 pt-11'
      }`}
      onClick={() => setControlCenterOpen(false)}
    >
      <div className="space-y-3.5" onClick={(e) => e.stopPropagation()}>
        {/* Top Header + Board Switcher */}
        <div className="flex items-center justify-between px-1 gap-2">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <span className="font-semibold text-white">Control Board</span>
            <span>·</span>
            <span className="font-mono-num flex items-center gap-1">
              {state.isCharging && <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />}
              {state.batteryLevel}%
            </span>
          </div>

          <div className="flex items-center gap-1 bg-white/10 rounded-full p-0.5">
            {['Controls', 'Media', 'Network'].map((label, idx) => (
              <button
                key={label}
                onClick={() => setBoardPage(idx)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                  boardPage === idx ? 'bg-white text-zinc-950' : 'text-zinc-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => rotateDevice()}
              className={`px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                isLandscape ? 'bg-indigo-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Rotate Screen Orientation"
              aria-label="Rotate Screen Orientation"
            >
              <RotateCw className="w-3 h-3" />
              <span>Rotate</span>
            </button>
            <button
              onClick={() => setControlCenterOpen(false)}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
              aria-label="Close Control Center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Swipable Control Center Boards */}
        <AnimatePresence mode="wait">
          {boardPage === 0 && (
            <motion.div
              key="cc-main"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: swipeOffsetX }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="space-y-3"
            >
              {/* Row 1: Connectivity Cluster + Now Playing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="liquid-glass-dark rounded-[28px] p-3 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() =>
                      updateSettings({
                        airplaneMode: !s.airplaneMode,
                        wifi: s.airplaneMode ? true : false,
                        cellular: s.airplaneMode ? true : false,
                      })
                    }
                    className={`h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      s.airplaneMode ? 'bg-amber-500 text-white' : 'bg-white/12 text-zinc-200 hover:bg-white/20'
                    }`}
                    title="Airplane Mode"
                  >
                    <Plane className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => updateSettings({ cellular: !s.cellular, airplaneMode: false })}
                    className={`h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      s.cellular && !s.airplaneMode ? 'bg-emerald-500 text-white' : 'bg-white/12 text-zinc-200 hover:bg-white/20'
                    }`}
                    title="Cellular Data"
                  >
                    <Signal className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => updateSettings({ wifi: !s.wifi, airplaneMode: false })}
                    className={`h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      s.wifi && !s.airplaneMode ? 'bg-blue-500 text-white' : 'bg-white/12 text-zinc-200 hover:bg-white/20'
                    }`}
                    title="Wi-Fi"
                  >
                    <Wifi className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => updateSettings({ bluetooth: !s.bluetooth })}
                    className={`h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      s.bluetooth ? 'bg-blue-500 text-white' : 'bg-white/12 text-zinc-200 hover:bg-white/20'
                    }`}
                    title="Bluetooth"
                  >
                    <Bluetooth className="w-5 h-5" />
                  </button>
                </div>

                {/* Now Playing Card */}
                <div className="liquid-glass-dark rounded-[28px] p-3.5 flex flex-col justify-between">
                  <div
                    onClick={() => setBoardPage(1)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentTrack.coverGradient} shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{currentTrack.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{currentTrack.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-around pt-2">
                    <button
                      onClick={toggleMusic}
                      className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
                      aria-label={musicPlaying ? 'Pause' : 'Play'}
                    >
                      {musicPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <button
                      onClick={nextTrack}
                      className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
                      aria-label="Next Track"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Toggles + Vertical Swipe Brightness & Volume Bars */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <button
                    onClick={toggleSilentMode}
                    className={`h-[65px] rounded-[22px] flex flex-col items-center justify-center gap-1 transition-colors ${
                      s.silentMode ? 'bg-rose-500 text-white' : 'liquid-glass-dark text-zinc-200'
                    }`}
                    title="Toggle Silent Mode"
                  >
                    {s.silentMode ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    <span className="text-[10px] font-medium">{s.silentMode ? 'Silent On' : 'Ring'}</span>
                  </button>

                  <button
                    onClick={() => updateSettings({ darkMode: !s.darkMode })}
                    className={`h-[65px] rounded-[22px] flex flex-col items-center justify-center gap-1 transition-colors ${
                      s.darkMode ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-900'
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{s.darkMode ? 'Dark' : 'Light'}</span>
                  </button>

                  <button
                    onClick={() => updateSettings({ rotationLock: !s.rotationLock })}
                    className={`h-[65px] rounded-[22px] flex flex-col items-center justify-center gap-1 transition-colors ${
                      s.rotationLock ? 'bg-amber-500 text-white' : 'liquid-glass-dark text-zinc-200'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Orient.</span>
                  </button>

                  <button
                    onClick={cycleFocus}
                    className={`h-[65px] rounded-[22px] flex flex-col items-center justify-center gap-1 transition-colors ${
                      s.focusMode !== 'off' ? 'bg-indigo-500 text-white' : 'liquid-glass-dark text-zinc-200'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span className="text-[10px] font-medium capitalize truncate max-w-[64px]">
                      {s.focusMode === 'off' ? 'Focus' : s.focusMode}
                    </span>
                  </button>
                </div>

                <VerticalSwipeSlider
                  value={s.brightness}
                  min={25}
                  max={100}
                  onChange={(val) => updateSettings({ brightness: val })}
                  icon={<Sun className="w-4 h-4" />}
                  fillClass="bg-white/95"
                  label="Screen Brightness"
                />

                <VerticalSwipeSlider
                  value={s.volume}
                  min={0}
                  max={100}
                  onChange={(val) => updateSettings({ volume: val })}
                  icon={<Volume2 className="w-4 h-4" />}
                  fillClass="bg-sky-300/95"
                  label="System Volume"
                />
              </div>

              {/* Row 3: Quick Utility Buttons */}
              <div className="grid grid-cols-5 gap-2">
                <button
                  onClick={toggleFlashlight}
                  className={`h-16 rounded-[22px] flex flex-col items-center justify-center gap-1 transition-all ${
                    flashlightOn ? 'bg-white text-zinc-950' : 'liquid-glass-dark text-white'
                  }`}
                >
                  <Flashlight className="w-5 h-5" />
                  <span className="text-[10px]">Torch</span>
                </button>

                <button
                  onClick={toggleMicrophoneHardware}
                  className={`h-16 rounded-[22px] flex flex-col items-center justify-center gap-1 transition-all ${
                    s.microphoneEnabled === false
                      ? 'bg-rose-500 text-white'
                      : 'liquid-glass-dark text-white hover:bg-white/20'
                  }`}
                  title="Toggle Hardware Microphone Array"
                >
                  {s.microphoneEnabled === false ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
                  <span className="text-[10px]">{s.microphoneEnabled === false ? 'Mic Off' : 'Mic On'}</span>
                </button>

                <button
                  onClick={() => openApp('calculator')}
                  className="h-16 rounded-[22px] liquid-glass-dark text-white flex flex-col items-center justify-center gap-1 hover:bg-white/20"
                >
                  <Calculator className="w-5 h-5" />
                  <span className="text-[10px]">Calc</span>
                </button>

                <button
                  onClick={() => openApp('camera')}
                  className="h-16 rounded-[22px] liquid-glass-dark text-white flex flex-col items-center justify-center gap-1 hover:bg-white/20"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px]">Camera</span>
                </button>

                <button
                  onClick={toggleScreenRecording}
                  className={`h-16 rounded-[22px] flex flex-col items-center justify-center gap-1 transition-all ${
                    screenRecording ? 'bg-rose-500 text-white' : 'liquid-glass-dark text-white hover:bg-white/20'
                  }`}
                >
                  <Disc className={`w-5 h-5 ${screenRecording ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px]">{screenRecording ? 'Stop' : 'Record'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {boardPage === 1 && (
            <motion.div
              key="cc-media"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: swipeOffsetX }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="space-y-3"
            >
              <div className="liquid-glass-dark rounded-[30px] p-5 space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentTrack.coverGradient} shadow-lg flex items-center justify-center shrink-0`}>
                    <Music className="w-7 h-7 text-white/90" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-sky-400 font-semibold">Now Playing</p>
                    <p className="text-base font-bold truncate">{currentTrack.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{currentTrack.artist} · {currentTrack.album}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-5 py-1">
                  <button
                    onClick={nextTrack}
                    className="w-11 h-11 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center"
                    aria-label="Previous Track"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleMusic}
                    className="w-14 h-14 rounded-full bg-white text-zinc-950 hover:scale-105 transition-transform flex items-center justify-center shadow-lg"
                    aria-label={musicPlaying ? 'Pause' : 'Play'}
                  >
                    {musicPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>
                  <button
                    onClick={nextTrack}
                    className="w-11 h-11 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center"
                    aria-label="Next Track"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 liquid-glass-dark rounded-[26px] p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-semibold">AirPods Pro 3</span>
                    </div>
                    <span className="text-[10px] font-mono-num text-emerald-400">96%</span>
                  </div>
                  <button
                    onClick={() => setSpatialAudio((prev) => !prev)}
                    className={`mt-2 py-2 px-3 rounded-2xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      spatialAudio ? 'bg-sky-500 text-white' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    <span>Spatial Audio</span>
                    <span>{spatialAudio ? 'Head Tracked' : 'Off'}</span>
                  </button>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => openApp('music')} className="py-1.5 rounded-xl bg-rose-500/80 text-[11px] font-semibold">
                      Apple Music
                    </button>
                    <button onClick={() => openApp('spotify')} className="py-1.5 rounded-xl bg-emerald-500/80 text-[11px] font-semibold">
                      Spotify
                    </button>
                  </div>
                </div>

                <VerticalSwipeSlider
                  value={s.volume}
                  min={0}
                  max={100}
                  onChange={(val) => updateSettings({ volume: val })}
                  icon={<Volume2 className="w-4 h-4" />}
                  fillClass="bg-sky-300/95"
                  label="Media Volume"
                />
              </div>
            </motion.div>
          )}

          {boardPage === 2 && (
            <motion.div
              key="cc-network"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: swipeOffsetX }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="space-y-3"
            >
              <div className="liquid-glass-dark rounded-[28px] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-blue-400" /> Wi-Fi Networks
                  </span>
                  <button
                    onClick={() => updateSettings({ wifi: !s.wifi, airplaneMode: false })}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      s.wifi && !s.airplaneMode ? 'bg-blue-500 text-white' : 'bg-white/15 text-zinc-300'
                    }`}
                  >
                    {s.wifi && !s.airplaneMode ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="space-y-1">
                  {WIFI_NETWORKS.map((net) => {
                    const active = s.wifi && !s.airplaneMode && s.wifiNetwork === net;
                    return (
                      <button
                        key={net}
                        onClick={() => updateSettings({ wifi: true, airplaneMode: false, wifiNetwork: net })}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                          active ? 'bg-blue-500/25 text-white font-semibold' : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        <span>{net}</span>
                        {active && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setHotspotOn((p) => !p)}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 text-left transition-colors ${
                    hotspotOn ? 'bg-emerald-500 text-white' : 'liquid-glass-dark text-zinc-200'
                  }`}
                >
                  <Radio className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Hotspot</p>
                    <p className="text-[10px] opacity-80">{hotspotOn ? 'Discoverable' : 'Off'}</p>
                  </div>
                </button>

                <button
                  onClick={() => setAirDropMode((m) => (m === 'Everyone' ? 'Contacts Only' : 'Everyone'))}
                  className="p-3 rounded-2xl liquid-glass-dark text-zinc-200 flex items-center gap-2.5 text-left"
                >
                  <Share2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">AirDrop</p>
                    <p className="text-[10px] text-zinc-400">{airDropMode}</p>
                  </div>
                </button>

                <button
                  onClick={() => updateSettings({ lowPowerMode: !s.lowPowerMode })}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 text-left transition-colors ${
                    s.lowPowerMode ? 'bg-amber-500 text-white' : 'liquid-glass-dark text-zinc-200'
                  }`}
                >
                  <Battery className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Low Power</p>
                    <p className="text-[10px] opacity-80">{s.lowPowerMode ? 'Active' : 'Off'}</p>
                  </div>
                </button>

                <button
                  onClick={() => updateSettings({ unlimitedNetworkMode: !s.unlimitedNetworkMode })}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 text-left transition-colors ${
                    s.unlimitedNetworkMode !== false ? 'bg-blue-600 text-white' : 'liquid-glass-dark text-zinc-200'
                  }`}
                >
                  <Signal className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Unlimited 5G</p>
                    <p className="text-[10px] opacity-85">
                      {s.unlimitedNetworkMode !== false
                        ? `Zero-Lag${networkLatencyMs ? ` · ${networkLatencyMs}ms` : ''}`
                        : 'Standard'}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => openApp('settings')}
                  className="p-3 rounded-2xl liquid-glass-dark text-zinc-200 flex items-center gap-2.5 text-left hover:bg-white/20"
                >
                  <Cast className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">All Settings</p>
                    <p className="text-[10px] text-zinc-400">Open Preferences</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Status Bar inside Control Board */}
        <div className="flex items-center justify-between liquid-glass-dark rounded-2xl px-4 py-2 text-[11px]">
          <span className="text-zinc-300 truncate">
            {s.airplaneMode
              ? 'Airplane Mode On'
              : s.unlimitedNetworkMode !== false
              ? `Unlimited Wi-Fi 7 & 5G⁺${networkLatencyMs ? ` · ${networkLatencyMs}ms` : ' · No Lag'}`
              : s.wifi
              ? `Wi-Fi: ${s.wifiNetwork}`
              : s.cellular
              ? '5G Ultra Wideband'
              : 'No Connection'}
          </span>
          <button
            onClick={() => openApp('settings')}
            className="text-sky-400 font-semibold flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            Settings
          </button>
        </div>
      </div>

      {/* Board Page Dots + Swipe Up Dismiss Bar */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setBoardPage(idx);
              }}
              className={`h-1.5 rounded-full transition-all ${
                boardPage === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
              }`}
              aria-label={`Control Board Page ${idx + 1}`}
            />
          ))}
        </div>
        <div className="w-32 h-1.5 rounded-full bg-white/75" />
      </div>
    </motion.div>
  );
};
