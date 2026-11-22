import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  Gamepad2,
  Play,
  RotateCcw,
  Settings,
  Trophy,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { soundEngine } from '../os/soundEngine';

type GameId = 'breaker' | 'snake' | 'g2048' | 'flappy';

interface GameMeta {
  id: GameId;
  title: string;
  genre: string;
  desc: string;
  grad: string;
}

const GAMES_CATALOG: GameMeta[] = [
  { id: 'breaker', title: 'Nebula Breaker', genre: 'Arcade · 60 FPS', desc: 'Bounce the plasma orb across titanium bricks and beat your high score.', grad: 'from-sky-500 to-indigo-700' },
  { id: 'snake', title: 'Titanium Snake', genre: 'Classic · Touch + Keys', desc: 'Collect energy orbs without hitting walls or your own tail.', grad: 'from-emerald-500 to-teal-700' },
  { id: 'g2048', title: '2048 Glass', genre: 'Puzzle · Strategy', desc: 'Slide numbered Liquid Glass tiles together to reach 2048.', grad: 'from-amber-500 to-rose-600' },
  { id: 'flappy', title: 'Flappy Orb', genre: 'Runner · Reflex', desc: 'Tap to pulse through glowing orbital pillars.', grad: 'from-purple-500 to-fuchsia-700' },
];

/* --- 1. NEBULA BREAKER --- */
const NebulaBreaker: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const paddleXRef = useRef(120);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let ballX = 160;
    let ballY = 230;
    let dx = 2.6;
    let dy = -2.8;
    let curScore = 0;
    const paddleW = 70;
    const bricks: Array<{ x: number; y: number; alive: boolean; color: string }> = [];
    const colors = ['#38bdf8', '#818cf8', '#f43f5e', '#fbbf24'];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        bricks.push({ x: 14 + c * 49, y: 24 + r * 22, alive: true, color: colors[r] });
      }
    }

    const loop = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bricks
      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, 43, 14);
      }

      // Paddle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(paddleXRef.current, canvas.height - 22, paddleW, 9);

      // Ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      ballX += dx;
      ballY += dy;

      if (ballX < 6 || ballX > canvas.width - 6) dx = -dx;
      if (ballY < 6) dy = -dy;

      // Paddle collision
      if (
        ballY >= canvas.height - 26 &&
        ballY <= canvas.height - 14 &&
        ballX >= paddleXRef.current &&
        ballX <= paddleXRef.current + paddleW
      ) {
        dy = -Math.abs(dy);
        const offset = (ballX - (paddleXRef.current + paddleW / 2)) / (paddleW / 2);
        dx = offset * 3.8;
        soundEngine.tap();
      }

      // Brick collision
      for (const b of bricks) {
        if (b.alive && ballX >= b.x && ballX <= b.x + 43 && ballY >= b.y && ballY <= b.y + 14) {
          b.alive = false;
          dy = -dy;
          curScore += 50;
          setScore(curScore);
          onScore(curScore);
          soundEngine.keyClick();
          break;
        }
      }

      if (bricks.every((b) => !b.alive)) {
        bricks.forEach((b) => (b.alive = true));
      }

      if (ballY > canvas.height + 10) {
        setGameOver(true);
        return;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, onScore]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-2 text-xs">
        <span className="font-mono-num font-bold">Score: {score}</span>
        {gameOver && (
          <button
            onClick={() => {
              setScore(0);
              setGameOver(false);
            }}
            className="px-3 py-1 rounded-full bg-blue-600 text-white font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={316}
        height={320}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          paddleXRef.current = Math.max(0, Math.min(316 - 70, e.clientX - rect.left - 35));
        }}
        className="rounded-2xl border border-zinc-800 bg-zinc-950 touch-none cursor-ew-resize"
      />
      <p className="text-[11px] text-zinc-400">Move finger / cursor across screen to steer paddle</p>
    </div>
  );
};

