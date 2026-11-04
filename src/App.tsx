import React, { useState, useEffect, useRef, useId } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Trophy,
  Coins,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Zap,
  Car,
  Lock,
  CheckCircle2,
  Gauge,
  Activity,
  Award,
  Wind,
  History,
  Trash2,
  Flag,
  TrendingUp,
} from "lucide-react";
import "./App.css";
import traffic1 from "./assets/2b1f29bf-58ce-405c-ae1d-68987fe116b3.jfif";
import traffic2 from "./assets/Image_4e7bej4e7bej4e7b.jfif";
import traffic3 from "./assets/Image_dhv1bwdhv1bwdhv1.jfif";
import traffic4 from "./assets/Image_ypnbbgypnbbgypnb.jfif";
import playercar from "../public/ngkd8hngkd8hngkd.jfif";

// ============================================================================
// --- Types & Data ---
// ============================================================================
export type VehicleModel = {
  id: string;
  name: string;
  image?: string;
  color: string;
  variant: "sedan" | "sport" | "truck";
  speedMultiplier: number;
  handling: number;
  price: number;
  unlocked: boolean;
};

export type GameObject = {
  id: number;
  x: number;
  y: number;
  type: "coin" | "traffic";
  image?: string;
  color: string;
  variant: "sedan" | "sport" | "truck";
  width: number;
  height: number;
};

export type RunRecord = {
  id: string;
  score: number;
  coins: number;
  carName: string;
  timestamp: number;
};

const GAME_SPEED_BASE = 0.5;
const PLAYER_WIDTH = 22;
const PLAYER_HEIGHT = 22;
const ROAD_LEFT_BOUND = 15;
const ROAD_RIGHT_BOUND = 85;
const GAME_BG = "#050810";

const TRAFFIC_IMAGES = [traffic1, traffic2, traffic3, traffic4];
const TRAFFIC_VARIANTS = ["sedan", "sport", "sedan", "truck"] as const;
const TRAFFIC_COLORS = [
  "#ff4d4d",
  "#3b9dff",
  "#2ee59d",
  "#ff9f1a",
  "#b66dff",
  "#f1f5f9",
];

const INITIAL_CARS: VehicleModel[] = [
  {
    id: "car1",
    name: "Apex White",
    image: "/Image_8knkdd8knkdd8knk.jfif",
    color: "#e8eef5",
    variant: "sedan",
    speedMultiplier: 1.0,
    handling: 1.0,
    price: 0,
    unlocked: true,
  },
  {
    id: "car2",
    name: "Luxury Detail",
    image: "/Image_cwspq4cwspq4cwsp.jfif",
    color: "#00e5ff",
    variant: "sport",
    speedMultiplier: 1.2,
    handling: 1.1,
    price: 500,
    unlocked: false,
  },
  {
    id: "car3",
    name: "Shadow Sport",
    image: "/Image_f7emguf7emguf7em.jfif",
    color: "#ff2bd6",
    variant: "sport",
    speedMultiplier: 1.4,
    handling: 0.9,
    price: 1500,
    unlocked: false,
  },
  {
    id: "car4",
    name: "Lambo Rear",
    image: "/Image_t9ex4zt9ex4zt9ex.jfif",
    color: "#ffd400",
    variant: "sport",
    speedMultiplier: 1.6,
    handling: 1.3,
    price: 3000,
    unlocked: false,
  },
];

// ============================================================================
// --- Transparent cutout ---
// ============================================================================
const cutoutCache = new Map<string, Promise<string>>();

const removeWhiteBackground = (src: string): Promise<string> => {
  const cached = cutoutCache.get(src);
  if (cached) return cached;

  const job = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const scale = Math.min(1, 420 / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const px = data.data;
        const cornerA = [
          0,
          (w - 1) * 4,
          (h - 1) * w * 4,
          ((h - 1) * w + w - 1) * 4,
        ].map((i) => px[i + 3]);
        if (cornerA.every((a) => a < 10)) {
          resolve(src);
          return;
        }

        const corner = (x: number, y: number) => {
          const i = (y * w + x) * 4;
          return (px[i] + px[i + 1] + px[i + 2]) / 3;
        };
        const dark =
          (corner(0, 0) +
            corner(w - 1, 0) +
            corner(0, h - 1) +
            corner(w - 1, h - 1)) /
            4 <
          60;
        const isBg = (i: number, loose = false) => {
          if (px[i + 3] < 10) return true;
          const r = px[i],
            g = px[i + 1],
            b = px[i + 2];
          const mx = Math.max(r, g, b),
            mn = Math.min(r, g, b);
          if (dark) return mx < (loose ? 85 : 55);
          return mx - mn < (loose ? 30 : 22) && mn > (loose ? 140 : 165);
        };

        const visited = new Uint8Array(w * h);
        const stack: number[] = [];
        const push = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= w || y >= h) return;
          const p = y * w + x;
          if (visited[p] || !isBg(p * 4)) return;
          visited[p] = 1;
          stack.push(p);
        };
        for (let x = 0; x < w; x++) {
          push(x, 0);
          push(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          push(0, y);
          push(w - 1, y);
        }
        while (stack.length) {
          const p = stack.pop()!;
          const x = p % w,
            y = (p / w) | 0;
          px[p * 4 + 3] = 0;
          push(x + 1, y);
          push(x - 1, y);
          push(x, y + 1);
          push(x, y - 1);
        }

        for (let pass = 0; pass < 3; pass++) {
          const kill: number[] = [];
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const p = y * w + x;
              if (visited[p]) continue;
              const touches =
                visited[p - 1] ||
                visited[p + 1] ||
                visited[p - w] ||
                visited[p + w];
              if (touches && isBg(p * 4, true)) kill.push(p);
            }
          }
          for (const p of kill) {
            visited[p] = 1;
            px[p * 4 + 3] = 0;
          }
        }

        ctx.putImageData(data, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });

  cutoutCache.set(src, job);
  return job;
};

