import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BatteryCharging,
  Camera,
  Check,
  Delete,
  Flashlight,
  Lock,
  Moon,
  ScanFace,
  Unlock,
} from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { renderAppIcon } from '../../os/appRegistry';
import { soundEngine } from '../../os/soundEngine';

export const LockScreen: React.FC = () => {
  const {
    state,
    isAlwaysOn,
    isLandscape,
    toggleAlwaysOn,
    unlockDevice,
    flashlightOn,
    toggleFlashlight,
    openApp,
    notifications,
    clearNotifications,
    musicPlaying,
    currentTrack,
    toggleMusic,
  } = useOS();

  const [now, setNow] = useState(() => new Date());
  const [faceIdState, setFaceIdState] = useState<'idle' | 'scanning' | 'verified'>('idle');
  const [dragY, setDragY] = useState(0);
  const [passcodePromptOpen, setPasscodePromptOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinWrong, setPinWrong] = useState(false);

  const hasPasscode = Boolean(state.settings.passcodeEnabled && state.settings.passcode);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(id);
  }, []);

  const handleUnlockAttempt = (forcePasscode = false) => {
    if (isAlwaysOn) {
      toggleAlwaysOn();
      return;
    }
    if (hasPasscode && (forcePasscode || !state.settings.faceIdEnabled)) {
      setEnteredPin('');
      setPinWrong(false);
      setPasscodePromptOpen(true);
      soundEngine.tap();
      return;
    }
    if (!state.settings.faceIdEnabled) {
      unlockDevice();
      return;
    }
    if (faceIdState === 'scanning') return;
    setFaceIdState('scanning');
    soundEngine.tap();
    window.setTimeout(() => {
      setFaceIdState('verified');
      window.setTimeout(() => {
        setFaceIdState('idle');
        unlockDevice();
      }, 320);
    }, 520);
  };

  const handlePinDigit = (digit: string) => {
    if (!hasPasscode) return;
    const expected = state.settings.passcode;
    if (enteredPin.length >= expected.length) return;
    soundEngine.tap();
    setPinWrong(false);
    const next = enteredPin + digit;
    setEnteredPin(next);
    if (next.length === expected.length) {
      window.setTimeout(() => {
        if (next === expected) {
          setPasscodePromptOpen(false);
          setEnteredPin('');
          unlockDevice();
        } else {
          setPinWrong(true);
          soundEngine.haptic(35);
          window.setTimeout(() => {
            setEnteredPin('');
          }, 420);
        }
      }, 100);
    }
  };

  const timeMain = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?(AM|PM)/i, '');
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  if (isAlwaysOn) {
    return (
      <div
        onClick={toggleAlwaysOn}
        className="absolute inset-0 z-30 bg-black/92 flex flex-col items-center justify-between pt-16 pb-8 px-6 text-white cursor-pointer select-none"
      >
        <div className="text-center opacity-70">
          <p className="text-xs font-medium tracking-wide text-zinc-400">{dateStr}</p>
          <p className="text-[74px] leading-none font-bold tracking-tight font-mono-num text-zinc-200 mt-1">
            {timeMain}
          </p>
          {state.settings.focusMode !== 'off' && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-300">
              <Moon className="w-3.5 h-3.5" />
              <span className="capitalize">{state.settings.focusMode} Focus</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 opacity-65">
          {notifications.length > 0 && (
            <p className="text-xs text-zinc-400">{notifications.length} notifications waiting</p>
          )}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {state.isCharging && <BatteryCharging className="w-4 h-4 text-emerald-400" />}
            <span className="font-mono-num">{state.batteryLevel}% Battery</span>
          </div>
          <p className="text-[11px] text-zinc-500">Tap screen to wake</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: -240, bottom: 0 }}
      dragElastic={0.18}
      onDrag={(_e, info) => setDragY(info.offset.y)}
      onDragEnd={(_e, info) => {
        setDragY(0);
        if (info.offset.y < -50 || info.velocity.y < -200) {
          handleUnlockAttempt();
        }
      }}
      style={{ y: Math.min(0, dragY * 0.45) }}
      className={`absolute inset-0 z-30 flex flex-col justify-between text-white select-none cursor-grab active:cursor-grabbing ${
        isLandscape ? 'pt-9 pb-3 px-8' : 'pt-12 pb-5 px-5'
      }`}
    >
      {/* Top Face ID + Clock (+ Side-by-Side Notifications in Landscape) */}
      <div className={isLandscape ? 'flex-1 flex items-center justify-between gap-8 min-h-0' : 'flex-1 flex flex-col justify-between min-h-0'}>
        <div className={`flex flex-col items-center text-center ${isLandscape ? 'w-1/2 justify-center' : ''}`}>
          {/* Face ID / Lock Indicator */}
          <button
            onClick={() => handleUnlockAttempt(false)}
            className="mb-1.5 flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors"
            title="Unlock with Face ID"
          >
            {faceIdState === 'scanning' ? (
              <ScanFace className="w-6 h-6 text-sky-400 animate-pulse" />
            ) : faceIdState === 'verified' ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            ) : (
              <Lock className="w-4 h-4 text-white/90" />
            )}
          </button>

          <p className="text-[13px] font-medium text-white/90 drop-shadow-sm">{dateStr}</p>
          <h1
            className={`${
              isLandscape ? 'text-[56px]' : 'text-[78px]'
            } leading-[0.95] font-bold tracking-tight font-mono-num drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] mt-1`}
          >
            {timeMain}
          </h1>

          {/* Status Chips: Battery / Charging / Focus */}
          <div className="mt-2.5 flex items-center justify-center gap-3 text-xs font-medium text-white/90">
            <div className="flex items-center gap-1.5 liquid-glass px-3 py-1 rounded-full">
              {state.isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
              <span className="font-mono-num">{state.batteryLevel}%</span>
              {state.isCharging && <span className="text-emerald-300">Charging</span>}
            </div>

            {state.settings.focusMode !== 'off' && (
              <div className="flex items-center gap-1.5 liquid-glass px-3 py-1 rounded-full capitalize">
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span>{state.settings.focusMode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Now Playing + Notification Stack */}
        <div
          className={`flex flex-col gap-2 overflow-y-auto no-scrollbar ${
            isLandscape ? 'w-1/2 justify-center max-h-[220px]' : 'flex-1 justify-end my-3 max-h-[265px]'
          }`}
        >
        {musicPlaying && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleMusic();
            }}
            className="liquid-glass-dark rounded-3xl p-3.5 flex items-center gap-3 cursor-pointer"
          >
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${currentTrack.coverGradient} shrink-0`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-zinc-300 truncate">{currentTrack.artist}</p>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/15">
              Playing
            </span>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-white/75">Notifications</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearNotifications();
                }}
                className="text-[11px] text-white/70 hover:text-white px-2 py-0.5 rounded-full bg-white/10"
              >
                Clear
              </button>
            </div>
            {notifications.slice(0, 3).map((n) => (
              <div
                key={n.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasPasscode && !state.settings.faceIdEnabled) {
                    handleUnlockAttempt(true);
                  } else {
                    unlockDevice();
                    openApp(n.appId);
                  }
                }}
                className="liquid-glass-dark rounded-3xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
                  {renderAppIcon(n.appId, 'sm')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold truncate">{n.title}</p>
                    <span className="text-[10px] text-zinc-400">{n.appName}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 line-clamp-1">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Bottom Shortcuts + Gesture Swipe-Up Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFlashlight();
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              flashlightOn ? 'bg-white text-zinc-950 shadow-[0_0_24px_rgba(255,255,255,0.65)]' : 'liquid-glass-dark text-white'
            }`}
            aria-label="Toggle Flashlight"
          >
            <Flashlight className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center gap-1">
            <div
              onClick={() => handleUnlockAttempt(false)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-white/80 tracking-wide cursor-pointer"
            >
              <Unlock className="w-3 h-3 opacity-80" />
              <span>
                {faceIdState === 'scanning'
                  ? 'Face ID...'
                  : hasPasscode && !state.settings.faceIdEnabled
                    ? 'Swipe up for Passcode'
                    : 'Swipe up to unlock'}
              </span>
            </div>
            {hasPasscode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnlockAttempt(true);
                }}
                className="text-[10px] font-semibold text-sky-300/90 hover:text-white px-2 py-0.5 rounded-full bg-white/10"
              >
                Enter Passcode
              </button>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!hasPasscode) unlockDevice();
              openApp('camera');
            }}
            className="w-12 h-12 rounded-full liquid-glass-dark text-white flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Open Camera"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Home Indicator */}
        <div className="flex justify-center pt-1">
          <div className="w-32 h-1.5 rounded-full bg-white/85" />
        </div>
      </div>

      {/* Liquid Glass Passcode Overlay */}
      {passcodePromptOpen && hasPasscode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute inset-0 z-40 bg-black/75 backdrop-blur-2xl flex text-white ${
            isLandscape
              ? 'flex-row items-center justify-center gap-10 pt-8 pb-4 px-8'
              : 'flex-col items-center justify-between pt-16 pb-8 px-6'
          }`}
        >
          <div className="text-center space-y-4">
            <Lock className="w-5 h-5 mx-auto text-white/90" />
            <div>
              <h2 className="text-base font-semibold">Enter Passcode</h2>
              {pinWrong && <p className="text-xs text-rose-400 font-medium mt-1">Incorrect Passcode · Try Again</p>}
            </div>

            <div className={`flex items-center justify-center gap-3.5 pt-1 ${pinWrong ? 'animate-pulse' : ''}`}>
              {Array.from({ length: state.settings.passcode.length }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    idx < enteredPin.length ? 'bg-white border-white scale-110' : 'border-white/60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className={isLandscape ? 'w-full max-w-[210px] space-y-2' : 'w-full max-w-[260px] space-y-3'}>
            <div className={`grid grid-cols-3 ${isLandscape ? 'gap-2' : 'gap-3.5'}`}>
              {[
                ['1', ''],
                ['2', 'ABC'],
                ['3', 'DEF'],
                ['4', 'GHI'],
                ['5', 'JKL'],
                ['6', 'MNO'],
                ['7', 'PQRS'],
                ['8', 'TUV'],
                ['9', 'WXYZ'],
              ].map(([num, letters]) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinDigit(num)}
                  className={`${
                    isLandscape ? 'h-11 w-11' : 'h-16 w-16'
                  } mx-auto rounded-full bg-white/15 hover:bg-white/25 active:scale-92 transition-all flex flex-col items-center justify-center`}
                >
                  <span className={`${isLandscape ? 'text-lg' : 'text-2xl'} font-normal leading-none`}>{num}</span>
                  {letters && !isLandscape && (
                    <span className="text-[8px] font-bold tracking-widest text-white/75 mt-0.5">{letters}</span>
                  )}
                </button>
              ))}

              <div className="flex items-center justify-center">
                {state.settings.faceIdEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setPasscodePromptOpen(false);
                      handleUnlockAttempt(false);
                    }}
                    className="p-2 text-sky-300 hover:text-white"
                    title="Unlock with Face ID"
                  >
                    <ScanFace className="w-5 h-5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className={`${
                  isLandscape ? 'h-11 w-11 text-lg' : 'h-16 w-16 text-2xl'
                } mx-auto rounded-full bg-white/15 hover:bg-white/25 active:scale-92 transition-all flex items-center justify-center font-normal`}
              >
                0
              </button>

              <div className="flex items-center justify-center">
                {enteredPin.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setEnteredPin((p) => p.slice(0, -1))}
                    className="p-2 text-white/80 hover:text-white"
                    aria-label="Delete digit"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPasscodePromptOpen(false);
                      setEnteredPin('');
                    }}
                    className="text-xs font-semibold text-white/85"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