/* --- 2. TITANIUM SNAKE --- */
const TitaniumSnake: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const [snake, setSnake] = useState<Array<[number, number]>>([[7, 7], [6, 7], [5, 7]]);
  const [food, setFood] = useState<[number, number]>([11, 7]);
  const [dir, setDir] = useState<[number, number]>([1, 0]);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);

  const dirRef = useRef(dir);
  dirRef.current = dir;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && dirRef.current[1] !== 1) setDir([0, -1]);
      if (e.key === 'ArrowDown' && dirRef.current[1] !== -1) setDir([0, 1]);
      if (e.key === 'ArrowLeft' && dirRef.current[0] !== 1) setDir([-1, 0]);
      if (e.key === 'ArrowRight' && dirRef.current[0] !== -1) setDir([1, 0]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (dead) return;
    const id = window.setInterval(() => {
      setSnake((prev) => {
        const head: [number, number] = [prev[0][0] + dirRef.current[0], prev[0][1] + dirRef.current[1]];
        if (head[0] < 0 || head[0] >= 15 || head[1] < 0 || head[1] >= 15 || prev.some((p) => p[0] === head[0] && p[1] === head[1])) {
          setDead(true);
          return prev;
        }
        const ate = head[0] === food[0] && head[1] === food[1];
        const next = [head, ...prev];
        if (!ate) next.pop();
        else {
          soundEngine.keyClick();
          const ns = score + 20;
          setScore(ns);
          onScore(ns);
          setFood([Math.floor(Math.random() * 15), Math.floor(Math.random() * 15)]);
        }
        return next;
      });
    }, 145);
    return () => clearInterval(id);
  }, [dead, food, score, onScore]);

  const reset = () => {
    setSnake([[7, 7], [6, 7], [5, 7]]);
    setFood([11, 7]);
    setDir([1, 0]);
    setScore(0);
    setDead(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-2 text-xs">
        <span className="font-mono-num font-bold">Score: {score}</span>
        {dead && (
          <button onClick={reset} className="px-3 py-1 rounded-full bg-emerald-600 text-white font-semibold">
            Restart
          </button>
        )}
      </div>

      <div className="w-[270px] h-[270px] rounded-2xl bg-zinc-900 border border-zinc-800 grid grid-cols-15 grid-rows-15 p-1">
        {Array.from({ length: 225 }).map((_, idx) => {
          const x = idx % 15;
          const y = Math.floor(idx / 15);
          const isHead = snake[0][0] === x && snake[0][1] === y;
          const isBody = snake.some((s) => s[0] === x && s[1] === y);
          const isFood = food[0] === x && food[1] === y;
          return (
            <div
              key={idx}
              className={`rounded-[3px] m-[1px] ${
                isHead ? 'bg-emerald-400' : isBody ? 'bg-emerald-600' : isFood ? 'bg-rose-500 rounded-full' : 'bg-zinc-950/60'
              }`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-1.5 w-32">
        <div />
        <button onClick={() => dir[1] !== 1 && setDir([0, -1])} className="p-2 rounded-xl bg-zinc-800 flex justify-center"><ArrowUp className="w-4 h-4" /></button>
        <div />
        <button onClick={() => dir[0] !== 1 && setDir([-1, 0])} className="p-2 rounded-xl bg-zinc-800 flex justify-center"><ArrowLeft className="w-4 h-4" /></button>
        <button onClick={() => dir[1] !== -1 && setDir([0, 1])} className="p-2 rounded-xl bg-zinc-800 flex justify-center"><ArrowDown className="w-4 h-4" /></button>
        <button onClick={() => dir[0] !== -1 && setDir([1, 0])} className="p-2 rounded-xl bg-zinc-800 flex justify-center"><ArrowRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

/* --- 3. 2048 GLASS --- */
const Game2048: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const spawn = (b: number[]) => {
    const empty = b.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    if (empty.length === 0) return b;
    const pick = empty[Math.floor(Math.random() * empty.length)];
    const nb = [...b];
    nb[pick] = Math.random() < 0.9 ? 2 : 4;
    return nb;
  };

  const initBoard = () => spawn(spawn(Array(16).fill(0)));
  const [board, setBoard] = useState<number[]>(initBoard);
  const [score, setScore] = useState(0);

  const slideLine = (line: number[]) => {
    const nz = line.filter((x) => x > 0);
    let gained = 0;
    const res: number[] = [];
    for (let i = 0; i < nz.length; i++) {
      if (nz[i] === nz[i + 1]) {
        const val = nz[i] * 2;
        res.push(val);
        gained += val;
        i++;
      } else {
        res.push(nz[i]);
      }
    }
    while (res.length < 4) res.push(0);
    return { res, gained };
  };

  const move = (dir: 'left' | 'right' | 'up' | 'down') => {
    let totalGained = 0;
    let changed = false;
    const next = [...board];
    for (let i = 0; i < 4; i++) {
      const indices =
        dir === 'left'
          ? [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3]
          : dir === 'right'
          ? [i * 4 + 3, i * 4 + 2, i * 4 + 1, i * 4]
          : dir === 'up'
          ? [i, i + 4, i + 8, i + 12]
          : [i + 12, i + 8, i + 4, i];
      const line = indices.map((idx) => board[idx]);
      const { res, gained } = slideLine(line);
      totalGained += gained;
      indices.forEach((idx, k) => {
        if (next[idx] !== res[k]) changed = true;
        next[idx] = res[k];
      });
    }
    if (changed) {
      soundEngine.tap();
      const updated = spawn(next);
      setBoard(updated);
      const ns = score + totalGained;
      setScore(ns);
      onScore(Math.max(ns, ...updated));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-2 text-xs">
        <span className="font-mono-num font-bold">Score: {score}</span>
        <button
          onClick={() => {
            setBoard(initBoard());
            setScore(0);
          }}
          className="px-3 py-1 rounded-full bg-amber-600 text-white font-semibold"
        >
          New Game
        </button>
      </div>

      <div className="w-[272px] h-[272px] rounded-2xl bg-zinc-900 border border-zinc-800 p-2 grid grid-cols-4 gap-2">
        {board.map((v, i) => (
          <div
            key={i}
            className={`rounded-xl flex items-center justify-center font-bold font-mono-num text-base ${
              v === 0
                ? 'bg-zinc-800/60'
                : v <= 4
                ? 'bg-sky-900 text-sky-100'
                : v <= 16
                ? 'bg-indigo-600 text-white'
                : v <= 64
                ? 'bg-amber-500 text-black'
                : 'bg-rose-500 text-white'
            }`}
          >
            {v > 0 ? v : ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5 w-36">
        <div />
        <button onClick={() => move('up')} className="p-2 rounded-xl bg-zinc-800 flex justify-center"><ArrowUp className="w-4 h-4" /></button>
        <div />
        <button onClick={() => move('left')} className="p-2 rounded-xl bg-zinc-800 flex justify-center"><ArrowLeft className="w-4 h-4" /></button>
        <button onClick={() => move('down')} className="p-2 rounded-xl bg-zinc-800 flex justify-center"><ArrowDown className="w-4 h-4" /></button>
        <button onClick={() => move('right')} className="p-2 rounded-xl bg-zinc-800 flex justify-center"><ArrowRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

/* --- 4. FLAPPY ORB --- */
const FlappyOrb: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const [running, setRunning] = useState(false);
  const [orbY, setOrbY] = useState(130);
  const [pipes, setPipes] = useState<Array<{ x: number; gapY: number; passed?: boolean }>>([{ x: 280, gapY: 110 }]);
  const [score, setScore] = useState(0);
  const velRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      velRef.current += 0.48;
      setOrbY((y) => {
        const ny = y + velRef.current;
        if (ny < 0 || ny > 280) {
          setRunning(false);
          return 130;
        }
        return ny;
      });
      setPipes((prev) => {
        const moved = prev
          .map((p) => ({ ...p, x: p.x - 3.2 }))
          .filter((p) => p.x > -40);
        if (moved.length === 0 || moved[moved.length - 1].x < 140) {
          moved.push({ x: 310, gapY: 65 + Math.random() * 140 });
        }
        return moved;
      });
    }, 24);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    for (const p of pipes) {
      if (p.x < 74 && p.x + 36 > 46) {
        if (orbY < p.gapY - 40 || orbY > p.gapY + 40) {
          setRunning(false);
          soundEngine.lock();
        }
      }
      if (!p.passed && p.x + 36 < 46) {
        p.passed = true;
        setScore((s) => {
          const ns = s + 1;
          onScore(ns);
          return ns;
        });
      }
    }
  }, [orbY, pipes, running, onScore]);

  const flap = () => {
    soundEngine.tap();
    if (!running) {
      setOrbY(130);
      setPipes([{ x: 280, gapY: 120 }]);
      setScore(0);
      velRef.current = -6.2;
      setRunning(true);
    } else {
      velRef.current = -6.5;
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex justify-between w-full px-2 text-xs">
        <span className="font-mono-num font-bold">Score: {score}</span>
        <span className="text-zinc-400">Tap viewport to fly</span>
      </div>
      <div
        onClick={flap}
        className="w-[300px] h-[290px] rounded-2xl bg-gradient-to-b from-indigo-950 to-zinc-950 border border-zinc-800 relative overflow-hidden cursor-pointer"
      >
        <div
          className="w-7 h-7 rounded-full bg-gradient-to-tr from-fuchsia-400 to-cyan-300 shadow-lg absolute left-12"
          style={{ top: orbY }}
        />
        {pipes.map((p, i) => (
          <React.Fragment key={i}>
            <div className="w-9 bg-purple-500/85 border border-purple-300/40 rounded-b-lg absolute top-0" style={{ left: p.x, height: Math.max(0, p.gapY - 44) }} />
            <div className="w-9 bg-purple-500/85 border border-purple-300/40 rounded-t-lg absolute bottom-0" style={{ left: p.x, top: p.gapY + 44 }} />
          </React.Fragment>
        ))}
        {!running && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold">Tap to Start</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== ARCADE HUB ==================== */
export const GamesApp: React.FC = () => {
  const { state, setPersisted } = useOS();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [installedGames, setInstalledGames] = useState<GameId[]>(['breaker', 'snake', 'g2048', 'flappy']);
  const [showSettings, setShowSettings] = useState(false);

  const recordHighScore = (id: GameId, val: number) => {
    setPersisted((os) => ({
      ...os,
      gameScores: {
        ...os.gameScores,
        [id]: Math.max(os.gameScores[id] || 0, val),
      },
    }));
  };

  if (activeGame) {
    const meta = GAMES_CATALOG.find((g) => g.id === activeGame)!;
    return (
      <div className="h-full flex flex-col bg-zinc-950 text-white">
        <div className="px-3 pt-3 pb-2 flex items-center justify-between border-b border-zinc-900">
          <button onClick={() => setActiveGame(null)} className="flex items-center text-xs text-orange-400 font-semibold">
            <ChevronLeft className="w-4 h-4" /> Library
          </button>
          <span className="text-xs font-bold">{meta.title}</span>
          <span className="text-[11px] font-mono-num text-amber-400">
            Best: {state.gameScores[activeGame] || 0}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-3">
          {activeGame === 'breaker' && <NebulaBreaker onScore={(s) => recordHighScore('breaker', s)} />}
          {activeGame === 'snake' && <TitaniumSnake onScore={(s) => recordHighScore('snake', s)} />}
          {activeGame === 'g2048' && <Game2048 onScore={(s) => recordHighScore('g2048', s)} />}
          {activeGame === 'flappy' && <FlappyOrb onScore={(s) => recordHighScore('flappy', s)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-orange-400" />
          <h1 className="text-xl font-extrabold">Arcade Hub</h1>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-full bg-zinc-900 text-zinc-300">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {showSettings && (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 text-xs space-y-2">
            <p className="font-bold">Game Center Settings</p>
            <div className="flex justify-between text-zinc-400">
              <span>Player Profile</span>
              <span className="text-white font-semibold">{state.settings.appleIdName}</span>
            </div>
            <button
              onClick={() => setPersisted((os) => ({ ...os, gameScores: { breaker: 0, snake: 0, g2048: 0, flappy: 0 } }))}
              className="text-rose-400 font-semibold"
            >
              Reset High Scores
            </button>
          </div>
        )}

        {GAMES_CATALOG.map((g) => {
          const installed = installedGames.includes(g.id);
          return (
            <div key={g.id} className={`rounded-3xl bg-gradient-to-br ${g.grad} p-4 space-y-2 shadow-lg`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{g.genre}</p>
                  <h2 className="text-base font-extrabold">{g.title}</h2>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono-num bg-black/30 px-2.5 py-1 rounded-full">
                  <Trophy className="w-3 h-3 text-amber-300" />
                  {state.gameScores[g.id] || 0}
                </div>
              </div>
              <p className="text-xs text-white/85">{g.desc}</p>
              <div className="flex items-center gap-2 pt-1">
                {installed ? (
                  <>
                    <button
                      onClick={() => setActiveGame(g.id)}
                      className="flex-1 py-2 rounded-xl bg-white text-black text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" /> Play Now
                    </button>
                    <button
                      onClick={() => setInstalledGames((prev) => prev.filter((x) => x !== g.id))}
                      className="px-3 py-2 rounded-xl bg-black/30 text-white text-xs font-semibold"
                    >
                      Uninstall
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setInstalledGames((prev) => [...prev, g.id])}
                    className="flex-1 py-2 rounded-xl bg-black/40 text-white text-xs font-bold"
                  >
                    Install Game
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
