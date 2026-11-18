/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  Shield,
  Link as LinkIcon,
  X,
  Save,
  AlertCircle,
  Building2,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Terminal,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LinkEntry {
  id: string;
  orgId: string;
  label: string;
  url: string;
  username?: string;
  password?: string;
  notes?: string;
  createdAt: number;
}

interface CommandEntry {
  id: string;
  orgId: string;
  label: string;
  command: string;
  notes?: string;
  createdAt: number;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

type OrgTab = 'all' | 'links' | 'commands';

export default function App() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [commands, setCommands] = useState<CommandEntry[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeOrgTab, setActiveOrgTab] = useState<OrgTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  
  // Modals
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingLink, setEditingLink] = useState<LinkEntry | null>(null);
  const [editingCommand, setEditingCommand] = useState<CommandEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ type: 'org' | 'link' | 'command'; id: string; title: string } | null>(null);
  
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [orgFormData, setOrgFormData] = useState({ name: '', description: '' });
  const [linkFormData, setLinkFormData] = useState({ label: '', url: '', username: '', password: '', notes: '', hasCredentials: false });
  const [commandFormData, setCommandFormData] = useState({ label: '', command: '', notes: '' });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(current => (current?.message === message ? null : current));
    }, 3500);
  };

  // Load from localStorage
  useEffect(() => {
    try {
      const savedOrgs = localStorage.getItem('linkvault_orgs');
      const savedLinks = localStorage.getItem('linkvault_links');
      const savedCommands = localStorage.getItem('linkvault_commands');
      if (savedOrgs) setOrganizations(JSON.parse(savedOrgs));
      if (savedLinks) setLinks(JSON.parse(savedLinks));
      if (savedCommands) setCommands(JSON.parse(savedCommands));
    } catch {
      showToast('error', 'Failed to load saved data from browser storage.');
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('linkvault_orgs', JSON.stringify(organizations));
    localStorage.setItem('linkvault_links', JSON.stringify(links));
    localStorage.setItem('linkvault_commands', JSON.stringify(commands));
  }, [organizations, links, commands]);

  const handleAddOrUpdateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgFormData.name.trim()) return;

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
    if (!activeOrgId || !linkFormData.label.trim() || !linkFormData.url.trim()) return;

    const trimmedNotes = linkFormData.notes.trim();
    const dataToSave = {
      label: linkFormData.label.trim(),
      url: linkFormData.url.trim(),
      username: linkFormData.hasCredentials ? linkFormData.username : undefined,
      password: linkFormData.hasCredentials ? linkFormData.password : undefined,
      notes: trimmedNotes ? trimmedNotes : undefined,
    };

    if (editingLink) {
      setLinks(links.map(l => l.id === editingLink.id ? { ...l, ...dataToSave } : l));
    } else {
      const newLink: LinkEntry = {
        id: crypto.randomUUID(),
        orgId: activeOrgId,
        ...dataToSave,
        createdAt: Date.now()
      };
      setLinks([newLink, ...links]);
    }
    closeLinkModal();
  };

  const handleAddOrUpdateCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || !commandFormData.label.trim() || !commandFormData.command.trim()) return;

    const trimmedNotes = commandFormData.notes.trim();
    const dataToSave = {
      label: commandFormData.label.trim(),
      command: commandFormData.command.trim(),
      notes: trimmedNotes ? trimmedNotes : undefined,
    };

    if (editingCommand) {
      setCommands(commands.map(c => c.id === editingCommand.id ? { ...c, ...dataToSave } : c));
    } else {
      const newCommand: CommandEntry = {
        id: crypto.randomUUID(),
        orgId: activeOrgId,
        ...dataToSave,
        createdAt: Date.now()
      };
      setCommands([newCommand, ...commands]);
    }
    closeCommandModal();
  };

  const closeOrgModal = () => {
    setIsOrgModalOpen(false);
    setEditingOrg(null);
    setOrgFormData({ name: '', description: '' });
  };

  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    setEditingLink(null);
    setLinkFormData({ label: '', url: '', username: '', password: '', notes: '', hasCredentials: false });
  };

  const closeCommandModal = () => {
    setIsCommandModalOpen(false);
    setEditingCommand(null);
    setCommandFormData({ label: '', command: '', notes: '' });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    if (type === 'org') {
      setOrganizations(organizations.filter(o => o.id !== id));
      setLinks(links.filter(l => l.orgId !== id));
      setCommands(commands.filter(c => c.orgId !== id));
      if (activeOrgId === id) setActiveOrgId(null);
    } else if (type === 'link') {
      setLinks(links.filter(l => l.id !== id));
    } else if (type === 'command') {
      setCommands(commands.filter(c => c.id !== id));
    }
    setPendingDelete(null);
  };

  const downloadBackup = () => {
    const data = { organizations, links, commands };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `linkvault_full_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast('success', 'Backup exported successfully.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json.organizations) && Array.isArray(json.links)) {
          setOrganizations(json.organizations);
          setLinks(json.links);
          setCommands(Array.isArray(json.commands) ? json.commands : []);
          showToast('success', 'Backup restored successfully!');
        } else {
          showToast('error', 'Invalid backup file format.');
        }
      } catch {
        showToast('error', 'Error parsing JSON file.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const normalizedOrgQuery = searchQuery.trim().toLowerCase();
  const filteredOrgs = organizations.filter(org => {
    if (!normalizedOrgQuery) return true;
    return (
      (org.name ?? '').toLowerCase().includes(normalizedOrgQuery) ||
      (org.description ?? '').toLowerCase().includes(normalizedOrgQuery)
    );
  });

  const activeOrg = organizations.find(o => o.id === activeOrgId);
  const orgLinks = links.filter(l => l.orgId === activeOrgId);
  const orgCommands = commands.filter(c => c.orgId === activeOrgId);

  const normalizedLinkQuery = linkSearchQuery.trim().toLowerCase();
  const filteredLinks = orgLinks.filter(l => {
    if (!normalizedLinkQuery) return true;
    return (
      (l.label ?? '').toLowerCase().includes(normalizedLinkQuery) ||
      (l.url ?? '').toLowerCase().includes(normalizedLinkQuery) ||
      (l.username ?? '').toLowerCase().includes(normalizedLinkQuery) ||
      (l.notes ?? '').toLowerCase().includes(normalizedLinkQuery)
    );
  });

  const filteredCommands = orgCommands.filter(c => {
    if (!normalizedLinkQuery) return true;
    return (
      (c.label ?? '').toLowerCase().includes(normalizedLinkQuery) ||
      (c.command ?? '').toLowerCase().includes(normalizedLinkQuery) ||
      (c.notes ?? '').toLowerCase().includes(normalizedLinkQuery)
    );
  });

  const visibleItems: Array<{ kind: 'link'; item: LinkEntry } | { kind: 'command'; item: CommandEntry }> = [
    ...(activeOrgTab === 'commands' ? [] : filteredLinks.map(item => ({ kind: 'link' as const, item }))),
    ...(activeOrgTab === 'links' ? [] : filteredCommands.map(item => ({ kind: 'command' as const, item }))),
  ].sort((a, b) => b.item.createdAt - a.item.createdAt);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const enterOrganization = (orgId: string) => {
    setActiveOrgId(orgId);
    setLinkSearchQuery('');
    setActiveOrgTab('all');
  };

  const leaveOrganization = () => {
    setActiveOrgId(null);
    setLinkSearchQuery('');
    setActiveOrgTab('all');
  };

  const totalItemsInOrg = orgLinks.length + orgCommands.length;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Toast notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`fixed top-5 right-5 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-zinc-900 text-white border-zinc-800'
                  : 'bg-red-600 text-white border-red-500'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} />}
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            {activeOrgId && (
              <button 
                onClick={leaveOrganization}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
                aria-label="Back to organizations"
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
                {activeOrgId ? `Managing links, commands & notes for ${activeOrg?.name}` : 'Organize your links, commands & notes by organization.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" title="Import JSON backup">
              <Upload size={18} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
            <button onClick={downloadBackup} className="btn-secondary" title="Export JSON backup">
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
            {!activeOrgId ? (
              <button onClick={() => setIsOrgModalOpen(true)} className="btn-primary">
                <Plus size={18} />
                <span>New Organization</span>
              </button>
            ) : (
              <>
                <button onClick={() => setIsCommandModalOpen(true)} className="btn-secondary">
                  <Terminal size={18} />
                  <span>Add Command</span>
                </button>
                <button onClick={() => setIsLinkModalOpen(true)} className="btn-primary">
                  <Plus size={18} />
                  <span>Add Link</span>
                </button>
              </>
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
                  className="w-full pl-12 pr-12 py-4 bg-white border border-zinc-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear organization search"
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Org Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrgs.length > 0 ? (
                  filteredOrgs.map(org => {
                    const orgLinkCount = links.filter(l => l.orgId === org.id).length;
                    const orgCommandCount = commands.filter(c => c.orgId === org.id).length;
                    return (
                      <motion.div
                        key={org.id}
                        layout
                        className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col"
                        onClick={() => enterOrganization(org.id)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                            <Building2 size={24} />
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingOrg(org); setOrgFormData({ name: org.name, description: org.description }); setIsOrgModalOpen(true); }}
                              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                              title="Edit organization"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPendingDelete({ type: 'org', id: org.id, title: org.name }); }}
                              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete organization"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-1">{org.name}</h3>
                        <p className="text-zinc-500 text-sm line-clamp-2 mb-4">{org.description || 'No description provided.'}</p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                          <div className="flex items-center gap-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            <span>{orgLinkCount} {orgLinkCount === 1 ? 'Link' : 'Links'}</span>
                            <span className="text-zinc-300">•</span>
                            <span>{orgCommandCount} {orgCommandCount === 1 ? 'Command' : 'Commands'}</span>
                          </div>
                          <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <Building2 size={48} className="mx-auto text-zinc-200 mb-4" />
                    <h3 className="text-xl font-semibold text-zinc-900">
                      {organizations.length > 0 && normalizedOrgQuery ? 'No matching organizations' : 'No organizations yet'}
                    </h3>
                    <p className="text-zinc-500">
                      {organizations.length > 0 && normalizedOrgQuery
                        ? `No organizations match "${searchQuery}".`
                        : 'Create an organization to start adding links and commands.'}
                    </p>
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
              {/* Search & Filter Tabs */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                  <input 
                    type="text" 
                    placeholder={`Search links, commands, or notes in ${activeOrg?.name}...`} 
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-zinc-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                  />
                  {linkSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLinkSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="inline-flex p-1.5 bg-white border border-zinc-200 rounded-2xl shadow-sm self-start md:self-auto">
                  {([
                    { id: 'all', label: 'All', count: totalItemsInOrg },
                    { id: 'links', label: 'Links', count: orgLinks.length },
                    { id: 'commands', label: 'Commands', count: orgCommands.length },
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveOrgTab(tab.id)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                        activeOrgTab === tab.id
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                        activeOrgTab === tab.id ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Items List */}
              <div className="space-y-4">
                {visibleItems.length > 0 ? (
                  visibleItems.map(entry => {
                    if (entry.kind === 'link') {
                      const link = entry.item;
                      return (
                        <motion.div
                          key={`link-${link.id}`}
                          layout
                          className="bg-white p-4 md:p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-4 group"
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-lg text-zinc-900 truncate">{link.label}</h3>
                                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-widest rounded-md">
                                  LINK
                                </span>
                              </div>
                              <p className="text-zinc-400 text-sm truncate max-w-xl">{link.url}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 md:gap-8">
                              {/* Credentials */}
                              {(link.username || link.password) && (
                                <div className="flex items-center gap-6">
                                  {link.username && (
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Username</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-zinc-700">{link.username}</span>
                                        <button onClick={() => copyToClipboard(link.username!, `${link.id}-u`)} className="text-zinc-300 hover:text-zinc-900">
                                          {copiedId === `${link.id}-u` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  {link.password && (
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Password</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono font-medium text-zinc-700">
                                          {showPasswords[link.id] ? link.password : '••••••••'}
                                        </span>
                                        <button onClick={() => setShowPasswords(p => ({...p, [link.id]: !p[link.id]}))} className="text-zinc-300 hover:text-zinc-900">
                                          {showPasswords[link.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                        <button onClick={() => copyToClipboard(link.password!, `${link.id}-p`)} className="text-zinc-300 hover:text-zinc-900">
                                          {copiedId === `${link.id}-p` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-2 ml-auto">
                                <button 
                                  onClick={() => { 
                                    setEditingLink(link); 
                                    setLinkFormData({ 
                                      label: link.label, 
                                      url: link.url, 
                                      username: link.username || '', 
                                      password: link.password || '',
                                      notes: link.notes || '',
                                      hasCredentials: !!(link.username || link.password)
                                    }); 
                                    setIsLinkModalOpen(true); 
                                  }}
                                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                                  title="Edit link"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button 
                                  onClick={() => setPendingDelete({ type: 'link', id: link.id, title: link.label })}
                                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Delete link"
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
                          </div>

                          {link.notes && (
                            <div className="flex items-start gap-2.5 bg-zinc-50 border border-zinc-100 rounded-xl px-3.5 py-2.5 text-sm text-zinc-600">
                              <FileText size={15} className="text-zinc-400 mt-0.5 shrink-0" />
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{link.notes}</p>
                            </div>
                          )}
                        </motion.div>
                      );
                    }

                    const cmd = entry.item;
                    return (
                      <motion.div
                        key={`cmd-${cmd.id}`}
                        layout
                        className="bg-white p-4 md:p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-3.5 group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <Terminal size={16} />
                            </div>
                            <h3 className="font-bold text-lg text-zinc-900 truncate">{cmd.label}</h3>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-md shrink-0">
                              COMMAND
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button 
                              onClick={() => { 
                                setEditingCommand(cmd); 
                                setCommandFormData({ 
                                  label: cmd.label, 
                                  command: cmd.command, 
                                  notes: cmd.notes || ''
                                }); 
                                setIsCommandModalOpen(true); 
                              }}
                              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                              title="Edit command"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button 
                              onClick={() => setPendingDelete({ type: 'command', id: cmd.id, title: cmd.label })}
                              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete command"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(cmd.command, `cmd-${cmd.id}`)}
                              className="ml-2 px-4 py-2 bg-zinc-900 text-white rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 font-medium text-sm"
                            >
                              {copiedId === `cmd-${cmd.id}` ? (
                                <>
                                  <Check size={16} className="text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={16} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <pre className="bg-zinc-950 text-zinc-100 font-mono text-sm rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed border border-zinc-800">
                          {cmd.command}
                        </pre>

                        {cmd.notes && (
                          <div className="flex items-start gap-2.5 bg-zinc-50 border border-zinc-100 rounded-xl px-3.5 py-2.5 text-sm text-zinc-600">
                            <FileText size={15} className="text-zinc-400 mt-0.5 shrink-0" />
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{cmd.notes}</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center bg-white rounded-3xl border border-zinc-100">
                    {totalItemsInOrg > 0 && normalizedLinkQuery ? (
                      <>
                        <Search size={48} className="mx-auto text-zinc-200 mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-900">No matching items</h3>
                        <p className="text-zinc-500 mb-4">Nothing in {activeOrg?.name} matches "{linkSearchQuery}".</p>
                        <button
                          type="button"
                          onClick={() => setLinkSearchQuery('')}
                          className="btn-secondary mx-auto"
                        >
                          Clear search
                        </button>
                      </>
                    ) : activeOrgTab === 'commands' ? (
                      <>
                        <Terminal size={48} className="mx-auto text-zinc-200 mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-900">No commands in this organization</h3>
                        <p className="text-zinc-500 mb-5">Save terminal snippets, CLI commands, and notes here.</p>
                        <button onClick={() => setIsCommandModalOpen(true)} className="btn-primary mx-auto">
                          <Terminal size={18} />
                          <span>Add Command</span>
                        </button>
                      </>
                    ) : activeOrgTab === 'links' ? (
                      <>
                        <LinkIcon size={48} className="mx-auto text-zinc-200 mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-900">No links in this organization</h3>
                        <p className="text-zinc-500 mb-5">Click "Add Link" to populate this list.</p>
                        <button onClick={() => setIsLinkModalOpen(true)} className="btn-primary mx-auto">
                          <Plus size={18} />
                          <span>Add Link</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <LinkIcon size={48} className="mx-auto text-zinc-200 mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-900">Nothing in this organization yet</h3>
                        <p className="text-zinc-500 mb-5">Add links, commands, and notes to organize your workflow.</p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <button onClick={() => setIsCommandModalOpen(true)} className="btn-secondary">
                            <Terminal size={18} />
                            <span>Add Command</span>
                          </button>
                          <button onClick={() => setIsLinkModalOpen(true)} className="btn-primary">
                            <Plus size={18} />
                            <span>Add Link</span>
                          </button>
                        </div>
                      </>
                    )}
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-zinc-900">{editingLink ? 'Edit Link' : 'Add Link'}</h2>
                <button onClick={closeLinkModal} className="p-2 hover:bg-zinc-100 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddOrUpdateLink} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Label</label>
                  <input type="text" required placeholder="e.g. Dashboard, Admin Panel" className="input-field" value={linkFormData.label} onChange={e => setLinkFormData({...linkFormData, label: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">URL</label>
                  <input type="text" required placeholder="e.g. https://example.com" className="input-field" value={linkFormData.url} onChange={e => setLinkFormData({...linkFormData, url: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Notes (Optional)</label>
                  <textarea rows={3} placeholder="Add helpful context, environment details, or reminders..." className="input-field resize-y" value={linkFormData.notes} onChange={e => setLinkFormData({...linkFormData, notes: e.target.value})} />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-700">Include Credentials</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLinkFormData(prev => ({ ...prev, hasCredentials: !prev.hasCredentials }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${linkFormData.hasCredentials ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${linkFormData.hasCredentials ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {linkFormData.hasCredentials && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4 overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Username</label>
                      <input type="text" required={linkFormData.hasCredentials} placeholder="User" className="input-field" value={linkFormData.username} onChange={e => setLinkFormData({...linkFormData, username: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Password</label>
                      <input type="password" required={linkFormData.hasCredentials} placeholder="••••" className="input-field" value={linkFormData.password} onChange={e => setLinkFormData({...linkFormData, password: e.target.value})} />
                    </div>
                  </motion.div>
                )}
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeLinkModal} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary"><Save size={18} /> {editingLink ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Command Modal */}
      <AnimatePresence>
        {isCommandModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCommandModal} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Terminal size={16} />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">{editingCommand ? 'Edit Command' : 'Add Command'}</h2>
                </div>
                <button onClick={closeCommandModal} className="p-2 hover:bg-zinc-100 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddOrUpdateCommand} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Label</label>
                  <input type="text" required placeholder="e.g. Deploy Production, Tail Logs" className="input-field" value={commandFormData.label} onChange={e => setCommandFormData({...commandFormData, label: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Command</label>
                  <textarea rows={3} required placeholder="e.g. kubectl logs -f deployment/api" className="input-field font-mono text-sm resize-y" value={commandFormData.command} onChange={e => setCommandFormData({...commandFormData, command: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Notes (Optional)</label>
                  <textarea rows={3} placeholder="Explain flags, prerequisites, or when to run this command..." className="input-field resize-y" value={commandFormData.notes} onChange={e => setCommandFormData({...commandFormData, notes: e.target.value})} />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeCommandModal} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary"><Save size={18} /> {editingCommand ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {pendingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPendingDelete(null)} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6">
              <h3 className="text-lg font-bold text-zinc-900 mb-2">
                Delete {pendingDelete.type === 'org' ? 'Organization' : pendingDelete.type === 'command' ? 'Command' : 'Link'}?
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                {pendingDelete.type === 'org'
                  ? `Are you sure you want to delete "${pendingDelete.title}" and all its links and commands?`
                  : `Are you sure you want to delete "${pendingDelete.title}"?`}
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPendingDelete(null)} className="flex-1 btn-secondary">Cancel</button>
                <button type="button" onClick={confirmDelete} className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-95 transition-all font-medium">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
