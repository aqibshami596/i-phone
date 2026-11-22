import React, { useEffect, useState } from 'react';
import { BellOff, MicOff, Plane, Wifi, BatteryCharging } from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { DynamicIsland } from './DynamicIsland';

export const StatusBar: React.FC<{ lightText?: boolean }> = ({ lightText = true }) => {
  const {
    state,
    isLocked,
    isAlwaysOn,
    isLandscape,
    micHardwareActive,
    setControlCenterOpen,
    setNotificationCenterOpen,
  } = useOS();

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  if (isAlwaysOn) return null;

  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const textClass = lightText ? 'text-white' : 'text-zinc-900 dark:text-white';

  const pullStartRef = React.useRef<{ x: number; y: number; isRight: boolean } | null>(null);

  return (
    <div
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const isRight = e.clientX - rect.left > rect.width * 0.55;
        pullStartRef.current = { x: e.clientX, y: e.clientY, isRight };
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        const start = pullStartRef.current;
        pullStartRef.current = null;
        if (!start) return;
        const dy = e.clientY - start.y;
        if (dy > 18) {
          if (start.isRight) setControlCenterOpen(true);
          else if (!isLocked) setNotificationCenterOpen(true);
        }
      }}
      onPointerCancel={() => {
        pullStartRef.current = null;
      }}
      className={`relative z-40 flex items-center justify-between select-none touch-none ${
        isLandscape ? 'px-6 pt-2 pb-0.5' : 'px-5 pt-3 pb-1'
      } ${textClass}`}
    >
      {/* Left: Time -> Notification Center */}
      <button
        onClick={() => {
          if (!isLocked) setNotificationCenterOpen(true);
        }}
        className="w-[74px] text-left text-[13px] font-semibold tracking-tight font-mono-num hover:opacity-80 transition-opacity"
        title="Swipe down or tap for Notification Center"
      >
        {timeStr}
      </button>

      {/* Center: Dynamic Island */}
      <div className="flex-1 flex justify-center">
        <DynamicIsland />
      </div>

      {/* Right: Signal / Wifi / Battery -> Control Center */}
      <button
        onClick={() => setControlCenterOpen(true)}
        className="w-[82px] flex flex-col items-end gap-0.5 text-[11px] font-semibold hover:opacity-80 transition-opacity"
        title="Swipe down from top-right for Control Center"
      >
        <div className="flex items-center justify-end gap-1.5">
          {micHardwareActive && (
            <span
              className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.9)] shrink-0"
              title="Microphone Active"
              aria-label="Microphone Active"
            />
          )}
          {state.settings.microphoneEnabled === false && (
            <MicOff className="w-3 h-3 text-rose-400 shrink-0" aria-label="Hardware Microphone Off" />
          )}
          {state.settings.silentMode && (
            <BellOff className="w-3 h-3 text-rose-400 shrink-0" aria-label="Silent Mode On" />
          )}
          {state.settings.airplaneMode ? (
            <Plane className="w-3.5 h-3.5" />
          ) : (
            <>
              {/* 5G Signal Bars */}
              <div className="flex items-end gap-[1.5px] h-2.5" aria-label="Cellular 5G Ultra Wideband">
                <span className="w-[2px] h-[4px] rounded-full bg-current opacity-95" />
                <span className="w-[2px] h-[6px] rounded-full bg-current opacity-95" />
                <span className="w-[2px] h-[8px] rounded-full bg-current opacity-95" />
                <span
                  className={`w-[2px] h-[10px] rounded-full bg-current ${
                    state.settings.unlimitedNetworkMode !== false ? 'opacity-95' : 'opacity-40'
                  }`}
                />
              </div>
              {state.settings.cellular && (
                <span className="text-[9px] font-bold tracking-tight opacity-90">
                  {state.settings.unlimitedNetworkMode !== false ? '5G⁺' : '5G'}
                </span>
              )}
              {state.settings.wifi && <Wifi className="w-3.5 h-3.5" />}
            </>
          )}

          {/* Battery Pill */}
          <div className="flex items-center gap-0.5">
            <div className="relative w-[22px] h-[11px] rounded-[3.5px] border border-current/50 p-[1.5px] flex items-center">
              <div
                className={`h-full rounded-[1.5px] transition-all ${
                  state.isCharging
                    ? 'bg-emerald-400'
                    : state.settings.lowPowerMode
                    ? 'bg-amber-400'
                    : state.batteryLevel <= 20
                    ? 'bg-red-500'
                    : 'bg-current'
                }`}
                style={{ width: `${Math.max(8, state.batteryLevel)}%` }}
              />
              {state.isCharging && (
                <BatteryCharging className="w-2.5 h-2.5 text-white absolute inset-0 m-auto drop-shadow" />
              )}
            </div>
          </div>
        </div>
        <div className="w-8 h-[2px] rounded-full bg-current opacity-35" />
      </button>
    </div>
  );
};
