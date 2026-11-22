import React, { useState } from 'react';
import {
  Accessibility,
  Battery,
  Bluetooth,
  ChevronLeft,
  ChevronRight,
  Compass,
  Delete,
  Globe,
  HardDrive,
  KeyRound,
  Keyboard,
  Lock,
  Mic,
  MicOff,
  Moon,
  Plane,
  RefreshCw,
  RotateCcw,
  ScanFace,
  Search,
  Shield,
  Smartphone,
  Sun,
  Volume2,
  Wallpaper,
  Wifi,
  Zap,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { WALLPAPERS } from '../os/seedData';
import { FocusMode, TitaniumFinish } from '../os/types';
import { voiceManager } from '../os/voiceManager';
import { clearNetworkCache, prewarmNetwork } from '../os/networkManager';

type SettingsSection =
  | 'root'
  | 'wifi'
  | 'bluetooth'
  | 'display'
  | 'wallpaper'
  | 'sounds'
  | 'microphone'
  | 'focus'
  | 'general'
  | 'faceid'
  | 'privacy'
  | 'accessibility'
  | 'safari'
  | 'actionbutton';

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-11 h-6 rounded-full p-0.5 transition-colors ${checked ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
  >
    <div
      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const SettingsApp: React.FC = () => {
  const {
    state,
    updateSettings,
    isLandscape,
    rotateDevice,
    openApp,
    resetSimulator,
    toggleCharging,
    toggleMicrophoneHardware,
    micHardwareActive,
    micLevel,
    startMicHardwareTest,
    stopMicHardwareTest,
    networkLatencyMs,
    refreshNetworkLatency,
  } = useOS();
  const [section, setSection] = useState<SettingsSection>('root');
  const [query, setQuery] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [micScanError, setMicScanError] = useState('');
  const [scanningMics, setScanningMics] = useState(false);
  const [testingMic, setTestingMic] = useState(false);

  // Passcode workflow inside Face ID & Passcode
  type PasscodeFlow = 'none' | 'verify-enter' | 'set-new' | 'set-confirm' | 'change-verify' | 'disable-verify';
  const [passcodeFlow, setPasscodeFlow] = useState<PasscodeFlow>('none');
  const [passcodeUnlocked, setPasscodeUnlocked] = useState(false);
  const [pinLength, setPinLength] = useState<4 | 6>(6);
  const [pinBuffer, setPinBuffer] = useState('');
  const [pinDraft, setPinDraft] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  const s = state.settings;

  const openFaceIdSection = () => {
    setPinBuffer('');
    setPinDraft('');
    setPinError('');
    setPinSuccessMsg('');
    if (s.passcodeEnabled && s.passcode) {
      setPasscodeUnlocked(false);
      setPasscodeFlow('verify-enter');
      setPinLength(s.passcode.length === 4 ? 4 : 6);
    } else {
      setPasscodeUnlocked(true);
      setPasscodeFlow('none');
    }
    setSection('faceid');
  };

  const handlePasscodeDigit = (digit: string) => {
    setPinError('');
    setPinSuccessMsg('');
    const targetLen =
      passcodeFlow === 'verify-enter' || passcodeFlow === 'change-verify' || passcodeFlow === 'disable-verify'
        ? (s.passcode.length === 4 ? 4 : 6)
        : pinLength;
    if (pinBuffer.length >= targetLen) return;
    const next = pinBuffer + digit;
    setPinBuffer(next);

    if (next.length < targetLen) return;

    // Completed PIN entry for the active step
    window.setTimeout(() => {
      if (passcodeFlow === 'verify-enter') {
        if (next === s.passcode) {
          setPasscodeUnlocked(true);
          setPasscodeFlow('none');
          setPinBuffer('');
        } else {
          setPinError('Incorrect Passcode. Try again.');
          setPinBuffer('');
        }
      } else if (passcodeFlow === 'disable-verify') {
        if (next === s.passcode) {
          updateSettings({ passcodeEnabled: false, passcode: '' });
          setPasscodeFlow('none');
          setPinBuffer('');
          setPinSuccessMsg('Passcode turned off.');
        } else {
          setPinError('Incorrect current passcode.');
          setPinBuffer('');
        }
      } else if (passcodeFlow === 'change-verify') {
        if (next === s.passcode) {
          setPasscodeFlow('set-new');
          setPinBuffer('');
          setPinDraft('');
        } else {
          setPinError('Incorrect current passcode.');
          setPinBuffer('');
        }
      } else if (passcodeFlow === 'set-new') {
        setPinDraft(next);
        setPinBuffer('');
        setPasscodeFlow('set-confirm');
      } else if (passcodeFlow === 'set-confirm') {
        if (next === pinDraft) {
          updateSettings({ passcodeEnabled: true, passcode: next });
          setPasscodeFlow('none');
          setPasscodeUnlocked(true);
          setPinBuffer('');
          setPinDraft('');
          setPinSuccessMsg(`${targetLen}-digit Passcode saved and enabled.`);
        } else {
          setPinError('Passcodes did not match. Enter new passcode again.');
          setPinDraft('');
          setPinBuffer('');
          setPasscodeFlow('set-new');
        }
      }
    }, 120);
  };

  const scanMicrophones = async (askPermission: boolean) => {
    setScanningMics(true);
    setMicScanError('');
    const res = await voiceManager.enumerateMicrophones(askPermission);
    setMicDevices(res.devices);
    if (res.error) setMicScanError(res.error);
    setScanningMics(false);
  };

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="px-3 pt-3 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
      <button onClick={() => setSection('root')} className="flex items-center gap-0.5 text-sm font-medium text-blue-500">
        <ChevronLeft className="w-5 h-5" />
        Settings
      </button>
      <span className="text-sm font-bold">{title}</span>
      <div className="w-14" />
    </div>
  );

  if (section === 'wifi') {
    const networks = ['Studio-5G-WiFi7', 'Cupertino-Guest', 'AirPort-Extreme-Pro', 'Home-Fiber-6E'];
    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <SectionHeader title="Wi-Fi &amp; Unlimited 5G" />
        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
          {/* Always-On Unlimited Network (Zero-Lag) */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600/15 to-emerald-500/15 border border-blue-500/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold">Unlimited Network · Always On</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Wi-Fi 7 + 5G⁺ Ultra Wideband · Zero throttling &amp; prefetch cache
                </p>
              </div>
              <Toggle
                checked={s.unlimitedNetworkMode !== false}
                onChange={(v) => updateSettings({ unlimitedNetworkMode: v })}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/10 dark:border-white/10">
              <span className="font-mono-num text-emerald-600 dark:text-emerald-400 font-semibold">
                {networkLatencyMs !== null ? `Ping: ${networkLatencyMs} ms · Ready` : 'Checking link...'}
              </span>
              <button
                type="button"
                onClick={() => {
                  clearNetworkCache();
                  prewarmNetwork();
                  void refreshNetworkLatency();
                }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Optimize &amp; Test Ping
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-sm font-medium">Wi-Fi</span>
              <Toggle checked={s.wifi} onChange={(v) => updateSettings({ wifi: v, airplaneMode: false })} />
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-sm font-medium">Cellular Data (5G⁺ Unlimited)</span>
              <Toggle checked={s.cellular} onChange={(v) => updateSettings({ cellular: v, airplaneMode: false })} />
            </div>
          </div>
          {s.wifi && (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
              {networks.map((net) => (
                <button
                  key={net}
                  onClick={() => updateSettings({ wifiNetwork: net })}
                  className="w-full p-3.5 flex items-center justify-between text-xs font-medium"
                >
                  <span>{net}</span>
                  <span className="text-blue-500">{s.wifiNetwork === net ? 'Connected ✓' : 'Tap to join'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === 'bluetooth') {
    const devices = ['AirPods Pro 3', 'Apple Watch Ultra 3', 'MagSafe Battery Pack', 'Keychron Q1 Pro'];
    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <SectionHeader title="Bluetooth" />
        <div className="p-4 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-3.5 flex items-center justify-between">
            <span className="text-sm font-medium">Bluetooth</span>
            <Toggle checked={s.bluetooth} onChange={(v) => updateSettings({ bluetooth: v })} />
          </div>
          {s.bluetooth && (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
              {devices.map((dev, i) => (
                <div key={dev} className="p-3.5 flex items-center justify-between text-xs">
                  <span className="font-medium">{dev}</span>
                  <span className="text-zinc-500">{i < 2 ? 'Connected' : 'Not Connected'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === 'display') {
    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <SectionHeader title="Display & Brightness" />
        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => updateSettings({ darkMode: false })}
              className={`p-3 rounded-xl border-2 text-center text-xs font-semibold ${
                !s.darkMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Light Mode
            </button>
            <button
              onClick={() => updateSettings({ darkMode: true })}
              className={`p-3 rounded-xl border-2 text-center text-xs font-semibold ${
                s.darkMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Dark Mode
            </button>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Brightness</span>
              <span className="font-mono-num">{s.brightness}%</span>
            </div>
            <input
              type="range"
              min={25}
              max={100}
              value={s.brightness}
              onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
              className="w-full accent-blue-500"
            />
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
            <div className="p-3.5 flex items-center justify-between text-xs font-medium">
              <span>True Tone</span>
              <Toggle checked={s.trueTone} onChange={(v) => updateSettings({ trueTone: v })} />
            </div>
            <div className="p-3.5 flex items-center justify-between text-xs font-medium">
              <span>Always On Display</span>
              <Toggle checked={s.alwaysOnDisplay} onChange={(v) => updateSettings({ alwaysOnDisplay: v })} />
            </div>
            <div className="p-3.5 flex items-center justify-between text-xs font-medium">
              <span>Orientation Lock</span>
              <Toggle checked={s.rotationLock} onChange={(v) => updateSettings({ rotationLock: v })} />
            </div>
          </div>

          {/* Screen Rotation / Orientation */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 space-y-2.5">
            <p className="text-xs font-bold">Screen Orientation</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => rotateDevice(false)}
                className={`p-2.5 rounded-xl border-2 text-center text-xs font-semibold ${
                  !isLandscape ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => rotateDevice(true)}
                className={`p-2.5 rounded-xl border-2 text-center text-xs font-semibold ${
                  isLandscape ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Landscape (Rotate)
              </button>
            </div>
          </div>

          {/* Hardware Titanium Finish */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 space-y-2.5">
            <p className="text-xs font-bold">iPhone 18 Pro Max Finish</p>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ['obsidian', 'Obsidian', 'bg-zinc-900'],
                  ['silver', 'Silver', 'bg-zinc-300'],
                  ['glacier', 'Glacier', 'bg-sky-200'],
                  ['burgundy', 'Burgundy', 'bg-rose-950'],
                ] as Array<[TitaniumFinish, string, string]>
              ).map(([id, label, swatch]) => (
                <button
                  key={id}
                  onClick={() => updateSettings({ finish: id })}
                  className={`p-2 rounded-xl border text-center space-y-1 ${
                    s.finish === id ? 'border-blue-500' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full mx-auto border border-white/20 ${swatch}`} />
                  <p className="text-[10px] font-medium">{label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'wallpaper') {
    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <SectionHeader title="Wallpaper" />
        <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.id}
              onClick={() => updateSettings({ wallpaper: wp.id })}
              className={`rounded-2xl overflow-hidden border-2 text-left ${
                s.wallpaper === wp.id ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <img src={wp.src} alt={wp.name} className="w-full h-44 object-cover" />
              <div className="p-2 bg-white dark:bg-zinc-900 text-xs font-semibold truncate">{wp.name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'sounds') {
    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <SectionHeader title="Sounds & Haptics" />
        <div className="p-4 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Ringer & Alerts Volume</span>
              <span className="font-mono-num">{s.volume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={s.volume}
              onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
              className="w-full accent-blue-500"
            />
          </div>
          <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
            <div className="p-3.5 flex items-center justify-between text-xs font-medium">
              <div>
                <p>Silent Mode</p>
                <p className="text-[10px] text-zinc-500">Mutes ringtones and system alert sounds</p>
              </div>
              <Toggle checked={s.silentMode} onChange={(v) => updateSettings({ silentMode: v })} />
            </div>
            <div className="p-3.5 flex items-center justify-between text-xs font-medium">
              <span>System Sound Effects</span>
              <Toggle checked={s.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} />
            </div>
            <div className="p-3.5 flex items-center justify-between text-xs font-medium">
              <span>System Haptics</span>
              <Toggle checked={s.hapticsEnabled} onChange={(v) => updateSettings({ hapticsEnabled: v })} />
            </div>
            <div className="p-3.5 flex items-center justify-between text-xs font-medium">
              <span>Keyboard Haptics</span>
              <Toggle checked={s.keyboardHaptics} onChange={(v) => updateSettings({ keyboardHaptics: v })} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'microphone') {
    const micOn = s.microphoneEnabled !== false;
    const gain = s.microphoneGain ?? 100;
    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <div className="px-3 pt-3 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => {
              stopMicHardwareTest();
              setTestingMic(false);
              setSection('root');
            }}
            className="flex items-center gap-0.5 text-sm font-medium text-blue-500"
          >
            <ChevronLeft className="w-5 h-5" />
            Settings
          </button>
          <span className="text-sm font-bold">Microphone Hardware</span>
          <div className="w-14" />
        </div>

        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
          {/* Master Hardware Mic Array Switch */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  micOn ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                }`}
              >
                {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold">Studio Microphone Array</p>
                <p className="text-[10px] text-zinc-500">
                  {micOn ? 'Hardware active for Calls, Siri & Voice Memos' : 'Hardware muted across all apps'}
                </p>
              </div>
            </div>
            <Toggle
              checked={micOn}
              onChange={() => {
                toggleMicrophoneHardware();
                if (micOn) setTestingMic(false);
              }}
            />
          </div>

          {/* Input Preamp Gain */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Microphone Input Gain</span>
              <span className="font-mono-num">{gain}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={gain}
              onChange={(e) => updateSettings({ microphoneGain: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Live Acoustic Test & VU Meter */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">Live Hardware Acoustic Test</p>
                <p className="text-[10px] text-zinc-500">
                  {testingMic || micHardwareActive
                    ? `Capturing real audio · Level ${micLevel}%`
                    : 'Tap Test to check physical mic input'}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (testingMic) {
                    stopMicHardwareTest();
                    setTestingMic(false);
                  } else {
                    setMicScanError('');
                    const res = await startMicHardwareTest();
                    if (res.ok) {
                      setTestingMic(true);
                      await scanMicrophones(false);
                    } else {
                      setMicScanError(res.error || 'Unable to start mic test.');
                    }
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  testingMic
                    ? 'bg-rose-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {testingMic ? 'Stop Test' : 'Test Mic'}
              </button>
            </div>

            <div className="h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden p-0.5 flex items-center gap-0.5">
              {Array.from({ length: 16 }).map((_, idx) => {
                const threshold = (idx + 1) * (100 / 16);
                const lit = micLevel >= threshold - 4;
                return (
                  <div
                    key={idx}
                    className={`flex-1 h-full rounded-full transition-colors ${
                      lit
                        ? idx > 12
                          ? 'bg-rose-500'
                          : idx > 9
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                        : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  />
                );
              })}
            </div>
            {micScanError && <p className="text-[11px] text-rose-500 font-medium">{micScanError}</p>}
          </div>

          {/* Physical Audio Input Devices */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">Detected Hardware Inputs</p>
              <button
                onClick={() => scanMicrophones(true)}
                disabled={scanningMics}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500"
              >
                <RefreshCw className={`w-3 h-3 ${scanningMics ? 'animate-spin' : ''}`} />
                Scan Hardware
              </button>
            </div>

            {micDevices.length === 0 ? (
              <p className="text-[11px] text-zinc-500">
                Tap &ldquo;Scan Hardware&rdquo; to detect your connected physical microphones.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <button
                  onClick={() => updateSettings({ microphoneDeviceId: '' })}
                  className="w-full py-2.5 flex items-center justify-between text-xs text-left"
                >
                  <span className="font-medium">Automatic System Default</span>
                  {!s.microphoneDeviceId && <span className="text-blue-500 font-bold">Active ✓</span>}
                </button>
                {micDevices.map((dev, i) => (
                  <button
                    key={dev.deviceId || i}
                    onClick={() => updateSettings({ microphoneDeviceId: dev.deviceId })}
                    className="w-full py-2.5 flex items-center justify-between text-xs text-left gap-2"
                  >
                    <span className="truncate">{dev.label || `Microphone Input ${i + 1}`}</span>
                    {s.microphoneDeviceId === dev.deviceId && (
                      <span className="text-blue-500 font-bold shrink-0">Active ✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (section === 'focus') {
    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <SectionHeader title="Focus" />
        <div className="p-4 space-y-2">
          {(['off', 'dnd', 'work', 'sleep', 'personal'] as FocusMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ focusMode: mode })}
              className="w-full rounded-2xl bg-white dark:bg-zinc-900 p-3.5 flex items-center justify-between text-xs font-semibold capitalize"
            >
              <span>{mode === 'dnd' ? 'Do Not Disturb' : mode}</span>
              {s.focusMode === mode && <span className="text-blue-500">Active ✓</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'actionbutton') {
    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <SectionHeader title="Action Button" />
        <div className="p-4 space-y-2">
          <p className="text-xs text-zinc-500 mb-2">Choose what the physical side Action Button triggers:</p>
          {(
            [
              ['camera', 'Open Camera'],
              ['flashlight', 'Toggle Flashlight'],
              ['siri', 'Activate Siri AI'],
              ['voicememo', 'Open Voice Memos'],
              ['silent', 'Toggle Silent Mode'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => updateSettings({ actionButtonAction: id })}
              className="w-full rounded-2xl bg-white dark:bg-zinc-900 p-3.5 flex items-center justify-between text-xs font-semibold"
            >
              <span>{label}</span>
              {s.actionButtonAction === id && <span className="text-blue-500">Selected ✓</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'general') {
    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <SectionHeader title="General" />
        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Model Name</span><span className="font-semibold">iPhone 18 Pro Max</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">iOS Version</span><span className="font-semibold">iOS 20.1 (Liquid Glass)</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Display</span><span className="font-semibold">6.9&quot; Super Retina XDR 120Hz</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Installed Apps</span><span className="font-semibold font-mono-num">{state.installedAppIds.length}</span></div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
            <div className="p-3.5 flex items-center justify-between text-xs">
              <span className="font-medium flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> Language</span>
              <select
                value={s.language}
                onChange={(e) => updateSettings({ language: e.target.value })}
                className="bg-transparent text-zinc-500 outline-none"
              >
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Español</option>
                <option>Français</option>
                <option>日本語</option>
              </select>
            </div>
            <button onClick={() => openApp('storage')} className="w-full p-3.5 flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-indigo-500" /> iPhone Storage</span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-3.5 space-y-2">
            {confirmReset ? (
              <div className="space-y-2">
                <p className="text-xs text-rose-500 font-semibold">Erase all simulator data, photos, and installed apps?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmReset(false)} className="flex-1 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-semibold">
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setConfirmReset(false);
                      await resetSimulator();
                    }}
                    className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
                  >
                    Erase All
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-rose-500 py-1"
              >
                <RotateCcw className="w-4 h-4" />
                Reset iPhone Simulator
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (section === 'faceid') {
    const activePinLength =
      passcodeFlow === 'verify-enter' || passcodeFlow === 'change-verify' || passcodeFlow === 'disable-verify'
        ? (s.passcode.length === 4 ? 4 : 6)
        : pinLength;

    const flowTitle =
      passcodeFlow === 'verify-enter'
        ? 'Enter Passcode'
        : passcodeFlow === 'change-verify'
          ? 'Enter Old Passcode'
          : passcodeFlow === 'disable-verify'
            ? 'Enter Passcode to Turn Off'
            : passcodeFlow === 'set-new'
              ? 'Enter a New Passcode'
              : passcodeFlow === 'set-confirm'
                ? 'Re-enter Your Passcode'
                : '';

    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <SectionHeader title="Face ID & Passcode" />

        {passcodeFlow !== 'none' ? (
          <div className="flex-1 flex flex-col items-center justify-between p-5">
            <div className="text-center space-y-3 pt-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold">{flowTitle}</h2>
              <p className="text-[11px] text-zinc-500">
                {passcodeFlow === 'set-new'
                  ? `Choose a ${pinLength}-digit passcode to lock your iPhone`
                  : passcodeFlow === 'set-confirm'
                    ? 'Verify your new passcode'
                    : 'Verify your identity to continue'}
              </p>

              {/* PIN Dots */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {Array.from({ length: activePinLength }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      i < pinBuffer.length
                        ? 'bg-blue-500 border-blue-500 scale-110'
                        : 'border-zinc-400 dark:border-zinc-600'
                    }`}
                  />
                ))}
              </div>

              {pinError && <p className="text-xs font-semibold text-rose-500 pt-1">{pinError}</p>}

              {passcodeFlow === 'set-new' && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPinLength(4);
                      setPinBuffer('');
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                      pinLength === 4 ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    4-Digit Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinLength(6);
                      setPinBuffer('');
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                      pinLength === 6 ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    6-Digit Code
                  </button>
                </div>
              )}
            </div>

            {/* Numeric Keypad */}
            <div className="w-full max-w-[260px] space-y-2.5 pb-2">
              <div className="grid grid-cols-3 gap-2.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handlePasscodeDigit(d)}
                    className="h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-lg font-semibold active:scale-95 transition-transform shadow-xs"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    if (passcodeFlow === 'verify-enter' && !passcodeUnlocked) {
                      setSection('root');
                    } else {
                      setPasscodeFlow('none');
                    }
                    setPinBuffer('');
                    setPinDraft('');
                    setPinError('');
                  }}
                  className="h-14 rounded-2xl text-xs font-semibold text-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handlePasscodeDigit('0')}
                  className="h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-lg font-semibold active:scale-95 transition-transform shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPinBuffer((prev) => prev.slice(0, -1))}
                  className="h-14 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  aria-label="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
            {pinSuccessMsg && (
              <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {pinSuccessMsg}
              </div>
            )}

            <div className="rounded-2xl bg-white dark:bg-zinc-900 p-3.5 flex items-center justify-between text-xs font-medium">
              <div>
                <p className="font-semibold">Unlock iPhone with Face ID</p>
                <p className="text-[10px] text-zinc-500">Turn off to require Passcode immediately on unlock</p>
              </div>
              <Toggle checked={s.faceIdEnabled} onChange={(v) => updateSettings({ faceIdEnabled: v })} />
            </div>

            <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
              <div className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="font-semibold">iPhone Passcode</p>
                    <p className="text-[10px] text-zinc-500">
                      {s.passcodeEnabled && s.passcode
                        ? `${s.passcode.length}-digit passcode active`
                        : 'No passcode set'}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    s.passcodeEnabled && s.passcode ? 'text-emerald-500' : 'text-zinc-400'
                  }`}
                >
                  {s.passcodeEnabled && s.passcode ? 'On' : 'Off'}
                </span>
              </div>

              {!s.passcodeEnabled || !s.passcode ? (
                <button
                  type="button"
                  onClick={() => {
                    setPinBuffer('');
                    setPinDraft('');
                    setPinError('');
                    setPinSuccessMsg('');
                    setPasscodeFlow('set-new');
                  }}
                  className="w-full p-3.5 text-left text-xs font-bold text-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  Turn Passcode On
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setPinBuffer('');
                      setPinDraft('');
                      setPinError('');
                      setPinSuccessMsg('');
                      setPasscodeFlow('change-verify');
                    }}
                    className="w-full p-3.5 text-left text-xs font-bold text-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    Change Passcode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinBuffer('');
                      setPinDraft('');
                      setPinError('');
                      setPinSuccessMsg('');
                      setPasscodeFlow('disable-verify');
                    }}
                    className="w-full p-3.5 text-left text-xs font-bold text-rose-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    Turn Passcode Off
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (section === 'privacy' || section === 'accessibility' || section === 'safari') {
    return (
      <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <SectionHeader title={section === 'privacy' ? 'Privacy & Security' : section === 'accessibility' ? 'Accessibility' : 'Safari'} />
        <div className="p-4 space-y-3">
          {section === 'accessibility' && (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="p-3.5 flex items-center justify-between text-xs font-medium">
                <span>Reduce Motion</span>
                <Toggle checked={s.reduceMotion} onChange={(v) => updateSettings({ reduceMotion: v })} />
              </div>
              <div className="p-3.5 flex items-center justify-between text-xs font-medium">
                <span>Bold Text</span>
                <Toggle checked={s.boldText} onChange={(v) => updateSettings({ boldText: v })} />
              </div>
            </div>
          )}
          {section === 'safari' && (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="p-3.5 flex items-center justify-between text-xs font-medium">
                <span>Block Pop-ups</span>
                <Toggle checked={s.safariBlockPopups} onChange={(v) => updateSettings({ safariBlockPopups: v })} />
              </div>
              <div className="p-3.5 flex items-center justify-between text-xs font-medium">
                <span>Default Private Mode</span>
                <Toggle checked={s.safariPrivateDefault} onChange={(v) => updateSettings({ safariPrivateDefault: v })} />
              </div>
            </div>
          )}
          {section === 'privacy' && (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 text-xs space-y-2 text-zinc-500">
              <p className="font-semibold text-zinc-900 dark:text-white">Browser App Permissions</p>
              <p>Camera & Microphone access are requested only when opening Camera, FaceTime, QR Scanner, or Voice Memos.</p>
              <p>All photos, notes, passwords, and settings persist locally in your browser&apos;s IndexedDB & LocalStorage.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const rows: Array<{ id: string; label: string; icon: React.ReactNode; action: () => void; right?: string }> = [
    { id: 'wifi', label: 'Wi-Fi & Network', icon: <Wifi className="w-4 h-4 text-blue-500" />, action: () => setSection('wifi'), right: s.unlimitedNetworkMode !== false ? 'Unlimited 5G⁺' : s.wifi ? s.wifiNetwork : 'Off' },
    { id: 'bluetooth', label: 'Bluetooth', icon: <Bluetooth className="w-4 h-4 text-blue-500" />, action: () => setSection('bluetooth'), right: s.bluetooth ? 'On' : 'Off' },
    { id: 'focus', label: 'Focus', icon: <Moon className="w-4 h-4 text-indigo-500" />, action: () => setSection('focus'), right: s.focusMode === 'off' ? 'Off' : s.focusMode },
    { id: 'general', label: 'General', icon: <Smartphone className="w-4 h-4 text-zinc-500" />, action: () => setSection('general') },
    { id: 'display', label: 'Display & Brightness', icon: <Sun className="w-4 h-4 text-sky-500" />, action: () => setSection('display') },
    { id: 'wallpaper', label: 'Wallpaper', icon: <Wallpaper className="w-4 h-4 text-cyan-500" />, action: () => setSection('wallpaper') },
    { id: 'actionbutton', label: 'Action Button', icon: <Zap className="w-4 h-4 text-amber-500" />, action: () => setSection('actionbutton') },
    { id: 'sounds', label: 'Sounds & Haptics', icon: <Volume2 className="w-4 h-4 text-rose-500" />, action: () => setSection('sounds') },
    {
      id: 'microphone',
      label: 'Microphone Hardware',
      icon: <Mic className="w-4 h-4 text-emerald-500" />,
      action: () => {
        setSection('microphone');
        scanMicrophones(false);
      },
      right: s.microphoneEnabled === false ? 'Muted' : 'Ready',
    },
    { id: 'battery', label: 'Battery', icon: <Battery className="w-4 h-4 text-emerald-500" />, action: () => openApp('battery'), right: `${state.batteryLevel}%` },
    {
      id: 'faceid',
      label: 'Face ID & Passcode',
      icon: <ScanFace className="w-4 h-4 text-emerald-500" />,
      action: openFaceIdSection,
      right: s.passcodeEnabled && s.passcode ? 'Passcode On' : 'Off',
    },
    { id: 'privacy', label: 'Privacy & Security', icon: <Shield className="w-4 h-4 text-blue-500" />, action: () => setSection('privacy') },
    { id: 'accessibility', label: 'Accessibility', icon: <Accessibility className="w-4 h-4 text-blue-600" />, action: () => setSection('accessibility') },
    { id: 'safari', label: 'Safari', icon: <Compass className="w-4 h-4 text-sky-500" />, action: () => setSection('safari') },
    { id: 'keyboard', label: 'Keyboard Haptics', icon: <Keyboard className="w-4 h-4 text-zinc-500" />, action: () => updateSettings({ keyboardHaptics: !s.keyboardHaptics }), right: s.keyboardHaptics ? 'On' : 'Off' },
  ];

  const filtered = rows.filter((r) => r.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-200/80 dark:bg-zinc-900 px-3 py-1.5">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Settings"
            className="flex-1 bg-transparent text-xs outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-4">
        {/* Apple Account Profile Card */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center">
            AM
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{s.appleIdName}</p>
            <p className="text-[11px] text-zinc-500 truncate">Apple Account, iCloud+, Media &amp; Purchases</p>
          </div>
        </div>

        {/* Airplane & Charging Quick Toggles */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
          <div className="p-3 flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-2.5"><Plane className="w-4 h-4 text-amber-500" /> Airplane Mode</span>
            <Toggle checked={s.airplaneMode} onChange={(v) => updateSettings({ airplaneMode: v, wifi: !v, cellular: !v })} />
          </div>
          <div className="p-3 flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-2.5"><Zap className="w-4 h-4 text-emerald-500" /> MagSafe Charging Sim</span>
            <Toggle checked={state.isCharging} onChange={toggleCharging} />
          </div>
        </div>

        {/* Settings List */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
          {filtered.map((row) => (
            <button
              key={row.id}
              onClick={row.action}
              className="w-full p-3 flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <span className="flex items-center gap-2.5 font-medium">
                {row.icon}
                {row.label}
              </span>
              <span className="flex items-center gap-1 text-zinc-500">
                {row.right && <span className="truncate max-w-[110px]">{row.right}</span>}
                <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
