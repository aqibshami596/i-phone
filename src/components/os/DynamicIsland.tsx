import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BatteryCharging,
  Bell,
  BellOff,
  MicOff,
  Pause,
  PhoneOff,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Timer as TimerIcon,
  Volume2,
  X,
} from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { renderAppIcon } from '../../os/appRegistry';

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const DynamicIsland: React.FC = () => {
  const {
    state,
    islandExpanded,
    setIslandExpanded,
    musicPlaying,
    currentTrack,
    musicElapsed,
    toggleMusic,
    nextTrack,
    prevTrack,
    timerRemaining,
    timerRunning,
    pauseTimer,
    resetTimer,
    activeCall,
    endCall,
    toggleCallMute,
    toggleCallSpeaker,
    toggleCallHold,
    setCallMinimized,
    screenRecording,
    screenRecordSeconds,
    toggleScreenRecording,
    bannerNotification,
    dismissBanner,
    openApp,
    isAlwaysOn,
    silentHud,
  } = useOS();

  const [callSec, setCallSec] = React.useState(0);
  React.useEffect(() => {
    if (!activeCall?.connectedAt) {
      setCallSec(0);
      return;
    }
    const tick = () => setCallSec(Math.max(0, Math.floor((Date.now() - activeCall.connectedAt!) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeCall?.connectedAt, activeCall?.id]);

  const hasTimer = timerRemaining > 0;
  const hasCall = !!activeCall;
  const hasMusic = musicPlaying;
  const hasRec = screenRecording;
  const hasCharging = state.isCharging;
  const hasSilentToast = silentHud !== null;
  const hasActivity = hasCall || hasMusic || hasTimer || hasRec || hasCharging || hasSilentToast;

  if (isAlwaysOn) {
    return (
      <div className="mx-auto w-[108px] h-[30px] rounded-full bg-black border border-white/5" />
    );
  }

  return (
    <div className="relative z-50 flex flex-col items-center w-[180px] h-[32px]">
      {/* Main Dynamic Island Pill */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
        onClick={() => {
          if (hasActivity) setIslandExpanded(!islandExpanded);
        }}
        className={`bg-black text-white shadow-[0_8px_28px_rgba(0,0,0,0.65)] border border-white/10 overflow-hidden select-none ${
          hasActivity ? 'cursor-pointer' : ''
        } ${
          islandExpanded && hasActivity
            ? 'absolute top-0 left-1/2 -translate-x-1/2 z-50 w-[336px] rounded-[34px] p-4'
            : hasActivity
            ? 'h-[32px] px-3 rounded-full flex items-center gap-2.5 min-w-[152px] max-w-[196px]'
            : 'w-[114px] h-[30px] rounded-full flex items-center justify-end pr-2.5'
        }`}
      >
        {!islandExpanded && !hasActivity && (
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-indigo-950/80 shadow-inner" />
        )}

        {/* COMPACT LIVE ACTIVITY PILL */}
        {!islandExpanded && hasActivity && (
          <div className="flex items-center justify-between w-full gap-2 text-[11px] font-medium">
            {hasSilentToast ? (
              <>
                <div className={`flex items-center gap-1.5 ${silentHud === 'silent' ? 'text-rose-400' : 'text-white'}`}>
                  {silentHud === 'silent' ? (
                    <BellOff className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  ) : (
                    <Bell className="w-3.5 h-3.5 text-white shrink-0" />
                  )}
                  <span className="font-semibold">Silent</span>
                </div>
                <span className={`text-[10px] font-bold ${silentHud === 'silent' ? 'text-rose-400' : 'text-zinc-300'}`}>
                  {silentHud === 'silent' ? 'On' : 'Off'}
                </span>
              </>
            ) : hasCall && activeCall ? (
              <>
                <div
                  className={`flex items-center gap-1.5 truncate ${
                    activeCall.transport === 'simulated-local' ? 'text-amber-300' : 'text-emerald-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${
                      activeCall.transport === 'simulated-local' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span className="truncate max-w-[90px]">{activeCall.contactName}</span>
                </div>
                <span
                  className={`font-mono-num text-[10px] ${
                    activeCall.transport === 'simulated-local' ? 'text-amber-300' : 'text-emerald-300'
                  }`}
                >
                  {activeCall.status === 'connected'
                    ? fmtSec(callSec)
                    : activeCall.status === 'on-hold'
                      ? 'HOLD'
                      : activeCall.status === 'failed'
                        ? 'ERR'
                        : activeCall.status === 'incoming'
                          ? 'IN'
                          : 'RING'}
                </span>
              </>
            ) : hasRec ? (
              <>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>REC</span>
                </div>
                <span className="font-mono-num text-rose-300">{fmtSec(screenRecordSeconds)}</span>
              </>
            ) : hasMusic ? (
              <>
                <div className={`w-4 h-4 rounded-sm bg-gradient-to-br ${currentTrack.coverGradient} shrink-0`} />
                <span className="truncate max-w-[82px] text-white/95">{currentTrack.title}</span>
                <div className="flex items-end gap-[2px] h-3 shrink-0">
                  <span className="w-[2px] h-2 bg-rose-400 rounded-full animate-pulse" />
                  <span className="w-[2px] h-3 bg-sky-400 rounded-full animate-pulse" />
                  <span className="w-[2px] h-1.5 bg-amber-400 rounded-full animate-pulse" />
                </div>
              </>
            ) : hasTimer ? (
              <>
                <TimerIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-mono-num text-amber-300">{fmtSec(timerRemaining)}</span>
              </>
            ) : (
              <>
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-mono-num">{state.batteryLevel}%</span>
              </>
            )}

            {/* Secondary split badge if both music and timer are active */}
            {hasMusic && hasTimer && (
              <span className="pl-1.5 border-l border-white/15 font-mono-num text-amber-300 text-[10px]">
                {fmtSec(timerRemaining)}
              </span>
            )}
          </div>
        )}

        {/* EXPANDED LIVE ACTIVITY CARD */}
        {islandExpanded && hasActivity && (
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400">Live Activities</span>
              <button
                onClick={() => setIslandExpanded(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300"
                aria-label="Collapse Dynamic Island"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {hasCall && activeCall && (
              <div className="flex items-center justify-between gap-2 bg-white/5 rounded-2xl p-2.5">
                <div
                  onClick={() => {
                    setIslandExpanded(false);
                    setCallMinimized(false);
                  }}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <p className="text-xs font-semibold truncate">{activeCall.contactName}</p>
                  <p
                    className={`text-[10px] truncate ${
                      activeCall.transport === 'simulated-local' ? 'text-amber-300' : 'text-emerald-400'
                    }`}
                  >
                    {activeCall.status === 'connected'
                      ? `${fmtSec(callSec)} · `
                      : `${activeCall.status} · `}
                    {activeCall.transport === 'twilio-pstn'
                      ? 'Twilio PSTN'
                      : activeCall.transport === 'webrtc-p2p'
                        ? 'WebRTC VoIP'
                        : 'Simulated Audio'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={toggleCallMute}
                    className={`p-2 rounded-full ${activeCall.muted ? 'bg-white text-black' : 'bg-white/15 text-white'}`}
                    title="Mute"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={toggleCallHold}
                    className={`p-2 rounded-full ${activeCall.onHold ? 'bg-amber-400 text-black' : 'bg-white/15 text-white'}`}
                    title="Hold"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={toggleCallSpeaker}
                    className={`p-2 rounded-full ${activeCall.speaker ? 'bg-white text-black' : 'bg-white/15 text-white'}`}
                    title="Speaker"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={endCall}
                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                    title="End Call"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {hasMusic && (
              <div className="bg-white/5 rounded-2xl p-2.5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div
                    onClick={() => {
                      setIslandExpanded(false);
                      openApp('music');
                    }}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentTrack.coverGradient} shrink-0 cursor-pointer`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{currentTrack.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={prevTrack} className="p-1.5 rounded-full hover:bg-white/10">
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={toggleMusic} className="p-1.5 rounded-full bg-white text-black">
                      {musicPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={nextTrack} className="p-1.5 rounded-full hover:bg-white/10">
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono-num text-zinc-400">
                  <span>{fmtSec(musicElapsed)}</span>
                  <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{ width: `${Math.min(100, (musicElapsed / currentTrack.durationSec) * 100)}%` }}
                    />
                  </div>
                  <span>{fmtSec(currentTrack.durationSec)}</span>
                </div>
              </div>
            )}

            {hasTimer && (
              <div className="flex items-center justify-between bg-white/5 rounded-2xl p-2.5">
                <div className="flex items-center gap-2">
                  <TimerIcon className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-[11px] text-zinc-400">Timer</p>
                    <p className="text-sm font-bold font-mono-num text-amber-300">{fmtSec(timerRemaining)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={pauseTimer}
                    className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium"
                  >
                    {timerRunning ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-1.5 rounded-full bg-white/10 text-zinc-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {hasRec && (
              <div className="flex items-center justify-between bg-rose-500/15 border border-rose-500/30 rounded-2xl p-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-medium text-rose-200">
                    Screen Recording · {fmtSec(screenRecordSeconds)}
                  </span>
                </div>
                <button
                  onClick={toggleScreenRecording}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs font-medium"
                >
                  <Square className="w-3 h-3 fill-current" />
                  Stop
                </button>
              </div>
            )}

            {hasCharging && !hasMusic && !hasTimer && !hasCall && (
              <div className="flex items-center justify-between bg-emerald-500/15 border border-emerald-500/25 rounded-2xl p-2.5">
                <div className="flex items-center gap-2">
                  <BatteryCharging className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-200">MagSafe Fast Charging</span>
                </div>
                <span className="text-sm font-bold font-mono-num text-emerald-300">{state.batteryLevel}%</span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Drop-down Notification Banner */}
      <AnimatePresence>
        {bannerNotification && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={() => {
              const target = bannerNotification.appId;
              dismissBanner();
              openApp(target);
            }}
            className="absolute top-9 left-1/2 -translate-x-1/2 z-50 w-[336px] liquid-glass-dark rounded-[24px] p-3 flex items-center gap-3 cursor-pointer shadow-2xl"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
              {renderAppIcon(bannerNotification.appId, 'sm')}
            </div>
            <div className="min-w-0 flex-1 text-white">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold truncate">{bannerNotification.title}</p>
                <span className="text-[10px] text-zinc-400 shrink-0">now</span>
              </div>
              <p className="text-[11px] text-zinc-300 truncate">{bannerNotification.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
