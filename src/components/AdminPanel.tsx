import React, { useState, useEffect } from 'react';
import { User, Notification, AuditLog } from '../types';
import { apiClient } from '../api/client';
import { 
  Shield, Users, ClipboardList, Plus, Trash2, Edit2, Check, X, Search, UserPlus, Bell, ShieldAlert, Key, CreditCard, Activity, ArrowRight, Mail
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  onRefreshAll: () => void;
}

export default function AdminPanel({ currentUser, onRefreshAll }: AdminPanelProps) {
  const [subTab, setSubTab] = useState<'users' | 'notifications' | 'logs'>('users');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states (Users)
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'MANGAKA' | 'EDITOR' | 'BOARD_MEMBER' | 'ASSISTANT' | 'ADMIN'>('ASSISTANT');
  const [formPassword, setFormPassword] = useState('');
  
  // Bank account details
  const [formBankName, setFormBankName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formCardholder, setFormCardholder] = useState('');

  // Form states (Notifications)
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [notifUserId, setNotifUserId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifType, setNotifType] = useState<'INFO' | 'WARNING' | 'ERROR'>('INFO');
  
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.users.getAll();
      setUsersList(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const data = await apiClient.notifications.adminGetAll();
      setNotificationsList(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch system-wide notifications', 'error');
      setNotificationsList([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const mockAuditLogs: AuditLog[] = [
    { _id: '1', timestamp: '2026-06-29 10:15:32', user: 'Takeshi (Mangaka)', action: 'Uploaded Storyboard', target: 'Ninja Chronicles Chapter 1 Proposal' },
    { _id: '2', timestamp: '2026-06-29 11:02:11', user: 'Hiroshi (Editor)', action: 'Forwarded to Board', target: 'Ninja Chronicles Proposal' },
    { _id: '3', timestamp: '2026-06-29 12:45:00', user: 'Kenji (Board)', action: 'Assigned Required Voters', target: 'Ninja Chronicles Submission' },
    { _id: '4', timestamp: '2026-06-29 13:20:15', user: 'Kenji (Board)', action: 'Cast Vote: ACCEPT', target: 'Ninja Chronicles Pitch' },
    { _id: '5', timestamp: '2026-06-29 14:05:44', user: 'Kenji Sato (Assistant)', action: 'Submitted Work Page 3', target: 'Ninja Chronicles Ch 1 Background' }
  ];

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await apiClient.auditLogs.getAll();
      setAuditLogsList(data);
    } catch (err: any) {
      showToast('Could not reach Audit API. Using local mock logs.', 'warning');
      setAuditLogsList(mockAuditLogs);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
    fetchAuditLogs();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || (!editingUserId && !formPassword)) {
      showToast('Please fill out all required fields', 'warning');
      return;
    }

    try {
      if (editingUserId) {
        await apiClient.users.update(editingUserId, {
          name: formName,
          email: formEmail,
          role: formRole,
          bankName: formBankName,
          accountNumber: formAccountNumber,
          cardholder: formCardholder
        });
        showToast('User updated successfully!');
      } else {
        await apiClient.users.create({
          name: formName,
          email: formEmail,
          role: formRole,
          password: formPassword,
          bankName: formBankName,
          accountNumber: formAccountNumber,
          cardholder: formCardholder
        });
        showToast('User created successfully!');
      }
      resetForm();
      fetchUsers();
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser._id) {
      showToast('Cannot delete yourself', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.users.delete(userId);
      showToast('User deleted successfully.');
      fetchUsers();
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    if (userId === currentUser._id) {
      showToast('Cannot deactivate yourself', 'error');
      return;
    }
    try {
      await apiClient.users.toggleStatus(userId);
      showToast('User status toggled successfully.');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifUserId || !notifTitle || !notifContent) {
      showToast('Please fill out all required fields', 'warning');
      return;
    }
    try {
      await apiClient.notifications.create(notifUserId, notifTitle, notifContent, notifType);
      showToast('Notification sent successfully!');
      setShowNotifForm(false);
      setNotifUserId('');
      setNotifTitle('');
      setNotifContent('');
      setNotifType('INFO');
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to send notification', 'error');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await apiClient.notifications.delete(id);
      showToast('Notification deleted successfully.');
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete notification', 'error');
    }
  };

  const startEdit = (user: User) => {
    setEditingUserId(user._id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role as any);
    setFormPassword('');
    setFormBankName(user.bankName || '');
    setFormAccountNumber(user.accountNumber || '');
    setFormCardholder(user.cardholder || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormRole('ASSISTANT');
    setFormPassword('');
    setFormBankName('');
    setFormAccountNumber('');
    setFormCardholder('');
    setShowForm(false);
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] min-h-[600px] bg-gradient-to-br from-[#0f1015] to-[#1a1b26] border border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl overflow-hidden relative">
      
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Tab Header */}
      <header className="flex items-center justify-between px-6 py-5 bg-white/5 backdrop-blur-md border-b border-white/10 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 leading-none">
              Nexus Command Center
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              Admin &amp; Security Controls
            </p>
          </div>
        </div>

        <div className="flex gap-2 bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/5">
          {[
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'notifications', icon: Bell, label: 'Alerts' },
            { id: 'logs', icon: Activity, label: 'Audit' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all duration-300 flex items-center gap-2 ${
                subTab === tab.id 
                  ? 'bg-gradient-to-r from-indigo-500/20 to-rose-500/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-white/10' 
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
        {toast && (
          <div className="absolute top-4 right-6 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`px-6 py-4 rounded-xl text-xs font-bold border shadow-2xl backdrop-blur-xl flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-slate-900/90 border-emerald-500/50 text-emerald-400 shadow-[0_10px_40px_rgba(16,185,129,0.2)]' 
                : toast.type === 'warning'
                ? 'bg-slate-900/90 border-amber-500/50 text-amber-400 shadow-[0_10px_40px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/90 border-rose-500/50 text-rose-400 shadow-[0_10px_40px_rgba(244,63,94,0.2)]'
            }`}>
              {toast.type === 'success' ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {toast.msg}
            </div>
          </div>
        )}

        {subTab === 'users' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Users list */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-6 shrink-0">
                <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-4 top-3 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search agents by name, email or clearance..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-600 transition-all shadow-inner"
                  />
                </div>
                <button 
                  onClick={() => { resetForm(); setShowForm(true); }}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> Enlist User
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-500">
                    <Activity className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-xs font-bold uppercase tracking-widest">Decrypting User Data...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-600">
                    <Users className="w-12 h-12 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No matching operatives found.</p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div key={user._id} className="group flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] rounded-2xl transition-all duration-300 shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                      <div className="flex gap-4 items-center">
                        {/* Avatar placeholder */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                          <span className="text-sm font-black text-slate-400">{user.name.charAt(0)}</span>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-bold text-slate-200 group-hover:text-white transition-colors">{user.name}</h4>
                            <div className="flex gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm ${
                                user.role === 'ADMIN' 
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-900/20' 
                                  : user.role === 'BOARD_MEMBER' 
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-900/20'
                                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-indigo-900/20'
                              }`}>
                                {user.role.replace('_', ' ')}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm ${
                                user.isActive !== false
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-900/20'
                                  : 'bg-slate-500/10 border-slate-500/30 text-slate-400 shadow-slate-900/20'
                              }`}>
                                {user.isActive !== false ? 'ONLINE' : 'OFFLINE'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-1.5">
                            <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail className="w-3 h-3" /> {user.email}</p>
                            {user.role === 'ASSISTANT' && user.bankName && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded border border-white/5">
                                <CreditCard className="w-3 h-3 text-indigo-400" />
                                {user.bankName} • {user.accountNumber?.slice(-4)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center opacity-70 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleToggleStatus(user._id)}
                          className={`px-3 py-1.5 rounded-lg border backdrop-blur-md transition-all cursor-pointer text-[10px] font-bold uppercase flex items-center gap-1.5 ${
                            user.isActive !== false 
                              ? 'bg-amber-500/5 hover:bg-amber-500/20 text-amber-500 border-amber-500/20' 
                              : 'bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                          }`}
                          title={user.isActive !== false ? "Suspend Access" : "Restore Access"}
                        >
                          <ShieldAlert className="w-3 h-3" />
                          {user.isActive !== false ? "Suspend" : "Restore"}
                        </button>
                        <button 
                          onClick={() => startEdit(user)}
                          className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer shadow-sm"
                          title="Modify Clearance"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user._id)}
                          className="p-2 bg-rose-500/5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer shadow-sm"
                          title="Terminate Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ingestion/CRUD form panel */}
            <aside className={`w-[360px] border-l border-white/10 bg-black/40 backdrop-blur-2xl p-6 overflow-y-auto flex flex-col justify-between shrink-0 transition-all duration-500 ease-in-out absolute right-0 top-0 bottom-0 z-20 ${showForm ? 'translate-x-0 opacity-100 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]' : 'translate-x-full opacity-0'}`}>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-400" />
                    {editingUserId ? 'Modify Operative' : 'New Operative'}
                  </h3>
                  <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. Kenji Sato"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secure Comms (Email)</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="e.g. kenji@nexus.io"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clearance Level (Role)</label>
                    <select
                      value={formRole}
                      onChange={e => setFormRole(e.target.value as any)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none"
                    >
                      <option value="MANGAKA">MANGAKA (Creator)</option>
                      <option value="EDITOR">EDITOR (Reviewer)</option>
                      <option value="BOARD_MEMBER">BOARD MEMBER (Executive)</option>
                      <option value="ASSISTANT">ASSISTANT (Staff)</option>
                      <option value="ADMIN">ADMIN (Root)</option>
                    </select>
                  </div>

                  {!editingUserId && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Passkey</label>
                      <input
                        type="password"
                        value={formPassword}
                        onChange={e => setFormPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono tracking-widest"
                        required
                      />
                    </div>
                  )}

                  {formRole === 'ASSISTANT' && (
                    <div className="space-y-4 pt-4 mt-2 border-t border-white/10">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5" /> Payroll Directives
                      </h4>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Institution</label>
                        <input
                          type="text"
                          value={formBankName}
                          onChange={e => setFormBankName(e.target.value)}
                          placeholder="e.g. MB Bank, Vietcombank"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Cipher</label>
                        <input
                          type="text"
                          value={formAccountNumber}
                          onChange={e => setFormAccountNumber(e.target.value)}
                          placeholder="e.g. 190284792389"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Beneficiary Name</label>
                        <input
                          type="text"
                          value={formCardholder}
                          onChange={e => setFormCardholder(e.target.value)}
                          placeholder="e.g. NGUYEN VAN A"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all uppercase"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-6">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-all shadow-sm"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Execute
                    </button>
                  </div>
                </form>
              </div>
            </aside>
          </div>
        ) : subTab === 'notifications' ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col p-6 overflow-hidden relative">
              <div className="flex items-center justify-between gap-4 mb-6 shrink-0 z-10">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" /> Comm Broadcasts
                </h3>
                <button 
                  onClick={() => setShowNotifForm(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" /> Dispatch Alert
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent z-10">
                {loadingNotifications ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-500">
                    <Activity className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-xs font-bold uppercase tracking-widest">Scanning Comms...</p>
                  </div>
                ) : notificationsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-600">
                    <Bell className="w-12 h-12 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Comm logs are silent.</p>
                  </div>
                ) : (
                  notificationsList.map(notif => {
                    const recipientId = notif.userId && typeof notif.userId === 'object' ? notif.userId._id : notif.userId;
                    const recipient = usersList.find(u => u._id === recipientId) || 
                      (notif.userId && typeof notif.userId === 'object' ? notif.userId : null);
                    return (
                      <div key={notif._id} className="group flex items-start justify-between p-5 bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] rounded-2xl transition-all duration-300 shadow-sm relative overflow-hidden">
                        
                        {/* Status color indicator line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          notif.type === 'ERROR' ? 'bg-rose-500' :
                          notif.type === 'WARNING' ? 'bg-amber-500' :
                          'bg-indigo-500'
                        }`} />

                        <div className="flex-1 pl-3">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-base font-bold text-slate-200">{notif.title}</h4>
                            <div className="flex gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm ${
                                notif.type === 'ERROR' 
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                                  : notif.type === 'WARNING' 
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                              }`}>
                                {notif.type}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm ${
                                notif.isRead 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : 'bg-white/5 border-white/10 text-slate-400'
                              }`}>
                                {notif.isRead ? 'Acknowledged' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">{notif.content}</p>
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                              <Users className="w-3 h-3" /> Target: {recipient ? <strong className="text-slate-300">{recipient.name} ({recipient.role})</strong> : <span className="font-mono">{String(notif.userId || '')}</span>}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                              <Activity className="w-3 h-3" /> Timestamp: <span className="text-slate-300">{new Date(notif.createdAt || Date.now()).toLocaleString()}</span>
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 ml-4 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDeleteNotification(notif._id)}
                            className="p-2.5 bg-rose-500/5 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-colors shadow-sm"
                            title="Scrub Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notification Form Panel */}
            <aside className={`w-[400px] border-l border-white/10 bg-black/40 backdrop-blur-2xl p-6 overflow-y-auto flex flex-col justify-between shrink-0 transition-all duration-500 ease-in-out absolute right-0 top-0 bottom-0 z-20 ${showNotifForm ? 'translate-x-0 opacity-100 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]' : 'translate-x-full opacity-0'}`}>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-400" /> Dispatch Alert
                  </h3>
                  <button onClick={() => setShowNotifForm(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateNotification} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Operative</label>
                    <select
                      value={notifUserId}
                      onChange={e => setNotifUserId(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-pointer"
                      required
                    >
                      <option value="">-- Select Target --</option>
                      {usersList.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.role.replace('_',' ')})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alert Designation (Title)</label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={e => setNotifTitle(e.target.value)}
                      placeholder="e.g. Protocol Update v2.1"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['INFO', 'WARNING', 'ERROR'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNotifType(type)}
                          className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                            notifType === type 
                              ? type === 'ERROR' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                              : type === 'WARNING' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                              : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                              : 'bg-black/30 border-white/5 text-slate-500 hover:bg-white/5'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payload Content</label>
                    <textarea
                      value={notifContent}
                      onChange={e => setNotifContent(e.target.value)}
                      placeholder="Enter briefing details..."
                      rows={5}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-5 h-5" /> Broadcast Now
                    </button>
                  </div>
                </form>
              </div>
            </aside>
          </div>
        ) : (
          /* Audit logs grid view */
          <div className="flex-1 p-6 flex flex-col overflow-hidden relative z-10">
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Global Telemetry Logs</h3>
            </div>
            
            <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-inner backdrop-blur-sm">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-black/40 border-b border-white/10 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                <div className="col-span-3">Timestamp</div>
                <div className="col-span-3">Operative</div>
                <div className="col-span-3">Action Executed</div>
                <div className="col-span-3">Target Node</div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 font-mono text-xs scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {loadingLogs ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-500">
                    <Activity className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-xs font-bold uppercase tracking-widest font-sans">Compiling Telemetry...</p>
                  </div>
                ) : auditLogsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-600">
                    <ClipboardList className="w-12 h-12 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest font-sans">Telemetry logs empty.</p>
                  </div>
                ) : (
                  auditLogsList.map((log, i) => (
                    <div key={log._id || i} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors items-center">
                      <div className="col-span-3 text-slate-500 tracking-tight">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : log.timestamp}
                      </div>
                      <div className="col-span-3">
                        <span className="bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20 shadow-sm font-semibold truncate block w-max max-w-full">
                          {log.userName || 
                            (log.userId && typeof log.userId === 'object' && 'name' in log.userId ? (log.userId as any).name : '') || 
                            (log.user 
                              ? typeof log.user === 'object'
                                ? (log.user as User).name
                                : String(log.user)
                              : 'Unknown Ghost')}
                        </span>
                      </div>
                      <div className="col-span-3 text-emerald-400 font-bold tracking-tight">
                        &gt; {log.action}
                      </div>
                      <div className="col-span-3 text-slate-400 truncate">
                        {log.target}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
