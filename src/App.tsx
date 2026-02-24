/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  Shield,
  Link as LinkIcon,
  User,
  Lock,
  X,
  Save,
  AlertCircle,
  Building2,
  ChevronRight,
  ArrowRight,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LinkEntry {
  id: string;
  orgId: string;
  label: string;
  url: string;
  username: string;
  password: string;
  createdAt: number;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export default function App() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  
  // Modals
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingLink, setEditingLink] = useState<LinkEntry | null>(null);
  
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [orgFormData, setOrgFormData] = useState({ name: '', description: '' });
  const [linkFormData, setLinkFormData] = useState({ label: '', url: '', username: '', password: '' });

  // Load from localStorage
  useEffect(() => {
    const savedOrgs = localStorage.getItem('linkvault_orgs');
    const savedLinks = localStorage.getItem('linkvault_links');
    if (savedOrgs) setOrganizations(JSON.parse(savedOrgs));
    if (savedLinks) setLinks(JSON.parse(savedLinks));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('linkvault_orgs', JSON.stringify(organizations));
    localStorage.setItem('linkvault_links', JSON.stringify(links));
  }, [organizations, links]);

  const handleAddOrUpdateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgFormData.name) return;

    if (editingOrg) {
      setOrganizations(organizations.map(o => o.id === editingOrg.id ? { ...o, ...orgFormData } : o));
    } else {
      const newOrg: Organization = {
        id: crypto.randomUUID(),
        ...orgFormData,
        createdAt: Date.now()
      };
      setOrganizations([newOrg, ...organizations]);
    }
    closeOrgModal();
  };

  const handleAddOrUpdateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || !linkFormData.label || !linkFormData.url) return;

    if (editingLink) {
      setLinks(links.map(l => l.id === editingLink.id ? { ...l, ...linkFormData } : l));
    } else {
      const newLink: LinkEntry = {
        id: crypto.randomUUID(),
        orgId: activeOrgId,
        ...linkFormData,
        createdAt: Date.now()
      };
      setLinks([newLink, ...links]);
    }
    closeLinkModal();
  };

  const closeOrgModal = () => {
    setIsOrgModalOpen(false);
    setEditingOrg(null);
    setOrgFormData({ name: '', description: '' });
  };

  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    setEditingLink(null);
    setLinkFormData({ label: '', url: '', username: '', password: '' });
  };

  const deleteOrg = (id: string) => {
    if (confirm('Delete this organization and all its links?')) {
      setOrganizations(organizations.filter(o => o.id !== id));
      setLinks(links.filter(l => l.orgId !== id));
      if (activeOrgId === id) setActiveOrgId(null);
    }
  };

  const deleteLink = (id: string) => {
    if (confirm('Delete this link?')) {
      setLinks(links.filter(l => l.id !== id));
    }
  };

  const downloadBackup = () => {
    const data = { organizations, links };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `linkvault_full_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.organizations && json.links) {
          setOrganizations(json.organizations);
          setLinks(json.links);
          alert('Backup restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeOrg = organizations.find(o => o.id === activeOrgId);
  const orgLinks = links.filter(l => l.orgId === activeOrgId);
  const filteredLinks = orgLinks.filter(l => 
    l.label.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
    l.url.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
    l.username.toLowerCase().includes(linkSearchQuery.toLowerCase())
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            {activeOrgId && (
              <button 
                onClick={() => setActiveOrgId(null)}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
                  <Shield size={24} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">LinkVault</h1>
              </div>
              <p className="text-zinc-500 font-medium">
                {activeOrgId ? `Managing links for ${activeOrg?.name}` : 'Organize your credentials by organization.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" title="Import">
              <Upload size={18} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
            <button onClick={downloadBackup} className="btn-secondary" title="Export">
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
            {!activeOrgId ? (
              <button onClick={() => setIsOrgModalOpen(true)} className="btn-primary">
                <Plus size={18} />
                <span>New Organization</span>
              </button>
            ) : (
              <button onClick={() => setIsLinkModalOpen(true)} className="btn-primary">
                <Plus size={18} />
                <span>Add Link</span>
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!activeOrgId ? (
            <motion.div
              key="org-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Org Search */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search organizations..." 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Org Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrgs.length > 0 ? (
                  filteredOrgs.map(org => (
                    <motion.div
                      key={org.id}
                      layout
                      className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                      onClick={() => setActiveOrgId(org.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                          <Building2 size={24} />
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingOrg(org); setOrgFormData({ name: org.name, description: org.description }); setIsOrgModalOpen(true); }}
                            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteOrg(org.id); }}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 mb-1">{org.name}</h3>
                      <p className="text-zinc-500 text-sm line-clamp-2 mb-4">{org.description || 'No description provided.'}</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-50">
                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          {links.filter(l => l.orgId === org.id).length} Links
                        </span>
                        <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <Building2 size={48} className="mx-auto text-zinc-200 mb-4" />
                    <h3 className="text-xl font-semibold text-zinc-900">No organizations yet</h3>
                    <p className="text-zinc-500">Create an organization to start adding links.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="link-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Link Search */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input 
                  type="text" 
                  placeholder={`Search links in ${activeOrg?.name}...`} 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                  value={linkSearchQuery}
                  onChange={(e) => setLinkSearchQuery(e.target.value)}
                />
              </div>

              {/* Vertical Link List */}
              <div className="space-y-4">
                {filteredLinks.length > 0 ? (
                  filteredLinks.map(link => (
                    <motion.div
                      key={link.id}
                      layout
                      className="bg-white p-4 md:p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center gap-6 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-lg text-zinc-900 truncate">{link.label}</h3>
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-md">
                            LINK
                          </span>
                        </div>
                        <p className="text-zinc-400 text-sm truncate max-w-md">{link.url}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 md:gap-8">
                        {/* Credentials */}
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Username</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-700">{link.username}</span>
                              <button onClick={() => copyToClipboard(link.username, `${link.id}-u`)} className="text-zinc-300 hover:text-zinc-900">
                                {copiedId === `${link.id}-u` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Password</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-medium text-zinc-700">
                                {showPasswords[link.id] ? link.password : '••••••••'}
                              </span>
                              <button onClick={() => setShowPasswords(p => ({...p, [link.id]: !p[link.id]}))} className="text-zinc-300 hover:text-zinc-900">
                                {showPasswords[link.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button onClick={() => copyToClipboard(link.password, `${link.id}-p`)} className="text-zinc-300 hover:text-zinc-900">
                                {copiedId === `${link.id}-p` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-auto">
                          <button 
                            onClick={() => { setEditingLink(link); setLinkFormData({ label: link.label, url: link.url, username: link.username, password: link.password }); setIsLinkModalOpen(true); }}
                            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteLink(link.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                          <a 
                            href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 px-4 py-2 bg-zinc-900 text-white rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 font-medium text-sm"
                          >
                            Go <ArrowRight size={16} />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-white rounded-3xl border border-zinc-100">
                    <LinkIcon size={48} className="mx-auto text-zinc-200 mb-4" />
                    <h3 className="text-xl font-semibold text-zinc-900">No links in this organization</h3>
                    <p className="text-zinc-500">Click "Add Link" to populate this list.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Org Modal */}
      <AnimatePresence>
        {isOrgModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeOrgModal} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900">{editingOrg ? 'Edit Organization' : 'New Organization'}</h2>
                <button onClick={closeOrgModal} className="p-2 hover:bg-zinc-100 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddOrUpdateOrg} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Name</label>
                  <input type="text" required placeholder="e.g. Work, Personal, Client X" className="input-field" value={orgFormData.name} onChange={e => setOrgFormData({...orgFormData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Description (Optional)</label>
                  <textarea rows={3} placeholder="What is this organization for?" className="input-field resize-none" value={orgFormData.description} onChange={e => setOrgFormData({...orgFormData, description: e.target.value})} />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeOrgModal} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary"><Save size={18} /> {editingOrg ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Link Modal */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeLinkModal} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900">{editingLink ? 'Edit Link' : 'Add Link'}</h2>
                <button onClick={closeLinkModal} className="p-2 hover:bg-zinc-100 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddOrUpdateLink} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Label</label>
                  <input type="text" required placeholder="e.g. Dashboard, Admin Panel" className="input-field" value={linkFormData.label} onChange={e => setLinkFormData({...linkFormData, label: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">URL</label>
                  <input type="text" required placeholder="e.g. https://example.com" className="input-field" value={linkFormData.url} onChange={e => setLinkFormData({...linkFormData, url: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Username</label>
                    <input type="text" required placeholder="User" className="input-field" value={linkFormData.username} onChange={e => setLinkFormData({...linkFormData, username: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Password</label>
                    <input type="password" required placeholder="••••" className="input-field" value={linkFormData.password} onChange={e => setLinkFormData({...linkFormData, password: e.target.value})} />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeLinkModal} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary"><Save size={18} /> {editingLink ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
