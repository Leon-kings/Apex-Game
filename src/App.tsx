// import React, { useState, useEffect, useRef, useId } from "react";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import {
//   Trophy,
//   Coins,
//   Play,
//   RotateCcw,
//   ChevronLeft,
//   ChevronRight,
//   Zap,
//   Car,
//   Lock,
//   CheckCircle2,
//   Gauge,
//   Activity,
//   Award,
//   Wind,
//   History,
//   Trash2,
// } from "lucide-react";
// import "./App.css";

// // ============================================================================
// // --- Types & Data ---
// // ============================================================================
// export type VehicleModel = {
//   id: string;
//   name: string;
//   image?: string;
//   color: string;
//   variant: "sedan" | "sport" | "truck";
//   speedMultiplier: number;
//   handling: number;
//   price: number;
//   unlocked: boolean;
// };

// export type GameObject = {
//   id: number;
//   x: number;
//   y: number;
//   type: "coin" | "traffic";
//   image?: string;
//   color: string;
//   variant: "sedan" | "sport" | "truck";
//   width: number;
//   height: number;
// };

// export type RunRecord = {
//   id: string;
//   score: number;
//   coins: number;
//   carName: string;
//   timestamp: number;
// };

// const GAME_SPEED_BASE = 0.5;
// const PLAYER_WIDTH = 22;
// const PLAYER_HEIGHT = 22;
// const ROAD_LEFT_BOUND = 15;
// const ROAD_RIGHT_BOUND = 85;
// const GAME_BG = "#050810";

// // YOUR EXACT IMAGES
// const TRAFFIC_IMAGES = [
//   "/src/assets/2b1f29bf-58ce-405c-ae1d-68987fe116b3.jfif",
//   "/src/assets/Image_4e7bej4e7bej4e7b.jfif",
//   "/src/assets/Image_dhv1bwdhv1bwdhv1.jfif",
//   "/src/assets/Image_ypnbbgypnbbgypnb.jfif",
// ];
// const TRAFFIC_VARIANTS = ["sedan", "sport", "sedan", "truck"] as const;
// const TRAFFIC_COLORS = [
//   "#ff4d4d",
//   "#3b9dff",
//   "#2ee59d",
//   "#ff9f1a",
//   "#b66dff",
//   "#f1f5f9",
// ];

// // YOUR EXACT CARS WITH PRICES AND UNLOCK STATES
// const INITIAL_CARS: VehicleModel[] = [
//   {
//     id: "car1",
//     name: "Apex White",
//     image: "/public/Image_8knkdd8knkdd8knk.jfif",
//     color: "#e8eef5",
//     variant: "sedan",
//     speedMultiplier: 1.0,
//     handling: 1.0,
//     price: 0,
//     unlocked: true,
//   },
//   {
//     id: "car2",
//     name: "Luxury Detail",
//     image: "/public/Image_cwspq4cwspq4cwsp.jfif",
//     color: "#00e5ff",
//     variant: "sport",
//     speedMultiplier: 1.2,
//     handling: 1.1,
//     price: 500,
//     unlocked: false,
//   },
//   {
//     id: "car3",
//     name: "Shadow Sport",
//     image: "/public/Image_f7emguf7emguf7em.jfif",
//     color: "#ff2bd6",
//     variant: "sport",
//     speedMultiplier: 1.4,
//     handling: 0.9,
//     price: 1500,
//     unlocked: false,
//   },
//   {
//     id: "car4",
//     name: "Lambo Rear",
//     image: "/public/Image_t9ex4zt9ex4zt9ex.jfif",
//     color: "#ffd400",
//     variant: "sport",
//     speedMultiplier: 1.6,
//     handling: 1.3,
//     price: 3000,
//     unlocked: false,
//   },
// ];

// // ============================================================================
// // --- Transparent cutout ---
// // ============================================================================
// const cutoutCache = new Map<string, Promise<string>>();

// const removeWhiteBackground = (src: string): Promise<string> => {
//   const cached = cutoutCache.get(src);
//   if (cached) return cached;

//   const job = new Promise<string>((resolve) => {
//     const img = new Image();
//     img.crossOrigin = "anonymous";
//     img.onload = () => {
//       try {
//         const scale = Math.min(1, 420 / Math.max(img.width, img.height));
//         const w = Math.max(1, Math.round(img.width * scale));
//         const h = Math.max(1, Math.round(img.height * scale));
//         const canvas = document.createElement("canvas");
//         canvas.width = w;
//         canvas.height = h;
//         const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
//         ctx.drawImage(img, 0, 0, w, h);
//         const data = ctx.getImageData(0, 0, w, h);
//         const px = data.data;
//         const cornerA = [
//           0,
//           (w - 1) * 4,
//           (h - 1) * w * 4,
//           ((h - 1) * w + w - 1) * 4,
//         ].map((i) => px[i + 3]);
//         if (cornerA.every((a) => a < 10)) {
//           resolve(src);
//           return;
//         }

//         const corner = (x: number, y: number) => {
//           const i = (y * w + x) * 4;
//           return (px[i] + px[i + 1] + px[i + 2]) / 3;
//         };
//         const dark =
//           (corner(0, 0) +
//             corner(w - 1, 0) +
//             corner(0, h - 1) +
//             corner(w - 1, h - 1)) /
//             4 <
//           60;
//         const isBg = (i: number, loose = false) => {
//           if (px[i + 3] < 10) return true;
//           const r = px[i],
//             g = px[i + 1],
//             b = px[i + 2];
//           const mx = Math.max(r, g, b),
//             mn = Math.min(r, g, b);
//           if (dark) return mx < (loose ? 85 : 55);
//           return mx - mn < (loose ? 30 : 22) && mn > (loose ? 140 : 165);
//         };

//         const visited = new Uint8Array(w * h);
//         const stack: number[] = [];
//         const push = (x: number, y: number) => {
//           if (x < 0 || y < 0 || x >= w || y >= h) return;
//           const p = y * w + x;
//           if (visited[p] || !isBg(p * 4)) return;
//           visited[p] = 1;
//           stack.push(p);
//         };
//         for (let x = 0; x < w; x++) {
//           push(x, 0);
//           push(x, h - 1);
//         }
//         for (let y = 0; y < h; y++) {
//           push(0, y);
//           push(w - 1, y);
//         }
//         while (stack.length) {
//           const p = stack.pop()!;
//           const x = p % w,
//             y = (p / w) | 0;
//           px[p * 4 + 3] = 0;
//           push(x + 1, y);
//           push(x - 1, y);
//           push(x, y + 1);
//           push(x, y - 1);
//         }

//         for (let pass = 0; pass < 3; pass++) {
//           const kill: number[] = [];
//           for (let y = 1; y < h - 1; y++) {
//             for (let x = 1; x < w - 1; x++) {
//               const p = y * w + x;
//               if (visited[p]) continue;
//               const touches =
//                 visited[p - 1] ||
//                 visited[p + 1] ||
//                 visited[p - w] ||
//                 visited[p + w];
//               if (touches && isBg(p * 4, true)) kill.push(p);
//             }
//           }
//           for (const p of kill) {
//             visited[p] = 1;
//             px[p * 4 + 3] = 0;
//           }
//         }

//         ctx.putImageData(data, 0, 0);
//         resolve(canvas.toDataURL("image/png"));
//       } catch {
//         resolve(src);
//       }
//     };
//     img.onerror = () => resolve(src);
//     img.src = src;
//   });

//   cutoutCache.set(src, job);
//   return job;
// };

// const CarImage = ({
//   src,
//   alt,
//   className = "",
//   style,
//   onFail,
// }: {
//   src: string;
//   alt: string;
//   className?: string;
//   style?: React.CSSProperties;
//   onFail?: () => void;
// }) => {
//   const [url, setUrl] = useState<string | null>(null);
//   const [failed, setFailed] = useState(false);

//   useEffect(() => {
//     let alive = true;
//     removeWhiteBackground(src).then((u) => alive && setUrl(u));
//     return () => {
//       alive = false;
//     };
//   }, [src]);

//   if (failed)
//     return (
//       <div className="w-full h-full rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
//     );
//   if (!url) return <div className="w-full h-full" />;
//   return (
//     <img
//       src={url}
//       alt={alt}
//       draggable={false}
//       onError={() => (onFail ? onFail() : setFailed(true))}
//       className={className}
//       style={style}
//     />
//   );
// };

// // ============================================================================
// // --- Rear-view car sprites ---
// // ============================================================================
// type Variant = "sedan" | "sport" | "truck";

// const CarSprite = ({
//   image,
//   color,
//   variant,
//   alt = "car",
//   className = "",
//   style,
// }: {
//   image?: string;
//   color: string;
//   variant: Variant;
//   alt?: string;
//   className?: string;
//   style?: React.CSSProperties;
// }) => {
//   const uid = useId().replace(/:/g, "");
//   const [broken, setBroken] = useState(false);
//   if (image && !broken)
//     return (
//       <CarImage
//         src={image}
//         alt={alt}
//         onFail={() => setBroken(true)}
//         className={`object-contain ${className}`}
//         style={style}
//       />
//     );

//   const truck = variant === "truck";
//   const sport = variant === "sport";
//   const wheelY = truck ? [48, 140] : [34, 126];
//   const bodyD =
//     "M30 8 Q50 0 70 8 L80 40 Q84 90 82 150 Q80 178 70 182 L30 182 Q20 178 18 150 Q16 90 20 40 Z";
//   const glass = "#0d1b2a";

//   return (
//     <svg
//       viewBox="0 0 100 190"
//       className={className}
//       style={style}
//       role="img"
//       aria-label={alt}
//       preserveAspectRatio="xMidYMid meet"
//     >
//       <defs>
//         <linearGradient id={`b${uid}`} x1="0" y1="0" x2="1" y2="0">
//           <stop offset="0" stopColor="#000" stopOpacity=".35" />
//           <stop offset=".28" stopColor="#fff" stopOpacity=".2" />
//           <stop offset=".5" stopColor="#fff" stopOpacity="0" />
//           <stop offset=".72" stopColor="#fff" stopOpacity=".2" />
//           <stop offset="1" stopColor="#000" stopOpacity=".35" />
//         </linearGradient>
//         <filter id={`g${uid}`} x="-60%" y="-300%" width="220%" height="700%">
//           <feGaussianBlur stdDeviation="3" />
//         </filter>
//       </defs>

