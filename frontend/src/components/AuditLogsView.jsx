import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertOctagon, RefreshCw, Search, Trash2, Eye, TrendingUp, DollarSign, Filter, Code } from 'lucide-react';

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACCEPTED' | 'SKIPPED' | 'BLOCKED' | 'FAILED'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all audit logs?")) return;
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      fetchLogs();
    } catch (err) {
      console.error("Clear logs error:", err);
    }
  };

  // Filter logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.session_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.cart_items || []).some(i => i.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'ACCEPTED') return log.user_action === 'accepted';
    if (filter === 'SKIPPED') return log.user_action === 'skipped';
    if (filter === 'BLOCKED') return (log.candidates_evaluated?.length || 0) > (log.final_suggestions?.length || 0);
    if (filter === 'FAILED') return log.payment_status === 'failed';

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">AI Agent Audit Trail</h1>
              <p className="text-xs text-slate-400">Complete audit log of LLM suggestions, Bounded Gate evaluations, and payment traces</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchLogs}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-semibold text-xs transition-all border border-rose-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Total Audit Runs</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{metrics?.totalLogs || 0}</span>
            <span className="text-[11px] text-slate-400 mt-1 block">Recorded agent executions</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Code className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Conversion Rate</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{metrics?.conversionRate || '0.0%'}</span>
            <span className="text-[11px] text-slate-400 mt-1 block">{metrics?.acceptedCount || 0} Accepted suggestions</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Bounded Rule Blocks</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{metrics?.blockedCount || 0}</span>
            <span className="text-[11px] text-slate-400 mt-1 block">Candidates blocked by rules</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">AI Upsell Revenue</span>
            <span className="text-2xl font-extrabold text-cyan-400 mt-1 block">₹{(metrics?.totalUpsellRevenue || 0).toLocaleString('en-IN')}</span>
            <span className="text-[11px] text-slate-400 mt-1 block">Incremental gross value</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-blue-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Logs' },
            { id: 'ACCEPTED', label: 'Accepted' },
            { id: 'SKIPPED', label: 'Skipped' },
            { id: 'BLOCKED', label: 'Blocked by Rules' },
            { id: 'FAILED', label: 'Payment Failed' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === t.id 
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Session ID or Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-6 font-semibold">Timestamp / Log ID</th>
                <th className="py-4 px-6 font-semibold">Cart Items</th>
                <th className="py-4 px-6 font-semibold">AI Candidates Evaluated</th>
                <th className="py-4 px-6 font-semibold">Rule Engine Result</th>
                <th className="py-4 px-6 font-semibold">User Action</th>
                <th className="py-4 px-6 font-semibold">Payment Status</th>
                <th className="py-4 px-6 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No audit logs match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const cartSummary = (log.cart_items || []).map(i => `${i.name} (x${i.qty})`).join(', ');
                  const candidatesCount = log.candidates_evaluated?.length || 0;
                  const finalCount = log.final_suggestions?.length || 0;
                  const blockedInLog = candidatesCount - finalCount;

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Timestamp & ID */}
                      <td className="py-4 px-6">
                        <span className="font-mono text-cyan-400 font-semibold block">{log.id}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Cart Contents */}
                      <td className="py-4 px-6 max-w-xs">
                        <span className="text-white font-medium line-clamp-1">{cartSummary || 'Empty'}</span>
                      </td>

                      {/* AI Candidates */}
                      <td className="py-4 px-6">
                        <span className="text-slate-300">{candidatesCount} Evaluated</span>
                        <span className="text-[10px] text-slate-500 block">LLM Prompted</span>
                      </td>

                      {/* Rule Engine Status */}
                      <td className="py-4 px-6">
                        {blockedInLog > 0 ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 text-[11px] font-bold">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            <span>{finalCount} Passed ({blockedInLog} Blocked)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{finalCount} Approved</span>
                          </span>
                        )}
                      </td>

                      {/* User Action */}
                      <td className="py-4 px-6">
                        {log.user_action === 'accepted' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 text-[11px]">
                            Accepted
                          </span>
                        ) : log.user_action === 'skipped' ? (
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px]">
                            Skipped
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[11px]">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-4 px-6">
                        {log.payment_status === 'success' ? (
                          <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Razorpay Success</span>
                          </span>
                        ) : log.payment_status === 'failed' ? (
                          <span className="flex items-center space-x-1 text-rose-400 font-semibold">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>Razorpay Failed</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">Pending</span>
                        )}
                      </td>

                      {/* Action Detail Trigger */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 rounded-xl text-cyan-400 hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON & Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedLog(null)} />

          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 glass-panel z-10 space-y-6 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-lg">Audit Record Details: <span className="font-mono text-cyan-400">{selectedLog.id}</span></h3>
              <button onClick={() => setSelectedLog(null)} className="p-2 rounded-xl text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-2">Cart Contents</h4>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                  <pre className="font-mono">{JSON.stringify(selectedLog.cart_items, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-2">Bounded &amp; Gated Rule Check Execution</h4>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                  <pre className="font-mono">{JSON.stringify(selectedLog.rule_results, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-2">Approved Suggestions Presented</h4>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                  <pre className="font-mono">{JSON.stringify(selectedLog.final_suggestions, null, 2)}</pre>
                </div>
              </div>

              {selectedLog.failure_reason && (
                <div>
                  <h4 className="font-bold text-rose-400 uppercase tracking-wider text-[10px] mb-2">Payment Failure Record</h4>
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300">
                    {selectedLog.failure_reason}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
