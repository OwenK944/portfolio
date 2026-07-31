import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';
import { cn } from '../lib/utils';
import { Search, Menu, X, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageContent } from '../hooks/usePageContent';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const CELL_SIZE = isMobile ? 200 : 360;
const GAP = isMobile ? 16 : 24;
const CHUNK_COLS = 4;
const CHUNK_ROWS = 4;
const CHUNK_WIDTH = CHUNK_COLS * CELL_SIZE;
const CHUNK_HEIGHT = CHUNK_ROWS * CELL_SIZE;

const MAX_SCROLL = 100000;
const CENTER = MAX_SCROLL / 2;

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function shuffle<T>(array: T[], rand: () => number) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(rand() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

interface PlacedItem {
  id: string;
  project?: Project;
  col: number;
  row: number;
  cols: number;
  rows: number;
  isFiller?: boolean;
}

const getProjectDims = (proj: Project) => {
  let cols = 1, rows = 1;
  const isMed = proj.size === 'medium';
  if (proj.shape === 'square' || proj.shape === 'circle') {
    cols = isMed ? 2 : 1;
    rows = cols;
  } else if (proj.shape === 'rect-h') {
    cols = isMed ? 3 : 2;
    rows = isMed ? 2 : 1;
  } else if (proj.shape === 'rect-v') {
    cols = isMed ? 2 : 1;
    rows = isMed ? 3 : 2;
  }
  return { cols, rows };
};

const packChunk = (chunkX: number, chunkY: number, offset: number, sessionSeed: number, projects: Project[]): PlacedItem[] => {
  const seed = (chunkX * 1337) + (chunkY * 42069) + 12345 + offset + sessionSeed;
  const rand = mulberry32(seed);
  
  const grid = Array.from({ length: CHUNK_ROWS }, () => Array(CHUNK_COLS).fill(false));
  const placed: PlacedItem[] = [];
  
  const availableProjects = projects.length > 0 ? [...projects] : [];
  shuffle(availableProjects, rand);
  
  const canFit = (r: number, c: number, rows: number, cols: number) => {
    if (r + rows > CHUNK_ROWS || c + cols > CHUNK_COLS) return false;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[r + i][c + j]) return false;
      }
    }
    return true;
  };

  const markGrid = (r: number, c: number, rows: number, cols: number) => {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        grid[r + i][c + j] = true;
      }
    }
  };

  for (let r = 0; r < CHUNK_ROWS; r++) {
    for (let c = 0; c < CHUNK_COLS; c++) {
      if (grid[r][c]) continue;
      
      let placedProject = false;
      const cellProjects = [...availableProjects];
      shuffle(cellProjects, rand);
      
      for (const proj of cellProjects) {
        const { cols, rows } = getProjectDims(proj);
        if (canFit(r, c, rows, cols)) {
          placed.push({ id: `${chunkX}-${chunkY}-${r}-${c}`, project: proj, col: c, row: r, cols, rows });
          markGrid(r, c, rows, cols);
          placedProject = true;
          break;
        }
      }
      
      if (!placedProject) {
        placed.push({ id: `${chunkX}-${chunkY}-${r}-${c}-filler`, col: c, row: r, cols: 1, rows: 1, isFiller: true });
        markGrid(r, c, 1, 1);
      }
    }
  }
  return placed;
};