//       {wheelY.flatMap((y) =>
//         [4, 80].map((x) => (
//           <rect
//             key={`${x}-${y}`}
//             x={x}
//             y={y}
//             width="16"
//             height="32"
//             rx="5"
//             fill="#0a0a0f"
//             stroke="#8b93a1"
//             strokeWidth="1.5"
//           />
//         )),
//       )}

//       {truck ? (
//         <g>
//           <rect
//             x="22"
//             y="4"
//             width="56"
//             height="42"
//             rx="9"
//             fill={color}
//             stroke="rgba(255,255,255,.6)"
//             strokeWidth="1.5"
//           />
//           <rect x="28" y="12" width="44" height="16" rx="3" fill={glass} />
//           <rect
//             x="14"
//             y="42"
//             width="72"
//             height="144"
//             rx="5"
//             fill={color}
//             stroke="rgba(255,255,255,.6)"
//             strokeWidth="1.5"
//           />
//           <rect
//             x="14"
//             y="42"
//             width="72"
//             height="144"
//             rx="5"
//             fill={`url(#b${uid})`}
//           />
//           {[72, 102, 132, 160].map((y) => (
//             <line
//               key={y}
//               x1="16"
//               x2="84"
//               y1={y}
//               y2={y}
//               stroke="#000"
//               strokeOpacity=".18"
//               strokeWidth="2"
//             />
//           ))}
//           <line
//             x1="50"
//             x2="50"
//             y1="44"
//             y2="184"
//             stroke="#000"
//             strokeOpacity=".3"
//             strokeWidth="2"
//           />
//           <rect
//             x="18"
//             y="172"
//             width="18"
//             height="8"
//             rx="3"
//             fill="#ff2d2d"
//             filter={`url(#g${uid})`}
//           />
//           <rect
//             x="64"
//             y="172"
//             width="18"
//             height="8"
//             rx="3"
//             fill="#ff2d2d"
//             filter={`url(#g${uid})`}
//           />
//           <rect x="18" y="172" width="18" height="8" rx="3" fill="#ff5a5a" />
//           <rect x="64" y="172" width="18" height="8" rx="3" fill="#ff5a5a" />
//         </g>
//       ) : (
//         <g>
//           <path
//             d={bodyD}
//             fill={color}
//             stroke="rgba(255,255,255,.6)"
//             strokeWidth="1.5"
//           />
//           <path d={bodyD} fill={`url(#b${uid})`} />
//           <path
//             d="M28 14 Q50 8 72 14 L76 44 L24 44 Z"
//             fill="#fff"
//             fillOpacity=".16"
//           />
//           <path d="M27 48 L73 48 L68 74 L32 74 Z" fill={glass} />
//           <path
//             d="M31 50 L50 50 L46 60 L31 60 Z"
//             fill="#fff"
//             fillOpacity=".12"
//           />
//           <rect
//             x="32"
//             y="74"
//             width="36"
//             height="36"
//             rx="6"
//             fill="#000"
//             fillOpacity=".12"
//           />
//           <path d="M32 112 L68 112 L74 134 L26 134 Z" fill={glass} />
//           <path
//             d="M26 138 L74 138 L76 170 Q50 176 24 170 Z"
//             fill="#fff"
//             fillOpacity=".12"
//           />
//           {sport && (
//             <g>
//               <rect
//                 x="17"
//                 y="148"
//                 width="66"
//                 height="9"
//                 rx="3"
//                 fill={color}
//                 stroke="rgba(255,255,255,.6)"
//                 strokeWidth="1.2"
//               />
//               <rect
//                 x="17"
//                 y="148"
//                 width="66"
//                 height="9"
//                 rx="3"
//                 fill="#000"
//                 fillOpacity=".3"
//               />
//             </g>
//           )}
//           <rect
//             x="21"
//             y="166"
//             width="22"
//             height="8"
//             rx="3"
//             fill="#ff2d2d"
//             filter={`url(#g${uid})`}
//           />
//           <rect
//             x="57"
//             y="166"
//             width="22"
//             height="8"
//             rx="3"
//             fill="#ff2d2d"
//             filter={`url(#g${uid})`}
//           />
//           <rect x="21" y="166" width="22" height="8" rx="3" fill="#ff5a5a" />
//           <rect x="57" y="166" width="22" height="8" rx="3" fill="#ff5a5a" />
//           <circle cx="38" cy="184" r="3.2" fill="#9aa3b2" />
//           <circle cx="62" cy="184" r="3.2" fill="#9aa3b2" />
//         </g>
//       )}
//     </svg>
//   );
// };

// const CoinSprite = ({ className = "" }: { className?: string }) => (
//   <svg viewBox="0 0 100 100" className={className} role="img" aria-label="coin">
//     <circle
//       cx="50"
//       cy="50"
//       r="46"
//       fill="#f5b800"
//       stroke="#fff3b0"
//       strokeWidth="4"
//     />
//     <circle
//       cx="50"
//       cy="50"
//       r="34"
//       fill="#ffd633"
//       stroke="#c98f00"
//       strokeWidth="3"
//     />
//     <text
//       x="50"
//       y="64"
//       textAnchor="middle"
//       fontSize="42"
//       fontWeight="900"
//       fontFamily="Arial, sans-serif"
//       fill="#b87b00"
//     >
//       $
//     </text>
//   </svg>
// );

// const read = (key: string, fallback: string) => {
//   try {
//     return localStorage.getItem(key) ?? fallback;
//   } catch {
//     return fallback;
//   }
// };

// // ============================================================================
// // --- Store ---
// // ============================================================================
// const useGameStore = () => {
//   const [coins, setCoins] = useState(
//     () => parseInt(read("apex_coins", "0")) || 0,
//   );
//   const [playerName, setPlayerName] = useState(() => read("apex_name", ""));
//   const [leaderboard, setLeaderboard] = useState<
//     { name: string; score: number }[]
//   >(() => {
//     try {
//       return JSON.parse(read("apex_leaderboard", "[]"));
//     } catch {
//       return [];
//     }
//   });
//   const [history, setHistory] = useState<RunRecord[]>(() => {
//     try {
//       return JSON.parse(read("apex_history", "[]"));
//     } catch {
//       return [];
//     }
//   });
//   const [cars, setCars] = useState<VehicleModel[]>(() => {
//     let saved: VehicleModel[] = [];
//     try {
//       saved = JSON.parse(read("apex_cars", "null")) || INITIAL_CARS;
//     } catch {
//       saved = INITIAL_CARS;
//     }
//     return INITIAL_CARS.map((c) => ({
//       ...c,
//       unlocked: saved.find((s) => s.id === c.id)?.unlocked ?? c.unlocked,
//     }));
//   });
//   const [selectedCarId, setSelectedCarId] = useState<string>(() =>
//     read("apex_selected_car", "car1"),
//   );

//   useEffect(() => {
//     try {
//       localStorage.setItem("apex_coins", coins.toString());
//       localStorage.setItem("apex_name", playerName);
//       localStorage.setItem("apex_leaderboard", JSON.stringify(leaderboard));
//       localStorage.setItem("apex_history", JSON.stringify(history));
//       localStorage.setItem("apex_cars", JSON.stringify(cars));
//       localStorage.setItem("apex_selected_car", selectedCarId);
//     } catch {
//       /* storage unavailable */
//     }
//   }, [coins, playerName, leaderboard, history, cars, selectedCarId]);

//   const addCoins = (amount: number) => setCoins((prev) => prev + amount);

//   const unlockCar = (id: string, price: number, name: string) => {
//     if (coins < price) {
//       toast.error(`Need ${price - coins} more coins for ${name}`);
//       return;
//     }
//     setCoins((prev) => prev - price);
//     setCars((prev) =>
//       prev.map((c) => (c.id === id ? { ...c, unlocked: true } : c)),
//     );
//     toast.success(`${name} unlocked!`);
//   };

//   const submitScore = (
//     finalScore: number,
//     runCoins: number,
//     carName: string,
//   ) => {
//     if (!playerName) return;
//     setLeaderboard(
//       [...leaderboard, { name: playerName, score: finalScore }]
//         .sort((a, b) => b.score - a.score)
//         .slice(0, 50),
//     );
//     setHistory((prev) =>
//       [
//         {
//           id: `${Date.now()}-${Math.random()}`,
//           score: finalScore,
//           coins: runCoins,
//           carName,
//           timestamp: Date.now(),
//         },
//         ...prev,
//       ].slice(0, 100),
//     );
//   };

//   const clearLeaderboard = () => {
//     setLeaderboard([]);
//     setHistory([]);
//     toast.success("Leaderboard & history cleared");
//   };

//   const clearAllMemory = () => {
//     setCoins(0);
//     setPlayerName("");
//     setLeaderboard([]);
//     setHistory([]);
//     setCars(INITIAL_CARS);
//     setSelectedCarId("car1");
//     try {
//       [
//         "apex_coins",
//         "apex_name",
//         "apex_leaderboard",
//         "apex_history",
//         "apex_cars",
//         "apex_selected_car",
//       ].forEach((k) => localStorage.removeItem(k));
//     } catch {
//       /* ignore */
//     }
//     toast.success("All memory wiped");
//   };

//   return {
//     coins,
//     addCoins,
//     cars,
//     unlockCar,
//     selectedCarId,
//     setSelectedCarId,
//     playerName,
//     setPlayerName,
//     leaderboard,
//     history,
//     submitScore,
//     clearLeaderboard,
//     clearAllMemory,
//   };
// };

// // ============================================================================
// // --- Header ---
// // ============================================================================
// const Header = ({
//   coins,
//   onHistory,
// }: {
//   coins: number;
//   onHistory: () => void;
// }) => (
//   <header className="shrink-0 rounded-2xl w-full z-20 border-b border-white/10 bg-black/60 backdrop-blur-md">
//     <div className="w-full px-3 sm:px-4 lg:px-6 py-2 lg:py-2.5">
//       <div className="mx-auto w-full max-w-6xl grid grid-cols-[1fr_auto] items-center gap-2">
//         <div className="grid grid-flow-col auto-cols-max items-baseline gap-1 sm:gap-1.5 min-w-0">
//           <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 font-black italic tracking-tighter text-xs sm:text-sm md:text-base lg:text-lg leading-none whitespace-nowrap">
//             NEON
//           </span>
//           <span className="text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 to-fuchsia-700 font-black italic tracking-tighter text-xs sm:text-sm md:text-base lg:text-lg leading-none whitespace-nowrap">
//             HIGHWAY
//           </span>
//         </div>

