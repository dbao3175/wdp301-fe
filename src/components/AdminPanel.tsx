import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../api/client';
import { 
  Shield, Users, ClipboardList, Plus, Trash2, Edit2, Check, X, Search, UserPlus
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  onRefreshAll: () => void;
}

export default function AdminPanel({ currentUser, onRefreshAll }: AdminPanelProps) {
  const [subTab, setSubTab] = useState<'users' | 'logs'>('users');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'MANGAKA' | 'EDITOR' | 'BOARD_MEMBER' | 'ASSISTANT' | 'ADMIN'>('ASSISTANT');
  const [formPassword, setFormPassword] = useState('');
  
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || (!editingUserId && !formPassword)) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      if (editingUserId) {
        // CALL UPDATE ENDPOINT
        await (apiClient.users as any).update(editingUserId, {
          name: formName,
          email: formEmail,
          role: formRole
        });
        showToast('User updated successfully!');
      } else {
        // CALL CREATE ENDPOINT
        await (apiClient.users as any).create({
          name: formName,
          email: formEmail,
          role: formRole,
          password: formPassword
        });
        showToast('User created successfully!');
      }
      resetForm();
      fetchUsers();
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Action failed (Endpoint needs BE integration)', 'error');
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser._id) {
      showToast('Cannot delete yourself', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await (apiClient.users as any).delete(userId);
      showToast('User deleted successfully.');
      fetchUsers();
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const startEdit = (user: User) => {
    setEditingUserId(user._id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role as any);
    setFormPassword('');
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormRole('ASSISTANT');
    setFormPassword('');
    setShowForm(false);
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mock Audit Logs
  const mockAuditLogs = [
    { time: '2026-06-29 10:15:32', user: 'Takeshi (Mangaka)', action: 'Uploaded Storyboard', target: 'Ninja Chronicles Chapter 1 Proposal' },
    { time: '2026-06-29 11:02:11', user: 'Hiroshi (Editor)', action: 'Forwarded to Board', target: 'Ninja Chronicles Proposal' },
    { time: '2026-06-29 12:45:00', user: 'Kenji (Board)', action: 'Assigned Required Voters', target: 'Ninja Chronicles Submission' },
    { time: '2026-06-29 13:20:15', user: 'Kenji (Board)', action: 'Cast Vote: ACCEPT', target: 'Ninja Chronicles Pitch' },
    { time: '2026-06-29 14:05:44', user: 'Kenji Sato (Assistant)', action: 'Submitted Work Page 3', target: 'Ninja Chronicles Ch 1 Background' }
  ];

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
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Manage platform users &amp; inspect system audit logs</p>
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
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                      </div>

                      <div className="flex gap-2">
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
                {mockAuditLogs.map((log, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3.5 hover:bg-[#121214]/30 transition-colors">
                    <div className="col-span-3 text-slate-500">{log.time}</div>
                    <div className="col-span-3 text-white font-bold">{log.user}</div>
                    <div className="col-span-3 text-red-400">{log.action}</div>
                    <div className="col-span-3 text-slate-400">{log.target}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
