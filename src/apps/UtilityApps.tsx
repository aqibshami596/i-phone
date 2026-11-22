import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  BatteryCharging,
  Check,
  Compass,
  Copy,
  Disc,
  Eye,
  EyeOff,
  Flashlight,
  HardDrive,
  KeyRound,
  Pause,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { APP_MAP } from '../os/appRegistry';
import { soundEngine } from '../os/soundEngine';

/* ==================== FLASHLIGHT ==================== */
export const FlashlightApp: React.FC = () => {
  const { flashlightOn, flashlightLevel, setFlashlightLevel, toggleFlashlight } = useOS();
  const [sos, setSos] = useState(false);

  return (
    <div className={`h-full flex flex-col justify-between p-6 text-white transition-colors ${flashlightOn ? 'bg-amber-950/90' : 'bg-zinc-950'}`}>
      <h1 className="text-2xl font-extrabold">Flashlight</h1>

      <div className="flex flex-col items-center gap-5">
        <button
          onClick={toggleFlashlight}
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
            flashlightOn
              ? 'bg-amber-300 text-zinc-950 shadow-[0_0_60px_rgba(252,211,77,0.75)]'
              : 'bg-zinc-900 border border-zinc-700 text-zinc-300'
          }`}
        >
          <Flashlight className="w-12 h-12" />
        </button>
        <p className="text-sm font-semibold">{flashlightOn ? `Beam Level ${flashlightLevel}/4` : 'Flashlight Off'}</p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setFlashlightLevel(lvl);
                if (!flashlightOn) toggleFlashlight();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                flashlightLevel === lvl && flashlightOn ? 'bg-amber-400 text-black' : 'bg-zinc-900'
              }`}
            >
              {lvl * 25}%
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setSos(!sos);
            if (!flashlightOn) toggleFlashlight();
          }}
          className={`w-full py-2.5 rounded-xl text-xs font-bold ${sos ? 'bg-rose-600 text-white animate-pulse' : 'bg-zinc-900'}`}
        >
          {sos ? 'Stop SOS Strobe' : 'SOS Strobe Mode'}
        </button>
      </div>
    </div>
  );
};

