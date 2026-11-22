import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ChevronDown,
  Grid3X3,
  Mic,
  MicOff,
  Pause,
  Phone,
  PhoneOff,
  Play,
  Radio,
  ShieldCheck,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { soundEngine } from '../../os/soundEngine';

const DTMF_KEYS = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
  ['*', ''], ['0', '+'], ['#', ''],
];

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

export const CallOverlay: React.FC = () => {
  const {
    activeCall,
    micLevel,
    acceptIncomingCall,
    declineIncomingCall,
    endCall,
    toggleCallMute,
    toggleCallSpeaker,
    toggleCallHold,
    sendCallDtmf,
    setCallMinimized,
    openApp,
  } = useOS();

  const [elapsed, setElapsed] = useState(0);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [ringSilenced, setRingSilenced] = useState(false);

  useEffect(() => {
    setRingSilenced(false);
    setKeypadOpen(false);
  }, [activeCall?.id]);

  useEffect(() => {
    if (!activeCall?.connectedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - activeCall.connectedAt!) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeCall?.connectedAt, activeCall?.id]);

  if (!activeCall || activeCall.minimized) return null;

  const isIncoming = activeCall.status === 'incoming';
  const isSimulated = activeCall.transport === 'simulated-local';
  const isFailed = activeCall.status === 'failed' || activeCall.status === 'declined';

  const transportBadge =
    activeCall.transport === 'twilio-pstn'
      ? { label: 'Twilio Carrier PSTN', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35' }
      : activeCall.transport === 'webrtc-p2p'
        ? { label: 'Free WebRTC VoIP', cls: 'bg-sky-500/20 text-sky-300 border-sky-400/35' }
        : { label: 'Simulated Audio Test · No Carrier', cls: 'bg-amber-500/20 text-amber-300 border-amber-400/40' };

  const statusText = (() => {
    switch (activeCall.status) {
      case 'incoming':
        return isSimulated ? 'Incoming Simulated Call...' : 'Incoming Voice Call...';
      case 'dialing':
        return 'Dialing...';
      case 'ringing':
        return 'Ringing...';
      case 'connecting':
        return 'Establishing Audio...';
      case 'on-hold':
        return 'Call On Hold';
      case 'connected':
        return activeCall.remoteOnHold ? `Remote On Hold · ${formatDuration(elapsed)}` : formatDuration(elapsed);
      case 'declined':
        return 'Call Declined';
      case 'failed':
        return 'Connection Failed';
      default:
        return 'Ending...';
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.22 }}
      className="absolute inset-0 z-45 bg-gradient-to-b from-slate-900 via-zinc-950 to-black text-white flex flex-col justify-between px-6 pt-14 pb-9 select-none"
    >
      {/* Top Bar + Honest Transport Distinction */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {!isIncoming && !isFailed ? (
            <button
              onClick={() => setCallMinimized(true)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              title="Minimize to Dynamic Island"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9" />
          )}

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold tracking-wide ${transportBadge.cls}`}
          >
            {isSimulated ? <Radio className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            {transportBadge.label}
          </span>

          <div className="w-9" />
        </div>

        {/* Caller Name, Number & Live Connection Status */}
        <div className="text-center space-y-1.5 pt-2">
          <p
            className={`text-xs font-semibold font-mono-num ${
              isFailed
                ? 'text-rose-400'
                : activeCall.status === 'on-hold'
                  ? 'text-amber-300'
                  : activeCall.status === 'connected'
                    ? 'text-emerald-400'
                    : 'text-sky-300'
            }`}
          >
            {statusText}
          </p>
          <h1 className="text-3xl font-bold tracking-tight truncate">{activeCall.contactName}</h1>
          <p className="text-xs text-zinc-400 font-mono-num">{activeCall.handle}</p>
        </div>
      </div>

      {/* Center Section: Avatar / Calling Ripple OR DTMF Keypad OR Error Box */}
      {isFailed && activeCall.errorMessage ? (
        <div className="rounded-3xl bg-rose-500/15 border border-rose-500/35 p-4 text-center space-y-2 mx-auto max-w-[290px]">
          <AlertCircle className="w-7 h-7 text-rose-400 mx-auto" />
          <p className="text-xs font-semibold text-rose-200">{activeCall.errorMessage}</p>
          <p className="text-[11px] text-zinc-400">
            This call was not marked connected because audio/signaling did not complete.
          </p>
        </div>
      ) : keypadOpen && !isIncoming ? (
        <div className="space-y-3 my-auto">
          <div className="h-7 text-center font-mono-num text-lg tracking-widest text-white/90">
            {activeCall.dtmfSent || ' '}
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-[238px] mx-auto">
            {DTMF_KEYS.map(([digit, sub]) => (
              <button
                key={digit}
                onClick={() => sendCallDtmf(digit)}
                className="w-16 h-16 rounded-full bg-white/15 hover:bg-white/25 flex flex-col items-center justify-center active:scale-95 transition-transform"
              >
                <span className="text-xl font-medium leading-none">{digit}</span>
                {sub && <span className="text-[8px] text-zinc-300 tracking-widest mt-0.5">{sub}</span>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 my-auto">
          <div className="relative flex items-center justify-center">
            {(isIncoming || activeCall.status === 'ringing' || activeCall.status === 'dialing') && (
              <>
                <span className="absolute w-32 h-32 rounded-full border border-emerald-400/30 animate-ping" />
                <span className="absolute w-40 h-40 rounded-full border border-emerald-400/15 animate-pulse" />
              </>
            )}
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center text-4xl font-bold shadow-2xl border border-white/20">
              {activeCall.contactName[0]?.toUpperCase() || <User className="w-12 h-12" />}
            </div>
          </div>

          {/* Real Live Microphone Input Level Meter */}
          {!isIncoming && (
            <div className="w-44 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  {activeCall.muted ? <MicOff className="w-3 h-3 text-rose-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                  {activeCall.muted ? 'Mic Muted' : activeCall.onHold ? 'On Hold' : 'Live Mic Level'}
                </span>
                <span className="font-mono-num">{activeCall.muted || activeCall.onHold ? 0 : micLevel}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    activeCall.muted || activeCall.onHold ? 'bg-zinc-600' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${activeCall.muted || activeCall.onHold ? 0 : Math.max(4, micLevel)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls */}
      {isIncoming ? (
        <div className="space-y-6 pb-2">
          <div className="flex justify-center">
            <button
              onClick={() => {
                soundEngine.stopCallTones();
                setRingSilenced(true);
              }}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <VolumeX className="w-3.5 h-3.5" />
              {ringSilenced ? 'Ringtone Silenced' : 'Silence Ringtone'}
            </button>
          </div>
          <div className="flex items-center justify-around px-4">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={declineIncomingCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                aria-label="Decline Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs font-medium text-zinc-300">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={acceptIncomingCall}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                aria-label="Accept Call"
              >
                <Phone className="w-7 h-7 fill-white" />
              </button>
              <span className="text-xs font-medium text-zinc-300">Accept</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {!isFailed && (
            <div className="grid grid-cols-3 gap-4 max-w-[260px] mx-auto">
              <button
                onClick={toggleCallMute}
                className={`h-16 rounded-full flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  activeCall.muted ? 'bg-white text-black' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                {activeCall.muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                Mute
              </button>
              <button
                onClick={() => setKeypadOpen((k) => !k)}
                className={`h-16 rounded-full flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  keypadOpen ? 'bg-white text-black' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
                Keypad
              </button>
              <button
                onClick={toggleCallSpeaker}
                className={`h-16 rounded-full flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  activeCall.speaker ? 'bg-white text-black' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                <Volume2 className="w-5 h-5" />
                Speaker
              </button>

              <button
                onClick={toggleCallHold}
                disabled={activeCall.status !== 'connected' && activeCall.status !== 'on-hold'}
                className={`h-16 rounded-full flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors disabled:opacity-40 ${
                  activeCall.onHold ? 'bg-amber-400 text-black' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                {activeCall.onHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                {activeCall.onHold ? 'Resume' : 'Hold'}
              </button>
              <button
                onClick={() => {
                  setCallMinimized(true);
                  openApp('contacts');
                }}
                className="h-16 rounded-full bg-white/15 hover:bg-white/25 flex flex-col items-center justify-center gap-1 text-[10px] font-medium"
              >
                <User className="w-5 h-5" />
                Contacts
              </button>
              <button
                onClick={() => setCallMinimized(true)}
                className="h-16 rounded-full bg-white/15 hover:bg-white/25 flex flex-col items-center justify-center gap-1 text-[10px] font-medium"
              >
                <ChevronDown className="w-5 h-5" />
                Island
              </button>
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
              aria-label="End Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-[11px] text-zinc-400">{isFailed ? 'Dismiss' : 'End Call'}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