//         <div className="grid grid-flow-col auto-cols-max items-center gap-1.5 sm:gap-2 shrink-0">
//           <button
//             onClick={onHistory}
//             className="grid grid-flow-col auto-cols-max items-center gap-1 bg-black/40 border border-white/10 px-2 sm:px-2.5 py-1.5 rounded-full text-white text-[10px] sm:text-xs lg:text-sm font-bold hover:bg-white/10 transition whitespace-nowrap"
//           >
//             <History className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
//             <span>MARKS</span>
//           </button>
//           <div className="grid grid-flow-col auto-cols-max items-center gap-1 bg-black/40 border border-white/10 px-2 sm:px-2.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.2)] whitespace-nowrap">
//             <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-yellow-400" />
//             <span className="text-white font-mono font-bold tracking-wider text-[10px] sm:text-xs lg:text-sm">
//               {coins.toLocaleString()}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   </header>
// );

// // ============================================================================
// // --- Footer ---
// // ============================================================================
// const Footer = ({
//   onHome,
//   onGarage,
//   onHistory,
// }: {
//   onHome?: () => void;
//   onGarage?: () => void;
//   onHistory?: () => void;
// }) => (
//   <footer className="shrink-0 rounded-2xl w-full border-t border-white/10 bg-black/50 backdrop-blur-md pb-6 z-10">
//     <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-6 py-2 grid grid-cols-[1fr_auto] items-center gap-2">
//       <div className="grid py-4 grid-flow-col auto-cols-max items-center gap-1.5 sm:gap-2 min-w-0">
//         <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
//         <a
//           href="https://www.leonakingeneye.live/"
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-[9px] sm:text-[11px] lg:text-xs text-white font-bold hover:text-cyan-400 tracking-wider uppercase transition-colors whitespace-nowrap"
//         >
//           Leon © {new Date().getFullYear()}
//         </a>
//       </div>
//       <nav className="grid grid-flow-col auto-cols-max items-center gap-2 lg:gap-3 justify-end">
//         {onHome && (
//           <button
//             onClick={onHome}
//             className="text-[9px] sm:text-[11px] lg:text-xs text-gray-400 hover:text-cyan-400 font-bold tracking-wider uppercase transition-colors whitespace-nowrap"
//           >
//             Home
//           </button>
//         )}
//         {onGarage && (
//           <button
//             onClick={onGarage}
//             className="text-[9px] sm:text-[11px] lg:text-xs text-gray-400 hover:text-cyan-400 font-bold tracking-wider uppercase transition-colors whitespace-nowrap"
//           >
//             Garage
//           </button>
//         )}
//         {onHistory && (
//           <button
//             onClick={onHistory}
//             className="text-[9px] sm:text-[11px] lg:text-xs text-gray-400 hover:text-fuchsia-400 font-bold tracking-wider uppercase transition-colors whitespace-nowrap"
//           >
//             Marks
//           </button>
//         )}
//       </nav>
//     </div>
//   </footer>
// );

// // ============================================================================
// // --- Home Page ---
// // ============================================================================
// const HomePage = ({
//   onStart,
//   onGarage,
//   onHistory,
//   playerName,
//   setPlayerName,
//   leaderboard,
//   cars,
//   selectedCarId,
// }: any) => {
//   const selectedCar =
//     cars.find((c: VehicleModel) => c.id === selectedCarId) || cars[0];
//   return (
//     <div className="w-full rounded-2xl bg-[#050810] flex flex-col z-50 font-sans relative min-h-full overflow-hidden">
//       {/* Glow Backgrounds - Added overflow-hidden to parent to prevent horizontal scrolling */}
//       <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />
//       <div className="absolute bottom-[-10%] right-[-10%] w-full h-[40%] bg-fuchsia-600/20 blur-[100px] rounded-full pointer-events-none" />

//       <div className="flex-1 w-full z-10 px-3 sm:px-4 lg:px-6 flex flex-col items-center justify-center py-10">
//         <h1 className="grid place-items-center text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl font-black italic tracking-tighter text-center leading-none">
//           <span className="block text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]">
//             NEON
//           </span>
//           <span className="block text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 to-fuchsia-700 drop-shadow-[0_0_25px_rgba(192,38,211,0.8)]">
//             HIGHWAY
//           </span>
//         </h1>

//         <p className="text-cyan-200/60 tracking-[0.2em] sm:tracking-[0.3em] text-[8px] xs:text-[9px] sm:text-xs font-bold uppercase text-center mt-2">
//           Ultimate Racing Experience
//         </p>

//         <div className="w-20 h-28 xs:w-24 xs:h-32 sm:w-28 sm:h-40 md:w-32 md:h-44 lg:w-36 lg:h-48 mt-4 p-2 rounded-2xl border border-white/10 bg-white/5 grid place-items-center shrink-0">
//           <CarSprite
//             image={selectedCar.image}
//             color={selectedCar.color}
//             variant={selectedCar.variant}
//             alt={selectedCar.name}
//             className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
//           />
//         </div>
//         <p className="text-white/80 text-[10px] xs:text-[11px] sm:text-xs lg:text-sm font-mono text-center mt-2">
//           {selectedCar.name}
//         </p>
//       </div>

//       <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 pb-6 z-10 grid gap-2 sm:gap-3 shrink-0">
//         <input
//           type="text"
//           placeholder="ENTER DRIVER NAME"
//           value={playerName}
//           maxLength={14}
//           onChange={(e) => setPlayerName(e.target.value)}
//           className="w-full bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-center font-bold tracking-widest text-xs sm:text-sm lg:text-base transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
//         />

//         <button
//           onClick={onStart}
//           disabled={!playerName.trim()}
//           className="w-full py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-black rounded-xl sm:rounded-2xl text-sm sm:text-lg lg:text-xl tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95 transition-all grid grid-flow-col auto-cols-max place-items-center justify-center gap-2 sm:gap-3"
//         >
//           <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
//           <span>RACE NOW</span>
//         </button>

//         <div className="grid grid-cols-2 gap-2 sm:gap-3">
//           <button
//             onClick={onGarage}
//             className="py-3 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl sm:rounded-2xl text-xs sm:text-base lg:text-lg tracking-wider grid grid-flow-col auto-cols-max place-items-center justify-center gap-2 transition-all"
//           >
//             <Car size={16} className="sm:w-5 sm:h-5" />
//             <span>GARAGE</span>
//           </button>
//           <button
//             onClick={onHistory}
//             className="py-3 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl sm:rounded-2xl text-xs sm:text-base lg:text-lg tracking-wider grid grid-flow-col auto-cols-max place-items-center justify-center gap-2 transition-all"
//           >
//             <History size={16} className="sm:w-5 sm:h-5" />
//             <span>MARKS</span>
//           </button>
//         </div>

//         {leaderboard.length > 0 && (
//           <div className="bg-black/40 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 w-full mt-2">
//             <h3 className="text-cyan-400 font-bold text-xs tracking-widest uppercase grid grid-flow-col auto-cols-max place-items-center justify-center gap-2 mb-2">
//               <Award size={14} className="sm:w-4 sm:h-4" /> Top Drivers
//             </h3>
//             <div className="grid gap-1">
//               {leaderboard.slice(0, 3).map((entry: any, i: number) => (
//                 <div
//                   key={i}
//                   className="grid grid-cols-[1fr_auto] text-xs text-gray-300 font-mono py-1 border-b border-white/5 last:border-0 gap-2"
//                 >
//                   <span className="truncate">
//                     {i + 1}. {entry.name}
//                   </span>
//                   <span className="text-white">
//                     {entry.score.toLocaleString()}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // ============================================================================
// // --- Garage Page ---
// // ============================================================================
// const GaragePage = ({
//   onBack,
//   cars,
//   unlockCar,
//   selectedCarId,
//   setSelectedCarId,
//   coins,
// }: any) => (
//   <div className="w-full rounded-2xl bg-[#050810] z-50 pb-10">
//     <div className="p-3 sm:p-4 grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-white/10 bg-black/40 backdrop-blur-md">
//       <button
//         onClick={onBack}
//         className="text-white grid grid-flow-col auto-cols-max items-center gap-1 font-bold hover:text-cyan-400 transition-colors text-xs sm:text-base"
//       >
//         <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" /> BACK
//       </button>
//       <h2 className="text-center text-sm sm:text-lg lg:text-xl font-black text-white tracking-widest">
//         GARAGE
//       </h2>
//       <div className="grid grid-flow-col auto-cols-max items-center gap-1 sm:gap-2 text-yellow-400 font-mono font-bold text-xs sm:text-base">
//         <Coins size={14} className="sm:w-5 sm:h-5" /> {coins}
//       </div>
//     </div>

//     <div className="p-3 sm:p-4">
//       <div className="grid gap-3 sm:gap-4">
//         {cars.map((car: VehicleModel) => (
//           <div
//             key={car.id}
//             className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 grid gap-3 transition-all duration-300 ${
//               selectedCarId === car.id
//                 ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
//                 : "border-white/5 bg-white/5 hover:border-white/20"
//             }`}
//           >
//             <div className="grid grid-cols-[auto_1fr] items-center gap-3 sm:gap-4 min-w-0">
//               <div className="w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 lg:w-28 lg:h-36 rounded-lg sm:rounded-xl p-1 sm:p-2 overflow-hidden grid place-items-center border border-white/10 bg-transparent shrink-0">
//                 <CarSprite
//                   image={car.image}
//                   color={car.color}
//                   variant={car.variant}
//                   alt={car.name}
//                   className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
//                 />
//               </div>
//               <div className="min-w-0">
//                 <h3 className="text-white font-bold text-sm sm:text-lg truncate">
//                   {car.name}
//                 </h3>
//                 <p className="text-gray-400 text-[10px] sm:text-xs grid grid-flow-col auto-cols-max items-center gap-1 mt-1">
//                   <Gauge size={10} className="sm:w-3 sm:h-3 text-cyan-400" />
//                   <span>Speed: {car.speedMultiplier}x</span>
//                 </p>
//                 <p className="text-gray-400 text-[10px] sm:text-xs grid grid-flow-col auto-cols-max items-center gap-1">
//                   <Activity
//                     size={10}
//                     className="sm:w-3 sm:h-3 text-fuchsia-400"
//                   />
//                   <span>Handling: {car.handling}x</span>
//                 </p>
//               </div>
//             </div>

