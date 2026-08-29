import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, ShieldCheck, ShieldAlert, Trash2, Ban, CheckCircle, 
  Search, Eye, RefreshCw, AlertTriangle, Package, Clock, UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, authFetch } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState('users'); // 'users', 'guardian', 'audit'

  // Selected User Inspection Modal
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete User Confirmation Modal
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // System Logs Data
  const [guardianLogs, setGuardianLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuardianLogs = async () => {
    try {
      const res = await authFetch('/api/admin/guardian-logs');
      const data = await res.json();
      if (data.success) {
        setGuardianLogs(data.logs || []);
      }
    } catch (err) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await authFetch('/api/admin/audit-logs');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchGuardianLogs();
      fetchAuditLogs();
    }
  }, [isAdmin]);

  const handleToggleStatus = async (user) => {
    try {
      const res = await authFetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_suspended: !user.is_suspended })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.detail || "Failed to update status");
      }
    } catch (err) {
      alert("Status update failed");
    }
  };

  const handleInspectUser = async (userId) => {
    setDetailLoading(true);
    setSelectedUserDetail(null);
    try {
      const res = await authFetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedUserDetail(data);
      }
    } catch (err) {
      console.error("Failed to inspect user:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setUserToDelete(null);
        fetchUsers();
      } else {
        alert(data.detail || "Failed to delete user account");
      }
    } catch (err) {
      alert("Delete operation failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-[#3a2e2a] dark:text-white">Access Denied</h1>
        <p className="text-sm text-[#6e5d57] dark:text-slate-400 max-w-md mx-auto">
          The Admin Management Panel is restricted exclusively to authenticated system administrators.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel bg-gradient-to-r from-[#fffaf5] via-[#fceef0] to-[#fffaf5] dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border border-[#ede0d5] dark:border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f4795b]/10 text-[#f4795b] dark:bg-indigo-500/10 dark:text-indigo-300 border border-[#f4795b]/20 text-xs font-mono font-bold uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Admin Control Panel • PostgreSQL Database</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#3a2e2a] dark:text-white tracking-tight">
            User Management &amp; Platform Operations
          </h1>
          <p className="text-xs text-[#6e5d57] dark:text-slate-400">
            Manage customer accounts, inspect user order trails, suspend/reactivate accounts, and monitor Guardian Agent logs.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-[#3a2e2a] dark:text-white border border-[#ede0d5] dark:border-slate-700 text-xs font-bold transition-all shadow-sm hover:bg-[#fdf3ea] flex items-center space-x-2 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#f4795b]" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Admin Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#ede0d5] dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminTab === 'users'
              ? 'bg-[#f4795b] dark:bg-indigo-600 text-white shadow-md'
              : 'bg-[#fffaf5] dark:bg-slate-900 text-[#6e5d57] dark:text-slate-400 hover:text-[#3a2e2a] border border-[#ede0d5] dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('guardian')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminTab === 'guardian'
              ? 'bg-[#c85450] dark:bg-rose-600 text-white shadow-md'
              : 'bg-[#fffaf5] dark:bg-slate-900 text-[#6e5d57] dark:text-slate-400 hover:text-[#3a2e2a] border border-[#ede0d5] dark:border-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Guardian Safety Logs ({guardianLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminTab === 'audit'
              ? 'bg-[#5b824b] dark:bg-emerald-600 text-white shadow-md'
              : 'bg-[#fffaf5] dark:bg-slate-900 text-[#6e5d57] dark:text-slate-400 hover:text-[#3a2e2a] border border-[#ede0d5] dark:border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>System Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: User Accounts Directory */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#94827b] dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#fffaf5] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800 text-xs text-[#3a2e2a] dark:text-white focus:outline-none focus:border-[#f4795b] transition-all"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#6e5d57] font-mono">Loading user directory from PostgreSQL...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center glass-panel rounded-3xl text-xs text-[#6e5d57]">No registered users match your search query.</div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-[#ede0d5] dark:border-slate-800 shadow-sm glass-panel">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#fdf3ea] dark:bg-slate-950 text-[#6e5d57] dark:text-slate-400 font-bold border-b border-[#ede0d5] dark:border-slate-800">
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4">Orders</th>
                    <th className="p-4">Signed Up</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede0d5] dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#fffaf5]/80 dark:hover:bg-slate-900/50 transition-colors">
                      
                      <td className="p-4">
                        <div className="font-bold text-[#3a2e2a] dark:text-white">{u.name}</div>
                        <div className="text-[11px] text-[#6e5d57] dark:text-slate-400 font-mono">{u.email}</div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          u.role === 'admin'
                            ? 'bg-[#f4795b]/15 text-[#f4795b] dark:bg-indigo-500/15 dark:text-indigo-300 border border-[#f4795b]/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-4">
                        {u.is_suspended ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/30">
                            <Ban className="w-3 h-3" />
                            <span>SUSPENDED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            <span>ACTIVE</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono font-bold text-[#3a2e2a] dark:text-white">
                        {u.orderCount}
                      </td>

                      <td className="p-4 text-[11px] text-[#6e5d57] dark:text-slate-400 font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {/* Inspect User button */}
                        <button
                          onClick={() => handleInspectUser(u.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[#3a2e2a] dark:text-white border border-[#ede0d5] dark:border-slate-700 text-[11px] font-bold hover:bg-[#fdf3ea] transition-all"
                          title="Inspect Order History & Audit Trail"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1 text-[#f4795b]" />
                          <span>Inspect</span>
                        </button>

                        {/* Suspend / Reactivate button */}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                              u.is_suspended
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                            title={u.is_suspended ? "Reactivate user account" : "Suspend user account"}
                          >
                            <Ban className="w-3.5 h-3.5 inline mr-1" />
                            <span>{u.is_suspended ? 'Reactivate' : 'Suspend'}</span>
                          </button>
                        )}

                        {/* Delete User button */}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] font-bold hover:bg-rose-500/20 transition-all"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Guardian Safety Logs */}
      {activeAdminTab === 'guardian' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass-card bg-[#fffaf5] dark:bg-slate-900 border-[#ede0d5] dark:border-slate-800">
            <h3 className="font-display font-bold text-sm text-[#3a2e2a] dark:text-white">Guardian Safety Supervision Records</h3>
            <p className="text-xs text-[#6e5d57] dark:text-slate-400">Autonomous evaluation logs for AI Upsell, Chat, and Campaign recommendations.</p>
          </div>

          <div className="space-y-3">
            {guardianLogs.map((g) => (
              <div key={g.id} className="p-4 rounded-2xl glass-card bg-white dark:bg-slate-900 border-[#ede0d5] dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      g.verdict === 'APPROVE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    }`}>
                      {g.verdict}
                    </span>
                    <span className="font-bold text-xs text-[#3a2e2a] dark:text-white">{g.agentName}</span>
                    <span className="text-[10px] text-[#6e5d57] font-mono">Risk Score: {g.riskScore}/100</span>
                  </div>
                  <p className="text-xs text-[#6e5d57] dark:text-slate-400">{g.reasoning}</p>
                </div>
                <div className="text-[10px] text-[#94827b] font-mono whitespace-nowrap">
                  {new Date(g.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: System Audit Trail */}
      {activeAdminTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass-card bg-[#fffaf5] dark:bg-slate-900 border-[#ede0d5] dark:border-slate-800">
            <h3 className="font-display font-bold text-sm text-[#3a2e2a] dark:text-white">System-Wide Audit Trail</h3>
            <p className="text-xs text-[#6e5d57] dark:text-slate-400">Complete audit history of user checkout sessions, AI recommendation actions, and payment results.</p>
          </div>

          <div className="space-y-3">
            {auditLogs.map((a) => (
              <div key={a.id} className="p-4 rounded-2xl glass-card bg-white dark:bg-slate-900 border-[#ede0d5] dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-[#3a2e2a] dark:text-white">Audit ID: {a.id}</span>
                  <span className="text-[10px] text-[#6e5d57] font-mono">{new Date(a.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">User ID: {a.userId || 'Guest'}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 font-mono">Action: {a.userAction}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-mono">Payment: {a.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Inspect User Details */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#fffaf5] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-[#ede0d5] dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-display text-xl font-extrabold text-[#3a2e2a] dark:text-white">
                  User Profile: {selectedUserDetail.user.name}
                </h3>
                <p className="text-xs text-[#6e5d57] font-mono">{selectedUserDetail.user.email} • ID: {selectedUserDetail.user.id}</p>
              </div>
              <button onClick={() => setSelectedUserDetail(null)} className="px-3 py-1 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800">
                Close
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-[#ede0d5] dark:border-slate-800">
                <div className="text-[10px] text-[#6e5d57]">Total Orders</div>
                <div className="font-mono font-extrabold text-base text-[#3a2e2a] dark:text-white">{selectedUserDetail.orders.length}</div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-[#ede0d5] dark:border-slate-800">
                <div className="text-[10px] text-[#6e5d57]">Active Cart Items</div>
                <div className="font-mono font-extrabold text-base text-[#f4795b]">{selectedUserDetail.user.cartCount}</div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-[#ede0d5] dark:border-slate-800">
                <div className="text-[10px] text-[#6e5d57]">Wishlist Items</div>
                <div className="font-mono font-extrabold text-base text-[#c85450]">{selectedUserDetail.user.wishlistCount}</div>
              </div>
            </div>

            {/* User Order History */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-[#3a2e2a] dark:text-white uppercase tracking-wider">Order History</h4>
              {selectedUserDetail.orders.length === 0 ? (
                <p className="text-xs text-[#6e5d57]">No orders placed yet.</p>
              ) : (
                selectedUserDetail.orders.map((ord) => (
                  <div key={ord.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-[#ede0d5] dark:border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-mono font-bold">
                      <span>{ord.orderNumber}</span>
                      <span className="text-[#5b824b]">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-[11px] text-[#6e5d57] flex justify-between">
                      <span>Items: {ord.items.length}</span>
                      <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Delete User Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#fffaf5] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-extrabold text-center text-[#3a2e2a] dark:text-white">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-[#6e5d57] text-center">
              Are you sure you want to delete user account <strong className="font-mono text-[#3a2e2a] dark:text-white">{userToDelete.email}</strong>?
              Personal login details, cart, and wishlist will be removed, and historical order records will be anonymized.
            </p>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-[#3a2e2a] dark:text-white text-xs font-bold"
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteUser}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-all shadow-md shadow-rose-600/20"
              >
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
