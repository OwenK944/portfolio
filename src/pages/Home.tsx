import React, { useState, useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useContact } from '../hooks/useContact';
import { Project } from '../types';
import InfiniteMasonry from '../components/InfiniteMasonry';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, ChevronLeft, ChevronRight, Calendar, Layers, Activity, Award } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const { projects } = useProjects();
  const { contactInfo } = useContact();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Reset image index when project changes
  useEffect(() => {
    setCurrentImageIdx(0);
  }, [selectedProject]);

  // Handle arrow keys for gallery
  useEffect(() => {
    if (!selectedProject || !selectedProject.images || selectedProject.images.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentImageIdx((prev) => (prev + 1) % selectedProject.images.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIdx((prev) => (prev - 1 + selectedProject.images.length) % selectedProject.images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject]);

  return (
    <>
      <InfiniteMasonry 
        projects={projects} 
        onSelect={setSelectedProject} 
        welcomeTitle={contactInfo?.welcomeTitle}
        welcomeText={contactInfo?.welcomeText}
        paused={!!selectedProject}
      />

      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-6xl max-h-[90vh] h-[90vh] bg-[#111116] border border-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Image Gallery Side */}
              <div className="w-full md:w-1/2 min-h-[30vh] md:h-full relative bg-zinc-950 shrink-0 flex flex-col p-6 md:p-10 border-b md:border-b-0 md:border-r border-white/10 justify-center">
                <button onClick={() => setSelectedProject(null)} className="absolute top-4 left-4 md:top-6 md:left-6 p-2 bg-black/50 hover:bg-black/70 rounded-full transition z-20 backdrop-blur-md">
                  <X className="w-5 h-5 text-white" />
                </button>
                
                {selectedProject.images && selectedProject.images.length > 0 ? (
                  <div className="w-full h-full flex flex-col gap-6">
                    {/* Main Image Frame */}
                    <div 
                      className="relative w-full flex-1 min-h-[200px] md:min-h-[300px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group cursor-pointer"
                      onClick={() => setFullScreenImage(selectedProject.images[currentImageIdx])}
                    >
                      <img 
                        src={selectedProject.images[currentImageIdx]} 
                        alt={selectedProject.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm transition-opacity">
                          Click to expand
                        </span>
                      </div>
                    </div>
                    
                    {/* Thumbnail Carousel */}
                    {selectedProject.images.length > 1 && (
                      <div className="flex items-center gap-4 w-full h-16 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIdx((prev) => (prev - 1 + selectedProject.images.length) % selectedProject.images.length); }}
                          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors shrink-0"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar justify-center py-2 px-1">
                          {selectedProject.images.map((img, i) => (
                            <button 
                              key={i} 
                              onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(i); }}
                              className={cn("relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all", i === currentImageIdx ? "border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.3)] scale-110" : "border-white/10 opacity-50 hover:opacity-100 hover:border-white/30")} 
                            >
                              <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIdx((prev) => (prev + 1) % selectedProject.images.length); }}
                          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors shrink-0"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-2xl border border-white/10 flex items-center justify-center bg-zinc-900 text-zinc-700">No Image provided</div>
                )}
              </div>

              {/* Content Side */}
              <div className="w-full md:w-1/2 h-auto md:h-full overflow-y-auto p-8 md:p-12 relative no-scrollbar flex flex-col">
                
                {/* 1. Name */}
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">{selectedProject.title}</h2>
                
                {/* 2. Short Desc */}
                <p className="text-xl text-zinc-300 font-light mb-6 leading-relaxed">{selectedProject.description}</p>
                
                {/* Custom Buttons (Links) */}
                {selectedProject.links && selectedProject.links.length > 0 && (
                  <div className="flex flex-wrap gap-4 mb-6">
                    {selectedProject.links.map((link, i) => (
                      <a key={link.id || i} href={link.url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition flex items-center gap-2">
                        {link.label} <ArrowUpRight className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                )}
                
                <hr className="border-white/10 mb-6" />
                
                {/* 3. Tag and Date */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  {selectedProject.tags && selectedProject.tags.length > 0 && (
                    <div className="flex gap-2">
                      {selectedProject.tags.map(t => (
                        <span key={t} className="px-3 py-1 bg-fuchsia-500/10 text-fuchsia-400 text-xs font-semibold tracking-wide uppercase rounded-full border border-fuchsia-500/20">{t}</span>
                      ))}
                    </div>
                  )}
                  {(selectedProject.dateStarted || selectedProject.dateCompleted) && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span>
                        {selectedProject.dateStarted ? new Date(selectedProject.dateStarted).toLocaleDateString() : ''} 
                        {selectedProject.dateStarted && selectedProject.dateCompleted ? ' - ' : ''} 
                        {selectedProject.dateCompleted ? new Date(selectedProject.dateCompleted).toLocaleDateString() : (selectedProject.dateStarted ? ' - Present' : '')}
                      </span>
                    </div>
                  )}
                </div>
                
                <hr className="border-white/10 mb-8" />
                
                {/* 5. Markdown detailed desc in WHITE text */}
                {selectedProject.detailedDescription && (
                  <>
                    <div className="prose prose-invert prose-zinc max-w-none mb-10 text-white prose-p:text-white prose-headings:text-white prose-strong:text-white prose-li:text-white">
                      <ReactMarkdown>{selectedProject.detailedDescription}</ReactMarkdown>
                    </div>
                    <hr className="border-white/10 mb-10" />
                  </>
                )}
                
                {/* 6. Acclaim */}
                {selectedProject.acclaim && selectedProject.acclaim.length > 0 && (
                  <div className="mb-10">
                    <h4 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mb-4 flex items-center gap-2">
                      Acclaim & Recognition
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.acclaim.map((acc, i) => (
                        <span key={i} className="px-4 py-2 bg-[linear-gradient(110deg,#331c04,45%,#5c3409,55%,#331c04)] bg-[length:200%_100%] animate-shimmer text-amber-300 text-sm font-medium rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]">{acc}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 7. Skills */}
                {selectedProject.skills && selectedProject.skills.length > 0 && (
                  <div className="mb-10">
                    <h4 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mb-4">Skills Demonstrated</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.skills.map(s => (
                        <span key={s} className="px-4 py-2 bg-cyan-950/30 text-cyan-200 text-sm font-medium rounded-xl border border-cyan-500/20">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. Tools */}
                {selectedProject.tools && selectedProject.tools.length > 0 && (
                  <div className="mb-10">
                    <h4 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mb-4">Tools & Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tools.map(t => (
                        <span key={t} className="px-4 py-2 bg-zinc-900 text-zinc-300 text-sm font-medium rounded-xl border border-zinc-800">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 9. Stats/Metrics */}
                {selectedProject.stats && selectedProject.stats.length > 0 && (
                  <div>
                    <h4 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mb-4">Key Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProject.stats.map(s => (
                        <div key={s.id} className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-3xl flex flex-col gap-2 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-3xl md:text-4xl font-black text-white relative z-10">{s.value}</span>
                          <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold relative z-10">{s.metric}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Full Screen Image Viewer */}
      <AnimatePresence>
        {fullScreenImage && (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setFullScreenImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setFullScreenImage(null)} 
                className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={fullScreenImage} 
                alt="Full screen" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