//             <div className="grid grid-cols-1">
//               {car.unlocked ? (
//                 <button
//                   onClick={() => setSelectedCarId(car.id)}
//                   className={`w-full px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold grid grid-flow-col auto-cols-max items-center justify-center gap-1 transition-all ${
//                     selectedCarId === car.id
//                       ? "bg-cyan-600 text-white"
//                       : "bg-white/10 text-gray-300 hover:bg-white/20"
//                   }`}
//                 >
//                   {selectedCarId === car.id ? (
//                     <>
//                       <CheckCircle2 size={16} className="sm:w-4 sm:h-4" />
//                       <span>EQUIPPED</span>
//                     </>
//                   ) : (
//                     <span>SELECT</span>
//                   )}
//                 </button>
//               ) : (
//                 <button
//                   onClick={() => unlockCar(car.id, car.price, car.name)}
//                   className={`w-full px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold grid grid-flow-col auto-cols-max items-center justify-center gap-1 transition-all ${
//                     coins >= car.price
//                       ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]"
//                       : "bg-black/50 text-gray-500 border border-white/5"
//                   }`}
//                 >
//                   <Lock size={16} className="sm:w-4 sm:h-4" />
//                   <span>{car.price}</span>
//                 </button>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   </div>
// );

// // ============================================================================
// // --- History Page ---
// // ============================================================================
// const HistoryPage = ({
//   onBack,
//   leaderboard,
//   history,
//   clearLeaderboard,
//   clearAllMemory,
// }: any) => {
//   const [confirm, setConfirm] = useState<null | "clear" | "all">(null);
//   return (
//     <div className="w-full rounded-2xl bg-[#050810] z-50 pb-10">
//       <div className="p-3 sm:p-4 grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-white/10 bg-black/40 backdrop-blur-md">
//         <button
//           onClick={onBack}
//           className="text-white grid grid-flow-col auto-cols-max items-center gap-1 font-bold hover:text-cyan-400 transition-colors text-xs sm:text-base"
//         >
//           <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" /> BACK
//         </button>
//         <h2 className="text-center text-sm sm:text-lg lg:text-xl font-black text-white tracking-widest">
//           MARKS
//         </h2>
//         <div className="w-8 sm:w-12" />
//       </div>

//       <div className="p-3 sm:p-4 grid gap-3 sm:gap-4">
//         <div className="bg-black/40 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
//           <h3 className="text-cyan-400 font-bold text-xs tracking-widest uppercase grid grid-flow-col auto-cols-max items-center gap-2 mb-3">
//             <Award size={14} className="sm:w-4 sm:h-4" /> Best Scores
//           </h3>
//           {leaderboard.length === 0 ? (
//             <p className="text-gray-500 text-xs sm:text-sm text-center py-2">
//               No marks yet.
//             </p>
//           ) : (
//             <div className="grid gap-1">
//               {leaderboard.map((e: any, i: number) => (
//                 <div
//                   key={i}
//                   className="grid grid-cols-[1fr_auto] text-xs text-gray-300 font-mono py-1 border-b border-white/5 last:border-0 gap-2"
//                 >
//                   <span className="truncate">
//                     {i + 1}. {e.name}
//                   </span>
//                   <span className="text-white">{e.score.toLocaleString()}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="bg-black/40 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
//           <h3 className="text-fuchsia-400 font-bold text-xs tracking-widest uppercase grid grid-flow-col auto-cols-max items-center gap-2 mb-3">
//             <History size={14} className="sm:w-4 sm:h-4" /> Past Runs
//           </h3>
//           {history.length === 0 ? (
//             <p className="text-gray-500 text-xs sm:text-sm text-center py-2">
//               No runs recorded.
//             </p>
//           ) : (
//             <div className="grid gap-1">
//               {history.map((h: RunRecord) => (
//                 <div
//                   key={h.id}
//                   className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto] gap-x-2 text-xs text-gray-300 font-mono py-1 border-b border-white/5 last:border-0"
//                 >
//                   <span className="text-white/80 truncate">{h.carName}</span>
//                   <span>Score: {h.score.toLocaleString()}</span>
//                   <span className="text-yellow-400">+{h.coins}</span>
//                   <span className="text-gray-500 col-span-2 sm:col-span-1">
//                     {new Date(h.timestamp).toLocaleString()}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="bg-red-950/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-red-500/30 grid gap-3">
//           <h3 className="text-red-400 font-bold text-xs tracking-widest uppercase grid grid-flow-col auto-cols-max items-center gap-2">
//             <Trash2 size={14} className="sm:w-4 sm:h-4" /> Memory
//           </h3>
//           {confirm === null ? (
//             <div className="grid gap-2">
//               <button
//                 onClick={() => setConfirm("clear")}
//                 className="w-full py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold bg-red-900/50 hover:bg-red-800/60 text-red-200 border border-red-500/40 transition"
//               >
//                 Clear Leaderboard & History
//               </button>
//               <button
//                 onClick={() => setConfirm("all")}
//                 className="w-full py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold bg-red-900/50 hover:bg-red-800/60 text-red-200 border border-red-500/40 transition"
//               >
//                 Reset Everything (coins, cars, name)
//               </button>
//             </div>
//           ) : (
//             <div className="grid gap-3">
//               <p className="text-red-200 text-xs sm:text-sm text-center">
//                 Are you sure? This cannot be undone.
//               </p>
//               <div className="grid grid-cols-2 gap-3">
//                 <button
//                   onClick={() => setConfirm(null)}
//                   className="py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={() => {
//                     if (confirm === "clear") clearLeaderboard();
//                     else clearAllMemory();
//                     setConfirm(null);
//                   }}
//                   className="py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition"
//                 >
//                   Yes, delete
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// // ============================================================================
// // --- Results Page ---
// // ============================================================================
// const ResultsPage = ({ score, runCoins, onRestart, onHome }: any) => (
//   <div className="w-full rounded-2xl bg-black/80 p-4 sm:p-6 flex flex-col justify-center items-center z-50 min-h-full">
//     <div className="w-full max-w-sm grid gap-6 place-items-center">
//       <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-800 italic tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] text-center">
//         CRASHED!
//       </h2>

//       <div className="bg-[#0a0f1c] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 w-full grid gap-4 sm:gap-6 shadow-2xl relative overflow-hidden">
//         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500" />
//         <div className="text-center grid gap-1">
//           <p className="text-gray-400 text-[10px] sm:text-xs tracking-[0.2em] uppercase">
//             Run Score
//           </p>
//           <p className="text-4xl sm:text-5xl lg:text-6xl font-mono text-white font-black">
//             {score.toLocaleString()}
//           </p>
//         </div>
//         <div className="h-px bg-white/10 w-full" />
//         <div className="grid grid-cols-[1fr_auto] items-center bg-black/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/5 gap-3">
//           <span className="text-yellow-400 grid grid-flow-col auto-cols-max items-center gap-2 font-bold text-xs sm:text-sm">
//             <Coins size={16} className="sm:w-5 sm:h-5" /> Coins Earned
//           </span>
//           <span className="text-xl sm:text-2xl font-bold text-white">
//             +{runCoins}
//           </span>
//         </div>
//       </div>

//       <div className="grid gap-3 sm:gap-4 w-full">
//         <button
//           onClick={onRestart}
//           className="w-full py-3 sm:py-4 bg-white text-black font-black rounded-xl sm:rounded-2xl text-sm sm:text-lg grid grid-flow-col auto-cols-max place-items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
//         >
//           <RotateCcw size={18} className="sm:w-5 sm:h-5" /> TRY AGAIN
//         </button>
//         <button
//           onClick={onHome}
//           className="w-full py-3 sm:py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl sm:rounded-2xl text-sm sm:text-lg active:scale-95 transition-transform hover:bg-white/10"
//         >
//           MAIN MENU
//         </button>
//       </div>
//     </div>
//   </div>
// );

// // ============================================================================
// // --- Core Race Engine ---
// // ============================================================================
// type Input = {
//   left: boolean;
//   right: boolean;
//   gas: boolean;
//   brake: boolean;
//   nitro: boolean;
// };

// const RaceComponent = ({
//   selectedCar,
//   onGameOver,
// }: {
//   selectedCar: VehicleModel;
//   onGameOver: (score: number, coins: number) => void;
// }) => {
//   const input = useRef<Input>({
//     left: false,
//     right: false,
//     gas: false,
//     brake: false,
//     nitro: false,
//   });
//   const game = useRef({
//     x: 50,
//     steer: 0,
//     rotation: 0,
//     speed: GAME_SPEED_BASE * selectedCar.speedMultiplier * 0.5,
//     maxSpeed: GAME_SPEED_BASE * selectedCar.speedMultiplier,
//     nitro: 100,
//     nitroOn: false,
//     score: 0,
//     coins: 0,
//     roadY: 0,
//     spawn: 0,
//     objs: [] as GameObject[],
//     over: false,
//   });
//   const roadRef = useRef<HTMLDivElement>(null);
//   const [, setFrame] = useState(0);

//   useEffect(() => {
//     const set = (e: KeyboardEvent, v: boolean) => {
//       const k = e.key.toLowerCase();
//       if (k === "arrowleft" || k === "a") input.current.left = v;
//       if (k === "arrowright" || k === "d") input.current.right = v;
//       if (k === "arrowup" || k === "w") input.current.gas = v;
//       if (k === "arrowdown" || k === "s") input.current.brake = v;
//       if (k === "shift") input.current.nitro = v;
//       if (k.startsWith("arrow")) e.preventDefault();
//     };
//     const down = (e: KeyboardEvent) => set(e, true);
//     const up = (e: KeyboardEvent) => set(e, false);
//     window.addEventListener("keydown", down);
//     window.addEventListener("keyup", up);
//     return () => {
//       window.removeEventListener("keydown", down);
//       window.removeEventListener("keyup", up);
//     };
//   }, []);

//   useEffect(() => {
//     let raf = 0;
//     let last = performance.now();

