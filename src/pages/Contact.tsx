import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { useContact } from '../hooks/useContact';
import { useMessages } from '../hooks/useMessages';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Contact() {
  const { contactInfo, loading } = useContact();
  const { sendMessage } = useMessages();
  
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sendMessage({
        name: formData.name,
        email: formData.email,
        message: formData.message,
      });

      if (contactInfo?.web3FormsKey) {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            access_key: contactInfo.web3FormsKey,
            name: formData.name,
            email: formData.email,
            message: formData.message,
            subject: `New message from ${formData.name} on your Portfolio`
          })
        }).catch(err => console.error("Web3Forms error:", err));
      }

      setIsSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      alert("Failed to send message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden">
      {/* Cover Image */}
      {contactInfo?.coverImage && (
        <div className="absolute top-0 left-0 right-0 h-96 z-0">
          <img src={contactInfo.coverImage} alt="Cover" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050508]"></div>
        </div>
      )}

      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,_rgba(217,70,239,0.15)_0%,_transparent_60%)] mix-blend-screen blur-[100px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"></div>
      </div>
      
      <div className="z-10 container max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition w-fit mb-12 group relative z-10">
          <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" /> 
          </div>
          <span className="font-medium">Back to Portfolio</span>
        </Link>
        
        <div className="flex-1 flex flex-col lg:flex-row gap-16 items-start relative z-10">
          {/* Left Column: Info */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 w-full space-y-10 pt-4"
          >
            <div>
              <div className="flex items-center gap-6 mb-8">
                {contactInfo?.image && (
                  <img src={contactInfo.image} alt="Profile" className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-2xl" />
                )}
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white">
                  Let's Talk.
                </h1>
              </div>
              <p className="text-zinc-300 text-lg md:text-xl font-light max-w-lg leading-relaxed whitespace-pre-wrap">
                {contactInfo?.bio || "I'm always open to discussing new projects, creative ideas, or opportunities to be part of your visions."}
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo?.email && (
                <div className="flex items-center gap-4 group cursor-pointer w-fit">
                  <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:scale-110">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400 font-medium">Email</div>
                    <a href={`mailto:${contactInfo.email}`} className="text-lg text-white font-medium hover:underline transition-all">{contactInfo.email}</a>
                  </div>
                </div>
              )}
              {contactInfo?.phone && (
                <div className="flex items-center gap-4 group cursor-pointer w-fit">
                  <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:scale-110">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400 font-medium">Phone</div>
                    <a href={`tel:${contactInfo.phone}`} className="text-lg text-white font-medium hover:underline transition-all">{contactInfo.phone}</a>
                  </div>
                </div>
              )}
              {contactInfo?.location && (
                <div className="flex items-center gap-4 group cursor-pointer w-fit">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 text-white flex items-center justify-center transition-transform group-hover:scale-110">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400 font-medium">Location</div>
                    <div className="text-lg text-white font-medium">{contactInfo.location}</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column: Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex-1 w-full max-w-lg"
          >
            <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-10 rounded-3xl shadow-2xl">
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center text-center py-12 space-y-4"
                  >
                    <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">Message Sent!</h3>
                    <p className="text-zinc-400">Thanks for reaching out. I'll get back to you as soon as possible.</p>
                    <button 
                      onClick={() => setIsSuccess(false)}
                      className="mt-8 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6" 
                    onSubmit={handleSubmit}
                  >
                    <h2 className="text-2xl font-bold text-white mb-6">Send a Message</h2>
                    <div>
                      <label className="block text-sm font-semibold text-zinc-300 mb-2">Name</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 text-white outline-none focus:border-white transition-all placeholder:text-zinc-600" 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-zinc-300 mb-2">Email</label>
                      <input 
                        type="email" 
                        required 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 text-white outline-none focus:border-white transition-all placeholder:text-zinc-600" 
                        placeholder="john@example.com" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-zinc-300 mb-2">Message</label>
                      <textarea 
                        required 
                        rows={5} 
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 text-white outline-none focus:border-white transition-all placeholder:text-zinc-600 resize-none" 
                        placeholder="Tell me about your project..."
                      ></textarea>
                    </div>
                    <button 
                      disabled={isSubmitting}
                      className="w-full py-4 bg-white text-black hover:bg-zinc-200 disabled:opacity-70 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