export default function InfiniteMasonry({ projects, onSelect, welcomeTitle, welcomeText, paused = false }: { projects: Project[], onSelect: (p: Project) => void, welcomeTitle?: string, welcomeText?: string, paused?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxBgRef = useRef<HTMLDivElement>(null);
  const parallaxGridRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef<{x: number, y: number} | null>(null);
  const isMouseInWindow = useRef(true);
  
  const [visibleChunks, setVisibleChunks] = useState<{x: number, y: number}[]>([]);
  const visibleChunksRef = useRef<{x: number, y: number}[]>([]);
  const chunkOffsetsRef = useRef<Record<string, number>>({});
  const sessionSeed = useMemo(() => Math.floor(Math.random() * 1000000), []);
  
  const [hasScrolledPastThreshold, setHasScrolledPastThreshold] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterTool, setFilterTool] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMouseInMenu = useRef(false);
  const isSearchFocusedRef = useRef(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const { content: siteSettings } = usePageContent('site_settings', { adminPassword: 'admin', twitter: '', linkedin: '', github: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (hasScrolledPastThreshold) {
      setShowTooltip(true);
      const timer = setTimeout(() => setShowTooltip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasScrolledPastThreshold]);

  const allTags = useMemo(() => Array.from(new Set(projects.flatMap(p => p.tags || []))), [projects]);
  const allTools = useMemo(() => Array.from(new Set(projects.flatMap(p => p.tools || []))), [projects]);
  const allYears = useMemo(() => {
    const years = projects.map(p => {
      if (p.dateCompleted) return new Date(p.dateCompleted).getFullYear().toString();
      if (p.dateStarted) return new Date(p.dateStarted).getFullYear().toString();
      return null;
    }).filter(Boolean) as string[];
    return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
  }, [projects]);
  
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = filterTag === '' || p.tags?.includes(filterTag);
      const matchesTool = filterTool === '' || p.tools?.includes(filterTool);
      let year = null;
      if (p.dateCompleted) year = new Date(p.dateCompleted).getFullYear().toString();
      else if (p.dateStarted) year = new Date(p.dateStarted).getFullYear().toString();
      
      const matchesYear = filterYear === '' || year === filterYear;
      return matchesSearch && matchesTag && matchesTool && matchesYear;
    });
  }, [projects, searchQuery, filterTag, filterTool, filterYear]);
  
  const currentVelocity = useRef({ x: 0, y: 0 });
  const targetVelocity = useRef({ x: 0, y: 0 });
  
  // Track if user has explicitly interacted (wheeled, dragged, swiped)
  const hasUserInteracted = useRef(false);
  
  const startPos = useRef({ x: CENTER - window.innerWidth / 2, y: CENTER - window.innerHeight / 2 });

  useEffect(() => {
    if (!menuOpen && !filterOpen) {
      isMouseInMenu.current = false;
    }
  }, [menuOpen, filterOpen]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollLeft, clientWidth, clientHeight } = containerRef.current;
    
    // Direct DOM manipulation for parallax to avoid state re-renders
    if (parallaxBgRef.current) {
      parallaxBgRef.current.style.backgroundPosition = `${-(scrollLeft - startPos.current.x) * 0.1}px ${-(scrollTop - startPos.current.y) * 0.1}px`;
    }
    if (parallaxGridRef.current) {
      parallaxGridRef.current.style.backgroundPosition = `${-(scrollLeft - startPos.current.x) * 0.3}px ${-(scrollTop - startPos.current.y) * 0.3}px`;
    }
    
    // Only dismiss welcome text if user explicitly scrolled away
    if (hasUserInteracted.current && !hasScrolledPastThreshold) {
      const dist = Math.hypot(scrollLeft - startPos.current.x, scrollTop - startPos.current.y);
      if (dist > 400) {
        setHasScrolledPastThreshold(true);
      }
    }

    // Tight buffer to minimize offscreen rendered chunks
    const startX = Math.floor((scrollLeft - clientWidth * 0.1) / CHUNK_WIDTH);
    const endX = Math.floor((scrollLeft + clientWidth * 1.1) / CHUNK_WIDTH);
    const startY = Math.floor((scrollTop - clientHeight * 0.1) / CHUNK_HEIGHT);
    const endY = Math.floor((scrollTop + clientHeight * 1.1) / CHUNK_HEIGHT);
    
    const chunks = [];
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        chunks.push({ x, y });
      }
    }
    
    // Only update state if chunks actually changed
    const prevStr = JSON.stringify(visibleChunksRef.current);
    const nextStr = JSON.stringify(chunks);
    if (prevStr !== nextStr) {
      visibleChunksRef.current = chunks;
      setVisibleChunks(chunks);
      
      const newKeys = new Set(chunks.map(c => `${c.x},${c.y}`));
      
      // Deload out of bounds chunk offsets to allow procedural regeneration
      for (const key of Object.keys(chunkOffsetsRef.current)) {
        if (!newKeys.has(key)) {
          delete chunkOffsetsRef.current[key];
        }
      }
      
      // Assign new offsets for new chunks
      for (const key of newKeys) {
        if (!(key in chunkOffsetsRef.current)) {
          chunkOffsetsRef.current[key] = Math.floor(Math.random() * 1000000);
        }
      }
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      const left = CENTER - window.innerWidth / 2;
      const top = CENTER - window.innerHeight / 2;
      startPos.current = { x: left, y: top };
      containerRef.current.scrollTo({ left, top, behavior: 'instant' });
      handleScroll(); // manually trigger handleScroll once to initialize chunks
    }
  }, []);

  useEffect(() => {
    const initialSpeed = 0;
    targetVelocity.current = { x: 0, y: 0 };

    const handleMouseLeave = () => { isMouseInWindow.current = false; targetVelocity.current = {x: 0, y: 0}; };
    const handleMouseEnter = () => { isMouseInWindow.current = true; };
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    let animationFrameId: number;
    let lastTime = performance.now();
    
    const loop = (currentTime: number) => {
      const dt = currentTime - lastTime;
      lastTime = currentTime;
      // Cap delta time to prevent large jumps when returning to the tab
      const delta = Math.min(dt, 50) / (1000 / 60);
      
      if (!containerRef.current) return;
      
      if (hasUserInteracted.current && window.matchMedia('(pointer: fine)').matches) {
        if (!isMouseInWindow.current || !mousePos.current) {
          targetVelocity.current = { x: 0, y: 0 };
        } else {
          const { x, y } = mousePos.current;
          const { innerWidth, innerHeight } = window;
          const threshX = innerWidth * 0.25;
          const threshY = innerHeight * 0.25;
          const MAX_SPEED = 12;
          
          let tx = 0;
          let ty = 0;
          
          if (isSearchFocusedRef.current) {
            tx = 0;
            ty = 0;
          } else {
            if (x < threshX) tx = -MAX_SPEED * Math.pow(1 - x / threshX, 2);
            else if (x > innerWidth - threshX) tx = MAX_SPEED * Math.pow((x - (innerWidth - threshX)) / threshX, 2);
            
            if (y < threshY) {
              ty = -MAX_SPEED * Math.pow(1 - y / threshY, 2);
              // Search bar buffer
              if (hasScrolledPastThreshold && y < 150 && x > innerWidth/2 - 350 && x < innerWidth/2 + 350) {
                ty = 0;
              }
            } else if (y > innerHeight - threshY) {
              ty = MAX_SPEED * Math.pow((y - (innerHeight - threshY)) / threshY, 2);
            }
          }
          
          targetVelocity.current = { x: tx, y: ty };
        }
      }
      
      // Removed drift entirely as requested
      if (Math.abs(targetVelocity.current.x) > 0.05 || Math.abs(targetVelocity.current.y) > 0.05) {
        const tx = targetVelocity.current.x * delta;
        const ty = targetVelocity.current.y * delta;
        containerRef.current.scrollLeft += tx;
        containerRef.current.scrollTop += ty;
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };
    
    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [hasScrolledPastThreshold]);

  const onUserInteraction = () => {
    hasUserInteracted.current = true;
  };

  const [welcomeGlow, setWelcomeGlow] = useState({ x: 50, y: 50, opacity: 0 });
  const [edgeGlow, setEdgeGlow] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    mousePos.current = { x: e.clientX, y: e.clientY };
    hasUserInteracted.current = true;

    const { innerWidth, innerHeight } = window;
    const threshX = innerWidth * 0.25;
    const threshY = innerHeight * 0.25;
    
    if (e.clientX < threshX || e.clientX > innerWidth - threshX || e.clientY < threshY || e.clientY > innerHeight - threshY) {
      let glowX = e.clientX;
      let glowY = e.clientY;
      
      const distLeft = e.clientX;
      const distRight = innerWidth - e.clientX;
      const distTop = e.clientY;
      const distBottom = innerHeight - e.clientY;
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);
      
      if (minDist === distLeft) glowX = 0;
      else if (minDist === distRight) glowX = innerWidth;
      else if (minDist === distTop) glowY = 0;
      else if (minDist === distBottom) glowY = innerHeight;
      
      setEdgeGlow({ x: glowX, y: glowY, opacity: 1 });
    } else {
      setEdgeGlow(prev => ({ ...prev, opacity: 0 }));
    }
  };

  const handleWelcomeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setWelcomeGlow({ x, y, opacity: 1 });
  };

  return (
    <div 
      className="relative w-full h-screen bg-[#050508] text-white overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setEdgeGlow(prev => ({ ...prev, opacity: 0 }))}
      onWheel={onUserInteraction}
      onTouchMove={onUserInteraction}
      onMouseDown={onUserInteraction}
    >
      {/* Background Grid & Parallax */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          ref={parallaxBgRef}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-[#050508] to-[#050508] will-change-transform bg-[length:100vw_100vh] bg-center bg-repeat"
        ></div>
        {/* Make grid lines highly visible and animated */}
        <div 
          ref={parallaxGridRef}
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px] will-change-transform opacity-100 bg-repeat"
        ></div>
        {/* Glow pulse overlay */}
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(217,70,239,0.08)_0%,transparent_100%)] mix-blend-screen"
        ></motion.div>
      </div>

      {/* Edge Scroll Glow Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: edgeGlow.opacity,
          background: `radial-gradient(ellipse 500px 500px at ${edgeGlow.x}px ${edgeGlow.y}px, rgba(217,70,239,0.15), rgba(34,211,238,0.05), transparent 100%)`
        }}
      ></div>

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 z-10 overflow-auto no-scrollbar touch-pan-x touch-pan-y"
        style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ width: MAX_SCROLL, height: MAX_SCROLL, position: 'relative' }}>
          {visibleChunks.map(chunk => {
            const offset = chunkOffsetsRef.current[`${chunk.x},${chunk.y}`] || 0;
            const items = packChunk(chunk.x, chunk.y, offset, sessionSeed, filteredProjects);
            return (
              <div 
                key={`${chunk.x}-${chunk.y}`}
                className="absolute will-change-transform"
                style={{
                  left: chunk.x * CHUNK_WIDTH,
                  top: chunk.y * CHUNK_HEIGHT,
                  width: CHUNK_WIDTH,
                  height: CHUNK_HEIGHT
                }}
              >
                {items.map((item) => {
                  const width = item.cols * CELL_SIZE - GAP;
                  const height = item.rows * CELL_SIZE - GAP;
                  const left = item.col * CELL_SIZE + GAP / 2;
                  const top = item.row * CELL_SIZE + GAP / 2;
                  
                  if (item.isFiller || !item.project) {
                    return (
                      <div 
                        key={item.id}
                        className="absolute bg-white/[0.01] border border-white/5 rounded-2xl"
                        style={{ width, height, left, top }}
                      ></div>
                    );
                  }

                  const p = item.project;
                  const isCircle = p.shape === 'circle';

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      onClick={() => onSelect(p)}
                      className={cn(
                        "absolute flex flex-col justify-end p-4 md:p-6 cursor-pointer group overflow-hidden shadow-2xl",
                        "bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:border-fuchsia-400/50 hover:bg-white/[0.08] transition-all duration-500",
                        isCircle ? 'rounded-full items-center justify-center text-center p-6' : 'rounded-[2rem]'
                      )}
                      style={{ width, height, left, top }}
                    >
                      {p.images?.[0] && (
                        <img 
                          src={p.images[0]} 
                          alt={p.title} 
                          loading="lazy"
                          className={cn(
                            "absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-all duration-700 group-hover:scale-105", 
                            isCircle ? 'rounded-full' : ''
                          )} 
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative z-10 w-full">
                        <h3 className={cn("text-xl md:text-2xl font-extrabold font-sans tracking-tight drop-shadow-lg mb-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 text-white", isCircle && "text-center")}>{p.title}</h3>
                        
                        <p className={cn("text-xs md:text-sm text-zinc-300 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-2", isCircle && "text-center")}>
                          {p.description}
                        </p>
                        
                        <div className={cn("flex flex-wrap items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200", isCircle && "justify-center")}>
                          {p.tags?.slice(0,2).map(t => (
                            <span key={t} className="px-2 py-0.5 bg-fuchsia-500/20 backdrop-blur-xl rounded-full text-[10px] font-semibold tracking-wider text-fuchsia-300 border border-fuchsia-500/30">
                              {t}
                            </span>
                          ))}
                          {(p.dateStarted || p.dateCompleted) && (
                            <span className="text-[10px] tracking-wider text-zinc-400 font-medium">
                              {p.dateCompleted ? new Date(p.dateCompleted).getFullYear() : (p.dateStarted ? new Date(p.dateStarted).getFullYear() : '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Center Welcome -> Top Search Bar */}
      <motion.div 
        className={cn(
          "fixed z-40 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center pointer-events-none",
          hasScrolledPastThreshold 
            ? "top-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] h-14" 
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto"
        )}
        onMouseEnter={() => { isMouseInMenu.current = true; }}
        onMouseLeave={() => { isMouseInMenu.current = false; }}
      >
        <div className={cn(
          "relative w-full h-full flex transition-all duration-1000 overflow-hidden pointer-events-auto",
          hasScrolledPastThreshold 
            ? "items-center justify-between px-6 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full shadow-[0_8px_32px_rgba(217,70,239,0.15)]"
            : "items-center justify-center bg-white/[0.03] backdrop-blur-3xl border border-white/10 text-center flex-col gap-6 p-10 md:p-16 rounded-[3rem] max-w-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] group"
        )}
        onMouseMove={!hasScrolledPastThreshold ? handleWelcomeMouseMove : undefined}
        onMouseLeave={() => setWelcomeGlow(prev => ({ ...prev, opacity: 0 }))}
        >
          {/* Reactive background glow for welcome box */}
          {!hasScrolledPastThreshold && (
             <div 
               className="absolute inset-0 pointer-events-none transition-opacity duration-300 mix-blend-screen"
               style={{
                 opacity: welcomeGlow.opacity,
                 background: `radial-gradient(circle 300px at ${welcomeGlow.x}% ${welcomeGlow.y}%, rgba(217,70,239,0.15), transparent 100%)`
               }}
             />
          )}

          {!hasScrolledPastThreshold ? (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} className="relative z-10">
              <motion.h1 
                className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-fuchsia-500 drop-shadow-2xl mb-6"
                style={{ backgroundSize: '200% auto' }}
                animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                {siteSettings?.welcomeTitle || welcomeTitle || "Hello, I'm Owen Klea"}
              </motion.h1>
              <p className="text-zinc-300 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed drop-shadow-md">
                {siteSettings?.welcomeText || welcomeText || "I am a designer and developer."} 
              </p>
            </motion.div>
          ) : (
            <>
              <Search className="w-5 h-5 text-zinc-300 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => { isSearchFocusedRef.current = true; }}
                onBlur={() => { isSearchFocusedRef.current = false; }}
                className="w-full bg-transparent border-none outline-none px-4 text-white placeholder:text-zinc-400 font-medium text-lg"
              />
              <button 
                onClick={() => { setFilterOpen(!filterOpen); setMenuOpen(false); }} 
                className={cn("p-2 transition-colors rounded-full block", filterOpen || filterTag || filterTool || filterYear ? "text-fuchsia-400 bg-fuchsia-500/20" : "text-zinc-300 hover:text-white hover:bg-white/20")}
                title="Filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              </button>
              <div className="relative">
                <button onClick={() => { setMenuOpen(!menuOpen); setFilterOpen(false); }} className="p-2 -mr-2 text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/20 relative z-20">
                  {menuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}
        </div>
        <AnimatePresence>
          {showTooltip && hasScrolledPastThreshold && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-2 mt-4 w-48 p-3 bg-cyan-500 text-black text-sm font-bold rounded-xl shadow-xl text-center z-50 pointer-events-none before:content-[''] before:absolute before:-top-2 before:right-6 before:border-8 before:border-transparent before:border-b-cyan-500"
            >
              {siteSettings?.dropdownTooltip || "View more info and contact me here"}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {searchQuery === (siteSettings?.adminPassword || 'admin') && hasScrolledPastThreshold && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-50 pointer-events-auto"
            >
              <Link to="/admin" className="flex items-center gap-2 px-6 py-3 bg-fuchsia-600 text-white font-bold rounded-full hover:bg-fuchsia-500 shadow-xl transition-all hover:scale-105 hover:shadow-fuchsia-500/25">
                Admin Panel
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filter Menu */}
      <AnimatePresence>
        {filterOpen && hasScrolledPastThreshold && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] bg-[#111116]/95 backdrop-blur-3xl border border-white/20 rounded-3xl p-6 z-40 shadow-[0_16px_64px_rgba(217,70,239,0.2)] pointer-events-auto"
            onMouseEnter={() => { isMouseInMenu.current = true; }}
            onMouseLeave={() => { isMouseInMenu.current = false; }}
          >
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Filter by Tag</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setFilterTag('')}
                    className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors border", filterTag === '' ? "bg-white text-black border-white" : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10")}
                  >
                    All Tags
                  </button>
                  {allTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors border", filterTag === tag ? "bg-fuchsia-500 text-white border-fuchsia-400" : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10")}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-3">Filter by Tool/Software</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setFilterTool('')}
                    className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors border", filterTool === '' ? "bg-white text-black border-white" : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10")}
                  >
                    All Tools
                  </button>
                  {allTools.map(tool => (
                    <button 
                      key={tool}
                      onClick={() => setFilterTool(tool)}
                      className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors border", filterTool === tool ? "bg-fuchsia-500 text-white border-fuchsia-400" : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10")}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-3">Filter by Date</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setFilterYear('')}
                    className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors border", filterYear === '' ? "bg-white text-black border-white" : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10")}
                  >
                    Any Date
                  </button>
                  {allYears.map(year => (
                    <button 
                      key={year}
                      onClick={() => setFilterYear(year)}
                      className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors border", filterYear === year ? "bg-fuchsia-500 text-white border-fuchsia-400" : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10")}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && hasScrolledPastThreshold && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] bg-[#111116]/95 backdrop-blur-3xl border border-white/20 rounded-3xl p-6 z-40 shadow-[0_16px_64px_rgba(217,70,239,0.2)] pointer-events-auto"
            onMouseEnter={() => { isMouseInMenu.current = true; }}
            onMouseLeave={() => { isMouseInMenu.current = false; }}
          >
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Link to="/about" className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 flex items-center justify-between group">
                   <span className="font-semibold text-lg text-white">About</span>
                   <ArrowUpRight className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                 </Link>
                 <Link to="/skills" className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 flex items-center justify-between group">
                   <span className="font-semibold text-lg text-white">Skills</span>
                   <ArrowUpRight className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                 </Link>
                 <Link to="/achievements" className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 flex items-center justify-between group">
                   <span className="font-semibold text-lg text-white">Achievements</span>
                   <ArrowUpRight className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                 </Link>
                 <Link to="/contact" className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 flex items-center justify-between group">
                   <span className="font-semibold text-lg text-white">Contact Me</span>
                   <ArrowUpRight className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                 </Link>
              </div>
              <div className="pt-6 mt-2 border-t border-white/10 flex justify-between items-center text-sm text-zinc-500 font-medium">
                 <span>{siteSettings?.copyrightText || `© ${new Date().getFullYear()} Owen Klea.`}</span>
                 <span className="flex gap-6">
                   {siteSettings?.socialLinks?.map((link: any, idx: number) => (
                     <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{link.label}</a>
                   ))}
                 </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
