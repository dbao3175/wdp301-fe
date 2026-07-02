import React, { useState, useEffect } from 'react';
import { User, Notification, AuditLog } from '../types';
import { apiClient } from '../api/client';
import { 
  Shield, Users, ClipboardList, Plus, Trash2, Edit2, Check, X, Search, UserPlus, Bell
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
  
  // Bank account details (only for Assistants but editable)
  const [formBankName, setFormBankName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formCardholder, setFormCardholder] = useState('');

  // Form states (Notifications)
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [notifUserId, setNotifUserId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifType, setNotifType] = useState<'INFO' | 'WARNING' | 'ERROR'>('INFO');
  
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
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
      console.warn('Failed to fetch system-wide notifications, using empty array:', err);
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
      console.warn('Failed to fetch real audit logs, using mock logs:', err);
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
      showToast('Please fill out all required fields', 'error');
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
      showToast('Please fill out all required fields', 'error');
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
    <div className="flex flex-col h-[calc(100vh-6rem)] min-h-[600px] bg-[#121214] border border-[#2d2d34] shadow-2xl rounded-md overflow-hidden">
      {/* Tab Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#181820] border-b border-[#2d2d34] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-red-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Admin Control Panel</h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Manage platform users, send notifications &amp; inspect logs</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setSubTab('users')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all flex items-center gap-1.5 border ${
              subTab === 'users' 
                ? 'bg-white text-black border-white' 
                : 'bg-transparent text-slate-400 border-[#2d2d34] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Users
          </button>
          <button 
            onClick={() => setSubTab('notifications')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all flex items-center gap-1.5 border ${
              subTab === 'notifications' 
                ? 'bg-white text-black border-white' 
                : 'bg-transparent text-slate-400 border-[#2d2d34] hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Notifications
          </button>
          <button 
            onClick={() => setSubTab('logs')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all flex items-center gap-1.5 border ${
              subTab === 'logs' 
                ? 'bg-white text-black border-white' 
                : 'bg-transparent text-slate-400 border-[#2d2d34] hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" /> Audit Logs
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {toast && (
          <div className="absolute top-4 right-6 z-50">
            <div className={`px-4 py-2.5 rounded-md text-xs font-bold border ${
              toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {toast.msg}
            </div>
          </div>
        )}

        {subTab === 'users' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Users grid list */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email or role..."
                    className="w-full bg-[#1e1e24] border border-[#2d2d34] rounded-md pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-slate-500 placeholder:text-slate-600"
                  />
                </div>
                {!showForm && (
                  <button 
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="px-3 py-2 bg-white hover:bg-slate-200 text-black text-xs font-bold uppercase rounded-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add User
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {loading ? (
                  <p className="text-xs text-slate-500 text-center py-8">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No users found match criteria.</p>
                ) : (
                  filteredUsers.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-4 bg-[#1e1e24] border border-[#2d2d34] hover:border-slate-500 rounded-md transition-all">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {user.name}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono border font-black uppercase ${
                            user.role === 'ADMIN' 
                              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                              : user.role === 'BOARD_MEMBER' 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-[#2d2d34] border-[#3a3a44] text-slate-300'
                          }`}>
                            {user.role}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono border font-black uppercase ${
                            user.isActive !== false
                              ? 'bg-green-500/10 border-green-500/30 text-green-400'
                              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                          }`}>
                            {user.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                        {user.role === 'ASSISTANT' && user.bankName && (
                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                            Bank: {user.bankName} | Acc: {user.accountNumber} | Cardholder: {user.cardholder}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 items-center">
                        <button 
                          onClick={() => handleToggleStatus(user._id)}
                          className={`px-2 py-1 bg-[#121214] rounded border border-[#2d2d34] transition-colors cursor-pointer text-[10px] font-bold uppercase ${
                            user.isActive !== false ? 'hover:bg-yellow-950/20 text-yellow-500 border-yellow-500/20' : 'hover:bg-green-950/20 text-green-500 border-green-500/20'
                          }`}
                          title={user.isActive !== false ? "Deactivate User" : "Activate User"}
                        >
                          {user.isActive !== false ? "Deactivate" : "Activate"}
                        </button>
                        <button 
                          onClick={() => startEdit(user)}
                          className="p-2 bg-[#121214] hover:bg-[#2d2d34] text-slate-400 hover:text-white rounded border border-[#2d2d34] transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user._id)}
                          className="p-2 bg-[#121214] hover:bg-red-950/20 text-slate-400 hover:text-red-400 rounded border border-[#2d2d34] hover:border-red-500/30 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ingestion/CRUD form panel */}
            {showForm && (
              <aside className="w-80 border-l border-[#2d2d34] bg-[#1e1e24] p-5 overflow-y-auto flex flex-col justify-between shrink-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {editingUserId ? 'Edit Account' : 'Create Account'}
                    </h3>
                    <button onClick={resetForm} className="p-1 rounded hover:bg-[#2d2d34]">
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateOrUpdate} className="space-y-3.5">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="e.g. Kenji Sato"
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        placeholder="e.g. kenji@studio.com"
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Account Role</label>
                      <select
                        value={formRole}
                        onChange={e => setFormRole(e.target.value as any)}
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-500 cursor-pointer"
                      >
                        <option value="MANGAKA">MANGAKA</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="BOARD_MEMBER">BOARD MEMBER</option>
                        <option value="ASSISTANT">ASSISTANT</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>

                    {!editingUserId && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Initial Password</label>
                        <input
                          type="password"
                          value={formPassword}
                          onChange={e => setFormPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500"
                          required
                        />
                      </div>
                    )}

                    {formRole === 'ASSISTANT' && (
                      <div className="space-y-3 pt-3 border-t border-[#2d2d34]">
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Bank Payment Details</h4>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={formBankName}
                            onChange={e => setFormBankName(e.target.value)}
                            placeholder="e.g. MB Bank, Vietcombank"
                            className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Account Number</label>
                          <input
                            type="text"
                            value={formAccountNumber}
                            onChange={e => setFormAccountNumber(e.target.value)}
                            placeholder="e.g. 190284792389"
                            className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Cardholder Name</label>
                          <input
                            type="text"
                            value={formCardholder}
                            onChange={e => setFormCardholder(e.target.value)}
                            placeholder="e.g. NGUYEN VAN A"
                            className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500 uppercase"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 py-2 text-[10px] font-bold uppercase rounded border border-[#2d2d34] text-slate-400 hover:bg-[#2d2d34] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase rounded transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </aside>
            )}
          </div>
        ) : subTab === 'notifications' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Notifications grid list */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">System Notifications</h3>
                {!showNotifForm && (
                  <button 
                    onClick={() => setShowNotifForm(true)}
                    className="px-3 py-2 bg-white hover:bg-slate-200 text-black text-xs font-bold uppercase rounded-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Send Notification
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {loadingNotifications ? (
                  <p className="text-xs text-slate-500 text-center py-8">Loading notifications...</p>
                ) : notificationsList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No notifications sent yet.</p>
                ) : (
                  notificationsList.map(notif => {
                    const recipient = usersList.find(u => u._id === notif.userId);
                    return (
                      <div key={notif._id} className="flex items-center justify-between p-4 bg-[#1e1e24] border border-[#2d2d34] hover:border-slate-500 rounded-md transition-all">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono border font-black uppercase ${
                              notif.type === 'ERROR' 
                                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                : notif.type === 'WARNING' 
                                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            }`}>
                              {notif.type}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono border font-black uppercase ${
                              notif.isRead 
                                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                                : 'bg-[#2d2d34] border-[#3a3a44] text-slate-300'
                            }`}>
                              {notif.isRead ? 'Read' : 'Unread'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{notif.content}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            Recipient: {recipient ? `${recipient.name} (${recipient.email})` : notif.userId} | Sent: {new Date(notif.createdAt || Date.now()).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex gap-2 shrink-0 ml-4">
                          <button 
                            onClick={() => handleDeleteNotification(notif._id)}
                            className="p-2 bg-[#121214] hover:bg-red-950/20 text-slate-400 hover:text-red-400 rounded border border-[#2d2d34] hover:border-red-500/30 transition-colors cursor-pointer"
                            title="Delete Notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {showNotifForm && (
              <aside className="w-80 border-l border-[#2d2d34] bg-[#1e1e24] p-5 overflow-y-auto flex flex-col justify-between shrink-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Send Notification</h3>
                    <button onClick={() => setShowNotifForm(false)} className="p-1 rounded hover:bg-[#2d2d34]">
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateNotification} className="space-y-3.5">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Recipient User</label>
                      <select
                        value={notifUserId}
                        onChange={e => setNotifUserId(e.target.value)}
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-500 cursor-pointer"
                        required
                      >
                        <option value="">-- Select Recipient --</option>
                        {usersList.map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Title</label>
                      <input
                        type="text"
                        value={notifTitle}
                        onChange={e => setNotifTitle(e.target.value)}
                        placeholder="Notification Title"
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Type</label>
                      <select
                        value={notifType}
                        onChange={e => setNotifType(e.target.value as any)}
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-500 cursor-pointer"
                      >
                        <option value="INFO">INFO</option>
                        <option value="WARNING">WARNING</option>
                        <option value="ERROR">ERROR</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Content Message</label>
                      <textarea
                        value={notifContent}
                        onChange={e => setNotifContent(e.target.value)}
                        placeholder="Type notification message here..."
                        rows={4}
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-500 resize-none"
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNotifForm(false)}
                        className="flex-1 py-2 text-[10px] font-bold uppercase rounded border border-[#2d2d34] text-slate-400 hover:bg-[#2d2d34] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase rounded transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </aside>
            )}
          </div>
        ) : (
          /* Audit logs grid view */
          <div className="flex-1 p-6 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">System Actions Log</h3>
            <div className="flex-1 bg-[#1e1e24] border border-[#2d2d34] rounded-md overflow-hidden flex flex-col">
              <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-[#181820] border-b border-[#2d2d34] text-[10px] font-bold text-slate-500 uppercase font-mono">
                <div className="col-span-3">Timestamp</div>
                <div className="col-span-3">User</div>
                <div className="col-span-3">Action</div>
                <div className="col-span-3">Target Reference</div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-[#2d2d34] font-mono text-[11px] text-slate-300">
                {loadingLogs ? (
                  <p className="text-xs text-slate-500 text-center py-8">Loading audit logs...</p>
                ) : auditLogsList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No audit logs found.</p>
                ) : (
                  auditLogsList.map((log, i) => (
                    <div key={log._id || i} className="grid grid-cols-12 gap-4 px-4 py-3.5 hover:bg-[#121214]/30 transition-colors">
                      <div className="col-span-3 text-slate-500">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : log.timestamp}
                      </div>
                      <div className="col-span-3 text-white font-bold">
                        {typeof log.user === 'object' && log.user ? log.user.name : log.user}
                      </div>
                      <div className="col-span-3 text-red-400">{log.action}</div>
                      <div className="col-span-3 text-slate-400">{log.target}</div>
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
