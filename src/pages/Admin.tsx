import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { useContact } from '../hooks/useContact';
import { useMessages } from '../hooks/useMessages';
import { usePageContent } from '../hooks/usePageContent';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { compressImage } from '../lib/imageUtils';
import { Project } from '../types';
import { Trash, Edit, Plus, LogOut, Loader, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Admin() {
  const { user, loading: authLoading, login, logout, isAdmin } = useAuth();
  const { projects, loading: projsLoading } = useProjects();
  const { contactInfo, loading: contactLoading, updateContact } = useContact();
  const { messages, loading: messagesLoading, deleteMessage, toggleStarMessage } = useMessages();
  
  const { content: aboutContent, updateContent: updateAbout } = usePageContent('about', { title: 'About Me', subtitle: 'Designer & Developer', coverImage: '', sections: [] });
  const { content: skillsContent, updateContent: updateSkills } = usePageContent('skills', { title: 'Skills', items: [] });
  const { content: achievementsContent, updateContent: updateAchievements } = usePageContent('achievements', { title: 'Achievements', items: [] });
  
  const { content: siteSettings, updateContent: updateSiteSettings } = usePageContent('site_settings', { adminPassword: 'admin', welcomeTitle: '', welcomeText: '', socialLinks: [] });
  
  const [activeTab, setActiveTab] = useState<'settings' | 'projects' | 'skills' | 'achievements' | 'about' | 'contact'>('projects');
  const [editingProj, setEditingProj] = useState<Partial<Project> | null>(null);
  
  const [editingContact, setEditingContact] = useState<any>({ email: '', phone: '', location: '', bio: '', image: '', welcomeTitle: '', welcomeText: '' });
  const [editingAbout, setEditingAbout] = useState<any>({ title: 'About Me', subtitle: 'Designer & Developer', coverImage: '', sections: [] });
  const [editingSkills, setEditingSkills] = useState<any>({ title: '', items: [] });
  const [editingAchievements, setEditingAchievements] = useState<any>({ title: '', items: [] });
  const [editingSite, setEditingSite] = useState<any>({ adminPassword: 'admin', welcomeTitle: '', welcomeText: '', socialLinks: [] });

  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  React.useEffect(() => {
    if (contactInfo) setEditingContact(contactInfo);
    else setEditingContact({ email: '', phone: '', location: '', bio: '', image: '', welcomeTitle: '', welcomeText: '' });
  }, [contactInfo]);
  
  React.useEffect(() => {
    if (aboutContent) setEditingAbout(aboutContent);
  }, [aboutContent]);

  React.useEffect(() => {
    if (skillsContent) setEditingSkills(skillsContent);
  }, [skillsContent]);

  React.useEffect(() => {
    if (achievementsContent) setEditingAchievements(achievementsContent);
  }, [achievementsContent]);

  React.useEffect(() => {
    if (siteSettings) setEditingSite(siteSettings);
  }, [siteSettings]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
        <h1 className="text-3xl font-bold mb-6">Admin Login</h1>
        <button onClick={login} className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition">
          Sign in with Google
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
        <h1 className="text-2xl font-bold mb-4">Unauthorized access</h1>
        <p className="mb-6">You are not authorized to view this page. ({user.email})</p>
        <button onClick={logout} className="px-6 py-3 bg-zinc-800 text-white rounded-full">Sign Out</button>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    setUploadError(null);
    const newImages = [...(editingProj?.images || [])];
    
    try {
      for (const file of Array.from(e.target.files) as File[]) {
        const compressedBlob = await compressImage(file);
        
        // Convert Blob to Base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedBlob);
        });

        newImages.push(base64);
      }
      setEditingProj({ ...editingProj, images: newImages });
    } catch (err: any) {
      console.error("Upload failed", err);
      setUploadError(err.message || 'Failed to process image.');
    } finally {
      setUploading(false);
    }
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProj?.title) return;

    const data = {
      title: editingProj.title || '',
      description: editingProj.description || '',
      detailedDescription: editingProj.detailedDescription || '',
      images: editingProj.images || [],
      tags: editingProj.tags || [],
      acclaim: editingProj.acclaim || [],
      tools: editingProj.tools || [],
      skills: editingProj.skills || [],
      stats: editingProj.stats || [],
      shape: editingProj.shape || 'square',
      size: editingProj.size || 'medium',
      links: editingProj.links || [],
      dateStarted: editingProj.dateStarted || '',
      dateCompleted: editingProj.dateCompleted || '',
      updatedAt: new Date().toISOString(),
      featured: editingProj.featured || false,
    };

    if (editingProj.id) {
      await updateDoc(doc(db, 'projects', editingProj.id), data);
    } else {
      await addDoc(collection(db, 'projects'), { ...data, createdAt: new Date().toISOString() });
    }
    setEditingProj(null);
  };

  const deleteProject = async (id: string) => {
    setProjectToDelete(id);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteDoc(doc(db, 'projects', projectToDelete));
      setProjectToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Portfolio Admin</h1>
            <div className="flex gap-2 bg-zinc-900 p-1 rounded-full border border-zinc-800 w-fit">
              {(['settings', 'projects', 'skills', 'achievements', 'about', 'contact'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)} 
                  className={cn("px-6 py-2 rounded-full text-sm font-medium transition-colors capitalize", activeTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white')}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <Link to="/" className="px-4 py-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition">View Site</Link>
            <button onClick={logout} className="p-2 bg-red-900/50 text-red-400 rounded-full hover:bg-red-900 transition" title="Sign out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {activeTab === 'contact' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900 p-8 rounded-2xl space-y-6">
              <h2 className="text-2xl font-semibold">Contact & Profile Settings</h2>
              {contactLoading ? (
                <div className="flex justify-center p-12"><Loader className="w-8 h-8 animate-spin text-zinc-500"/></div>
              ) : editingContact && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await updateContact(editingContact);
                  alert('Settings saved!');
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Email</label>
                    <input type="email" value={editingContact.email || ''} onChange={e => setEditingContact({...editingContact, email: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                    <input type="text" value={editingContact.phone || ''} onChange={e => setEditingContact({...editingContact, phone: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Location</label>
                    <input type="text" value={editingContact.location || ''} onChange={e => setEditingContact({...editingContact, location: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Bio</label>
                    <textarea rows={4} value={editingContact.bio || ''} onChange={e => setEditingContact({...editingContact, bio: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Web3Forms Access Key (For Email Notifications)</label>
                    <input type="text" value={editingContact.web3FormsKey || ''} onChange={e => setEditingContact({...editingContact, web3FormsKey: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" placeholder="e.g. 1234-abcd..." />
                    <p className="text-xs text-zinc-500 mt-1">Get a free key at <a href="https://web3forms.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">web3forms.com</a> to receive email notifications when someone submits the contact form.</p>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Menu Tooltip Text</label>
                    <input type="text" value={editingContact.dropdownTooltip || ''} onChange={e => setEditingContact({...editingContact, dropdownTooltip: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" placeholder="View more info and contact me here" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Profile Image</label>
                      {editingContact.image && <img src={editingContact.image} alt="Profile" className="w-24 h-24 object-cover rounded-xl mb-4 border-2 border-zinc-700" />}
                      <label className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg cursor-pointer transition text-center w-full">
                        Upload Profile Image
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          if (!e.target.files?.length) return;
                          const file = e.target.files[0];
                          const compressedBlob = await compressImage(file);
                          const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(compressedBlob);
                          });
                          setEditingContact({...editingContact, image: base64});
                        }} />
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Cover Image</label>
                      {editingContact.coverImage && <img src={editingContact.coverImage} alt="Cover" className="w-full h-24 object-cover rounded-xl mb-4 border-2 border-zinc-700" />}
                      <label className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg cursor-pointer transition text-center w-full">
                        Upload Cover Image
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          if (!e.target.files?.length) return;
                          const file = e.target.files[0];
                          const compressedBlob = await compressImage(file);
                          const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(compressedBlob);
                          });
                          setEditingContact({...editingContact, coverImage: base64});
                        }} />
                      </label>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-800 text-right">
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition">Save Settings</button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-zinc-900 p-8 rounded-2xl flex flex-col h-full max-h-[800px]">
              <h2 className="text-2xl font-semibold mb-6">Messages</h2>
              {messagesLoading ? (
                <div className="flex-1 flex justify-center items-center"><Loader className="w-8 h-8 animate-spin text-zinc-500"/></div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                  <p>No messages yet.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {messages.map(msg => (
                    <div key={msg.id} className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white">{msg.name}</h4>
                            {msg.starred && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                          </div>
                          <a href={`mailto:${msg.email}`} className="text-sm text-blue-400 hover:underline">{msg.email}</a>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {msg.createdAt && (
                            <span className="text-xs text-zinc-500">{new Date(msg.createdAt?.toDate?.() || msg.createdAt).toLocaleString()}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleStarMessage(msg.id!, !!msg.starred)}
                              className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700 rounded-lg transition"
                              title={msg.starred ? "Unstar" : "Star"}
                            >
                              <Star className={cn("w-4 h-4", msg.starred && "fill-yellow-400 text-yellow-400")} />
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this message?")) {
                                  deleteMessage(msg.id!);
                                }
                              }}
                              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition"
                              title="Delete Message"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-zinc-300 text-sm mt-2 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="bg-zinc-900 p-8 rounded-2xl max-w-2xl">
            <h2 className="text-2xl font-semibold mb-6">Site Settings</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await updateSiteSettings(editingSite);
              alert('Site settings saved!');
            }} className="space-y-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Secret Admin Password (type this on the home page to show the admin link)</label>
                <input type="text" value={editingSite.adminPassword || ''} onChange={e => setEditingSite({...editingSite, adminPassword: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
              </div>
              <hr className="border-zinc-800 my-6" />
              <h3 className="text-lg font-medium">Home Page Welcome Box</h3>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Welcome Title</label>
                <input type="text" value={editingSite.welcomeTitle || ''} onChange={e => setEditingSite({...editingSite, welcomeTitle: e.target.value})} placeholder="e.g. Hello, I'm Owen Klea" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Welcome Text</label>
                <textarea rows={2} value={editingSite.welcomeText || ''} onChange={e => setEditingSite({...editingSite, welcomeText: e.target.value})} placeholder="e.g. I am a designer and developer." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"></textarea>
              </div>
              <hr className="border-zinc-800 my-6" />
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Social Links</h3>
                <button type="button" onClick={() => setEditingSite({...editingSite, socialLinks: [...(editingSite.socialLinks || []), { label: '', url: '' }]})} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-medium">Add Link</button>
              </div>
              <div className="space-y-3">
                {editingSite.socialLinks?.map((link: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <input type="text" placeholder="Platform (e.g. Twitter)" value={link.label} onChange={e => {
                      const newLinks = [...(editingSite.socialLinks || [])];
                      newLinks[idx].label = e.target.value;
                      setEditingSite({...editingSite, socialLinks: newLinks});
                    }} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white" />
                    <input type="url" placeholder="URL" value={link.url} onChange={e => {
                      const newLinks = [...(editingSite.socialLinks || [])];
                      newLinks[idx].url = e.target.value;
                      setEditingSite({...editingSite, socialLinks: newLinks});
                    }} className="flex-[2] bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white" />
                    <button type="button" onClick={() => {
                      setEditingSite({...editingSite, socialLinks: editingSite.socialLinks?.filter((_: any, i: number) => i !== idx)});
                    }} className="p-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900/80 transition-colors"><Trash className="w-5 h-5"/></button>
                  </div>
                ))}
                {(!editingSite.socialLinks || editingSite.socialLinks.length === 0) && (
                  <p className="text-sm text-zinc-500 italic">No social links added yet.</p>
                )}
              </div>
              <hr className="border-zinc-800 my-6" />
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1">Copyright Text</label>
                <input type="text" value={editingSite.copyrightText || ''} onChange={e => setEditingSite({...editingSite, copyrightText: e.target.value})} placeholder={`e.g. © ${new Date().getFullYear()} Owen Klea.`} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
              </div>
              <div className="pt-6 border-t border-zinc-800 text-right">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition">Save Settings</button>
              </div>
            </form>
          </div>
        ) : activeTab === 'skills' ? (
          <div className="bg-zinc-900 p-8 rounded-2xl max-w-4xl">
            <h2 className="text-2xl font-semibold mb-6">Skills Management</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await updateSkills(editingSkills);
              alert('Skills page saved!');
            }} className="space-y-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Page Title</label>
                <input type="text" value={editingSkills.title || ''} onChange={e => setEditingSkills({...editingSkills, title: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-zinc-400">Skills List</label>
                  <button type="button" onClick={() => setEditingSkills({...editingSkills, items: [...(editingSkills.items || []), { name: '', level: 'Learning', description: '', image: '' }]})} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition">Add Skill</button>
                </div>
                <div className="space-y-6 mt-4">
                  {editingSkills.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-4 bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50 relative">
                      <button type="button" onClick={() => {
                        setEditingSkills({...editingSkills, items: editingSkills.items?.filter((_: any, i: number) => i !== idx)});
                      }} className="absolute top-4 right-4 p-2 bg-red-900/50 text-red-400 rounded-lg"><Trash className="w-4 h-4"/></button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Skill Name</label>
                          <input type="text" placeholder="e.g. React" value={item.name} onChange={e => {
                            const newItems = [...(editingSkills.items || [])];
                            newItems[idx].name = e.target.value;
                            setEditingSkills({...editingSkills, items: newItems});
                          }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Proficiency Level</label>
                          <select value={item.level || 'Learning'} onChange={e => {
                            const newItems = [...(editingSkills.items || [])];
                            newItems[idx].level = e.target.value;
                            setEditingSkills({...editingSkills, items: newItems});
                          }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
                            <option value="Learning">Learning</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                            <option value="Professional">Professional</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Detailed Description (Markdown)</label>
                        <textarea rows={4} placeholder="Describe your experience with this skill..." value={item.description || ''} onChange={e => {
                          const newItems = [...(editingSkills.items || [])];
                          newItems[idx].description = e.target.value;
                          setEditingSkills({...editingSkills, items: newItems});
                        }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"></textarea>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-2">Cover Image</label>
                        {item.image && <img src={item.image} alt="Skill Cover" className="w-full h-32 object-cover rounded-xl mb-4 border-2 border-zinc-700" />}
                        <label className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg cursor-pointer transition">
                          Upload Cover Image
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (!e.target.files?.length) return;
                            const file = e.target.files[0];
                            const compressedBlob = await compressImage(file);
                            const base64 = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.onerror = reject;
                              reader.readAsDataURL(compressedBlob);
                            });
                            const newItems = [...(editingSkills.items || [])];
                            newItems[idx].image = base64;
                            setEditingSkills({...editingSkills, items: newItems});
                          }} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800 text-right sticky bottom-4">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition shadow-lg">Save Skills</button>
              </div>
            </form>
          </div>
        ) : activeTab === 'achievements' ? (
          <div className="bg-zinc-900 p-8 rounded-2xl max-w-4xl">
            <h2 className="text-2xl font-semibold mb-6">Achievements Management</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await updateAchievements(editingAchievements);
              alert('Achievements page saved!');
            }} className="space-y-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Page Title</label>
                <input type="text" value={editingAchievements.title || ''} onChange={e => setEditingAchievements({...editingAchievements, title: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-zinc-400">Achievements List</label>
                  <button type="button" onClick={() => setEditingAchievements({...editingAchievements, items: [...(editingAchievements.items || []), { title: '', year: '', description: '', link: '', importance: 3, image: '' }]})} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition">Add Achievement</button>
                </div>
                <div className="space-y-6 mt-4">
                  {editingAchievements.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-4 bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50 relative">
                      <button type="button" onClick={() => {
                        setEditingAchievements({...editingAchievements, items: editingAchievements.items?.filter((_: any, i: number) => i !== idx)});
                      }} className="absolute top-4 right-4 p-2 bg-red-900/50 text-red-400 rounded-lg"><Trash className="w-4 h-4"/></button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs text-zinc-400 mb-1">Title</label>
                          <input type="text" placeholder="Achievement Title" value={item.title} onChange={e => {
                            const newItems = [...(editingAchievements.items || [])];
                            newItems[idx].title = e.target.value;
                            setEditingAchievements({...editingAchievements, items: newItems});
                          }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Year</label>
                          <input type="text" placeholder="Year" value={item.year} onChange={e => {
                            const newItems = [...(editingAchievements.items || [])];
                            newItems[idx].year = e.target.value;
                            setEditingAchievements({...editingAchievements, items: newItems});
                          }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">External Link (Optional)</label>
                          <input type="url" placeholder="https://..." value={item.link || ''} onChange={e => {
                            const newItems = [...(editingAchievements.items || [])];
                            newItems[idx].link = e.target.value;
                            setEditingAchievements({...editingAchievements, items: newItems});
                          }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Importance (1-5) 5 is highest</label>
                          <input type="number" min="1" max="5" value={item.importance || 3} onChange={e => {
                            const newItems = [...(editingAchievements.items || [])];
                            newItems[idx].importance = parseInt(e.target.value);
                            setEditingAchievements({...editingAchievements, items: newItems});
                          }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Description</label>
                        <textarea placeholder="Description" rows={3} value={item.description} onChange={e => {
                          const newItems = [...(editingAchievements.items || [])];
                          newItems[idx].description = e.target.value;
                          setEditingAchievements({...editingAchievements, items: newItems});
                        }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"></textarea>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-2">Achievement Image</label>
                        {item.image && <img src={item.image} alt="Achievement" className="w-32 h-32 object-cover rounded-xl mb-4 border-2 border-zinc-700" />}
                        <label className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg cursor-pointer transition">
                          Upload Image
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (!e.target.files?.length) return;
                            const file = e.target.files[0];
                            const compressedBlob = await compressImage(file);
                            const base64 = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.onerror = reject;
                              reader.readAsDataURL(compressedBlob);
                            });
                            const newItems = [...(editingAchievements.items || [])];
                            newItems[idx].image = base64;
                            setEditingAchievements({...editingAchievements, items: newItems});
                          }} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800 text-right sticky bottom-4">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition shadow-lg">Save Achievements</button>
              </div>
            </form>
          </div>
        ) : activeTab === 'about' ? (
          <div className="bg-zinc-900 p-8 rounded-2xl max-w-4xl">
            <h2 className="text-2xl font-semibold mb-6">About Page Content</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await updateAbout(editingAbout);
              alert('About page saved!');
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Title</label>
                  <input type="text" value={editingAbout.title || ''} onChange={e => setEditingAbout({...editingAbout, title: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Subtitle</label>
                  <input type="text" value={editingAbout.subtitle || ''} onChange={e => setEditingAbout({...editingAbout, subtitle: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" placeholder="e.g. Designer & Developer" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Cover Image (Full Width)</label>
                {editingAbout.coverImage && <img src={editingAbout.coverImage} alt="Cover" className="w-full h-48 object-cover rounded-xl mb-4 border-2 border-zinc-700" />}
                <label className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg cursor-pointer transition">
                  Upload Cover Image
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    if (!e.target.files?.length) return;
                    const file = e.target.files[0];
                    const compressedBlob = await compressImage(file);
                    const base64 = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.onerror = reject;
                      reader.readAsDataURL(compressedBlob);
                    });
                    setEditingAbout({...editingAbout, coverImage: base64});
                  }} />
                </label>
              </div>

              <hr className="border-zinc-800 my-8" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium">Content Sections</h3>
                <button type="button" onClick={() => setEditingAbout({...editingAbout, sections: [...(editingAbout.sections || []), { title: '', content: '', image: '', facts: [] }]})} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition">Add Section</button>
              </div>
              
              <div className="space-y-8">
                {editingAbout.sections?.map((section: any, idx: number) => (
                  <div key={idx} className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-2xl relative">
                    <button type="button" onClick={() => {
                      setEditingAbout({...editingAbout, sections: editingAbout.sections?.filter((_: any, i: number) => i !== idx)});
                    }} className="absolute top-4 right-4 p-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900/80 transition"><Trash className="w-4 h-4"/></button>
                    
                    <h4 className="text-lg font-medium mb-4">Section {idx + 1}</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Section Title</label>
                        <input type="text" value={section.title || ''} onChange={e => {
                          const newSections = [...(editingAbout.sections || [])];
                          newSections[idx].title = e.target.value;
                          setEditingAbout({...editingAbout, sections: newSections});
                        }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" placeholder="e.g. My Journey" />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Markdown Content</label>
                        <textarea rows={6} value={section.content || ''} onChange={e => {
                          const newSections = [...(editingAbout.sections || [])];
                          newSections[idx].content = e.target.value;
                          setEditingAbout({...editingAbout, sections: newSections});
                        }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" placeholder="Use markdown for formatting..."></textarea>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-2">Section Image</label>
                        {section.image && <img src={section.image} alt="Section" className="w-32 h-32 object-cover rounded-xl mb-4 border-2 border-zinc-700" />}
                        <label className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg cursor-pointer transition">
                          Upload Image
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (!e.target.files?.length) return;
                            const file = e.target.files[0];
                            const compressedBlob = await compressImage(file);
                            const base64 = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.onerror = reject;
                              reader.readAsDataURL(compressedBlob);
                            });
                            const newSections = [...(editingAbout.sections || [])];
                            newSections[idx].image = base64;
                            setEditingAbout({...editingAbout, sections: newSections});
                          }} />
                        </label>
                      </div>
                      
                      <div className="pt-4 border-t border-zinc-700">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm text-zinc-400">Quick Facts (Below Section)</label>
                          <button type="button" onClick={() => {
                            const newSections = [...(editingAbout.sections || [])];
                            newSections[idx].facts = [...(newSections[idx].facts || []), { label: '', value: '' }];
                            setEditingAbout({...editingAbout, sections: newSections});
                          }} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-medium">Add Fact</button>
                        </div>
                        <div className="space-y-2">
                          {section.facts?.map((fact: any, fIdx: number) => (
                            <div key={fIdx} className="flex gap-2">
                              <input type="text" placeholder="Label" value={fact.label} onChange={e => {
                                const newSections = [...(editingAbout.sections || [])];
                                newSections[idx].facts[fIdx].label = e.target.value;
                                setEditingAbout({...editingAbout, sections: newSections});
                              }} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                              <input type="text" placeholder="Value" value={fact.value} onChange={e => {
                                const newSections = [...(editingAbout.sections || [])];
                                newSections[idx].facts[fIdx].value = e.target.value;
                                setEditingAbout({...editingAbout, sections: newSections});
                              }} className="flex-[2] bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                              <button type="button" onClick={() => {
                                const newSections = [...(editingAbout.sections || [])];
                                newSections[idx].facts = newSections[idx].facts.filter((_: any, i: number) => i !== fIdx);
                                setEditingAbout({...editingAbout, sections: newSections});
                              }} className="p-2 bg-red-900/50 text-red-400 rounded-lg"><Trash className="w-4 h-4"/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!editingAbout.sections || editingAbout.sections.length === 0) && (
                  <div className="text-center py-12 bg-zinc-800/20 border border-zinc-800 border-dashed rounded-2xl">
                    <p className="text-zinc-500">No content sections yet. Add one above.</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-zinc-800 text-right sticky bottom-4">
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 rounded-xl hover:bg-blue-500 hover:scale-105 transition-all">Save About Page</button>
              </div>
            </form>
          </div>
        ) : editingProj !== null ? (
          <form onSubmit={saveProject} className="bg-zinc-900 p-8 rounded-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">{editingProj.id ? 'Edit Project' : 'New Project'}</h2>
              <button type="button" onClick={() => setEditingProj(null)} className="text-zinc-400 hover:text-white">Cancel</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Title</label>
                  <input required type="text" value={editingProj.title || ''} onChange={e => setEditingProj({...editingProj, title: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Short Description</label>
                  <input type="text" value={editingProj.description || ''} onChange={e => setEditingProj({...editingProj, description: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Date Started</label>
                    <input type="date" value={editingProj.dateStarted || ''} onChange={e => setEditingProj({...editingProj, dateStarted: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Date Completed</label>
                    <input type="date" value={editingProj.dateCompleted || ''} onChange={e => setEditingProj({...editingProj, dateCompleted: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                  </div>
                </div>

                {/* Custom Buttons */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm text-zinc-400">Custom Buttons</label>
                    <button type="button" onClick={() => setEditingProj({...editingProj, links: [...(editingProj.links || []), { id: crypto.randomUUID(), label: '', url: '' }]})} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">Add Button</button>
                  </div>
                  <div className="space-y-2">
                    {editingProj.links?.map((link, idx) => (
                      <div key={link.id || idx} className="flex gap-2">
                        <input type="text" placeholder="Label (e.g. GitHub)" value={link.label} onChange={e => {
                          const newLinks = [...(editingProj.links || [])];
                          newLinks[idx].label = e.target.value;
                          setEditingProj({...editingProj, links: newLinks});
                        }} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        <input type="url" placeholder="URL" value={link.url} onChange={e => {
                          const newLinks = [...(editingProj.links || [])];
                          newLinks[idx].url = e.target.value;
                          setEditingProj({...editingProj, links: newLinks});
                        }} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        <button type="button" onClick={() => {
                          setEditingProj({...editingProj, links: editingProj.links?.filter((_, i) => i !== idx)});
                        }} className="p-2 bg-red-900/50 text-red-400 rounded-lg"><Trash className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Detailed Description (Markdown)</label>
                  <textarea rows={6} value={editingProj.detailedDescription || ''} onChange={e => setEditingProj({...editingProj, detailedDescription: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"></textarea>
                </div>
              </div>

              <div className="space-y-6">
                {/* Acclaim */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm text-zinc-400">Acclaim</label>
                    <button type="button" onClick={() => setEditingProj({...editingProj, acclaim: [...(editingProj.acclaim || []), '']})} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">Add Acclaim</button>
                  </div>
                  <div className="space-y-2">
                    {editingProj.acclaim?.map((acc, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" placeholder="e.g. Award Winner" value={acc} onChange={e => {
                          const newAcclaim = [...(editingProj.acclaim || [])];
                          newAcclaim[idx] = e.target.value;
                          setEditingProj({...editingProj, acclaim: newAcclaim});
                        }} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        <button type="button" onClick={() => {
                          setEditingProj({...editingProj, acclaim: editingProj.acclaim?.filter((_, i) => i !== idx)});
                        }} className="p-2 bg-red-900/50 text-red-400 rounded-lg"><Trash className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm text-zinc-400">Tools</label>
                    <button type="button" onClick={() => setEditingProj({...editingProj, tools: [...(editingProj.tools || []), '']})} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">Add Tool</button>
                  </div>
                  <div className="space-y-2">
                    {editingProj.tools?.map((tool, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" placeholder="e.g. React" value={tool} onChange={e => {
                          const newTools = [...(editingProj.tools || [])];
                          newTools[idx] = e.target.value;
                          setEditingProj({...editingProj, tools: newTools});
                        }} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        <button type="button" onClick={() => {
                          setEditingProj({...editingProj, tools: editingProj.tools?.filter((_, i) => i !== idx)});
                        }} className="p-2 bg-red-900/50 text-red-400 rounded-lg"><Trash className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm text-zinc-400">Skills</label>
                    <button type="button" onClick={() => setEditingProj({...editingProj, skills: [...(editingProj.skills || []), '']})} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">Add Skill</button>
                  </div>
                  <div className="space-y-2">
                    {editingProj.skills?.map((skill, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" placeholder="e.g. UI Design" value={skill} onChange={e => {
                          const newSkills = [...(editingProj.skills || [])];
                          newSkills[idx] = e.target.value;
                          setEditingProj({...editingProj, skills: newSkills});
                        }} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        <button type="button" onClick={() => {
                          setEditingProj({...editingProj, skills: editingProj.skills?.filter((_, i) => i !== idx)});
                        }} className="p-2 bg-red-900/50 text-red-400 rounded-lg"><Trash className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm text-zinc-400">Tags</label>
                    <button type="button" onClick={() => setEditingProj({...editingProj, tags: [...(editingProj.tags || []), '']})} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">Add Tag</button>
                  </div>
                  <div className="space-y-2">
                    {editingProj.tags?.map((tag, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" placeholder="e.g. Web, Mobile, Design" value={tag} onChange={e => {
                          const newTags = [...(editingProj.tags || [])];
                          newTags[idx] = e.target.value;
                          setEditingProj({...editingProj, tags: newTags});
                        }} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        <button type="button" onClick={() => {
                          setEditingProj({...editingProj, tags: editingProj.tags?.filter((_, i) => i !== idx)});
                        }} className="p-2 bg-red-900/50 text-red-400 rounded-lg"><Trash className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm text-zinc-400">Stats</label>
                    <button type="button" onClick={() => setEditingProj({...editingProj, stats: [...(editingProj.stats || []), { id: crypto.randomUUID(), metric: '', value: '' }]})} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">Add Stat</button>
                  </div>
                  <div className="space-y-2">
                    {editingProj.stats?.map((stat, idx) => (
                      <div key={stat.id || idx} className="flex gap-2">
                        <input type="text" placeholder="Metric (e.g. Users)" value={stat.metric} onChange={e => {
                          const newStats = [...(editingProj.stats || [])];
                          newStats[idx].metric = e.target.value;
                          setEditingProj({...editingProj, stats: newStats});
                        }} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        <input type="text" placeholder="Value (e.g. 10k+)" value={stat.value} onChange={e => {
                          const newStats = [...(editingProj.stats || [])];
                          newStats[idx].value = e.target.value;
                          setEditingProj({...editingProj, stats: newStats});
                        }} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
                        <button type="button" onClick={() => {
                          setEditingProj({...editingProj, stats: editingProj.stats?.filter((_, i) => i !== idx)});
                        }} className="p-2 bg-red-900/50 text-red-400 rounded-lg"><Trash className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Shape</label>
                    <select value={editingProj.shape || 'square'} onChange={e => setEditingProj({...editingProj, shape: e.target.value as any})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500">
                      <option value="square">Square</option>
                      <option value="rect-h">Horizontal Rectangle</option>
                      <option value="rect-v">Vertical Rectangle</option>
                      <option value="circle">Circle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Size</label>
                    <select value={editingProj.size || 'medium'} onChange={e => setEditingProj({...editingProj, size: e.target.value as any})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500">
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Images</label>
                  {uploadError && <div className="text-red-400 text-sm mb-2">{uploadError}</div>}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editingProj.images?.map((url, idx) => (
                      <div key={idx} className="relative group w-24 h-24">
                        <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-zinc-700" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          {idx > 0 && (
                            <button type="button" onClick={() => {
                              const newImages = [...(editingProj.images || [])];
                              [newImages[idx - 1], newImages[idx]] = [newImages[idx], newImages[idx - 1]];
                              setEditingProj({...editingProj, images: newImages});
                            }} className="p-1 bg-zinc-800 text-white rounded hover:bg-zinc-700">&lt;</button>
                          )}
                          <button type="button" onClick={() => setEditingProj({...editingProj, images: editingProj.images?.filter((_, i) => i !== idx)})} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><Trash className="w-3 h-3"/></button>
                          {idx < (editingProj.images?.length || 0) - 1 && (
                            <button type="button" onClick={() => {
                              const newImages = [...(editingProj.images || [])];
                              [newImages[idx + 1], newImages[idx]] = [newImages[idx], newImages[idx + 1]];
                              setEditingProj({...editingProj, images: newImages});
                            }} className="p-1 bg-zinc-800 text-white rounded hover:bg-zinc-700">&gt;</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-zinc-700 rounded-xl hover:border-zinc-500 cursor-pointer transition">
                    <span className="text-sm text-zinc-400">{uploading ? 'Uploading...' : 'Upload Images'}</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800 flex justify-end">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition">Save Project</button>
            </div>
          </form>
        ) : (
          <div>
            <button onClick={() => setEditingProj({})} className="mb-8 flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition">
              <Plus className="w-5 h-5" /> Create Project
            </button>
            
            {projsLoading ? (
              <div className="flex justify-center p-12"><Loader className="w-8 h-8 animate-spin text-zinc-500"/></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(proj => (
                  <div key={proj.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col group">
                    <div className="h-48 bg-zinc-800 relative">
                      {proj.images?.[0] && <img src={proj.images[0]} alt={proj.title} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                        <button onClick={() => setEditingProj(proj)} className="p-3 bg-white text-black rounded-full hover:scale-110 transition"><Edit className="w-5 h-5"/></button>
                        <button onClick={() => deleteProject(proj.id)} className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition"><Trash className="w-5 h-5"/></button>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-xl font-semibold mb-1">{proj.title}</h3>
                      <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{proj.description}</p>
                      <div className="mt-auto flex flex-wrap gap-2">
                        {proj.tools?.map(t => <span key={t} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md">{t}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Delete Project</h3>
            <p className="text-zinc-400 mb-8">Are you sure you want to delete this project? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setProjectToDelete(null)} className="px-4 py-2 text-zinc-300 hover:text-white transition">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
