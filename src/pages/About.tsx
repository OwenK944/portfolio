import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { usePageContent } from '../hooks/usePageContent';
import { cn } from '../lib/utils';

export default function About() {
  const { content, loading } = usePageContent('about', {
    title: 'About Me',
    subtitle: 'Designer & Developer',
    coverImage: '',
    sections: []
  });

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,_rgba(217,70,239,0.15)_0%,_transparent_60%)] mix-blend-screen blur-[100px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"></div>
      </div>
      
      {/* Full Width Cover Image */}
      {!loading && content.coverImage && (
        <div className="w-full h-[40vh] md:h-[50vh] relative z-10">
          <img src={content.coverImage} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/50 to-transparent"></div>
        </div>
      )}

      <div className={cn("z-10 container max-w-5xl mx-auto px-6 pb-24 flex-1 flex flex-col", content.coverImage ? "-mt-32 relative" : "py-12")}>
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition w-fit mb-12 group">
          <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" /> 
          </div>
          <span className="font-medium">Back to Portfolio</span>
        </Link>
        
        {loading ? (
          <div className="flex-1 flex justify-center items-center"><Loader className="w-8 h-8 animate-spin text-fuchsia-500" /></div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-24">
            
            <div className="text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-fuchsia-100 to-cyan-200">
                {content.title}
              </h1>
              {content.subtitle && (
                <h2 className="text-2xl md:text-3xl font-medium text-fuchsia-400 tracking-tight">{content.subtitle}</h2>
              )}
            </div>

            {content.sections && content.sections.map((section: any, idx: number) => {
              const isEven = idx % 2 === 0;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className={cn("flex flex-col gap-12 items-center", section.image ? (isEven ? "md:flex-row" : "md:flex-row-reverse") : "")}
                >
                  {section.image && (
                    <div className="w-full md:w-5/12 shrink-0">
                      <div className="relative rounded-[2rem] overflow-hidden border border-white/10 aspect-square md:aspect-[4/5] bg-white/5 shadow-2xl group">
                        <img src={section.image} alt={section.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/80 via-transparent to-transparent"></div>
                      </div>
                    </div>
                  )}
                  
                  <div className={cn("flex-1", section.image ? "" : "w-full max-w-4xl mx-auto text-center")}>
                    {section.title && (
                      <h3 className="text-3xl font-bold mb-6 text-white">{section.title}</h3>
                    )}
                    
                    <div className={cn("prose prose-invert prose-lg max-w-none text-zinc-300 font-light leading-relaxed mb-10", section.image ? "" : "mx-auto")}>
                      <ReactMarkdown>{section.content || ''}</ReactMarkdown>
                    </div>

                    {section.facts && section.facts.length > 0 && (
                      <div className={cn("grid grid-cols-2 gap-4", section.image ? (isEven ? "md:grid-cols-2" : "md:grid-cols-2") : "md:grid-cols-4")}>
                        {section.facts.map((fact: any, fIdx: number) => (
                          <div key={fIdx} className="flex flex-col gap-1 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
                              <Zap className="w-3 h-3 text-cyan-500" /> {fact.label}
                            </span>
                            <span className="text-lg font-semibold text-white">{fact.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