//     const loop = (time: number) => {
//       const g = game.current;
//       if (g.over) return;
//       const deltaTime = Math.min(time - last, 50);
//       last = time;
//       const dt = deltaTime / 16.66;
//       const inp = input.current;

//       if (inp.brake) g.speed = Math.max(0, g.speed - 0.15 * dt);
//       else if (inp.gas) g.speed += 0.03 * dt;
//       else g.speed -= 0.01 * dt;

//       g.nitroOn = inp.nitro && g.nitro > 0;
//       g.nitro = g.nitroOn
//         ? Math.max(0, g.nitro - 0.8 * dt)
//         : Math.min(100, g.nitro + 0.2 * dt);
//       const cap = g.nitroOn ? g.maxSpeed * 2 : g.maxSpeed;
//       g.speed = Math.max(0, Math.min(g.speed, cap));
//       const worldSpeed = Math.max(0.2, g.speed);

//       const steerInput = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
//       g.steer += (steerInput - g.steer) * 0.25 * dt;
//       g.x += g.steer * 1.1 * selectedCar.handling * dt;
//       g.x = Math.max(ROAD_LEFT_BOUND, Math.min(ROAD_RIGHT_BOUND, g.x));
//       g.rotation = g.steer * 18;

//       g.roadY = (g.roadY + worldSpeed * dt * 14) % 80;
//       if (roadRef.current)
//         roadRef.current.style.setProperty("--roadY", `${g.roadY}px`);

//       g.spawn += deltaTime;
//       if (g.spawn > 800) {
//         g.spawn = 0;
//         const isCoin = Math.random() > 0.8;
//         const idx = Math.floor(Math.random() * TRAFFIC_VARIANTS.length);
//         const tv = TRAFFIC_VARIANTS[idx];
//         g.objs.push({
//           id: Date.now() + Math.random(),
//           x:
//             Math.random() * (ROAD_RIGHT_BOUND - ROAD_LEFT_BOUND - 15) +
//             ROAD_LEFT_BOUND +
//             7.5,
//           y: -30,
//           type: isCoin ? "coin" : "traffic",
//           color:
//             TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)],
//           image: isCoin ? undefined : TRAFFIC_IMAGES[idx],
//           variant: tv,
//           width: isCoin ? 8 : tv === "truck" ? 22 : 20,
//           height: isCoin ? 8 : tv === "truck" ? 26 : 20,
//         });
//       }

//       const playerY = 75;
//       const remaining: GameObject[] = [];
//       let crashed = false;
//       for (const obj of g.objs) {
//         obj.y += worldSpeed * dt * 1.5;
//         const hit =
//           Math.abs(obj.x - g.x) < 10 && Math.abs(obj.y - playerY) < 15;
//         if (hit && obj.type === "coin") {
//           g.coins += 10;
//           g.score += 50;
//           continue;
//         }
//         if (hit) {
//           crashed = true;
//         }
//         if (obj.y < 120) remaining.push(obj);
//       }
//       g.objs = remaining;

//       if (g.speed > 0.1) g.score += Math.floor(g.speed * 2);

//       setFrame((f) => f + 1);

//       if (crashed) {
//         g.over = true;
//         onGameOver(g.score, g.coins);
//         return;
//       }
//       raf = requestAnimationFrame(loop);
//     };

//     raf = requestAnimationFrame(loop);
//     return () => cancelAnimationFrame(raf);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const g = game.current;
//   const mph = Math.floor(g.speed * 180);
//   const torque = Math.floor(g.speed * 50) + (input.current.gas ? 100 : 0);
//   const wind = Math.floor(10 + g.speed * 15);

//   const hold = (key: keyof Input) => ({
//     onPointerDown: (e: React.PointerEvent) => {
//       e.preventDefault();
//       (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
//       input.current[key] = true;
//     },
//     onPointerUp: () => {
//       input.current[key] = false;
//     },
//     onPointerCancel: () => {
//       input.current[key] = false;
//     },
//     onLostPointerCapture: () => {
//       input.current[key] = false;
//     },
//   });

//   const dashes =
//     "repeating-linear-gradient(to bottom, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 40px, transparent 40px, transparent 80px)";

//   return (
//     <div
//       className="absolute inset-0 overflow-hidden select-none touch-none"
//       style={{ background: GAME_BG }}
//     >
//       <div
//         ref={roadRef}
//         className="absolute inset-0"
//         style={{ ["--roadY" as any]: "0px" }}
//       >
//         {[33, 66].map((laneX) => (
//           <div
//             key={laneX}
//             className="absolute top-0 bottom-0 w-0.75"
//             style={{
//               left: `${laneX}%`,
//               backgroundImage: dashes,
//               backgroundPositionY: "var(--roadY)",
//             }}
//           />
//         ))}
//         <div className="absolute left-0 top-0 bottom-0 w-[15%] bg-gradient-to-r from-black via-red-900/40 to-transparent border-r-2 border-red-500 shadow-[inset_-10px_0_20px_rgba(220,38,38,0.3)] z-10" />
//         <div className="absolute right-0 top-0 bottom-0 w-[15%] bg-gradient-to-l from-black via-red-900/40 to-transparent border-l-2 border-red-500 shadow-[inset_10px_0_20px_rgba(220,38,38,0.3)] z-10" />
//       </div>

//       {g.objs.map((obj) => (
//         <div
//           key={obj.id}
//           className="absolute z-20"
//           style={{
//             left: `${obj.x}%`,
//             top: `${obj.y}%`,
//             width: `${obj.width}%`,
//             height: `${obj.height}%`,
//             transform: "translate(-50%, -50%)",
//           }}
//         >
//           {obj.type === "coin" ? (
//             <CoinSprite className="w-full h-full animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
//           ) : (
//             <CarSprite
//               image={obj.image}
//               color={obj.color}
//               variant={obj.variant}
//               alt="traffic"
//               className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]"
//             />
//           )}
//         </div>
//       ))}

//       <div
//         className="absolute z-30"
//         style={{
//           left: `${g.x}%`,
//           top: "75%",
//           width: `${PLAYER_WIDTH}%`,
//           height: `${PLAYER_HEIGHT}%`,
//           transform: "translate(-50%, -50%)",
//         }}
//       >
//         <div className="w-full h-full relative">
//           <CarSprite
//             image="/public/ngkd8hngkd8hngkd.jfif"
//             color={selectedCar.color}
//             variant={selectedCar.variant}
//             alt="Player Car"
//             className="w-full h-full drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
//             style={{ transform: `rotate(${g.rotation}deg)` }}
//           />
//           {g.nitroOn && (
//             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 grid grid-flow-col auto-cols-max gap-1">
//               <div className="w-2 h-10 bg-cyan-400 rounded-full blur-md animate-pulse" />
//               <div className="w-2 h-14 bg-blue-500 rounded-full blur-sm animate-pulse" />
//               <div className="w-2 h-10 bg-cyan-400 rounded-full blur-md animate-pulse" />
//             </div>
//           )}
//           {input.current.brake && g.speed > 0 && (
//             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-2 bg-red-600 shadow-[0_0_20px_red] animate-pulse" />
//           )}
//         </div>
//       </div>

//       {/* Top HUD */}
//       <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 grid grid-cols-[auto_1fr_auto] items-start z-40 pointer-events-none gap-2">
//         <div className="grid gap-2">
//           <div className="grid grid-flow-col auto-cols-max items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
//             <Trophy size={14} className="sm:w-4 sm:h-4 text-yellow-400" />
//             <span className="text-white font-mono font-bold text-xs sm:text-sm">
//               {g.score.toLocaleString()}
//             </span>
//           </div>
//           <div className="grid grid-flow-col auto-cols-max items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
//             <Coins size={14} className="sm:w-4 sm:h-4 text-yellow-400" />
//             <span className="text-white font-mono font-bold text-xs sm:text-sm">
//               {g.coins}
//             </span>
//           </div>
//         </div>

//         <div />

//         <div className="grid justify-items-end gap-1 bg-black/50 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-white/10">
//           <div className="text-white font-black text-xl sm:text-3xl lg:text-4xl italic drop-shadow-md leading-none">
//             {mph}{" "}
//             <span className="text-[9px] sm:text-sm font-normal text-cyan-400">
//               MPH
//             </span>
//           </div>
//           <div className="grid grid-flow-col auto-cols-max items-center gap-1 text-[8px] sm:text-[10px] text-gray-300 font-mono">
//             <Activity size={8} className="sm:w-2.5 sm:h-2.5 text-red-400" />
//             <span>{torque} Nm</span>
//           </div>
//           <div className="grid grid-flow-col auto-cols-max items-center gap-1 text-[8px] sm:text-[10px] text-gray-300 font-mono">
//             <Wind size={8} className="sm:w-2.5 sm:h-2.5 text-blue-400" />
//             <span>{wind} km/h</span>
//           </div>
//           <div className="w-full h-1.5 mt-1 bg-white/10 rounded-full overflow-hidden">
//             <div
//               className="h-full bg-cyan-400"
//               style={{ width: `${g.nitro}%` }}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Bottom controls */}
//       <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 pb-4 sm:pb-6 z-40 pointer-events-auto bg-gradient-to-t from-black via-black/80 to-transparent grid grid-cols-[auto_1fr_auto] items-end gap-2">
//         <div className="grid grid-flow-col auto-cols-max gap-2">
//           <button
//             {...hold("left")}
//             className="w-12 h-16 sm:w-16 sm:h-20 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 grid place-items-center text-white active:bg-cyan-600/50 touch-none"
//           >
//             <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
//           </button>
//           <button
//             {...hold("right")}
//             className="w-12 h-16 sm:w-16 sm:h-20 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 grid place-items-center text-white active:bg-cyan-600/50 touch-none"
//           >
//             <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
//           </button>
//         </div>

//         <div />