/* ==================== SCREEN RECORDER ==================== */
export const ScreenRecorderApp: React.FC = () => {
  const { screenRecording, screenRecordSeconds, toggleScreenRecording } = useOS();

  return (
    <div className="h-full flex flex-col justify-between bg-zinc-950 text-white p-6">
      <h1 className="text-2xl font-extrabold">Screen Recorder</h1>
      <div className="text-center space-y-4">
        <button
          onClick={toggleScreenRecording}
          className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center border-4 transition-all ${
            screenRecording ? 'border-rose-500 bg-rose-600/20 animate-pulse' : 'border-zinc-700 bg-zinc-900'
          }`}
        >
          <Disc className={`w-12 h-12 ${screenRecording ? 'text-rose-500' : 'text-zinc-300'}`} />
        </button>
        <p className="text-2xl font-mono-num font-bold">
          {Math.floor(screenRecordSeconds / 60)}:{String(screenRecordSeconds % 60).padStart(2, '0')}
        </p>
        <p className="text-xs text-zinc-400">
          {screenRecording ? 'Recording active in Dynamic Island across all apps.' : 'Tap to start recording simulator activity.'}
        </p>
      </div>
      <button onClick={toggleScreenRecording} className={`w-full py-3 rounded-2xl text-xs font-bold ${screenRecording ? 'bg-rose-600' : 'bg-blue-600'}`}>
        {screenRecording ? 'Stop Recording' : 'Start Broadcast'}
      </button>
    </div>
  );
};

/* ==================== QR SCANNER ==================== */
export const QRScannerApp: React.FC = () => {
  const { openApp } = useOS();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [payload, setPayload] = useState('https://en.m.wikipedia.org/wiki/IPhone');
  const [decoded, setDecoded] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {});
    }
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  return (
    <div className="h-full flex flex-col bg-black text-white p-4 space-y-4">
      <h1 className="text-xl font-extrabold flex items-center gap-2"><QrCode className="w-5 h-5 text-sky-400" /> Code Scanner</h1>
      <div className="relative h-56 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
        <div className="absolute w-36 h-36 border-2 border-amber-400 rounded-2xl pointer-events-none" />
      </div>
      <div className="space-y-2 text-xs">
        <p className="text-zinc-400">Simulate / Test QR Payload:</p>
        <div className="flex gap-2">
          <input value={payload} onChange={(e) => setPayload(e.target.value)} className="flex-1 rounded-xl bg-zinc-900 px-3 py-2 outline-none" />
          <button onClick={() => setDecoded(payload)} className="px-3 py-2 rounded-xl bg-amber-400 text-black font-bold">
            Decode
          </button>
        </div>
        {decoded && (
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2">
            <span className="truncate text-sky-400">{decoded}</span>
            <button onClick={() => openApp('safari')} className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-semibold shrink-0">
              Open Safari
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== COMPASS ==================== */
export const CompassApp: React.FC = () => {
  const [heading, setHeading] = useState(34);

  useEffect(() => {
    const onOrient = (e: DeviceOrientationEvent) => {
      if (typeof e.alpha === 'number') setHeading(Math.round(360 - e.alpha) % 360);
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, []);

  const cardinal = heading < 45 || heading >= 315 ? 'N' : heading < 135 ? 'E' : heading < 225 ? 'S' : 'W';

  return (
    <div className="h-full flex flex-col justify-between bg-black text-white p-5 text-center">
      <h1 className="text-xl font-extrabold text-left">Compass</h1>
      <div className="relative w-56 h-56 mx-auto rounded-full border-2 border-zinc-700 flex items-center justify-center">
        <div
          className="absolute inset-4 rounded-full border border-zinc-800 flex items-center justify-center transition-transform duration-200"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          <span className="absolute top-1 text-xs font-bold text-red-500">N</span>
          <span className="absolute right-2 text-xs font-bold text-zinc-400">E</span>
          <span className="absolute bottom-1 text-xs font-bold text-zinc-400">S</span>
          <span className="absolute left-2 text-xs font-bold text-zinc-400">W</span>
        </div>
        <Compass className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-3">
        <p className="text-4xl font-light font-mono-num">{heading}° {cardinal}</p>
        <input type="range" min={0} max={359} value={heading} onChange={(e) => setHeading(Number(e.target.value))} className="w-full accent-red-500" />
        <p className="text-[11px] text-zinc-500">37°19&apos;N 122°01&apos;W · Cupertino, CA · Elev 230 ft</p>
      </div>
    </div>
  );
};

/* ==================== UNIT CONVERTER ==================== */
export const ConverterApp: React.FC = () => {
  const [cat, setCat] = useState<'length' | 'weight' | 'temp' | 'data'>('length');
  const [val, setVal] = useState('10');
  const num = parseFloat(val) || 0;

  const conversions: Record<typeof cat, Array<[string, string]>> = {
    length: [['Meters', `${num}`], ['Kilometers', `${(num / 1000).toFixed(4)}`], ['Feet', `${(num * 3.28084).toFixed(2)}`], ['Miles', `${(num * 0.00062137).toFixed(5)}`]],
    weight: [['Kilograms', `${num}`], ['Grams', `${num * 1000}`], ['Pounds', `${(num * 2.20462).toFixed(2)}`], ['Ounces', `${(num * 35.274).toFixed(2)}`]],
    temp: [['Celsius', `${num}°C`], ['Fahrenheit', `${((num * 9) / 5 + 32).toFixed(1)}°F`], ['Kelvin', `${(num + 273.15).toFixed(2)}K`]],
    data: [['Gigabytes', `${num} GB`], ['Megabytes', `${num * 1024} MB`], ['Terabytes', `${(num / 1024).toFixed(4)} TB`]],
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4">
      <h1 className="text-xl font-extrabold flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-teal-500" /> Unit Converter</h1>
      <div className="grid grid-cols-4 gap-1.5 text-xs">
        {(['length', 'weight', 'temp', 'data'] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`py-2 rounded-xl font-semibold capitalize ${cat === c ? 'bg-teal-600 text-white' : 'bg-zinc-200 dark:bg-zinc-900'}`}>
            {c}
          </button>
        ))}
      </div>
      <input type="number" value={val} onChange={(e) => setVal(e.target.value)} className="w-full p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xl font-mono-num font-bold outline-none" />
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
        {conversions[cat].map(([label, out]) => (
          <div key={label} className="p-3.5 flex justify-between text-xs">
            <span className="text-zinc-500">{label}</span>
            <span className="font-mono-num font-bold">{out}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== PASSWORDS VAULT ==================== */
export const PasswordsApp: React.FC = () => {
  const { state, setPersisted } = useOS();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [site, setSite] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const genPass = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let out = '';
    for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setPass(out);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4 overflow-y-auto no-scrollbar">
      <h1 className="text-2xl font-extrabold flex items-center gap-2"><KeyRound className="w-6 h-6 text-blue-500" /> Passwords</h1>
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-2 text-xs">
        <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="Website (e.g. apple.com)" className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 outline-none" />
        <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Username / Email" className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 outline-none" />
        <div className="flex gap-2">
          <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password" className="flex-1 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 outline-none font-mono-num" />
          <button onClick={genPass} className="px-2.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 font-semibold">Gen</button>
        </div>
        <button
          onClick={() => {
            if (!site.trim() || !pass.trim()) return;
            setPersisted((os) => ({
              ...os,
              passwords: [{ id: `pw-${Date.now()}`, site: site.trim(), username: user.trim(), password: pass.trim(), updatedAt: Date.now() }, ...os.passwords],
            }));
            setSite(''); setUser(''); setPass('');
          }}
          className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold"
        >
          Save Password
        </button>
      </div>

      <div className="space-y-2">
        {state.passwords.map((p) => (
          <div key={p.id} className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
            <div className="flex justify-between font-bold">
              <span>{p.site}</span>
              <button onClick={() => setPersisted((os) => ({ ...os, passwords: os.passwords.filter((x) => x.id !== p.id) }))} className="text-zinc-400 hover:text-rose-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-zinc-500">{p.username}</p>
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono-num">{revealed[p.id] ? p.password : '••••••••••••'}</span>
              <div className="flex gap-2">
                <button onClick={() => setRevealed((r) => ({ ...r, [p.id]: !r[p.id] }))}>
                  {revealed[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => navigator.clipboard?.writeText(p.password)}>
                  <Copy className="w-3.5 h-3.5 text-blue-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== BATTERY DASHBOARD ==================== */
export const BatteryApp: React.FC = () => {
  const { state, updateSettings, toggleCharging } = useOS();

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4 overflow-y-auto no-scrollbar">
      <h1 className="text-2xl font-extrabold">Battery</h1>
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-extrabold font-mono-num text-emerald-500">{state.batteryLevel}%</p>
            <p className="text-xs text-zinc-500">{state.isCharging ? 'Charging via MagSafe' : 'On Battery Power'}</p>
          </div>
          <BatteryCharging className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${state.batteryLevel}%` }} />
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
        <div className="p-3.5 flex items-center justify-between">
          <span className="font-medium">Low Power Mode</span>
          <button
            onClick={() => updateSettings({ lowPowerMode: !state.settings.lowPowerMode })}
            className={`px-3 py-1 rounded-full font-semibold ${state.settings.lowPowerMode ? 'bg-amber-500 text-black' : 'bg-zinc-200 dark:bg-zinc-800'}`}
          >
            {state.settings.lowPowerMode ? 'On' : 'Off'}
          </button>
        </div>
        <div className="p-3.5 flex items-center justify-between">
          <span className="font-medium">Simulate Charging Cable</span>
          <button
            onClick={toggleCharging}
            className={`px-3 py-1 rounded-full font-semibold ${state.isCharging ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}
          >
            {state.isCharging ? 'Plugged In' : 'Unplugged'}
          </button>
        </div>
        <div className="p-3.5 flex items-center justify-between">
          <span className="font-medium">Maximum Capacity</span>
          <span className="font-mono-num font-bold text-emerald-500">100% · Normal</span>
        </div>
      </div>
    </div>
  );
};

/* ==================== STORAGE MANAGER ==================== */
export const StorageApp: React.FC = () => {
  const { state, media, uninstallApp } = useOS();
  const appsMB = state.installedAppIds.reduce((sum, id) => sum + (APP_MAP[id]?.sizeMB || 20), 0);
  const mediaMB = Math.max(12, media.length * 4);
  const totalGB = 512;
  const usedGB = Number(((appsMB + mediaMB + 14800) / 1024).toFixed(1));

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4 overflow-y-auto no-scrollbar">
      <h1 className="text-2xl font-extrabold flex items-center gap-2"><HardDrive className="w-6 h-6 text-indigo-500" /> iPhone Storage</h1>
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span>{usedGB} GB of {totalGB} GB Used</span>
          <span className="text-zinc-500 font-mono-num">{((usedGB / totalGB) * 100).toFixed(1)}%</span>
        </div>
        <div className="h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
          <div className="bg-blue-500 h-full" style={{ width: '14%' }} />
          <div className="bg-rose-500 h-full" style={{ width: '6%' }} />
          <div className="bg-amber-500 h-full" style={{ width: '4%' }} />
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
        {state.installedAppIds.map((id) => {
          const def = APP_MAP[id];
          if (!def) return null;
          return (
            <div key={id} className="p-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold">{def.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono-num">{def.sizeMB} MB</p>
              </div>
              {!def.systemApp && (
                <button onClick={() => uninstallApp(id)} className="px-2.5 py-1 rounded-full bg-rose-500/12 text-rose-500 font-semibold">
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ==================== EXTRA INSTALLABLE APP STORE APPS ==================== */
export const SketchPadApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { addMedia, pushNotification } = useOS();
  const [color, setColor] = useState('#38bdf8');
  const [drawing, setDrawing] = useState(false);

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold">SketchPad Pro</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const ctx = canvasRef.current?.getContext('2d');
              if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }}
            className="px-2.5 py-1 rounded-full bg-zinc-800 text-xs"
          >
            Clear
          </button>
          <button
            onClick={async () => {
              if (!canvasRef.current) return;
              await addMedia({
                id: `sketch-${Date.now()}`,
                type: 'photo',
                src: canvasRef.current.toDataURL('image/png'),
                name: `Sketch_${Date.now().toString().slice(-4)}.png`,
                createdAt: Date.now(),
                favorite: false,
                deleted: false,
                album: 'SketchPad',
              });
              pushNotification('photos', 'Sketch Saved', 'Exported drawing to Photos.');
            }}
            className="px-3 py-1 rounded-full bg-orange-500 text-black text-xs font-bold"
          >
            Save
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={330}
        height={420}
        onPointerDown={(e) => { setDrawing(true); draw(e); }}
        onPointerMove={draw}
        onPointerUp={() => setDrawing(false)}
        onPointerLeave={() => setDrawing(false)}
        className="flex-1 rounded-2xl bg-zinc-900 border border-zinc-800 touch-none cursor-crosshair"
      />

      <div className="flex justify-center gap-3 pb-1">
        {['#38bdf8', '#f43f5e', '#fbbf24', '#34d399', '#ffffff'].map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
          />
        ))}
      </div>
    </div>
  );
};

export const FlowFocusApp: React.FC = () => {
  const { startTimer, timerRemaining, timerRunning, pauseTimer } = useOS();
  return (
    <div className="h-full flex flex-col justify-between bg-gradient-to-b from-rose-950 to-zinc-950 text-white p-6 text-center">
      <h1 className="text-xl font-extrabold">FlowFocus Pomodoro</h1>
      <div className="space-y-2">
        <p className="text-6xl font-thin font-mono-num">
          {timerRemaining > 0 ? `${Math.floor(timerRemaining / 60)}:${String(timerRemaining % 60).padStart(2, '0')}` : '25:00'}
        </p>
        <p className="text-xs text-rose-200">Synced with Dynamic Island</p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => startTimer(25 * 60)} className="flex-1 py-3 rounded-2xl bg-rose-500 text-xs font-bold">
          25m Focus
        </button>
        <button onClick={() => (timerRemaining > 0 ? pauseTimer() : startTimer(5 * 60))} className="flex-1 py-3 rounded-2xl bg-white/15 text-xs font-bold">
          {timerRemaining > 0 ? (timerRunning ? 'Pause' : 'Resume') : '5m Break'}
        </button>
      </div>
    </div>
  );
};

export const HabitStreakApp: React.FC = () => {
  const { state, setPersisted } = useOS();
  const [title, setTitle] = useState('');

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white p-4 space-y-4">
      <h1 className="text-2xl font-extrabold text-emerald-400">HabitStreak</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setPersisted((os) => ({
            ...os,
            habits: [{ id: `hb-${Date.now()}`, title: title.trim(), streak: 1, doneToday: false }, ...os.habits],
          }));
          setTitle('');
        }}
        className="flex gap-2"
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New daily habit..." className="flex-1 rounded-xl bg-zinc-900 px-3 py-2 text-xs outline-none" />
        <button type="submit" className="px-3 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold">Add</button>
      </form>
      <div className="space-y-2.5">
        {state.habits.map((h) => (
          <button
            key={h.id}
            onClick={() =>
              setPersisted((os) => ({
                ...os,
                habits: os.habits.map((x) =>
                  x.id === h.id ? { ...x, doneToday: !x.doneToday, streak: x.doneToday ? x.streak - 1 : x.streak + 1 } : x
                ),
              }))
            }
            className="w-full p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-xs font-bold">{h.title}</p>
              <p className="text-[11px] text-emerald-400 font-mono-num">{h.streak} day streak</p>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${h.doneToday ? 'bg-emerald-500 text-black' : 'border border-zinc-600'}`}>
              {h.doneToday && <Check className="w-3.5 h-3.5" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const MetronomeApp: React.FC = () => {
  const [bpm, setBpm] = useState(110);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const ms = Math.round(60000 / bpm);
    const id = window.setInterval(() => {
      soundEngine.tap();
      setBeat((b) => (b + 1) % 4);
    }, ms);
    return () => clearInterval(id);
  }, [playing, bpm]);

  return (
    <div className="h-full flex flex-col justify-between bg-zinc-950 text-white p-6 text-center">
      <h1 className="text-xl font-extrabold text-cyan-400">Tempo Pulse</h1>
      <div className="space-y-4">
        <p className="text-6xl font-thin font-mono-num">{bpm} <span className="text-base text-zinc-400">BPM</span></p>
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full ${playing && beat === i ? 'bg-cyan-400 scale-125' : 'bg-zinc-800'} transition-transform`} />
          ))}
        </div>
        <input type="range" min={40} max={220} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-cyan-400" />
      </div>
      <button onClick={() => setPlaying(!playing)} className="w-full py-3 rounded-2xl bg-cyan-500 text-black font-bold text-xs flex items-center justify-center gap-2">
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {playing ? 'Stop Click Track' : 'Start Metronome'}
      </button>
    </div>
  );
};
