import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader, Code, Monitor, Server, Layout, Database, ChevronDown, Search, SortAsc, SortDesc } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { usePageContent } from '../hooks/usePageContent';
import { cn } from '../lib/utils';

const levelToPercent: Record<string, number> = {
  'Learning': 15,
  'Beginner': 30,
  'Intermediate': 50,
  'Advanced': 75,
  'Expert': 90,
  'Professional': 100
};

export default function Skills() {
  const { content, loading } = usePageContent('skills', {
    title: 'Skills',
    items: []
  });

  const [expandedSkill, setExpandedSkill] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const getIcon = (name: string) => {
    const l = name.toLowerCase();
    if (l.includes('react') || l.includes('vue') || l.includes('angular') || l.includes('front')) return <Monitor className="w-6 h-6" />;
    if (l.includes('node') || l.includes('python') || l.includes('back')) return <Server className="w-6 h-6" />;
    if (l.includes('css') || l.includes('figma') || l.includes('design') || l.includes('ui')) return <Layout className="w-6 h-6" />;
    if (l.includes('sql') || l.includes('mongo') || l.includes('firebase') || l.includes('data')) return <Database className="w-6 h-6" />;
    return <Code className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,_rgba(34,211,238,0.15)_0%,_transparent_60%)] mix-blend-screen blur-[100px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"></div>
      </div>
      
      <div className="z-10 container max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition w-fit mb-12 group">
          <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" /> 
          </div>
          <span className="font-medium">Back to Portfolio</span>
        </Link>
        
        {loading ? (
          <div className="flex-1 flex justify-center items-center"><Loader className="w-8 h-8 animate-spin text-cyan-500" /></div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-fuchsia-200">
                {content.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search skills..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-500"
                  />
                </div>
                <button 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-300 transition-colors w-full sm:w-auto justify-center"
                >
                  {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                  <span>Proficiency</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {content.items && content.items
                .filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                .sort((a: any, b: any) => {
                  const percentA = levelToPercent[a.level] || 50;
                  const percentB = levelToPercent[b.level] || 50;
                  return sortOrder === 'desc' ? percentB - percentA : percentA - percentB;
                })
                .map((skill: any, idx: number) => {
                const isExpanded = expandedSkill === idx;
                const percent = levelToPercent[skill.level] || 50;
                
                return (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl overflow-hidden group hover:border-white/20 transition-colors cursor-pointer"
                    onClick={() => setExpandedSkill(isExpanded ? null : idx)}
                  >
                    <div className="p-5 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4 md:gap-6 w-full">
                        {skill.image ? (
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-white/5">
                            <img src={skill.image} alt={skill.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-300 group-hover:text-cyan-400 transition-colors shrink-0 border border-white/10">
                            {getIcon(skill.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 truncate">{skill.name}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                            <span className="text-xs md:text-sm font-semibold tracking-wide uppercase text-zinc-400">{skill.level || 'Learning'}</span>
                            <div className="w-full sm:w-48 h-2 bg-white/5 rounded-full overflow-hidden relative">
                              <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: `${percent}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #d946ef 100%)`,
                                  backgroundSize: '200px 100%',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={cn("hidden sm:block p-2 rounded-full bg-white/5 border border-white/10 transition-transform duration-300", isExpanded ? "rotate-180" : "")}>
                        <ChevronDown className="w-5 h-5 text-zinc-400" />
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 md:p-8 pt-0 border-t border-white/10 mt-2">
                            <div className="prose prose-invert prose-zinc max-w-none prose-p:leading-relaxed prose-headings:font-bold">
                              {skill.description ? (
                                <ReactMarkdown>{skill.description}</ReactMarkdown>
                              ) : (
                                <p className="text-zinc-500 italic">No detailed description provided.</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {(!content.items || content.items.length === 0) && (
                <div className="col-span-full text-zinc-500 py-12 text-center">No skills added yet. Add them in the Admin panel.</div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
