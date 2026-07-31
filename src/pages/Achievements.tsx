import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award, ExternalLink, Loader, Search, Calendar, Star, SortDesc, SortAsc, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePageContent } from '../hooks/usePageContent';
import { cn } from '../lib/utils';

export default function Achievements() {
  const { content, loading } = usePageContent('achievements', {
    title: 'Achievements',
    items: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const allYears = Array.from(new Set(content.items?.map((a: any) => a.year).filter(Boolean))).sort().reverse();

  const filteredItems = useMemo(() => {
    let items = (content.items || []).filter((ach: any) => {
      const matchesSearch = ach.title.toLowerCase().includes(searchQuery.toLowerCase()) || ach.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = filterYear === '' || ach.year === filterYear;
      return matchesSearch && matchesYear;
    });

    items = items.sort((a: any, b: any) => {
      const importanceA = a.importance || 3;
      const importanceB = b.importance || 3;
      return sortOrder === 'desc' ? importanceB - importanceA : importanceA - importanceB;
    });

    return items;
  }, [content.items, searchQuery, filterYear, sortOrder]);

  const getCardStyle = (importance: number) => {
    switch(importance) {
      case 5: return 'border-transparent bg-amber-950/40 shadow-[0_0_40px_rgba(245,158,11,0.2)] before:absolute before:inset-0 before:-z-10 before:rounded-3xl before:p-[2px] before:bg-[length:200%_100%] before:animate-shimmer before:bg-gradient-to-r before:from-amber-300 before:via-yellow-500 before:to-amber-300 before:opacity-100 ring-1 ring-amber-400/20';
      case 4: return 'border-transparent bg-amber-950/20 shadow-xl before:absolute before:inset-0 before:-z-10 before:rounded-3xl before:p-[1px] before:bg-gradient-to-br before:from-amber-400/50 before:to-amber-600/20';
      case 3: return 'border-amber-500/30 bg-amber-950/10 hover:border-amber-400/50 transition-colors';
      case 2: return 'border-amber-500/20 bg-amber-950/5 hover:border-amber-500/40 transition-colors';
      case 1: default: return 'border-amber-500/10 bg-transparent hover:border-amber-500/30 transition-colors';
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], rotate: [0, 45, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(234,179,8,0.15)_0%,_transparent_60%)] mix-blend-screen blur-[100px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"></div>
      </div>
      
      <div className="z-10 container max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition w-fit mb-12 group relative z-[60]">
          <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" /> 
          </div>
          <span className="font-medium">Back to Portfolio</span>
        </Link>
        
        {loading ? (
          <div className="flex-1 flex justify-center items-center"><Loader className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-8 flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-[60]">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-100 via-yellow-200 to-amber-500">
                {content.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search achievements..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white outline-none focus:border-amber-500/50 transition-colors placeholder:text-zinc-500"
                  />
                </div>
                <div className="relative w-full sm:w-auto">
                  <button 
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                    className="w-full sm:w-auto flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white outline-none focus:border-amber-500/50 transition-colors cursor-pointer min-w-[140px]"
                  >
                    <span>{filterYear || "All Years"}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  </button>
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  
                  <AnimatePresence>
                    {isYearDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsYearDropdownOpen(false)}></div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full left-0 mt-2 w-full min-w-[140px] bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                          <button 
                            onClick={() => { setFilterYear(''); setIsYearDropdownOpen(false); }}
                            className={cn("w-full text-left px-4 py-2 text-sm transition-colors", filterYear === '' ? "bg-amber-500/20 text-amber-400" : "text-white hover:bg-white/10")}
                          >
                            All Years
                          </button>
                          {allYears.map((year: any) => (
                            <button 
                              key={year}
                              onClick={() => { setFilterYear(year); setIsYearDropdownOpen(false); }}
                              className={cn("w-full text-left px-4 py-2 text-sm transition-colors", filterYear === year ? "bg-amber-500/20 text-amber-400" : "text-white hover:bg-white/10")}
                            >
                              {year}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-300 transition-colors w-full sm:w-auto justify-center"
                >
                  {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                  <span>Importance</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 mt-8 relative z-10">
              {filteredItems.map((ach: any, i: number) => {
                const importance = ach.importance || 3;
                
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={cn(
                      "relative rounded-3xl overflow-hidden border p-6 flex flex-col group",
                      getCardStyle(importance)
                    )}
                  >
                    {ach.image && (
                      <div className="w-full h-48 mb-6 rounded-2xl overflow-hidden relative shrink-0">
                        <img src={ach.image} alt={ach.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80"></div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">{ach.title}</h3>
                      {ach.link && (
                        <a href={ach.link} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-amber-500/20 text-white rounded-full transition-colors shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                      {ach.year && (
                        <span className="inline-block px-3 py-1 bg-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-full">
                          {ach.year}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: importance }).map((_, idx) => (
                          <Star key={idx} className="w-3 h-3 text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-zinc-100 leading-relaxed text-sm">
                      {ach.description}
                    </p>
                  </motion.div>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-full text-zinc-500 py-12 text-center w-full">No achievements found.</div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