const CarImage = ({
  src,
  alt,
  className = "",
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    removeWhiteBackground(src).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [src]);

  if (!url) return <div className="w-full h-full" />;
  return (
    <img
      src={url}
      alt={alt}
      draggable={false}
      className={className}
      style={style}
    />
  );
};

// ============================================================================
// --- Car Sprite ---
// ============================================================================
type Variant = "sedan" | "sport" | "truck";

const CarSprite = ({
  image,
  alt = "car",
  className = "",
  style,
}: {
  image?: string;
  color?: string;
  variant?: Variant;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) => {
  useId();
  if (!image) return null;
  return (
    <CarImage
      src={image}
      alt={alt}
      className={`object-contain ${className}`}
      style={style}
    />
  );
};

const CoinSprite = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} role="img" aria-label="coin">
    <circle
      cx="50"
      cy="50"
      r="46"
      fill="#f5b800"
      stroke="#fff3b0"
      strokeWidth="4"
    />
    <circle
      cx="50"
      cy="50"
      r="34"
      fill="#ffd633"
      stroke="#c98f00"
      strokeWidth="3"
    />
    <text
      x="50"
      y="64"
      textAnchor="middle"
      fontSize="42"
      fontWeight="900"
      fontFamily="Arial, sans-serif"
      fill="#b87b00"
    >
      $
    </text>
  </svg>
);

const read = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