//         <div className="grid justify-items-end gap-2 sm:gap-3">
//           <div className="grid grid-flow-col auto-cols-max gap-2 sm:gap-3">
//             <button
//               {...hold("brake")}
//               className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-950/80 border-2 border-red-500 grid place-items-center text-red-200 active:bg-red-600 touch-none shadow-[0_0_15px_rgba(220,38,38,0.5)]"
//             >
//               <span className="font-bold text-[9px] sm:text-xs">BRAKE</span>
//             </button>
//             <button
//               {...hold("gas")}
//               className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-950/80 border-2 border-green-500 grid place-items-center text-green-200 active:bg-green-600 touch-none shadow-[0_0_15px_rgba(34,197,94,0.5)]"
//             >
//               <span className="font-bold text-[9px] sm:text-xs leading-tight">
//                 GAS
//               </span>
//             </button>
//           </div>
//           <button
//             {...hold("nitro")}
//             className={`w-20 h-10 sm:w-24 sm:h-14 rounded-xl sm:rounded-2xl grid place-items-center border-2 touch-none transition-all ${
//               g.nitro > 0
//                 ? "bg-blue-600 border-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.8)]"
//                 : "bg-slate-800 border-slate-600 text-gray-500"
//             }`}
//           >
//             <Zap
//               size={18}
//               className={`sm:w-6 sm:h-6 ${
//                 g.nitro > 0 ? "fill-white text-white" : ""
//               }`}
//             />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ============================================================================
// // --- Main App Component ---
// // ============================================================================
// export default function App() {
//   const [view, setView] = useState<
//     "home" | "garage" | "race" | "results" | "history"
//   >("home");
//   const [result, setResult] = useState({ score: 0, coins: 0 });
//   const [runId, setRunId] = useState(0);

//   const {
//     coins,
//     addCoins,
//     cars,
//     unlockCar,
//     selectedCarId,
//     setSelectedCarId,
//     playerName,
//     setPlayerName,
//     leaderboard,
//     history,
//     submitScore,
//     clearLeaderboard,
//     clearAllMemory,
//   } = useGameStore();

//   const selectedCar = cars.find((c) => c.id === selectedCarId) || cars[0];

//   const handleGameOver = (score: number, runCoins: number) => {
//     setResult({ score, coins: runCoins });
//     addCoins(runCoins);
//     submitScore(score, runCoins, selectedCar.name);
//     setView("results");
//   };

//   const startRace = () => {
//     setRunId((r) => r + 1);
//     setView("race");
//   };

//   const showChrome = view !== "race";

//   return (
//     <div className="min-h-screen w-full mt-4 rounded-2xl bg-black font-sans selection:bg-cyan-500 selection:text-white flex justify-center overflow-x-hidden">
//       {/* Frame — adapts to screen height, no forced scrolling containers inside */}
//       <div className="relative w-full max-w-6xl bg-[#050810] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col min-h-screen">
//         {showChrome && (
//           <Header coins={coins} onHistory={() => setView("history")} />
//         )}

//         {/* Middle container expands to fill available space, and scrolls normally if content exceeds it */}
//         <div className="relative flex-1 flex flex-col">
//           {(view === "race" || view === "results") && (
//             <div
//               className={`absolute inset-0 ${
//                 view === "results"
//                   ? "pointer-events-none opacity-50 blur-sm"
//                   : ""
//               }`}
//             >
//               <RaceComponent
//                 key={runId}
//                 selectedCar={selectedCar}
//                 onGameOver={handleGameOver}
//               />
//             </div>
//           )}

//           {view === "home" && (
//             <HomePage
//               onStart={startRace}
//               onGarage={() => setView("garage")}
//               onHistory={() => setView("history")}
//               coins={coins}
//               playerName={playerName}
//               setPlayerName={setPlayerName}
//               leaderboard={leaderboard}
//               cars={cars}
//               selectedCarId={selectedCarId}
//             />
//           )}
//           {view === "garage" && (
//             <GaragePage
//               onBack={() => setView("home")}
//               cars={cars}
//               unlockCar={unlockCar}
//               selectedCarId={selectedCarId}
//               setSelectedCarId={setSelectedCarId}
//               coins={coins}
//             />
//           )}
//           {view === "history" && (
//             <HistoryPage
//               onBack={() => setView("home")}
//               leaderboard={leaderboard}
//               history={history}
//               clearLeaderboard={clearLeaderboard}
//               clearAllMemory={clearAllMemory}
//             />
//           )}
//           {view === "results" && (
//             <ResultsPage
//               score={result.score}
//               runCoins={result.coins}
//               onRestart={startRace}
//               onHome={() => setView("home")}
//             />
//           )}
//         </div>

//         {showChrome && (
//           <Footer
//             onHome={view !== "home" ? () => setView("home") : undefined}
//             onGarage={view !== "garage" ? () => setView("garage") : undefined}
//             onHistory={
//               view !== "history" ? () => setView("history") : undefined
//             }
//           />
//         )}
//       </div>

//       <ToastContainer
//         position="top-center"
//         theme="dark"
//         autoClose={2000}
//         hideProgressBar
//         newestOnTop
//       />
//     </div>
//   );
// }








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
} from "lucide-react";
import "./App.css";

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

// YOUR EXACT IMAGES
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

