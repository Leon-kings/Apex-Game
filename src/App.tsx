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
} from "lucide-react";
import "./App.css";

// ============================================================================
// --- Types & Data ---
// ============================================================================
export type VehicleModel = {
  id: string;
  name: string;
  image?: string; // optional rear-view PNG, e.g. /cars/car1.png (SVG is used when empty)
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

const GAME_SPEED_BASE = 0.5;
const PLAYER_WIDTH = 22;
const PLAYER_HEIGHT = 22;
const ROAD_LEFT_BOUND = 15;
const ROAD_RIGHT_BOUND = 85;
const GAME_BG = "#050810";

const TRAFFIC_IMAGES = [
  "/src/assets/2b1f29bf-58ce-405c-ae1d-68987fe116b3.jfif",
  "/src/assets/Image_4e7bej4e7bej4e7b.jfif",
  "/src/assets/Image_dhv1bwdhv1bwdhv1.jfif",
  "/src/assets/Image_ypnbbgypnbbgypnb.jfif",
];
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
    image: "/public/Image_8knkdd8knkdd8knk.jfif",
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
    image: "/public/Image_cwspq4cwspq4cwsp.jfif",
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
    image: "/public/Image_f7emguf7emguf7em.jfif",
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
    image: "/public/Image_t9ex4zt9ex4zt9ex.jfif",
    color: "#ffd400",
    variant: "sport",
    speedMultiplier: 1.6,
    handling: 1.3,
    price: 3000,
    unlocked: false,
  },
];

// ============================================================================
// --- Transparent cutout (removes the white background of any car image) ---
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
        } // already transparent: use as is

        // Decide the background type from the 4 corners: dark (coins) or light/checkerboard (cars)
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
          // white AND grey checkerboard squares: low colour, fairly light
          return mx - mn < (loose ? 30 : 22) && mn > (loose ? 140 : 165);
        };

        // Flood fill from every border pixel so only the OUTER white is removed
        // (white parts inside the car, like headlights or a white body, stay).
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

        // Clean the fringe: remove leftover checker/dark pixels touching the removed area (3 passes)
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
        resolve(src); // canvas blocked by CORS -> use original
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
  onFail,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onFail?: () => void;
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    removeWhiteBackground(src).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [src]);

  if (failed)
    return (
      <div className="w-full h-full rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
    );
  if (!url) return <div className="w-full h-full" />;
  return (
    <img
      src={url}
      alt={alt}
      draggable={false}
      onError={() => (onFail ? onFail() : setFailed(true))}
      className={className}
      style={style}
    />
  );
};

// ============================================================================
// --- Store ---
// ============================================================================
// ============================================================================
// --- Rear-view car sprites (SVG, transparent, always visible on the dark road) ---
// ============================================================================
type Variant = "sedan" | "sport" | "truck";

