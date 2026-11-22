import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlarmClock,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudRain,
  CloudSun,
  CreditCard,
  Delete,
  Droplets,
  File,
  Flame,
  Folder,
  Heart,
  Languages,
  MapPin,
  Mic,
  Navigation,
  Pause,
  Play,
  Plus,
  Radar,
  Search,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Volume2,
  Wind,
  Zap,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { soundEngine } from '../os/soundEngine';

/* ==================== MAPS ==================== */
export const MapsApp: React.FC = () => {
  const [layer, setLayer] = useState<'standard' | 'satellite' | 'transit'>('standard');
  const [zoom, setZoom] = useState(1);
  const [dest, setDest] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const places = [
    { name: 'Apple Park', dist: '1.2 mi', eta: '4 min', x: 52, y: 42 },
    { name: 'Infinite Loop', dist: '2.4 mi', eta: '7 min', x: 34, y: 60 },
    { name: 'Shoreline Park', dist: '6.8 mi', eta: '14 min', x: 72, y: 26 },
    { name: 'San Jose Airport', dist: '9.5 mi', eta: '18 min', x: 78, y: 74 },
  ].filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const activePlace = places.find((p) => p.name === dest);

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white relative">
      {/* Map Canvas */}
      <div className={`flex-1 relative overflow-hidden ${layer === 'satellite' ? 'bg-emerald-950' : 'bg-slate-900'}`}>
        <div
          className="absolute inset-0 transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Simulated Vector Roads */}
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-55">
            <path d="M0 30 Q40 35 100 22" stroke={layer === 'transit' ? '#38bdf8' : '#64748b'} strokeWidth="1.5" fill="none" />
            <path d="M20 0 L36 100" stroke="#475569" strokeWidth="1.8" fill="none" />
            <path d="M68 0 Q62 50 76 100" stroke={layer === 'transit' ? '#10b981' : '#64748b'} strokeWidth="1.5" fill="none" />
            <path d="M0 68 L100 58" stroke="#475569" strokeWidth="1.4" fill="none" />
            {activePlace && (
              <path
                d={`M50 50 L${activePlace.x} ${activePlace.y}`}
                stroke="#3b82f6"
                strokeWidth="2.4"
                strokeDasharray="3 2"
                fill="none"
              />
            )}
          </svg>

          {/* User Blue Dot */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_16px_#3b82f6]" />

          {/* Place Pins */}
          {places.map((p) => (
            <button
              key={p.name}
              onClick={() => setDest(p.name)}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center"
            >
              <span className="px-2 py-0.5 rounded-full bg-black/75 text-[9px] font-semibold mb-0.5 whitespace-nowrap">
                {p.name}
              </span>
              <MapPin className={`w-5 h-5 ${dest === p.name ? 'text-rose-500 fill-rose-500' : 'text-amber-400'}`} />
            </button>
          ))}
        </div>

        {/* Layer & Zoom Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {(['standard', 'satellite', 'transit'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize ${
                layer === l ? 'bg-blue-600 text-white' : 'bg-black/70 text-zinc-200'
              }`}
            >
              {l}
            </button>
          ))}
          <div className="flex flex-col bg-black/70 rounded-xl overflow-hidden mt-1">
            <button onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))} className="px-2.5 py-1 text-xs font-bold">+</button>
            <button onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))} className="px-2.5 py-1 text-xs font-bold border-t border-white/10">−</button>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-3.5 space-y-2.5">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Apple Park, Airports..."
            className="flex-1 bg-transparent text-xs outline-none"
          />
        </div>
        {activePlace ? (
          <div className="flex items-center justify-between bg-blue-600/15 border border-blue-500/30 rounded-xl p-2.5">
            <div>
              <p className="text-xs font-bold">{activePlace.name}</p>
              <p className="text-[11px] text-sky-300">{activePlace.eta} · {activePlace.dist} via I-280</p>
            </div>
            <button
              onClick={() => setDest(null)}
              className="px-3 py-1 rounded-full bg-blue-600 text-xs font-semibold flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" /> End
            </button>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {places.map((p) => (
              <button
                key={p.name}
                onClick={() => setDest(p.name)}
                className="px-3 py-1.5 rounded-full bg-zinc-800 text-[11px] whitespace-nowrap shrink-0"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== WEATHER ==================== */
const CITIES = [
  { name: 'Cupertino', temp: 72, cond: 'Partly Cloudy', hi: 76, lo: 58, uv: 6, wind: '9 mph', aqi: 24, grad: 'from-sky-500 via-blue-700 to-indigo-950' },
  { name: 'Tokyo', temp: 64, cond: 'Clear Night', hi: 68, lo: 54, uv: 1, wind: '6 mph', aqi: 31, grad: 'from-indigo-800 via-slate-900 to-black' },
  { name: 'London', temp: 53, cond: 'Light Rain', hi: 56, lo: 47, uv: 2, wind: '14 mph', aqi: 19, grad: 'from-slate-600 via-slate-800 to-zinc-950' },
  { name: 'New York', temp: 61, cond: 'Sunny', hi: 65, lo: 49, uv: 5, wind: '11 mph', aqi: 28, grad: 'from-cyan-500 via-sky-700 to-blue-950' },
];

export const WeatherApp: React.FC = () => {
  const [cityIdx, setCityIdx] = useState(0);
  const c = CITIES[cityIdx];

  return (
    <div className={`h-full flex flex-col bg-gradient-to-b ${c.grad} text-white overflow-y-auto no-scrollbar p-4 space-y-4`}>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {CITIES.map((item, i) => (
          <button
            key={item.name}
            onClick={() => setCityIdx(i)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
              i === cityIdx ? 'bg-white text-black' : 'bg-white/15 text-white'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="text-center py-4 space-y-1">
        <h1 className="text-2xl font-bold">{c.name}</h1>
        <p className="text-6xl font-thin font-mono-num">{c.temp}°</p>
        <p className="text-sm font-medium">{c.cond}</p>
        <p className="text-xs text-white/80">H:{c.hi}° · L:{c.lo}°</p>
      </div>

      <div className="liquid-glass rounded-2xl p-3 space-y-2">
        <p className="text-[11px] font-bold uppercase text-white/75">Hourly Forecast</p>
        <div className="flex justify-between text-center text-xs">
          {['Now', '2PM', '4PM', '6PM', '8PM', '10PM'].map((hr, i) => (
            <div key={hr} className="space-y-1.5">
              <p className="text-[10px] text-white/75">{hr}</p>
              {c.cond.includes('Rain') ? <CloudRain className="w-4 h-4 mx-auto" /> : i > 3 ? <Sun className="w-4 h-4 mx-auto text-amber-300" /> : <CloudSun className="w-4 h-4 mx-auto" />}
              <p className="font-mono-num font-semibold">{c.temp - i}°</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="liquid-glass rounded-2xl p-3.5 space-y-1">
          <p className="text-[10px] text-white/75 flex items-center gap-1"><Sun className="w-3 h-3" /> UV INDEX</p>
          <p className="text-xl font-bold font-mono-num">{c.uv}</p>
          <p className="text-[11px] text-white/80">{c.uv >= 5 ? 'Moderate-High' : 'Low'}</p>
        </div>
        <div className="liquid-glass rounded-2xl p-3.5 space-y-1">
          <p className="text-[10px] text-white/75 flex items-center gap-1"><Wind className="w-3 h-3" /> WIND</p>
          <p className="text-xl font-bold font-mono-num">{c.wind}</p>
          <p className="text-[11px] text-white/80">AQI {c.aqi} · Good</p>
        </div>
      </div>
    </div>
  );
};

/* ==================== CALENDAR ==================== */
export const CalendarApp: React.FC = () => {
  const { state, setPersisted } = useOS();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('3:00 PM');

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayEvents = state.events.filter((e) => e.date === selectedDate);

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-rose-500">
          {today.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </h1>
        <CalendarIcon className="w-5 h-5 text-rose-500" />
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-zinc-400 font-semibold py-1">{d}</span>
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSel = iso === selectedDate;
          const hasEv = state.events.some((e) => e.date === iso);
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(iso)}
              className={`h-8 rounded-full flex flex-col items-center justify-center font-mono-num ${
                isSel ? 'bg-rose-500 text-white font-bold' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{day}</span>
              {hasEv && !isSel && <span className="w-1 h-1 rounded-full bg-rose-500" />}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTitle.trim()) return;
          setPersisted((os) => ({
            ...os,
            events: [
              ...os.events,
              { id: `ev-${Date.now()}`, title: newTitle.trim(), date: selectedDate, time: newTime, color: '#3b82f6' },
            ],
          }));
          setNewTitle('');
        }}
        className="flex gap-2"
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add event..."
          className="flex-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs outline-none"
        />
        <button type="submit" className="px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold">
          Add
        </button>
      </form>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
        {dayEvents.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No events on {selectedDate}</p>
        ) : (
          dayEvents.map((ev) => (
            <div key={ev.id} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">{ev.title}</p>
                <p className="text-[11px] text-zinc-500">{ev.time} {ev.location ? `· ${ev.location}` : ''}</p>
              </div>
              <button
                onClick={() => setPersisted((os) => ({ ...os, events: os.events.filter((x) => x.id !== ev.id) }))}
                className="text-zinc-400 hover:text-rose-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ==================== CLOCK (WORLD CLOCK / ALARMS / STOPWATCH / TIMER) ==================== */
export const ClockApp: React.FC = () => {
  const { appSubRoute, timerRemaining, timerRunning, startTimer, pauseTimer, resetTimer } = useOS();
  const [tab, setTab] = useState<'world' | 'alarm' | 'stopwatch' | 'timer'>(
    appSubRoute === 'stopwatch' ? 'stopwatch' : appSubRoute === 'timer' ? 'timer' : 'world'
  );
  useEffect(() => {
    if (appSubRoute === 'stopwatch' || appSubRoute === 'timer') {
      setTab(appSubRoute);
    }
  }, [appSubRoute]);
  const [alarms, setAlarms] = useState([
    { id: 'a1', time: '07:00 AM', label: 'Wake Up', enabled: true },
    { id: 'a2', time: '08:30 AM', label: 'Design Standup', enabled: false },
  ]);

  // Stopwatch state
  const [swMs, setSwMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [customMin, setCustomMin] = useState(5);

  useEffect(() => {
    if (!swRunning) return;
    const start = Date.now() - swMs;
    const id = window.setInterval(() => setSwMs(Date.now() - start), 35);
    return () => clearInterval(id);
  }, [swRunning]);

  const fmtSw = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        <h1 className="text-2xl font-extrabold capitalize">{tab === 'world' ? 'World Clock' : tab}</h1>

        {tab === 'world' && (
          <div className="divide-y divide-zinc-800">
            {[
              { city: 'Cupertino', offset: 'Today, +0HRS', tz: 'America/Los_Angeles' },
              { city: 'New York', offset: 'Today, +3HRS', tz: 'America/New_York' },
              { city: 'London', offset: 'Today, +8HRS', tz: 'Europe/London' },
              { city: 'Tokyo', offset: 'Tomorrow, +17HRS', tz: 'Asia/Tokyo' },
            ].map((w) => (
              <div key={w.city} className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-zinc-400">{w.offset}</p>
                  <p className="text-lg font-semibold">{w.city}</p>
                </div>
                <p className="text-2xl font-light font-mono-num">
                  {new Date().toLocaleTimeString([], { timeZone: w.tz, hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === 'alarm' && (
          <div className="space-y-3">
            {alarms.map((a) => (
              <div key={a.id} className="p-3.5 rounded-2xl bg-zinc-900 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-light font-mono-num">{a.time}</p>
                  <p className="text-xs text-zinc-400">{a.label}</p>
                </div>
                <button
                  onClick={() => setAlarms((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)))}
                  className={`w-11 h-6 rounded-full p-0.5 ${a.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${a.enabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'stopwatch' && (
          <div className="space-y-5 text-center pt-4">
            <p className="text-5xl font-thin font-mono-num tracking-tight">{fmtSw(swMs)}</p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => {
                  if (swRunning) setLaps((l) => [swMs, ...l]);
                  else { setSwMs(0); setLaps([]); }
                }}
                className="w-16 h-16 rounded-full bg-zinc-800 text-xs font-semibold"
              >
                {swRunning ? 'Lap' : 'Reset'}
              </button>
              <button
                onClick={() => setSwRunning(!swRunning)}
                className={`w-16 h-16 rounded-full text-xs font-semibold ${swRunning ? 'bg-rose-500/25 text-rose-400' : 'bg-emerald-500/25 text-emerald-400'}`}
              >
                {swRunning ? 'Stop' : 'Start'}
              </button>
            </div>
            <div className="divide-y divide-zinc-900 text-xs font-mono-num max-h-40 overflow-y-auto">
              {laps.map((l, i) => (
                <div key={i} className="py-2 flex justify-between text-zinc-300">
                  <span>Lap {laps.length - i}</span>
                  <span>{fmtSw(l)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'timer' && (
          <div className="space-y-5 text-center pt-3">
            <p className="text-5xl font-thin font-mono-num text-amber-400">
              {Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, '0')}
            </p>
            <div className="flex justify-center gap-2">
              {[1, 3, 5, 10].map((m) => (
                <button
                  key={m}
                  onClick={() => setCustomMin(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${customMin === m ? 'bg-amber-500 text-black' : 'bg-zinc-900'}`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-5">
              <button onClick={resetTimer} className="w-16 h-16 rounded-full bg-zinc-800 text-xs font-semibold">
                Cancel
              </button>
              {timerRemaining > 0 ? (
                <button onClick={pauseTimer} className="w-16 h-16 rounded-full bg-amber-500/25 text-amber-400 text-xs font-semibold">
                  {timerRunning ? 'Pause' : 'Resume'}
                </button>
              ) : (
                <button onClick={() => startTimer(customMin * 60)} className="w-16 h-16 rounded-full bg-emerald-500/25 text-emerald-400 text-xs font-semibold">
                  Start
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">Active timers run live inside Dynamic Island.</p>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-900 grid grid-cols-4 py-1.5 text-[10px] font-medium">
        {(
          [
            ['world', 'World', Clock],
            ['alarm', 'Alarms', AlarmClock],
            ['stopwatch', 'Stopwatch', Activity],
            ['timer', 'Timer', Zap],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-0.5 py-1 ${tab === id ? 'text-amber-400' : 'text-zinc-500'}`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ==================== CALCULATOR ==================== */
export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);
  const [scientific, setScientific] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const pressNum = (n: string) => {
    soundEngine.keyClick();
    if (resetNext || display === '0') {
      setDisplay(n === '.' ? '0.' : n);
      setResetNext(false);
    } else {
      if (n === '.' && display.includes('.')) return;
      setDisplay((d) => d + n);
    }
  };

  const compute = (a: number, b: number, operator: string) => {
    if (operator === '+') return a + b;
    if (operator === '-') return a - b;
    if (operator === '×') return a * b;
    if (operator === '÷') return b === 0 ? 0 : a / b;
    return b;
  };

  const pressOp = (nextOp: string) => {
    soundEngine.keyClick();
    const cur = parseFloat(display);
    if (prev !== null && op && !resetNext) {
      const res = compute(prev, cur, op);
      setDisplay(String(Number(res.toFixed(6))));
      setPrev(res);
    } else {
      setPrev(cur);
    }
    setOp(nextOp);
    setResetNext(true);
  };

  const equals = () => {
    soundEngine.tap();
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    const res = Number(compute(prev, cur, op).toFixed(6));
    setHistory((h) => [`${prev} ${op} ${cur} = ${res}`, ...h].slice(0, 6));
    setDisplay(String(res));
    setPrev(null);
    setOp(null);
    setResetNext(true);
  };

  return (
    <div className="h-full bg-black text-white p-4 flex flex-col justify-between select-none">
      <div className="flex items-center justify-between text-xs">
        <button onClick={() => setScientific(!scientific)} className="px-3 py-1 rounded-full bg-zinc-900 text-amber-400 font-semibold">
          {scientific ? 'Basic' : 'Scientific'}
        </button>
        {history[0] && <span className="text-[11px] text-zinc-500 font-mono-num truncate max-w-[170px]">{history[0]}</span>}
      </div>

      <div className="text-right px-2 pt-4">
        <p className="text-5xl font-light font-mono-num tracking-tight truncate">{display}</p>
      </div>

      {scientific && (
        <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
          {[
            ['sin', (x: number) => Math.sin(x)],
            ['cos', (x: number) => Math.cos(x)],
            ['√', (x: number) => Math.sqrt(Math.max(0, x))],
            ['x²', (x: number) => x * x],
          ].map(([label, fn]) => (
            <button
              key={label as string}
              onClick={() => setDisplay(String(Number((fn as (x: number) => number)(parseFloat(display)).toFixed(5))))}
              className="py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800"
            >
              {label as string}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2.5 pb-2">
        <button onClick={() => { setDisplay('0'); setPrev(null); setOp(null); }} className="h-14 rounded-full bg-zinc-400 text-black font-bold">AC</button>
        <button onClick={() => setDisplay((d) => String(-parseFloat(d)))} className="h-14 rounded-full bg-zinc-400 text-black font-bold">+/-</button>
        <button onClick={() => setDisplay((d) => String(parseFloat(d) / 100))} className="h-14 rounded-full bg-zinc-400 text-black font-bold">%</button>
        <button onClick={() => pressOp('÷')} className="h-14 rounded-full bg-amber-500 text-white text-xl font-bold">÷</button>

        {['7', '8', '9'].map((n) => <button key={n} onClick={() => pressNum(n)} className="h-14 rounded-full bg-zinc-800 text-xl font-medium">{n}</button>)}
        <button onClick={() => pressOp('×')} className="h-14 rounded-full bg-amber-500 text-white text-xl font-bold">×</button>

        {['4', '5', '6'].map((n) => <button key={n} onClick={() => pressNum(n)} className="h-14 rounded-full bg-zinc-800 text-xl font-medium">{n}</button>)}
        <button onClick={() => pressOp('-')} className="h-14 rounded-full bg-amber-500 text-white text-xl font-bold">−</button>

        {['1', '2', '3'].map((n) => <button key={n} onClick={() => pressNum(n)} className="h-14 rounded-full bg-zinc-800 text-xl font-medium">{n}</button>)}
        <button onClick={() => pressOp('+')} className="h-14 rounded-full bg-amber-500 text-white text-xl font-bold">+</button>

        <button onClick={() => pressNum('0')} className="col-span-2 h-14 rounded-full bg-zinc-800 text-xl font-medium text-left pl-6">0</button>
        <button onClick={() => pressNum('.')} className="h-14 rounded-full bg-zinc-800 text-xl font-medium">.</button>
        <button onClick={equals} className="h-14 rounded-full bg-amber-500 text-white text-xl font-bold">=</button>
      </div>
    </div>
  );
};

/* ==================== NOTES ==================== */
export const NotesApp: React.FC = () => {
  const { state, setPersisted } = useOS();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const note = state.notes.find((n) => n.id === selectedId);

  if (note) {
    return (
      <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedId(null)} className="flex items-center text-xs text-amber-500 font-semibold">
            <ChevronLeft className="w-4 h-4" /> Notes
          </button>
          <button
            onClick={() => {
              setPersisted((os) => ({ ...os, notes: os.notes.filter((n) => n.id !== note.id) }));
              setSelectedId(null);
            }}
            className="text-rose-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <input
          value={note.title}
          onChange={(e) =>
            setPersisted((os) => ({
              ...os,
              notes: os.notes.map((n) => (n.id === note.id ? { ...n, title: e.target.value, updatedAt: Date.now() } : n)),
            }))
          }
          className="text-lg font-bold bg-transparent outline-none"
        />
        <textarea
          value={note.body}
          onChange={(e) =>
            setPersisted((os) => ({
              ...os,
              notes: os.notes.map((n) => (n.id === note.id ? { ...n, body: e.target.value, updatedAt: Date.now() } : n)),
            }))
          }
          className="flex-1 bg-transparent text-xs leading-relaxed outline-none resize-none"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Notes</h1>
        <button
          onClick={() => {
            const id = `n-${Date.now()}`;
            setPersisted((os) => ({
              ...os,
              notes: [{ id, title: 'Untitled Note', body: '', folder: 'Notes', pinned: false, updatedAt: Date.now() }, ...os.notes],
            }));
            setSelectedId(id);
          }}
          className="p-2 rounded-full bg-amber-500 text-black"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-zinc-200/80 dark:bg-zinc-900 px-3 py-1.5">
        <Search className="w-4 h-4 text-zinc-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Notes" className="flex-1 bg-transparent text-xs outline-none" />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
        {state.notes
          .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))
          .map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              className="w-full text-left p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1"
            >
              <p className="text-xs font-bold truncate">{n.title || 'Untitled'}</p>
              <p className="text-[11px] text-zinc-500 line-clamp-2">{n.body || 'No additional text'}</p>
            </button>
          ))}
      </div>
    </div>
  );
};

/* ==================== REMINDERS ==================== */
export const RemindersApp: React.FC = () => {
  const { state, setPersisted } = useOS();
  const [text, setText] = useState('');

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4">
      <h1 className="text-2xl font-extrabold text-blue-500">Reminders</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setPersisted((os) => ({
            ...os,
            reminders: [
              { id: `rem-${Date.now()}`, title: text.trim(), list: 'Today', priority: 'medium', flagged: false, completed: false },
              ...os.reminders,
            ],
          }));
          setText('');
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New Reminder..."
          className="flex-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs outline-none"
        />
        <button type="submit" className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Add</button>
      </form>
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
        {state.reminders.map((r) => (
          <div key={r.id} className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <button
              onClick={() =>
                setPersisted((os) => ({
                  ...os,
                  reminders: os.reminders.map((x) => (x.id === r.id ? { ...x, completed: !x.completed } : x)),
                }))
              }
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                r.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-zinc-400'
              }`}
            >
              {r.completed && <Check className="w-3 h-3" />}
            </button>
            <span className={`flex-1 text-xs ${r.completed ? 'line-through text-zinc-500' : 'font-medium'}`}>{r.title}</span>
            <button
              onClick={() => setPersisted((os) => ({ ...os, reminders: os.reminders.filter((x) => x.id !== r.id) }))}
              className="text-zinc-400 hover:text-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== FILES ==================== */
export const FilesApp: React.FC = () => {
  const { media, state, openApp } = useOS();
  const [folder, setFolder] = useState<'root' | 'photos' | 'downloads' | 'memos'>('root');

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        {folder !== 'root' ? (
          <button onClick={() => setFolder('root')} className="flex items-center text-xs text-blue-500 font-semibold">
            <ChevronLeft className="w-4 h-4" /> iCloud Drive
          </button>
        ) : (
          <h1 className="text-2xl font-extrabold">Files</h1>
        )}
      </div>

      {folder === 'root' ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'photos', name: 'Photos Media', count: `${media.filter((m) => !m.deleted).length} items` },
            { id: 'downloads', name: 'Downloads', count: `${state.safariDownloads.length} files` },
            { id: 'memos', name: 'Voice Memos', count: `${state.voiceMemos.length} clips` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFolder(f.id as typeof folder)}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left space-y-1.5"
            >
              <Folder className="w-8 h-8 text-sky-500" />
              <p className="text-xs font-bold">{f.name}</p>
              <p className="text-[10px] text-zinc-500">{f.count}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto no-scrollbar">
          {folder === 'photos' &&
            media.filter((m) => !m.deleted).map((m) => (
              <button key={m.id} onClick={() => openApp('photos')} className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 flex items-center gap-3 text-left">
                <File className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-medium truncate">{m.name}</span>
              </button>
            ))}
          {folder === 'downloads' &&
            state.safariDownloads.map((d) => (
              <div key={d.id} className="p-3 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-between text-xs">
                <span>{d.name}</span>
                <span className="text-zinc-500">{d.size}</span>
              </div>
            ))}
          {folder === 'memos' &&
            state.voiceMemos.map((v) => (
              <button key={v.id} onClick={() => openApp('voicememos')} className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-between text-xs">
                <span>{v.title}</span>
                <span className="text-zinc-500 font-mono-num">{v.durationSec}s</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

/* ==================== VOICE MEMOS ==================== */
export const VoiceMemosApp: React.FC = () => {
  const { state, setPersisted } = useOS();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  const toggleRecord = async () => {
    setMicError('');
    if (recording) {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      setRecording(false);
      setSeconds(0);
      return;
    }

    if (state.settings.microphoneEnabled === false) {
      setMicError('Hardware Microphone is turned OFF. Enable it on the bottom chassis switch, Control Center, or Settings.');
      return;
    }

    setSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: state.settings.microphoneDeviceId
          ? { deviceId: { ideal: state.settings.microphoneDeviceId } }
          : true,
      });
      setRecording(true);
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPersisted((os) => ({
            ...os,
            voiceMemos: [
              {
                id: `vm-${Date.now()}`,
                title: `Voice Memo #${os.voiceMemos.length + 1}`,
                createdAt: Date.now(),
                durationSec: seconds || 3,
                audioDataUrl: reader.result as string,
              },
              ...os.voiceMemos,
            ],
          }));
        };
        reader.readAsDataURL(blob);
      };
      rec.start();
      recorderRef.current = rec;
    } catch (err) {
      recorderRef.current = null;
      setRecording(false);
      setMicError(err instanceof Error ? err.message : 'Microphone permission denied or hardware unavailable.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white justify-between p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Voice Memos</h1>
        {state.settings.microphoneEnabled === false && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
            Mic Hardware Off
          </span>
        )}
      </div>
      {micError && (
        <div className="mt-2 rounded-xl bg-rose-500/15 border border-rose-500/30 p-2.5 text-[11px] text-rose-300">
          {micError}
        </div>
      )}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 my-3">
        {state.voiceMemos.map((vm) => (
          <div key={vm.id} className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">{vm.title}</p>
                <p className="text-[10px] text-zinc-400 font-mono-num">{vm.durationSec}s</p>
              </div>
              <button
                onClick={() => setPersisted((os) => ({ ...os, voiceMemos: os.voiceMemos.filter((x) => x.id !== vm.id) }))}
                className="text-zinc-500 hover:text-rose-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {vm.audioDataUrl && <audio controls src={vm.audioDataUrl} className="w-full h-8" />}
          </div>
        ))}
      </div>
      <div className="pt-2 pb-3 flex flex-col items-center gap-2 border-t border-zinc-900">
        {recording && <span className="text-xs font-mono-num text-rose-400 animate-pulse">Recording · {seconds}s</span>}
        <button
          onClick={toggleRecord}
          className="w-16 h-16 rounded-full border-4 border-white/80 p-1 flex items-center justify-center"
        >
          <div className={`w-full h-full bg-red-600 transition-all ${recording ? 'rounded-md scale-50' : 'rounded-full'}`} />
        </button>
      </div>
    </div>
  );
};

/* ==================== SHORTCUTS ==================== */
export const ShortcutsApp: React.FC = () => {
  const { updateSettings, toggleFlashlight, startTimer, openApp, pushNotification } = useOS();

  const shortcuts = [
    {
      name: 'Morning Briefing',
      desc: 'Set 2m coffee timer + open Weather',
      grad: 'from-sky-500 to-indigo-600',
      run: () => { startTimer(120); openApp('weather'); },
    },
    {
      name: 'Deep Focus Mode',
      desc: 'Enable Do Not Disturb + Dark Mode',
      grad: 'from-indigo-600 to-purple-700',
      run: () => { updateSettings({ focusMode: 'dnd', darkMode: true }); pushNotification('shortcuts', 'Shortcut Ran', 'Focus Mode & Dark Mode enabled.'); },
    },
    {
      name: 'Quick Selfie',
      desc: 'Launch Camera immediately',
      grad: 'from-amber-500 to-orange-600',
      run: () => openApp('camera'),
    },
    {
      name: 'Torch Beacon',
      desc: 'Toggle Flashlight torch',
      grad: 'from-emerald-500 to-teal-700',
      run: () => toggleFlashlight(),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white p-4 space-y-4">
      <h1 className="text-2xl font-extrabold">Shortcuts</h1>
      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((sc) => (
          <button
            key={sc.name}
            onClick={sc.run}
            className={`h-32 rounded-3xl bg-gradient-to-br ${sc.grad} p-3.5 text-left flex flex-col justify-between shadow-lg active:scale-95 transition-transform`}
          >
            <Zap className="w-5 h-5" />
            <div>
              <p className="text-xs font-bold">{sc.name}</p>
              <p className="text-[10px] text-white/80 mt-0.5">{sc.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ==================== WALLET ==================== */
export const WalletApp: React.FC = () => {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const triggerApplePay = () => {
    setPaying(true);
    setPaid(false);
    soundEngine.tap();
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
      soundEngine.unlock();
      setTimeout(() => setPaid(false), 2200);
    }, 900);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white p-4 space-y-4">
      <h1 className="text-2xl font-extrabold">Wallet</h1>

      {/* Titanium Apple Card */}
      <div className="h-44 rounded-3xl bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-600 text-zinc-950 p-5 flex flex-col justify-between shadow-2xl">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold">Apple Card</span>
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-zinc-700">Available Balance</p>
          <p className="text-2xl font-extrabold font-mono-num">$4,820.50</p>
        </div>
      </div>

      <button
        onClick={triggerApplePay}
        className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-xs font-bold flex items-center justify-center gap-2"
      >
        {paying ? 'Verifying Face ID...' : paid ? 'Done ✓ Paid with Apple Pay' : 'Simulate Apple Pay Tap'}
      </button>

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 space-y-2 text-xs">
        <p className="font-bold text-zinc-400">Latest Transactions</p>
        <div className="flex justify-between"><span>Caffè Macs</span><span className="font-mono-num">-$6.50</span></div>
        <div className="flex justify-between"><span>Apple Store Cupertino</span><span className="font-mono-num">-$129.00</span></div>
        <div className="flex justify-between"><span>Clipper Transit</span><span className="font-mono-num">-$4.25</span></div>
      </div>
    </div>
  );
};

/* ==================== HEALTH ==================== */
export const HealthApp: React.FC = () => {
  const { state, setPersisted } = useOS();

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4 overflow-y-auto no-scrollbar">
      <h1 className="text-2xl font-extrabold">Health</h1>

      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4">
        <svg viewBox="0 0 60 60" className="w-20 h-20 -rotate-90 shrink-0">
          <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(244,63,94,0.2)" strokeWidth="6" />
          <circle cx="30" cy="30" r="24" fill="none" stroke="#f43f5e" strokeWidth="6" strokeDasharray="150" strokeDashoffset={Math.max(10, 150 - (state.healthCalories / 600) * 150)} strokeLinecap="round" />
          <circle cx="30" cy="30" r="16" fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth="6" />
          <circle cx="30" cy="30" r="16" fill="none" stroke="#22c55e" strokeWidth="6" strokeDasharray="100" strokeDashoffset="24" strokeLinecap="round" />
        </svg>
        <div className="space-y-1 text-xs">
          <p className="font-bold text-rose-500">Move: {state.healthCalories} / 600 kcal</p>
          <p className="font-bold text-emerald-500">Steps: {state.healthSteps.toLocaleString()}</p>
          <p className="font-bold text-sky-500">Hydration: {state.healthWater} glasses</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setPersisted((os) => ({ ...os, healthSteps: os.healthSteps + 500, healthCalories: os.healthCalories + 35 }))}
          className="p-3.5 rounded-2xl bg-rose-500/12 text-rose-500 text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Flame className="w-4 h-4" /> +500 Steps
        </button>
        <button
          onClick={() => setPersisted((os) => ({ ...os, healthWater: os.healthWater + 1 }))}
          className="p-3.5 rounded-2xl bg-sky-500/12 text-sky-500 text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Droplets className="w-4 h-4" /> +1 Water
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold flex items-center gap-1.5 text-rose-500"><Heart className="w-4 h-4 fill-current" /> Resting Heart Rate</span>
          <span className="font-mono-num font-bold">62 BPM</span>
        </div>
        <p className="text-[11px] text-zinc-500">Sleep Last Night · 7h 42m (92% Quality)</p>
      </div>
    </div>
  );
};

/* ==================== TRANSLATE ==================== */
export const TranslateApp: React.FC = () => {
  const [fromLang, setFromLang] = useState('English');
  const [toLang, setToLang] = useState('Spanish');
  const [text, setText] = useState('Hello, welcome to iPhone 18 Pro Max!');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const runTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, from: fromLang, to: toLang }),
      });
      const data = await res.json();
      setResult(data.translated || text);
    } catch {
      setResult(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4">
      <h1 className="text-2xl font-extrabold flex items-center gap-2">
        <Languages className="w-6 h-6 text-cyan-500" /> Translate
      </h1>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <select value={fromLang} onChange={(e) => setFromLang(e.target.value)} className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          {['English', 'Spanish', 'French', 'Japanese', 'German', 'Arabic'].map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={toLang} onChange={(e) => setToLang(e.target.value)} className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          {['Spanish', 'French', 'Japanese', 'German', 'Arabic', 'English'].map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none resize-none"
      />
      <button onClick={runTranslate} className="w-full py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold">
        {loading ? 'Translating...' : 'Translate'}
      </button>
      {result && (
        <div className="p-4 rounded-2xl bg-cyan-600/15 border border-cyan-500/30 space-y-2">
          <p className="text-sm font-semibold">{result}</p>
          <button
            onClick={() => {
              if ('speechSynthesis' in window) {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(result));
              }
            }}
            className="flex items-center gap-1 text-xs text-cyan-500 font-semibold"
          >
            <Volume2 className="w-4 h-4" /> Speak
          </button>
        </div>
      )}
    </div>
  );
};

/* ==================== FIND MY ==================== */
export const FindMyApp: React.FC = () => {
  const { pushNotification } = useOS();
  const [pinged, setPinged] = useState<string | null>(null);

  const devices = [
    { name: 'iPhone 18 Pro Max', loc: 'With You · Cupertino', bat: '88%' },
    { name: 'AirPods Pro 3', loc: 'Studio Desk · 2m away', bat: '96%' },
    { name: 'MacBook Pro 16"', loc: 'Infinite Loop · 0.4 mi', bat: '79%' },
    { name: 'Apple Watch Ultra 3', loc: 'On Wrist', bat: '84%' },
  ];

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Find My</h1>
        <Radar className="w-5 h-5 text-emerald-400" />
      </div>
      <div className="h-36 rounded-3xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/20 flex items-center justify-center relative">
        <div className="w-20 h-20 rounded-full border border-emerald-400/30 animate-ping absolute" />
        <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_20px_#34d399]" />
      </div>
      <div className="space-y-2 overflow-y-auto no-scrollbar">
        {devices.map((d) => (
          <div key={d.name} className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold">{d.name}</p>
              <p className="text-[10px] text-zinc-400">{d.loc} · {d.bat}</p>
            </div>
            <button
              onClick={() => {
                soundEngine.timerRing();
                setPinged(d.name);
                pushNotification('findmy', 'Find My Sound', `Playing alert chime on ${d.name}`);
              }}
              className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold"
            >
              {pinged === d.name ? 'Ringing...' : 'Play Sound'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== TIPS ==================== */
export const TipsApp: React.FC = () => {
  const tips = [
    { title: 'Dynamic Island Live Activities', body: 'Play Music or start a Timer, then tap the Dynamic Island pill at the top to expand interactive controls.' },
    { title: 'Real Camera & 8x Zoom', body: 'Open Camera to use your real browser webcam with 0.5x to 8x zoom, video recording, and persistent Photos storage.' },
    { title: 'App Store Installs & Updates', body: 'Open App Store to install new apps like SketchPad Pro or FlowFocus, update YouTube & Spotify, or uninstall apps.' },
    { title: 'Siri Voice & AI Commands', body: 'Tap Siri or hold the side Power button to ask questions, open apps, toggle Dark Mode, or start timers.' },
    { title: 'Control Center & Titanium Finishes', body: 'Tap top-right status icons for Control Center, or open Settings to switch between Obsidian, Silver, Glacier, and Burgundy finishes.' },
  ];

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-3 overflow-y-auto no-scrollbar">
      <h1 className="text-2xl font-extrabold flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-amber-500" /> iPhone 18 Tips
      </h1>
      {tips.map((t) => (
        <div key={t.title} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
          <h3 className="text-xs font-bold">{t.title}</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">{t.body}</p>
        </div>
      ))}
    </div>
  );
};