// YOUR EXACT CARS WITH PRICES AND UNLOCK STATES
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
// --- Rear-view car sprites (image only, no SVG fallback) ---
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
// --- Header (max-w-3xl) ---
// ============================================================================
const Header = ({
  coins,
  onHistory,
}: {
  coins: number;
  onHistory: () => void;
}) => (
  <header className="shrink-0 rounded-2xl w-full z-20 border-b border-white/10 bg-black/60 backdrop-blur-md">
    <div className="w-full px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10 4xl:px-14 py-1.5 xs:py-2 lg:py-2.5">
      <div className="mx-auto w-full grid grid-cols-[1fr_auto] items-center gap-1.5 xs:gap-2">
        <div className="grid grid-flow-col auto-cols-max items-baseline gap-0.5 xs:gap-1 sm:gap-1.5 min-w-0">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 font-black italic tracking-tighter text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl 4xl:text-3xl leading-none whitespace-nowrap">
            NEON
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 to-fuchsia-700 font-black italic tracking-tighter text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl 4xl:text-3xl leading-none whitespace-nowrap">
            HIGHWAY
          </span>
        </div>

        <div className="grid grid-flow-col auto-cols-max items-center gap-1 xs:gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onHistory}
            className="grid grid-flow-col auto-cols-max items-center gap-0.5 xs:gap-1 bg-black/40 border border-white/10 px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 rounded-full text-white text-[9px] xs:text-[10px] sm:text-xs lg:text-sm font-bold hover:bg-white/10 transition whitespace-nowrap"
          >
            <History className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
            <span>MARKS</span>
          </button>
          <div className="grid grid-flow-col auto-cols-max items-center gap-0.5 xs:gap-1 bg-black/40 border border-white/10 px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.2)] whitespace-nowrap">
            <Coins className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-yellow-400" />
            <span className="text-white font-mono font-bold tracking-wider text-[9px] xs:text-[10px] sm:text-xs lg:text-sm">
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
  <footer className="shrink-0 rounded-2xl w-full border-t border-white/10 bg-black/50 backdrop-blur-md pb-4 xs:pb-6 z-10">
    <div className="mx-auto w-full max-w-3xl px-2 xs:px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 4xl:px-14 py-2 grid grid-cols-[1fr_auto] items-center gap-1.5 xs:gap-2">
      <div className="grid py-2 xs:py-4 grid-flow-col auto-cols-max items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-0">
        <Trophy className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
        <a
          href="https://www.leonakingeneye.live/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[8px] xs:text-[9px] sm:text-[11px] lg:text-xs text-white font-bold hover:text-cyan-400 tracking-wider uppercase transition-colors whitespace-nowrap"
        >
          Leon © {new Date().getFullYear()}
        </a>
      </div>
      <nav className="grid grid-flow-col auto-cols-max items-center gap-1.5 xs:gap-2 lg:gap-3 justify-end">
        {onHome && (
          <button
            onClick={onHome}
            className="text-[8px] xs:text-[9px] sm:text-[11px] lg:text-xs text-gray-400 hover:text-cyan-400 font-bold tracking-wider uppercase transition-colors whitespace-nowrap"
          >
            Home
          </button>
        )}
        {onGarage && (
          <button
            onClick={onGarage}
            className="text-[8px] xs:text-[9px] sm:text-[11px] lg:text-xs text-gray-400 hover:text-cyan-400 font-bold tracking-wider uppercase transition-colors whitespace-nowrap"
          >
            Garage
          </button>
        )}
        {onHistory && (
          <button
            onClick={onHistory}
            className="text-[8px] xs:text-[9px] sm:text-[11px] lg:text-xs text-gray-400 hover:text-fuchsia-400 font-bold tracking-wider uppercase transition-colors whitespace-nowrap"
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
}: any) => {
  const selectedCar =
    cars.find((c: VehicleModel) => c.id === selectedCarId) || cars[0];
  return (
    <div className="w-full rounded-2xl bg-[#050810] flex flex-col  z-50 font-sans relative min-h-full overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-full h-[40%] bg-fuchsia-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex-1 w-full z-10 px-2 xs:px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 4xl:px-14 flex flex-col items-center justify-center py-6 xs:py-8 sm:py-10 lg:py-14">
        <h1 className="grid place-items-center text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 4xl:text-8xl font-black italic tracking-tighter text-center leading-none">
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]">
            NEON
          </span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 to-fuchsia-700 drop-shadow-[0_0_25px_rgba(192,38,211,0.8)]">
            HIGHWAY
          </span>
        </h1>

        <p className="text-cyan-200/60 tracking-[0.2em] sm:tracking-[0.3em] text-[7px] xs:text-[8px] sm:text-xs font-bold uppercase text-center mt-1.5 xs:mt-2">
          Ultimate Racing Experience
        </p>

        <div className="w-16 h-24 xs:w-20 xs:h-28 sm:w-24 sm:h-32 md:w-28 md:h-40 lg:w-32 lg:h-44 xl:w-36 xl:h-48 2xl:w-44 2xl:h-56 4xl:w-56 4xl:h-72 mt-3 xs:mt-4 p-1.5 xs:p-2 rounded-2xl border border-white/10 bg-white/5 grid place-items-center shrink-0">
          <CarSprite
            image={selectedCar.image}
            alt={selectedCar.name}
            className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
          />
        </div>
        <p className="text-white/80 text-[9px] xs:text-[10px] sm:text-xs lg:text-sm font-mono text-center mt-1.5 xs:mt-2">
          {selectedCar.name}
        </p>
      </div>

      <div className="w-full mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 4xl:px-14 pb-4 xs:pb-6 z-10 grid gap-1.5 xs:gap-2 sm:gap-3 shrink-0">
        <input
          type="text"
          placeholder="ENTER DRIVER NAME"
          value={playerName}
          maxLength={14}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-xl sm:rounded-2xl px-2.5 xs:px-3 sm:px-4 py-2.5 xs:py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-center font-bold tracking-widest text-[10px] xs:text-xs sm:text-sm lg:text-base transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        />

        <button
          onClick={onStart}
          disabled={!playerName.trim()}
          className="w-full py-2.5 xs:py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-black rounded-xl sm:rounded-2xl text-xs xs:text-sm sm:text-lg lg:text-xl tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95 transition-all grid grid-flow-col auto-cols-max place-items-center justify-center gap-1.5 xs:gap-2 sm:gap-3"
        >
          <Play className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 fill-white" />
          <span>RACE NOW</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-3">
          <button
            onClick={onGarage}
            className="py-2.5 xs:py-3 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl sm:rounded-2xl text-[10px] xs:text-xs sm:text-base lg:text-lg tracking-wider grid grid-flow-col auto-cols-max place-items-center justify-center gap-1 xs:gap-2 transition-all"
          >
            <Car size={12} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
            <span>GARAGE</span>
          </button>
          <button
            onClick={onHistory}
            className="py-2.5 xs:py-3 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl sm:rounded-2xl text-[10px] xs:text-xs sm:text-base lg:text-lg tracking-wider grid grid-flow-col auto-cols-max place-items-center justify-center gap-1 xs:gap-2 transition-all"
          >
            <History size={12} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
            <span>MARKS</span>
          </button>
        </div>

        {leaderboard.length > 0 && (
          <div className="bg-black/40 backdrop-blur-md p-2.5 xs:p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 w-full mt-1.5 xs:mt-2">
            <h3 className="text-cyan-400 font-bold text-[10px] xs:text-xs tracking-widest uppercase grid grid-flow-col auto-cols-max place-items-center justify-center gap-1.5 xs:gap-2 mb-1.5 xs:mb-2">
              <Award size={12} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" /> Top Drivers
            </h3>
            <div className="grid gap-0.5 xs:gap-1">
              {leaderboard.slice(0, 3).map((entry: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto] text-[10px] xs:text-xs text-gray-300 font-mono py-0.5 xs:py-1 border-b border-white/5 last:border-0 gap-1.5 xs:gap-2"
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
// --- Garage Page (models max-w-5xl) ---
// ============================================================================
const GaragePage = ({
  onBack,
  cars,
  unlockCar,
  selectedCarId,
  setSelectedCarId,
  coins,
}: any) => (
  <div className="w-full rounded-2xl bg-[#050810] z-50 pb-8 xs:pb-10">
    <div className="w-full mx-auto max-w-3xl px-2 xs:px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 4xl:px-14 py-2 xs:py-3 sm:py-4 grid grid-cols-[auto_1fr_auto] items-center gap-1.5 xs:gap-2 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <button
        onClick={onBack}
        className="text-white grid grid-flow-col auto-cols-max items-center gap-0.5 xs:gap-1 font-bold hover:text-cyan-400 transition-colors text-[10px] xs:text-xs sm:text-base"
      >
        <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" /> BACK
      </button>
      <h2 className="text-center text-xs xs:text-sm sm:text-lg lg:text-xl font-black text-white tracking-widest">
        GARAGE
      </h2>
      <div className="grid grid-flow-col auto-cols-max items-center gap-0.5 xs:gap-1 sm:gap-2 text-yellow-400 font-mono font-bold text-[10px] xs:text-xs sm:text-base">
        <Coins size={12} className="xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5" /> {coins}
      </div>
    </div>

    {/* models container max-w-5xl */}
    <div className="w-full max-w-5xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 4xl:px-14 py-3 xs:py-4">
      <div className="grid gap-2 xs:gap-3 sm:gap-4">
        {cars.map((car: VehicleModel) => (
          <div
            key={car.id}
            className={`p-2.5 xs:p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 grid gap-2 xs:gap-3 transition-all duration-300 ${
              selectedCarId === car.id
                ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                : "border-white/5 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 xs:gap-3 sm:gap-4 min-w-0">
              <div className="w-14 h-20 xs:w-16 xs:h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 lg:w-28 lg:h-36 xl:w-32 xl:h-40 2xl:w-36 2xl:h-44 4xl:w-44 4xl:h-56 rounded-lg sm:rounded-xl p-1 sm:p-2 overflow-hidden grid place-items-center border border-white/10 bg-transparent shrink-0">
                <CarSprite
                  image={car.image}
                  alt={car.name}
                  className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-bold text-xs xs:text-sm sm:text-lg truncate">
                  {car.name}
                </h3>
                <p className="text-gray-400 text-[9px] xs:text-[10px] sm:text-xs grid grid-flow-col auto-cols-max items-center gap-0.5 xs:gap-1 mt-0.5 xs:mt-1">
                  <Gauge size={9} className="xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                  <span>Speed: {car.speedMultiplier}x</span>
                </p>
                <p className="text-gray-400 text-[9px] xs:text-[10px] sm:text-xs grid grid-flow-col auto-cols-max items-center gap-0.5 xs:gap-1">
                  <Activity
                    size={9}
                    className="xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 text-fuchsia-400"
                  />
                  <span>Handling: {car.handling}x</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1">
              {car.unlocked ? (
                <button
                  onClick={() => setSelectedCarId(car.id)}
                  className={`w-full px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg sm:rounded-xl text-[10px] xs:text-xs sm:text-sm font-bold grid grid-flow-col auto-cols-max items-center justify-center gap-0.5 xs:gap-1 transition-all ${
                    selectedCarId === car.id
                      ? "bg-cyan-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {selectedCarId === car.id ? (
                    <>
                      <CheckCircle2 size={12} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
                      <span>EQUIPPED</span>
                    </>
                  ) : (
                    <span>SELECT</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => unlockCar(car.id, car.price, car.name)}
                  className={`w-full px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg sm:rounded-xl text-[10px] xs:text-xs sm:text-sm font-bold grid grid-flow-col auto-cols-max items-center justify-center gap-0.5 xs:gap-1 transition-all ${
                    coins >= car.price
                      ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                      : "bg-black/50 text-gray-500 border border-white/5"
                  }`}
                >
                  <Lock size={12} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
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
    <div className="w-full rounded-2xl bg-[#050810] z-50 pb-8 xs:pb-10">
      <div className="w-full mx-auto max-w-3xl px-2 xs:px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 4xl:px-14 py-2 xs:py-3 sm:py-4 grid grid-cols-[auto_1fr_auto] items-center gap-1.5 xs:gap-2 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <button
          onClick={onBack}
          className="text-white grid grid-flow-col auto-cols-max items-center gap-0.5 xs:gap-1 font-bold hover:text-cyan-400 transition-colors text-[10px] xs:text-xs sm:text-base"
        >
          <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" /> BACK
        </button>
        <h2 className="text-center text-xs xs:text-sm sm:text-lg lg:text-xl font-black text-white tracking-widest">
          MARKS
        </h2>
        <div className="w-6 xs:w-8 sm:w-12" />
      </div>

      <div className="w-full max-w-5xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 4xl:px-14 py-3 xs:py-4 grid gap-2 xs:gap-3 sm:gap-4">
        <div className="bg-black/40 backdrop-blur-md p-2.5 xs:p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
          <h3 className="text-cyan-400 font-bold text-[10px] xs:text-xs tracking-widest uppercase grid grid-flow-col auto-cols-max items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3">
            <Award size={12} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" /> Best Scores
          </h3>
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 text-[10px] xs:text-xs sm:text-sm text-center py-1.5 xs:py-2">
              No marks yet.
            </p>
          ) : (
            <div className="grid gap-0.5 xs:gap-1">
              {leaderboard.map((e: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto] text-[10px] xs:text-xs text-gray-300 font-mono py-0.5 xs:py-1 border-b border-white/5 last:border-0 gap-1.5 xs:gap-2"
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

        <div className="bg-black/40 backdrop-blur-md p-2.5 xs:p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
          <h3 className="text-fuchsia-400 font-bold text-[10px] xs:text-xs tracking-widest uppercase grid grid-flow-col auto-cols-max items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3">
            <History size={12} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" /> Past Runs
          </h3>
          {history.length === 0 ? (
            <p className="text-gray-500 text-[10px] xs:text-xs sm:text-sm text-center py-1.5 xs:py-2">
              No runs recorded.
            </p>
          ) : (
            <div className="grid gap-0.5 xs:gap-1">
              {history.map((h: RunRecord) => (
                <div
                  key={h.id}
                  className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto] gap-x-1.5 xs:gap-x-2 text-[10px] xs:text-xs text-gray-300 font-mono py-0.5 xs:py-1 border-b border-white/5 last:border-0"
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

        <div className="bg-red-950/30 p-2.5 xs:p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-red-500/30 grid gap-2 xs:gap-3">
          <h3 className="text-red-400 font-bold text-[10px] xs:text-xs tracking-widest uppercase grid grid-flow-col auto-cols-max items-center gap-1.5 xs:gap-2">
            <Trash2 size={12} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" /> Memory
          </h3>
          {confirm === null ? (
            <div className="grid gap-1.5 xs:gap-2">
              <button
                onClick={() => setConfirm("clear")}
                className="w-full py-1.5 xs:py-2 rounded-lg sm:rounded-xl text-[10px] xs:text-xs sm:text-sm font-bold bg-red-900/50 hover:bg-red-800/60 text-red-200 border border-red-500/40 transition"
              >
                Clear Leaderboard & History
              </button>
              <button
                onClick={() => setConfirm("all")}
                className="w-full py-1.5 xs:py-2 rounded-lg sm:rounded-xl text-[10px] xs:text-xs sm:text-sm font-bold bg-red-900/50 hover:bg-red-800/60 text-red-200 border border-red-500/40 transition"
              >
                Reset Everything (coins, cars, name)
              </button>
            </div>
          ) : (
            <div className="grid gap-2 xs:gap-3">
              <p className="text-red-200 text-[10px] xs:text-xs sm:text-sm text-center">
                Are you sure? This cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-2 xs:gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  className="py-1.5 xs:py-2 rounded-lg sm:rounded-xl text-[10px] xs:text-xs sm:text-sm font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirm === "clear") clearLeaderboard();
                    else clearAllMemory();
                    setConfirm(null);
                  }}
                  className="py-1.5 xs:py-2 rounded-lg sm:rounded-xl text-[10px] xs:text-xs sm:text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition"
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
// --- Results Page ---
// ============================================================================
const ResultsPage = ({ score, runCoins, onRestart, onHome }: any) => (
  <div className="w-full rounded-2xl bg-black/80 p-3 xs:p-4 sm:p-6 flex flex-col justify-center items-center z-50 min-h-full">
    <div className="w-full max-w-sm grid gap-4 xs:gap-6 place-items-center">
      <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-800 italic tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] text-center">
        CRASHED!
      </h2>

      <div className="bg-[#0a0f1c] p-4 xs:p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 w-full grid gap-3 xs:gap-4 sm:gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500" />
        <div className="text-center grid gap-0.5 xs:gap-1">
          <p className="text-gray-400 text-[9px] xs:text-[10px] sm:text-xs tracking-[0.2em] uppercase">
            Run Score
          </p>
          <p className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-mono text-white font-black">
            {score.toLocaleString()}
          </p>
        </div>
        <div className="h-px bg-white/10 w-full" />
        <div className="grid grid-cols-[1fr_auto] items-center bg-black/50 p-2.5 xs:p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/5 gap-2 xs:gap-3">
          <span className="text-yellow-400 grid grid-flow-col auto-cols-max items-center gap-1 xs:gap-2 font-bold text-[10px] xs:text-xs sm:text-sm">
            <Coins size={12} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" /> Coins Earned
          </span>
          <span className="text-lg xs:text-xl sm:text-2xl font-bold text-white">
            +{runCoins}
          </span>
        </div>
      </div>

      <div className="grid gap-2 xs:gap-3 sm:gap-4 w-full">
        <button
          onClick={onRestart}
          className="w-full py-2.5 xs:py-3 sm:py-4 bg-white text-black font-black rounded-xl sm:rounded-2xl text-xs xs:text-sm sm:text-lg grid grid-flow-col auto-cols-max place-items-center justify-center gap-1.5 xs:gap-2 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          <RotateCcw size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" /> TRY AGAIN
        </button>
        <button
          onClick={onHome}
          className="w-full py-2.5 xs:py-3 sm:py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl sm:rounded-2xl text-xs xs:text-sm sm:text-lg active:scale-95 transition-transform hover:bg-white/10"
        >
          MAIN MENU
        </button>
      </div>
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

      // --- SPEED / BRAKE ---
      // Brake applies strong deceleration so player actually slows,
      // while the world (traffic + road) keeps scrolling based on
      // the *world speed* which is derived from the current speed.
      if (inp.brake) {
        g.speed = Math.max(0, g.speed - 0.28 * dt);
      } else if (inp.gas) {
        g.speed += 0.03 * dt;
      } else {
        g.speed -= 0.01 * dt;
      }

      g.nitroOn = inp.nitro && g.nitro > 0;
      g.nitro = g.nitroOn
        ? Math.max(0, g.nitro - 0.8 * dt)
        : Math.min(100, g.nitro + 0.2 * dt);
      const cap = g.nitroOn ? g.maxSpeed * 2 : g.maxSpeed;
      g.speed = Math.max(0, Math.min(g.speed, cap));

      // WORLD SPEED: traffic & road scroll relative to your speed.
      // When braking, this value drops as your speed drops — so the
      // traffic appears to move slower relative to you, simulating
      // the car decelerating while the road still flows.
      const worldSpeed = Math.max(0.15, g.speed);

      const steerInput = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      g.steer += (steerInput - g.steer) * 0.25 * dt;
      g.x += g.steer * 1.1 * selectedCar.handling * dt;
      g.x = Math.max(ROAD_LEFT_BOUND, Math.min(ROAD_RIGHT_BOUND, g.x));
      g.rotation = g.steer * 18;

      g.roadY = (g.roadY + worldSpeed * dt * 14) % 80;
      if (roadRef.current)
        roadRef.current.style.setProperty("--roadY", `${g.roadY}px`);

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

      const playerY = 75;
      const remaining: GameObject[] = [];
      let crashed = false;
      for (const obj of g.objs) {
        // Objects move using worldSpeed — when braking, worldSpeed
        // is lower so objects slow their descent relative to the screen.
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
            image="/public/ngkd8hngkd8hngkd.jfif"
            alt="Player Car"
            className="w-full h-full drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
            style={{ transform: `rotate(${g.rotation}deg)` }}
          />
          {g.nitroOn && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 grid grid-flow-col auto-cols-max gap-1">
              <div className="w-2 h-10 bg-cyan-400 rounded-full blur-md animate-pulse" />
              <div className="w-2 h-14 bg-blue-500 rounded-full blur-sm animate-pulse" />
              <div className="w-2 h-10 bg-cyan-400 rounded-full blur-md animate-pulse" />
            </div>
          )}
          {input.current.brake && g.speed > 0 && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-2 bg-red-600 shadow-[0_0_20px_red] animate-pulse" />
          )}
        </div>
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-1.5 xs:p-2 sm:p-4 grid grid-cols-[auto_1fr_auto] items-start z-40 pointer-events-none gap-1 xs:gap-2">
        <div className="grid gap-1 xs:gap-2">
          <div className="grid grid-flow-col auto-cols-max items-center gap-1 xs:gap-2 bg-black/50 backdrop-blur-md px-1.5 xs:px-2 sm:px-3 py-1 xs:py-2 rounded-lg xs:rounded-xl border border-white/10">
            <Trophy size={10} className="xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-white font-mono font-bold text-[9px] xs:text-[10px] sm:text-sm">
              {g.score.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-flow-col auto-cols-max items-center gap-1 xs:gap-2 bg-black/50 backdrop-blur-md px-1.5 xs:px-2 sm:px-3 py-1 xs:py-2 rounded-lg xs:rounded-xl border border-white/10">
            <Coins size={10} className="xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-white font-mono font-bold text-[9px] xs:text-[10px] sm:text-sm">
              {g.coins}
            </span>
          </div>
        </div>

        <div />

        <div className="grid justify-items-end gap-0.5 xs:gap-1 bg-black/50 backdrop-blur-md p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl border border-white/10">
          <div className="text-white font-black text-base xs:text-xl sm:text-3xl lg:text-4xl italic drop-shadow-md leading-none">
            {mph}{" "}
            <span className="text-[8px] xs:text-[9px] sm:text-sm font-normal text-cyan-400">
              MPH
            </span>
          </div>
          <div className="grid grid-flow-col auto-cols-max items-center gap-0.5 xs:gap-1 text-[7px] xs:text-[8px] sm:text-[10px] text-gray-300 font-mono">
            <Activity size={7} className="xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 text-red-400" />
            <span>{torque} Nm</span>
          </div>
          <div className="grid grid-flow-col auto-cols-max items-center gap-0.5 xs:gap-1 text-[7px] xs:text-[8px] sm:text-[10px] text-gray-300 font-mono">
            <Wind size={7} className="xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 text-blue-400" />
            <span>{wind} km/h</span>
          </div>
          <div className="w-full h-1 xs:h-1.5 mt-0.5 xs:mt-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${g.nitro}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-1.5 xs:p-2 sm:p-4 pb-2 xs:pb-3 sm:pb-6 z-40 pointer-events-auto bg-gradient-to-t from-black via-black/80 to-transparent grid grid-cols-[auto_1fr_auto] items-end gap-1 xs:gap-2">
        <div className="grid grid-flow-col auto-cols-max gap-1 xs:gap-2">
          <button
            {...hold("left")}
            className="w-10 h-14 xs:w-12 xs:h-16 sm:w-16 sm:h-20 rounded-lg xs:rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 grid place-items-center text-white active:bg-cyan-600/50 touch-none"
          >
            <ChevronLeft className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8" />
          </button>
          <button
            {...hold("right")}
            className="w-10 h-14 xs:w-12 xs:h-16 sm:w-16 sm:h-20 rounded-lg xs:rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 grid place-items-center text-white active:bg-cyan-600/50 touch-none"
          >
            <ChevronRight className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8" />
          </button>
        </div>

        <div />

        <div className="grid justify-items-end gap-1 xs:gap-2 sm:gap-3">
          <div className="grid grid-flow-col auto-cols-max gap-1 xs:gap-2 sm:gap-3">
            <button
              {...hold("brake")}
              className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 rounded-full bg-red-950/80 border-2 border-red-500 grid place-items-center text-red-200 active:bg-red-600 touch-none shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            >
              <span className="font-bold text-[8px] xs:text-[9px] sm:text-xs">BRAKE</span>
            </button>
            <button
              {...hold("gas")}
              className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 rounded-full bg-green-950/80 border-2 border-green-500 grid place-items-center text-green-200 active:bg-green-600 touch-none shadow-[0_0_15px_rgba(34,197,94,0.5)]"
            >
              <span className="font-bold text-[8px] xs:text-[9px] sm:text-xs leading-tight">
                GAS
              </span>
            </button>
          </div>
          <button
            {...hold("nitro")}
            className={`w-16 h-8 xs:w-20 xs:h-10 sm:w-24 sm:h-14 rounded-lg xs:rounded-xl sm:rounded-2xl grid place-items-center border-2 touch-none transition-all ${
              g.nitro > 0
                ? "bg-blue-600 border-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.8)]"
                : "bg-slate-800 border-slate-600 text-gray-500"
            }`}
          >
            <Zap
              size={14}
              className={`xs:w-5 xs:h-5 sm:w-6 sm:h-6 ${
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
    setRunId((r) => r + 1);
    setView("race");
  };

  const showChrome = view !== "race";

  return (
    <div className="min-h-screen w-full rounded-2xl bg-black font-sans selection:bg-cyan-500 selection:text-white flex justify-center overflow-x-hidden">
      <div className="relative w-full bg-[#050810] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col min-h-screen">
        {showChrome && (
          <Header coins={coins} onHistory={() => setView("history")} />
        )}

        <div className="relative flex-1 flex flex-col">
          {(view === "race" || view === "results") && (
            <div
              className={`absolute inset-0 ${
                view === "results"
                  ? "pointer-events-none opacity-50 blur-sm"
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