// ============================================================================
// --- Store ---
// ============================================================================
const useGameStore = () => {
  const [coins, setCoins] = useState(
    () => parseInt(read("apex_coins", "0")) || 0,
  );
  const [playerName, setPlayerName] = useState(() => read("apex_name", ""));
  const [leaderboard, setLeaderboard] = useState<
    { name: string; score: number }[]
  >(() => {
    try {
      return JSON.parse(read("apex_leaderboard", "[]"));
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState<RunRecord[]>(() => {
    try {
      return JSON.parse(read("apex_history", "[]"));
    } catch {
      return [];
    }
  });
  const [cars, setCars] = useState<VehicleModel[]>(() => {
    let saved: VehicleModel[] = [];
    try {
      saved = JSON.parse(read("apex_cars", "null")) || INITIAL_CARS;
    } catch {
      saved = INITIAL_CARS;
    }
    return INITIAL_CARS.map((c) => ({
      ...c,
      unlocked: saved.find((s) => s.id === c.id)?.unlocked ?? c.unlocked,
    }));
  });
  const [selectedCarId, setSelectedCarId] = useState<string>(() =>
    read("apex_selected_car", "car1"),
  );

  useEffect(() => {
    try {
      localStorage.setItem("apex_coins", coins.toString());
      localStorage.setItem("apex_name", playerName);
      localStorage.setItem("apex_leaderboard", JSON.stringify(leaderboard));
      localStorage.setItem("apex_history", JSON.stringify(history));
      localStorage.setItem("apex_cars", JSON.stringify(cars));
      localStorage.setItem("apex_selected_car", selectedCarId);
    } catch {
      /* storage unavailable */
    }
  }, [coins, playerName, leaderboard, history, cars, selectedCarId]);

  const addCoins = (amount: number) => setCoins((prev) => prev + amount);

  const unlockCar = (id: string, price: number, name: string) => {
    if (coins < price) {
      toast.error(`Need ${price - coins} more coins for ${name}`);
      return;
    }
    setCoins((prev) => prev - price);
    setCars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unlocked: true } : c)),
    );
    toast.success(`${name} unlocked!`);
  };

  const submitScore = (
    finalScore: number,
    runCoins: number,
    carName: string,
  ) => {
    if (!playerName) return;
    setLeaderboard(
      [...leaderboard, { name: playerName, score: finalScore }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 50),
    );
    setHistory((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random()}`,
          score: finalScore,
          coins: runCoins,
          carName,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 100),
    );
  };

  const clearLeaderboard = () => {
    setLeaderboard([]);
    setHistory([]);
    toast.success("Leaderboard & history cleared");
  };

  const clearAllMemory = () => {
    setCoins(0);
    setPlayerName("");
    setLeaderboard([]);
    setHistory([]);
    setCars(INITIAL_CARS);
    setSelectedCarId("car1");
    try {
      [
        "apex_coins",
        "apex_name",
        "apex_leaderboard",
        "apex_history",
        "apex_cars",
        "apex_selected_car",
      ].forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    toast.success("All memory wiped");
  };

  return {
    coins,
    addCoins,
    cars,
    unlockCar,
    selectedCarId,
    setSelectedCarId,
    playerName,
    setPlayerName,
    leaderboard,
    history,
    submitScore,
    clearLeaderboard,
    clearAllMemory,
  };
};

// ============================================================================
// --- Header ---
// ============================================================================
const Header = ({
  coins,
  onHistory,
}: {
  coins: number;
  onHistory: () => void;
}) => (
  <header className="shrink-0 w-full z-20 border-b border-white/10 bg-black/60 backdrop-blur-md">
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 lg:py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1 sm:gap-1.5 min-w-0">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 font-black italic tracking-tighter text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl leading-none whitespace-nowrap">
            NEON
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 to-fuchsia-700 font-black italic tracking-tighter text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl leading-none whitespace-nowrap">
            HIGHWAY
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onHistory}
            className="flex items-center gap-1 bg-black/40 border border-white/10 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-white text-[10px] sm:text-xs lg:text-sm font-bold hover:bg-white/10 transition whitespace-nowrap"
          >
            <History className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden xs:inline">MARKS</span>
          </button>
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.2)] whitespace-nowrap">
            <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-yellow-400" />
            <span className="text-white font-mono font-bold tracking-wider text-[10px] sm:text-xs lg:text-sm">
              {coins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  </header>
);

// ============================================================================
// --- Footer ---
// ============================================================================
const Footer = ({
  onHome,
  onGarage,
  onHistory,
}: {
  onHome?: () => void;
  onGarage?: () => void;
  onHistory?: () => void;
}) => (
  <footer className="shrink-0 w-full border-t border-white/10 bg-black/50 backdrop-blur-md z-10">
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
        <a
          href="https://www.leonakingeneye.live/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] sm:text-[11px] lg:text-xs text-white font-bold hover:text-cyan-400 tracking-wider uppercase transition-colors whitespace-nowrap"
        >
          Leon © {new Date().getFullYear()}
        </a>
      </div>
      <nav className="flex items-center gap-2 lg:gap-3 justify-end">
        {onHome && (
          <button
            onClick={onHome}
            className="text-[9px] sm:text-[11px] lg:text-xs text-gray-400 hover:text-cyan-400 font-bold tracking-wider uppercase transition-colors whitespace-nowrap"
          >
            Home
          </button>
        )}
        {onGarage && (
          <button
            onClick={onGarage}
            className="text-[9px] sm:text-[11px] lg:text-xs text-gray-400 hover:text-cyan-400 font-bold tracking-wider uppercase transition-colors whitespace-nowrap"
          >
            Garage
          </button>
        )}
        {onHistory && (
          <button
            onClick={onHistory}
            className="text-[9px] sm:text-[11px] lg:text-xs text-gray-400 hover:text-fuchsia-400 font-bold tracking-wider uppercase transition-colors whitespace-nowrap"
          >
            Marks
          </button>
        )}
      </nav>
    </div>
  </footer>
);

// ============================================================================
// --- Home Page ---
// ============================================================================
const HomePage = ({
  onStart,
  onGarage,
  onHistory,
  playerName,
  setPlayerName,
  leaderboard,
  cars,
  selectedCarId,
  coins,
  history,
}: any) => {
  const selectedCar =
    cars.find((c: VehicleModel) => c.id === selectedCarId) || cars[0];

  const totalRuns = history.length;
  const bestScore = history.reduce(
    (max: number, h: RunRecord) => Math.max(max, h.score),
    0,
  );
  const totalCoinsEarned = history.reduce(
    (sum: number, h: RunRecord) => sum + h.coins,
    0,
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-[#050810]">
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-full h-[40%] bg-fuchsia-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center justify-center gap-4 sm:gap-5">
        <h1 className="grid place-items-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black italic tracking-tighter text-center leading-none">
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]">
            NEON
          </span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 to-fuchsia-700 drop-shadow-[0_0_25px_rgba(192,38,211,0.8)]">
            HIGHWAY
          </span>
        </h1>

        <p className="text-cyan-200/60 tracking-[0.25em] sm:tracking-[0.35em] text-[9px] sm:text-xs font-bold uppercase text-center">
          Ultimate Racing Experience
        </p>

        <div className="w-24 h-32 sm:w-28 sm:h-36 md:w-32 md:h-40 p-2 rounded-2xl border border-white/10 bg-white/5 grid place-items-center shrink-0 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <CarSprite
            image={selectedCar.image}
            alt={selectedCar.name}
            className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
          />
        </div>
        <p className="text-white/80 text-xs sm:text-sm font-mono text-center">
          {selectedCar.name}
        </p>

        <div className="w-full grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col items-center gap-1">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <span className="text-white font-mono font-bold text-sm sm:text-lg">
              {coins.toLocaleString()}
            </span>
            <span className="text-gray-400 text-[8px] sm:text-[10px] uppercase tracking-wider">
              Coins
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col items-center gap-1">
            <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <span className="text-white font-mono font-bold text-sm sm:text-lg">
              {selectedCar.speedMultiplier.toFixed(1)}x
            </span>
            <span className="text-gray-400 text-[8px] sm:text-[10px] uppercase tracking-wider">
              Speed
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col items-center gap-1">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" />
            <span className="text-white font-mono font-bold text-sm sm:text-lg">
              {bestScore.toLocaleString()}
            </span>
            <span className="text-gray-400 text-[8px] sm:text-[10px] uppercase tracking-wider">
              Best
            </span>
          </div>
        </div>

        <div className="w-full grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-2.5 flex flex-col items-center gap-0.5">
            <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
            <span className="text-white font-mono font-bold text-xs sm:text-base">
              {totalRuns}
            </span>
            <span className="text-gray-400 text-[7px] sm:text-[9px] uppercase tracking-wider">
              Runs
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-2.5 flex flex-col items-center gap-0.5">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            <span className="text-white font-mono font-bold text-xs sm:text-base">
              {totalCoinsEarned.toLocaleString()}
            </span>
            <span className="text-gray-400 text-[7px] sm:text-[9px] uppercase tracking-wider">
              Earned
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-2.5 flex flex-col items-center gap-0.5">
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-fuchsia-400" />
            <span className="text-white font-mono font-bold text-xs sm:text-base">
              {selectedCar.handling.toFixed(1)}x
            </span>
            <span className="text-gray-400 text-[7px] sm:text-[9px] uppercase tracking-wider">
              Handling
            </span>
          </div>
        </div>

        <input
          type="text"
          placeholder="ENTER DRIVER NAME"
          value={playerName}
          maxLength={14}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-center font-bold tracking-widest text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        />

        <button
          onClick={onStart}
          disabled={!playerName.trim()}
          className="w-full py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-black rounded-xl text-sm sm:text-lg tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3"
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
          <span>RACE NOW</span>
        </button>

        <div className="w-full grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={onGarage}
            className="py-2.5 sm:py-3 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl text-xs sm:text-base tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transition-all"
          >
            <Car size={14} className="sm:w-5 sm:h-5" />
            <span>GARAGE</span>
          </button>
          <button
            onClick={onHistory}
            className="py-2.5 sm:py-3 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl text-xs sm:text-base tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transition-all"
          >
            <History size={14} className="sm:w-5 sm:h-5" />
            <span>MARKS</span>
          </button>
        </div>

        {leaderboard.length > 0 && (
          <div className="bg-black/40 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/5 w-full">
            <h3 className="text-cyan-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase flex items-center justify-center gap-2 mb-2">
              <Award size={14} className="sm:w-4 sm:h-4" /> Top Drivers
            </h3>
            <div className="grid gap-1">
              {leaderboard.slice(0, 3).map((entry: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[10px] sm:text-xs text-gray-300 font-mono py-1 border-b border-white/5 last:border-0 gap-2"
                >
                  <span className="truncate">
                    {i + 1}. {entry.name}
                  </span>
                  <span className="text-white">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// --- Garage Page ---
// ============================================================================
const GaragePage = ({
  onBack,
  cars,
  unlockCar,
  selectedCarId,
  setSelectedCarId,
  coins,
}: any) => (
  <div className="w-full h-full flex flex-col bg-[#050810] overflow-y-auto">
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between gap-2 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-10">
      <button
        onClick={onBack}
        className="text-white flex items-center gap-1 font-bold hover:text-cyan-400 transition-colors text-xs sm:text-base"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> BACK
      </button>
      <h2 className="text-center text-sm sm:text-lg lg:text-xl font-black text-white tracking-widest">
        GARAGE
      </h2>
      <div className="flex items-center gap-1 text-yellow-400 font-mono font-bold text-xs sm:text-base">
        <Coins size={14} className="sm:w-5 sm:h-5" /> {coins}
      </div>
    </div>

    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
      <div className="grid gap-3 sm:gap-4">
        {cars.map((car: VehicleModel) => (
          <div
            key={car.id}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 grid gap-3 transition-all duration-300 ${
              selectedCarId === car.id
                ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                : "border-white/5 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-16 h-20 sm:w-24 sm:h-32 md:w-28 md:h-36 rounded-lg p-1 sm:p-2 overflow-hidden grid place-items-center border border-white/10 bg-transparent shrink-0">
                <CarSprite
                  image={car.image}
                  alt={car.name}
                  className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-bold text-sm sm:text-lg truncate">
                  {car.name}
                </h3>
                <p className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-1 mt-1">
                  <Gauge size={11} className="sm:w-3 sm:h-3 text-cyan-400" />
                  <span>Speed: {car.speedMultiplier}x</span>
                </p>
                <p className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-1">
                  <Activity
                    size={11}
                    className="sm:w-3 sm:h-3 text-fuchsia-400"
                  />
                  <span>Handling: {car.handling}x</span>
                </p>
              </div>
            </div>

            <div>
              {car.unlocked ? (
                <button
                  onClick={() => setSelectedCarId(car.id)}
                  className={`w-full px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                    selectedCarId === car.id
                      ? "bg-cyan-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {selectedCarId === car.id ? (
                    <>
                      <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
                      <span>EQUIPPED</span>
                    </>
                  ) : (
                    <span>SELECT</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => unlockCar(car.id, car.price, car.name)}
                  className={`w-full px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                    coins >= car.price
                      ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                      : "bg-black/50 text-gray-500 border border-white/5"
                  }`}
                >
                  <Lock size={14} className="sm:w-4 sm:h-4" />
                  <span>{car.price}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// --- History Page ---
// ============================================================================
const HistoryPage = ({
  onBack,
  leaderboard,
  history,
  clearLeaderboard,
  clearAllMemory,
}: any) => {
  const [confirm, setConfirm] = useState<null | "clear" | "all">(null);
  return (
    <div className="w-full h-full flex flex-col bg-[#050810] overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between gap-2 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={onBack}
          className="text-white flex items-center gap-1 font-bold hover:text-cyan-400 transition-colors text-xs sm:text-base"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> BACK
        </button>
        <h2 className="text-center text-sm sm:text-lg lg:text-xl font-black text-white tracking-widest">
          MARKS
        </h2>
        <div className="w-8 sm:w-12" />
      </div>

      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 grid gap-3 sm:gap-4">
        <div className="bg-black/40 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/5">
          <h3 className="text-cyan-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase flex items-center gap-2 mb-2">
            <Award size={14} className="sm:w-4 sm:h-4" /> Best Scores
          </h3>
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 text-xs sm:text-sm text-center py-2">
              No marks yet.
            </p>
          ) : (
            <div className="grid gap-1">
              {leaderboard.map((e: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-gray-300 font-mono py-1 border-b border-white/5 last:border-0 gap-2"
                >
                  <span className="truncate">
                    {i + 1}. {e.name}
                  </span>
                  <span className="text-white">{e.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-black/40 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/5">
          <h3 className="text-fuchsia-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase flex items-center gap-2 mb-2">
            <History size={14} className="sm:w-4 sm:h-4" /> Past Runs
          </h3>
          {history.length === 0 ? (
            <p className="text-gray-500 text-xs sm:text-sm text-center py-2">
              No runs recorded.
            </p>
          ) : (
            <div className="grid gap-1">
              {history.map((h: RunRecord) => (
                <div
                  key={h.id}
                  className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto] gap-x-2 text-xs text-gray-300 font-mono py-1 border-b border-white/5 last:border-0"
                >
                  <span className="text-white/80 truncate">{h.carName}</span>
                  <span>Score: {h.score.toLocaleString()}</span>
                  <span className="text-yellow-400">+{h.coins}</span>
                  <span className="text-gray-500 col-span-2 sm:col-span-1">
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-red-950/30 p-3 sm:p-4 rounded-xl border border-red-500/30 grid gap-2">
          <h3 className="text-red-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase flex items-center gap-2">
            <Trash2 size={14} className="sm:w-4 sm:h-4" /> Memory
          </h3>
          {confirm === null ? (
            <div className="grid gap-2">
              <button
                onClick={() => setConfirm("clear")}
                className="w-full py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold bg-red-900/50 hover:bg-red-800/60 text-red-200 border border-red-500/40 transition"
              >
                Clear Leaderboard & History
              </button>
              <button
                onClick={() => setConfirm("all")}
                className="w-full py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold bg-red-900/50 hover:bg-red-800/60 text-red-200 border border-red-500/40 transition"
              >
                Reset Everything (coins, cars, name)
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              <p className="text-red-200 text-xs sm:text-sm text-center">
                Are you sure? This cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  className="py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirm === "clear") clearLeaderboard();
                    else clearAllMemory();
                    setConfirm(null);
                  }}
                  className="py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// --- Results Modal ---
// ============================================================================
const ResultsPage = ({
  score,
  runCoins,
  onRestart,
  onHome,
}: {
  score: number;
  runCoins: number;
  onRestart: () => void;
  onHome: () => void;
}) => (
  <div
    className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md pointer-events-auto"
    style={{ pointerEvents: "auto" }}
  >
    <div className="w-full max-w-sm flex flex-col items-center gap-5 animate-[fadeIn_0.2s_ease-out]">
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-800 italic tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] text-center">
        CRASHED!
      </h2>

      <div className="bg-[#0a0f1c] p-5 sm:p-6 rounded-2xl border border-white/10 w-full grid gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500" />
        <div className="text-center grid gap-1">
          <p className="text-gray-400 text-[10px] sm:text-xs tracking-[0.2em] uppercase">
            Run Score
          </p>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-mono text-white font-black">
            {score.toLocaleString()}
          </p>
        </div>
        <div className="h-px bg-white/10 w-full" />
        <div className="flex items-center justify-between bg-black/50 p-3 rounded-xl border border-white/5 gap-3">
          <span className="text-yellow-400 flex items-center gap-2 font-bold text-xs sm:text-sm">
            <Coins size={16} className="sm:w-5 sm:h-5" /> Coins Earned
          </span>
          <span className="text-xl sm:text-2xl font-bold text-white">
            +{runCoins}
          </span>
        </div>
      </div>

      <div className="grid gap-3 w-full">
        <button
          type="button"
          onClick={onRestart}
          className="w-full py-3 sm:py-4 bg-white text-black font-black rounded-xl text-sm sm:text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer"
        >
          <RotateCcw size={16} className="sm:w-5 sm:h-5" /> TRY AGAIN
        </button>
        <button
          type="button"
          onClick={onHome}
          className="w-full py-3 sm:py-4 bg-white/10 border border-white/20 text-white font-bold rounded-xl text-sm sm:text-lg active:scale-95 transition-transform hover:bg-white/20 cursor-pointer"
        >
          MAIN MENU
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// --- Core Race Engine (auto-moving + can accelerate) ---
// ============================================================================
type Input = {
  left: boolean;
  right: boolean;
  gas: boolean;
  brake: boolean;
  nitro: boolean;
};

const RaceComponent = ({
  selectedCar,
  onGameOver,
}: {
  selectedCar: VehicleModel;
  onGameOver: (score: number, coins: number) => void;
}) => {
  const input = useRef<Input>({
    left: false,
    right: false,
    gas: false,
    brake: false,
    nitro: false,
  });
  const game = useRef({
    x: 50,
    steer: 0,
    rotation: 0,
    speed: GAME_SPEED_BASE * selectedCar.speedMultiplier * 0.5,
    cruiseSpeed: GAME_SPEED_BASE * selectedCar.speedMultiplier * 0.5, // auto-cruise baseline
    maxSpeed: GAME_SPEED_BASE * selectedCar.speedMultiplier,
    nitro: 100,
    nitroOn: false,
    score: 0,
    coins: 0,
    roadY: 0,
    spawn: 0,
    objs: [] as GameObject[],
    over: false,
    overFired: false,
  });
  const roadRef = useRef<HTMLDivElement>(null);
  const [, setFrame] = useState(0);

  useEffect(() => {
    const set = (e: KeyboardEvent, v: boolean) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") input.current.left = v;
      if (k === "arrowright" || k === "d") input.current.right = v;
      if (k === "arrowup" || k === "w") input.current.gas = v;
      if (k === "arrowdown" || k === "s") input.current.brake = v;
      if (k === "shift") input.current.nitro = v;
      if (k.startsWith("arrow")) e.preventDefault();
    };
    const down = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (time: number) => {
      const g = game.current;
      if (g.over) return;
      const deltaTime = Math.min(time - last, 50);
      last = time;
      const dt = deltaTime / 16.66;
      const inp = input.current;

      // --- SPEED MODEL: auto-cruise + accelerate + brake ---
      if (inp.brake) {
        // Strong deceleration, fully stops at 0
        g.speed = Math.max(0, g.speed - 0.35 * dt);
      } else if (inp.gas) {
        // Accelerate above cruise
        g.speed = Math.min(g.maxSpeed, g.speed + 0.04 * dt);
      } else {
        // Coast back toward cruise speed automatically
        if (g.speed < g.cruiseSpeed) {
          g.speed = Math.min(g.cruiseSpeed, g.speed + 0.02 * dt);
        } else {
          g.speed = Math.max(g.cruiseSpeed, g.speed - 0.02 * dt);
        }
      }

      g.nitroOn = inp.nitro && g.nitro > 0 && g.speed > 0.05;
      g.nitro = g.nitroOn
        ? Math.max(0, g.nitro - 0.8 * dt)
        : Math.min(100, g.nitro + 0.2 * dt);
      const cap = g.nitroOn ? g.maxSpeed * 2 : g.maxSpeed;
      g.speed = Math.max(0, Math.min(g.speed, cap));

      // World speed: 0 when fully stopped → everything freezes
      const worldSpeed = g.speed;

      const steerInput = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      g.steer += (steerInput - g.steer) * 0.25 * dt;
      g.x += g.steer * 1.1 * selectedCar.handling * dt;
      g.x = Math.max(ROAD_LEFT_BOUND, Math.min(ROAD_RIGHT_BOUND, g.x));
      g.rotation = g.steer * 18;

      g.roadY = (g.roadY + worldSpeed * dt * 14) % 80;
      if (roadRef.current)
        roadRef.current.style.setProperty("--roadY", `${g.roadY}px`);

      if (worldSpeed > 0.05) {
        g.spawn += deltaTime;
        if (g.spawn > 800) {
          g.spawn = 0;
          const isCoin = Math.random() > 0.8;
          const idx = Math.floor(Math.random() * TRAFFIC_VARIANTS.length);
          const tv = TRAFFIC_VARIANTS[idx];
          g.objs.push({
            id: Date.now() + Math.random(),
            x:
              Math.random() * (ROAD_RIGHT_BOUND - ROAD_LEFT_BOUND - 15) +
              ROAD_LEFT_BOUND +
              7.5,
            y: -30,
            type: isCoin ? "coin" : "traffic",
            color:
              TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)],
            image: isCoin ? undefined : TRAFFIC_IMAGES[idx],
            variant: tv,
            width: isCoin ? 8 : tv === "truck" ? 22 : 20,
            height: isCoin ? 8 : tv === "truck" ? 26 : 20,
          });
        }
      }

      const playerY = 75;
      const remaining: GameObject[] = [];
      let crashed = false;
      for (const obj of g.objs) {
        if (worldSpeed > 0.05) {
          obj.y += worldSpeed * dt * 1.5;
        }
        const hit =
          Math.abs(obj.x - g.x) < 10 && Math.abs(obj.y - playerY) < 15;
        if (hit && obj.type === "coin") {
          g.coins += 10;
          g.score += 50;
          continue;
        }
        if (hit && obj.type === "traffic") {
          crashed = true;
        }
        if (obj.y < 120) remaining.push(obj);
      }
      g.objs = remaining;

      if (g.speed > 0.1) g.score += Math.floor(g.speed * 2);

      setFrame((f) => f + 1);

      if (crashed && !g.overFired) {
        // Fire exactly once — prevents double-submit on restart
        g.overFired = true;
        g.over = true;
        onGameOver(Math.floor(g.score), g.coins);
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const g = game.current;
  const mph = Math.floor(g.speed * 180);
  const torque = Math.floor(g.speed * 50) + (input.current.gas ? 100 : 0);
  const wind = Math.floor(10 + g.speed * 15);

  const hold = (key: keyof Input) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      input.current[key] = true;
    },
    onPointerUp: () => {
      input.current[key] = false;
    },
    onPointerCancel: () => {
      input.current[key] = false;
    },
    onLostPointerCapture: () => {
      input.current[key] = false;
    },
  });

  const dashes =
    "repeating-linear-gradient(to bottom, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 40px, transparent 40px, transparent 80px)";

  return (
    <div
      className="absolute inset-0 overflow-hidden select-none touch-none"
      style={{ background: GAME_BG }}
    >
      <div
        ref={roadRef}
        className="absolute inset-0"
        style={{ ["--roadY" as any]: "0px" }}
      >
        {[33, 66].map((laneX) => (
          <div
            key={laneX}
            className="absolute top-0 bottom-0 w-0.75"
            style={{
              left: `${laneX}%`,
              backgroundImage: dashes,
              backgroundPositionY: "var(--roadY)",
            }}
          />
        ))}
        <div className="absolute left-0 top-0 bottom-0 w-[15%] bg-gradient-to-r from-black via-red-900/40 to-transparent border-r-2 border-red-500 shadow-[inset_-10px_0_20px_rgba(220,38,38,0.3)] z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-[15%] bg-gradient-to-l from-black via-red-900/40 to-transparent border-l-2 border-red-500 shadow-[inset_10px_0_20px_rgba(220,38,38,0.3)] z-10" />
      </div>

      {g.objs.map((obj) => (
        <div
          key={obj.id}
          className="absolute z-20"
          style={{
            left: `${obj.x}%`,
            top: `${obj.y}%`,
            width: `${obj.width}%`,
            height: `${obj.height}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {obj.type === "coin" ? (
            <CoinSprite className="w-full h-full animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
          ) : (
            <CarSprite
              image={obj.image}
              alt="traffic"
              className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]"
            />
          )}
        </div>
      ))}

      <div
        className="absolute z-30"
        style={{
          left: `${g.x}%`,
          top: "75%",
          width: `${PLAYER_WIDTH}%`,
          height: `${PLAYER_HEIGHT}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-full h-full relative">
          <CarSprite
            image={playercar}
            alt=""
            className="w-full h-full drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
            style={{ transform: `rotate(${g.rotation}deg)` }}
          />
          {g.nitroOn && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
              <div className="w-2 h-10 bg-cyan-400 rounded-full blur-md animate-pulse" />
              <div className="w-2 h-14 bg-blue-500 rounded-full blur-sm animate-pulse" />
              <div className="w-2 h-10 bg-cyan-400 rounded-full blur-md animate-pulse" />
            </div>
          )}
          {input.current.brake && g.speed > 0 && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-2 bg-red-600 shadow-[0_0_20px_red] animate-pulse" />
          )}
          {input.current.brake && g.speed === 0 && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-red-400 font-bold text-xs animate-pulse">
              STOPPED
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex items-start justify-between z-40 pointer-events-none gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl border border-white/10">
            <Trophy size={12} className="sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-white font-mono font-bold text-[10px] sm:text-sm">
              {g.score.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl border border-white/10">
            <Coins size={12} className="sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-white font-mono font-bold text-[10px] sm:text-sm">
              {g.coins}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 bg-black/50 backdrop-blur-md p-2 sm:p-3 rounded-lg sm:rounded-xl border border-white/10">
          <div className="text-white font-black text-lg sm:text-3xl lg:text-4xl italic drop-shadow-md leading-none">
            {mph}{" "}
            <span className="text-[9px] sm:text-sm font-normal text-cyan-400">
              MPH
            </span>
          </div>
          <div className="flex items-center gap-1 text-[8px] sm:text-[10px] text-gray-300 font-mono">
            <Activity size={8} className="sm:w-2.5 sm:h-2.5 text-red-400" />
            <span>{torque} Nm</span>
          </div>
          <div className="flex items-center gap-1 text-[8px] sm:text-[10px] text-gray-300 font-mono">
            <Wind size={8} className="sm:w-2.5 sm:h-2.5 text-blue-400" />
            <span>{wind} km/h</span>
          </div>
          <div className="w-full h-1.5 mt-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${g.nitro}%` }}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 pb-3 sm:pb-6 z-40 pointer-events-auto bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-between gap-2">
        <div className="flex gap-2">
          <button
            {...hold("left")}
            className="w-12 h-16 sm:w-16 sm:h-20 rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-md border border-white/10 grid place-items-center text-white active:bg-cyan-600/50 touch-none"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <button
            {...hold("right")}
            className="w-12 h-16 sm:w-16 sm:h-20 rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-md border border-white/10 grid place-items-center text-white active:bg-cyan-600/50 touch-none"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>

        <div className="flex flex-col items-end gap-2 sm:gap-3">
          <div className="flex gap-2 sm:gap-3">
            <button
              {...hold("brake")}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-950/80 border-2 border-red-500 grid place-items-center text-red-200 active:bg-red-600 touch-none shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            >
              <span className="font-bold text-[9px] sm:text-xs">BRAKE</span>
            </button>
            <button
              {...hold("gas")}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-950/80 border-2 border-green-500 grid place-items-center text-green-200 active:bg-green-600 touch-none shadow-[0_0_15px_rgba(34,197,94,0.5)]"
            >
              <span className="font-bold text-[9px] sm:text-xs leading-tight">
                GAS
              </span>
            </button>
          </div>
          <button
            {...hold("nitro")}
            className={`w-20 h-10 sm:w-24 sm:h-14 rounded-lg sm:rounded-xl grid place-items-center border-2 touch-none transition-all ${
              g.nitro > 0
                ? "bg-blue-600 border-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.8)]"
                : "bg-slate-800 border-slate-600 text-gray-500"
            }`}
          >
            <Zap
              size={18}
              className={`sm:w-6 sm:h-6 ${
                g.nitro > 0 ? "fill-white text-white" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// --- Main App Component ---
// ============================================================================
export default function App() {
  const [view, setView] = useState<
    "home" | "garage" | "race" | "results" | "history"
  >("home");
  const [result, setResult] = useState({ score: 0, coins: 0 });
  const [runId, setRunId] = useState(0);

  const {
    coins,
    addCoins,
    cars,
    unlockCar,
    selectedCarId,
    setSelectedCarId,
    playerName,
    setPlayerName,
    leaderboard,
    history,
    submitScore,
    clearLeaderboard,
    clearAllMemory,
  } = useGameStore();

  const selectedCar = cars.find((c) => c.id === selectedCarId) || cars[0];

  const handleGameOver = (score: number, runCoins: number) => {
    setResult({ score, coins: runCoins });
    addCoins(runCoins);
    submitScore(score, runCoins, selectedCar.name);
    setView("results");
  };

  const startRace = () => {
    // Bump runId → forces RaceComponent to remount fresh
    setRunId((r) => r + 1);
    setView("race");
  };

  const showChrome = view !== "race" && view !== "results";

  return (
    <div className="min-h-screen w-full bg-black font-sans selection:bg-cyan-500 selection:text-white flex justify-center items-center overflow-x-hidden">
      <div className="relative w-full max-w-[1920px] min-h-screen bg-[#050810] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col">
        {showChrome && (
          <Header coins={coins} onHistory={() => setView("history")} />
        )}

        <div className="relative flex-1 flex flex-col min-h-0">
          {/* Race scene stays mounted behind results so background remains visible */}
          {(view === "race" || view === "results") && (
            <div
              className={`absolute inset-0 ${
                view === "results"
                  ? "pointer-events-none opacity-40 blur-sm"
                  : ""
              }`}
            >
              <RaceComponent
                key={runId}
                selectedCar={selectedCar}
                onGameOver={handleGameOver}
              />
            </div>
          )}

          {view === "home" && (
            <HomePage
              onStart={startRace}
              onGarage={() => setView("garage")}
              onHistory={() => setView("history")}
              coins={coins}
              playerName={playerName}
              setPlayerName={setPlayerName}
              leaderboard={leaderboard}
              cars={cars}
              selectedCarId={selectedCarId}
              history={history}
            />
          )}
          {view === "garage" && (
            <GaragePage
              onBack={() => setView("home")}
              cars={cars}
              unlockCar={unlockCar}
              selectedCarId={selectedCarId}
              setSelectedCarId={setSelectedCarId}
              coins={coins}
            />
          )}
          {view === "history" && (
            <HistoryPage
              onBack={() => setView("home")}
              leaderboard={leaderboard}
              history={history}
              clearLeaderboard={clearLeaderboard}
              clearAllMemory={clearAllMemory}
            />
          )}

          {/* Results modal renders above the frozen race scene */}
          {view === "results" && (
            <ResultsPage
              score={result.score}
              runCoins={result.coins}
              onRestart={startRace}
              onHome={() => setView("home")}
            />
          )}
        </div>

        {showChrome && (
          <Footer
            onHome={view !== "home" ? () => setView("home") : undefined}
            onGarage={view !== "garage" ? () => setView("garage") : undefined}
            onHistory={
              view !== "history" ? () => setView("history") : undefined
            }
          />
        )}
      </div>

      <ToastContainer
        position="top-center"
        theme="dark"
        autoClose={2000}
        hideProgressBar
        newestOnTop
      />
    </div>
  );
}