const CarSprite = ({
  image,
  color,
  variant,
  alt = "car",
  className = "",
  style,
}: {
  image?: string;
  color: string;
  variant: Variant;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const uid = useId().replace(/:/g, "");
  const [broken, setBroken] = useState(false);
  if (image && !broken)
    return (
      <CarImage
        src={image}
        alt={alt}
        onFail={() => setBroken(true)}
        className={`object-contain ${className}`}
        style={style}
      />
    );

  const truck = variant === "truck";
  const sport = variant === "sport";
  const wheelY = truck ? [48, 140] : [34, 126];
  const bodyD =
    "M30 8 Q50 0 70 8 L80 40 Q84 90 82 150 Q80 178 70 182 L30 182 Q20 178 18 150 Q16 90 20 40 Z";
  const glass = "#0d1b2a";

  return (
    <svg
      viewBox="0 0 100 190"
      className={className}
      style={style}
      role="img"
      aria-label={alt}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`b${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".35" />
          <stop offset=".28" stopColor="#fff" stopOpacity=".2" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset=".72" stopColor="#fff" stopOpacity=".2" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </linearGradient>
        <filter id={`g${uid}`} x="-60%" y="-300%" width="220%" height="700%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* wheels */}
      {wheelY.flatMap((y) =>
        [4, 80].map((x) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="16"
            height="32"
            rx="5"
            fill="#0a0a0f"
            stroke="#8b93a1"
            strokeWidth="1.5"
          />
        )),
      )}

      {truck ? (
        <g>
          <rect
            x="22"
            y="4"
            width="56"
            height="42"
            rx="9"
            fill={color}
            stroke="rgba(255,255,255,.6)"
            strokeWidth="1.5"
          />
          <rect x="28" y="12" width="44" height="16" rx="3" fill={glass} />
          <rect
            x="14"
            y="42"
            width="72"
            height="144"
            rx="5"
            fill={color}
            stroke="rgba(255,255,255,.6)"
            strokeWidth="1.5"
          />
          <rect
            x="14"
            y="42"
            width="72"
            height="144"
            rx="5"
            fill={`url(#b${uid})`}
          />
          {[72, 102, 132, 160].map((y) => (
            <line
              key={y}
              x1="16"
              x2="84"
              y1={y}
              y2={y}
              stroke="#000"
              strokeOpacity=".18"
              strokeWidth="2"
            />
          ))}
          <line
            x1="50"
            x2="50"
            y1="44"
            y2="184"
            stroke="#000"
            strokeOpacity=".3"
            strokeWidth="2"
          />
          <rect
            x="18"
            y="172"
            width="18"
            height="8"
            rx="3"
            fill="#ff2d2d"
            filter={`url(#g${uid})`}
          />
          <rect
            x="64"
            y="172"
            width="18"
            height="8"
            rx="3"
            fill="#ff2d2d"
            filter={`url(#g${uid})`}
          />
          <rect x="18" y="172" width="18" height="8" rx="3" fill="#ff5a5a" />
          <rect x="64" y="172" width="18" height="8" rx="3" fill="#ff5a5a" />
        </g>
      ) : (
        <g>
          <path
            d={bodyD}
            fill={color}
            stroke="rgba(255,255,255,.6)"
            strokeWidth="1.5"
          />
          <path d={bodyD} fill={`url(#b${uid})`} />
          {/* hood */}
          <path
            d="M28 14 Q50 8 72 14 L76 44 L24 44 Z"
            fill="#fff"
            fillOpacity=".16"
          />
          {/* windshield, roof, rear window */}
          <path d="M27 48 L73 48 L68 74 L32 74 Z" fill={glass} />
          <path
            d="M31 50 L50 50 L46 60 L31 60 Z"
            fill="#fff"
            fillOpacity=".12"
          />
          <rect
            x="32"
            y="74"
            width="36"
            height="36"
            rx="6"
            fill="#000"
            fillOpacity=".12"
          />
          <path d="M32 112 L68 112 L74 134 L26 134 Z" fill={glass} />
          {/* trunk */}
          <path
            d="M26 138 L74 138 L76 170 Q50 176 24 170 Z"
            fill="#fff"
            fillOpacity=".12"
          />
          {sport && (
            <g>
              <rect
                x="17"
                y="148"
                width="66"
                height="9"
                rx="3"
                fill={color}
                stroke="rgba(255,255,255,.6)"
                strokeWidth="1.2"
              />
              <rect
                x="17"
                y="148"
                width="66"
                height="9"
                rx="3"
                fill="#000"
                fillOpacity=".3"
              />
            </g>
          )}
          {/* tail lights with glow */}
          <rect
            x="21"
            y="166"
            width="22"
            height="8"
            rx="3"
            fill="#ff2d2d"
            filter={`url(#g${uid})`}
          />
          <rect
            x="57"
            y="166"
            width="22"
            height="8"
            rx="3"
            fill="#ff2d2d"
            filter={`url(#g${uid})`}
          />
          <rect x="21" y="166" width="22" height="8" rx="3" fill="#ff5a5a" />
          <rect x="57" y="166" width="22" height="8" rx="3" fill="#ff5a5a" />
          {/* exhausts */}
          <circle cx="38" cy="184" r="3.2" fill="#9aa3b2" />
          <circle cx="62" cy="184" r="3.2" fill="#9aa3b2" />
        </g>
      )}
    </svg>
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

const useGameStore = () => {
  const [coins, setCoins] = useState(
    () => parseInt(read("apex_coins", "0")) || 0,
  );
  const [playerName, setPlayerName] = useState(() => read("apex_name", ""));
  const [leaderboard, setLeaderboard] = useState<
    { name: string; score: number }[]
  >(() => JSON.parse(read("apex_leaderboard", "[]")));
  const [cars, setCars] = useState<VehicleModel[]>(() => {
    const saved: VehicleModel[] =
      JSON.parse(read("apex_cars", "null")) || INITIAL_CARS;
    // always use the latest image URLs, keep the unlocked state
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
      localStorage.setItem("apex_cars", JSON.stringify(cars));
      localStorage.setItem("apex_selected_car", selectedCarId);
    } catch {
      /* storage unavailable */
    }
  }, [coins, playerName, leaderboard, cars, selectedCarId]);

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

  const submitScore = (finalScore: number) => {
    if (!playerName) return;
    setLeaderboard(
      [...leaderboard, { name: playerName, score: finalScore }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    );
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
    submitScore,
  };
};

// ============================================================================
// --- Home Page ---
// ============================================================================
const HomePage = ({
  onStart,
  onGarage,
  coins,
  playerName,
  setPlayerName,
  leaderboard,
}: any) => (
  <div className="absolute inset-0 bg-[#050810] flex flex-col items-center justify-between z-50 overflow-hidden font-sans">
    <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[40%] bg-fuchsia-600/20 blur-[100px] rounded-full pointer-events-none"></div>

    <div className="w-full flex justify-end p-6 z-10">
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.2)]">
        <Coins size={18} className="text-yellow-400" />
        <span className="text-white font-mono font-bold tracking-wider">
          {coins.toLocaleString()}
        </span>
      </div>
    </div>

    <div className="flex flex-col items-center justify-center flex-1 w-full z-10 mt-[-10%]">
      <h1 className="text-6xl sm:text-7xl font-black italic tracking-tighter text-center leading-none">
        <span className="block text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]">
          NEON
        </span>
        <span className="block text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 to-fuchsia-700 drop-shadow-[0_0_25px_rgba(192,38,211,0.8)] mt-2">
          HIGHWAY
        </span>
      </h1>
      <p className="text-cyan-200/60 tracking-[0.3em] text-xs font-bold uppercase mt-6">
        Ultimate Racing Experience
      </p>
    </div>

    <div className="w-full max-w-sm px-6 pb-12 z-10 flex flex-col gap-4">
      <input
        type="text"
        placeholder="ENTER DRIVER NAME"
        value={playerName}
        maxLength={14}
        onChange={(e) => setPlayerName(e.target.value)}
        className="w-full bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-2xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-center font-bold tracking-widest transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
      />

      <button
        onClick={onStart}
        disabled={!playerName.trim()}
        className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-black rounded-2xl text-xl tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95 transition-all flex items-center justify-center gap-3"
      >
        <Play className="fill-white" /> RACE NOW
      </button>

      <button
        onClick={onGarage}
        className="w-full py-4 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl text-lg tracking-wider flex items-center justify-center gap-2 transition-all"
      >
        <Car size={20} /> GARAGE
      </button>

      {leaderboard.length > 0 && (
        <div className="mt-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 w-full">
          <h3 className="text-cyan-400 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 mb-3">
            <Award size={14} /> Top Drivers
          </h3>
          {leaderboard.slice(0, 3).map((entry: any, i: number) => (
            <div
              key={i}
              className="flex justify-between text-xs text-gray-300 font-mono py-1 border-b border-white/5 last:border-0"
            >
              <span>
                {i + 1}. {entry.name}
              </span>
              <span className="text-white">{entry.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

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
  <div className="absolute inset-0 bg-[#050810] z-50 flex flex-col">
    <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
      <button
        onClick={onBack}
        className="text-white flex items-center gap-1 font-bold hover:text-cyan-400 transition-colors"
      >
        <ChevronLeft /> BACK
      </button>
      <h2 className="text-xl font-black text-white tracking-widest">GARAGE</h2>
      <div className="flex items-center gap-2 text-yellow-400 font-mono font-bold">
        <Coins size={18} /> {coins}
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {cars.map((car: VehicleModel) => (
        <div
          key={car.id}
          className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-300 ${selectedCarId === car.id ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "border-white/5 bg-white/5 hover:border-white/20"}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-28 rounded-xl p-2 overflow-hidden flex items-center justify-center border border-white/10 bg-transparent">
              <CarSprite
                image={car.image}
                color={car.color}
                variant={car.variant}
                alt={car.name}
                className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{car.name}</h3>
              <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                <Gauge size={12} className="text-cyan-400" /> Speed:{" "}
                {car.speedMultiplier}x
              </p>
              <p className="text-gray-400 text-xs flex items-center gap-1">
                <Activity size={12} className="text-fuchsia-400" /> Handling:{" "}
                {car.handling}x
              </p>
            </div>
          </div>
          {car.unlocked ? (
            <button
              onClick={() => setSelectedCarId(car.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-all ${selectedCarId === car.id ? "bg-cyan-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
            >
              {selectedCarId === car.id ? (
                <>
                  <CheckCircle2 size={16} /> EQUIPPED
                </>
              ) : (
                "SELECT"
              )}
            </button>
          ) : (
            <button
              onClick={() => unlockCar(car.id, car.price, car.name)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-all ${coins >= car.price ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]" : "bg-black/50 text-gray-500 border border-white/5"}`}
            >
              <Lock size={16} /> {car.price}
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// --- Results Page ---
// ============================================================================
const ResultsPage = ({ score, runCoins, onRestart, onHome }: any) => (
  <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center z-50 p-6">
    <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-800 italic mb-8 tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
      CRASHED!
    </h2>

    <div className="bg-[#0a0f1c] p-8 rounded-3xl border border-white/10 w-full max-w-sm mb-10 space-y-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500"></div>
      <div className="text-center">
        <p className="text-gray-400 text-xs tracking-[0.2em] uppercase mb-1">
          Run Score
        </p>
        <p className="text-6xl font-mono text-white font-black">
          {score.toLocaleString()}
        </p>
      </div>
      <div className="h-px bg-white/10 w-full"></div>
      <div className="flex justify-between items-center bg-black/50 p-4 rounded-xl border border-white/5">
        <span className="text-yellow-400 flex items-center gap-2 font-bold text-sm">
          <Coins size={18} /> Coins Earned
        </span>
        <span className="text-2xl font-bold text-white">+{runCoins}</span>
      </div>
    </div>

    <div className="flex flex-col gap-4 w-full max-w-sm">
      <button
        onClick={onRestart}
        className="w-full py-4 bg-white text-black font-black rounded-2xl text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
      >
        <RotateCcw size={20} /> TRY AGAIN
      </button>
      <button
        onClick={onHome}
        className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl text-lg active:scale-95 transition-transform hover:bg-white/10"
      >
        MAIN MENU
      </button>
    </div>
  </div>
);

// ============================================================================
// --- Core Race Engine ---
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
  // All game state lives in refs and the loop runs ONCE, so input is never stale.
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
    maxSpeed: GAME_SPEED_BASE * selectedCar.speedMultiplier,
    nitro: 100,
    nitroOn: false,
    score: 0,
    coins: 0,
    roadY: 0,
    spawn: 0,
    objs: [] as GameObject[],
    over: false,
  });
  const roadRef = useRef<HTMLDivElement>(null);
  const [, setFrame] = useState(0);

  // Keyboard
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

  // Game loop
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

      // Speed
      if (inp.brake) g.speed = Math.max(0, g.speed - 0.15 * dt);
      else if (inp.gas) g.speed += 0.03 * dt;
      else g.speed -= 0.01 * dt;

      // Nitro
      g.nitroOn = inp.nitro && g.nitro > 0;
      g.nitro = g.nitroOn
        ? Math.max(0, g.nitro - 0.8 * dt)
        : Math.min(100, g.nitro + 0.2 * dt);
      const cap = g.nitroOn ? g.maxSpeed * 2 : g.maxSpeed;
      g.speed = Math.max(0, Math.min(g.speed, cap));
      const worldSpeed = Math.max(0.2, g.speed);

      // Steering: ALWAYS works, no speed needed. Tap/hold = car slides sideways.
      const steerInput = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      g.steer += (steerInput - g.steer) * 0.25 * dt;
      g.x += g.steer * 1.1 * selectedCar.handling * dt;
      g.x = Math.max(ROAD_LEFT_BOUND, Math.min(ROAD_RIGHT_BOUND, g.x));
      g.rotation = g.steer * 18;

      // Road scroll
      g.roadY = (g.roadY + worldSpeed * dt * 14) % 80;
      if (roadRef.current)
        roadRef.current.style.setProperty("--roadY", `${g.roadY}px`);

      // Spawn
      g.spawn += deltaTime;
      if (g.spawn > 800) {
        g.spawn = 0;
        const isCoin = Math.random() > 0.8;
        const idx = Math.floor(Math.random() * TRAFFIC_IMAGES.length);
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

      // Move & collide
      const playerY = 75;
      const remaining: GameObject[] = [];
      let crashed = false;
      for (const obj of g.objs) {
        obj.y += worldSpeed * dt * 1.5;
        const hit =
          Math.abs(obj.x - g.x) < 10 && Math.abs(obj.y - playerY) < 15;
        if (hit && obj.type === "coin") {
          g.coins += 10;
          g.score += 50;
          continue;
        }
        if (hit) {
          crashed = true;
        }
        if (obj.y < 120) remaining.push(obj);
      }
      g.objs = remaining;

      if (g.speed > 0.1) g.score += Math.floor(g.speed * 2);

      setFrame((f) => f + 1);

      if (crashed) {
        g.over = true;
        onGameOver(g.score, g.coins);
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

  // Pointer helper for on-screen buttons
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
      {/* Road */}
      <div
        ref={roadRef}
        className="absolute inset-0"
        style={{ ["--roadY" as any]: "0px" }}
      >
        {[33, 66].map((laneX) => (
          <div
            key={laneX}
            className="absolute top-0 bottom-0 w-[3px]"
            style={{
              left: `${laneX}%`,
              backgroundImage: dashes,
              backgroundPositionY: "var(--roadY)",
            }}
          />
        ))}
        <div className="absolute left-0 top-0 bottom-0 w-[15%] bg-gradient-to-r from-black via-red-900/40 to-transparent border-r-2 border-red-500 shadow-[inset_-10px_0_20px_rgba(220,38,38,0.3)] z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-[15%] bg-gradient-to-l from-black via-red-900/40 to-transparent border-l-2 border-red-500 shadow-[inset_10px_0_20px_rgba(220,38,38,0.3)] z-10"></div>
      </div>

      {/* Traffic & Coins */}
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
              color={obj.color}
              variant={obj.variant}
              alt="traffic"
              className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]"
            />
          )}
        </div>
      ))}

      {/* Player Car */}
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
            image="/public/ngkd8hngkd8hngkd.jfif"
            color={selectedCar.color}
            variant={selectedCar.variant}
            alt="Player Car"
            className="w-full h-full drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
            style={{ transform: `rotate(${g.rotation}deg)` }}
          />
          {g.nitroOn && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
              <div className="w-2 h-10 bg-cyan-400 rounded-full blur-md animate-pulse"></div>
              <div className="w-2 h-14 bg-blue-500 rounded-full blur-sm animate-pulse"></div>
              <div className="w-2 h-10 bg-cyan-400 rounded-full blur-md animate-pulse"></div>
            </div>
          )}
          {input.current.brake && g.speed > 0 && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-2 bg-red-600 shadow-[0_0_20px_red] animate-pulse"></div>
          )}
        </div>
      </div>

      {/* HUD - Top */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-40 pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <Trophy size={16} className="text-yellow-400" />
            <span className="text-white font-mono font-bold">
              {g.score.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <Coins size={16} className="text-yellow-400" />
            <span className="text-white font-mono font-bold">{g.coins}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <div className="text-white font-black text-4xl italic drop-shadow-md leading-none">
            {mph} <span className="text-sm font-normal text-cyan-400">MPH</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-300 font-mono">
            <Activity size={10} className="text-red-400" /> {torque} Nm
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-300 font-mono">
            <Wind size={10} className="text-blue-400" /> {wind} km/h
          </div>
          <div className="w-full h-1.5 mt-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${g.nitro}%` }}
            />
          </div>
        </div>
      </div>

      {/* HUD - Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 flex justify-between items-end z-40 pointer-events-auto bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="flex gap-2">
          <button
            {...hold("left")}
            className="w-16 h-20 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:bg-cyan-600/50 touch-none"
          >
            <ChevronLeft size={36} />
          </button>
          <button
            {...hold("right")}
            className="w-16 h-20 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:bg-cyan-600/50 touch-none"
          >
            <ChevronRight size={36} />
          </button>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-3">
            <button
              {...hold("brake")}
              className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-red-200 active:bg-red-600 touch-none shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            >
              <span className="font-bold text-xs">BRAKE</span>
            </button>
            <button
              {...hold("gas")}
              className="w-16 h-16 rounded-full bg-green-950/80 border-2 border-green-500 flex items-center justify-center text-green-200 active:bg-green-600 touch-none shadow-[0_0_15px_rgba(34,197,94,0.5)]"
            >
              <span className="font-bold text-xs leading-tight">GAS</span>
            </button>
          </div>
          <button
            {...hold("nitro")}
            className={`w-24 h-14 rounded-2xl flex items-center justify-center border-2 touch-none transition-all ${g.nitro > 0 ? "bg-blue-600 border-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.8)]" : "bg-slate-800 border-slate-600 text-gray-500"}`}
          >
            <Zap
              size={24}
              className={g.nitro > 0 ? "fill-white text-white" : ""}
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
  const [view, setView] = useState<"home" | "garage" | "race" | "results">(
    "home",
  );
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
    submitScore,
  } = useGameStore();
  const selectedCar = cars.find((c) => c.id === selectedCarId) || cars[0];

  const handleGameOver = (score: number, runCoins: number) => {
    setResult({ score, coins: runCoins });
    addCoins(runCoins);
    submitScore(score);
    toast.error("You crashed!", { autoClose: 1500 });
    setView("results");
  };

  const startRace = () => {
    setRunId((r) => r + 1);
    setView("race");
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-black font-sans selection:bg-cyan-500 selection:text-white">
      <div
        className="relative w-full h-[100dvh] sm:h-[850px] sm:max-h-[95vh] max-w-md md:max-w-lg lg:max-w-xl overflow-hidden sm:rounded-[2.5rem] sm:border-[12px] sm:border-[#111] shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        style={{ background: GAME_BG }}
      >
        {(view === "race" || view === "results") && (
          <div
            className={`absolute inset-0 ${view === "results" ? "pointer-events-none opacity-50 blur-sm" : ""}`}
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
            coins={coins}
            playerName={playerName}
            setPlayerName={setPlayerName}
            leaderboard={leaderboard}
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
        {view === "results" && (
          <ResultsPage
            score={result.score}
            runCoins={result.coins}
            onRestart={startRace}
            onHome={() => setView("home")}
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
