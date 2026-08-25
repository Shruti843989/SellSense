import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertOctagon, RefreshCw, Zap, Bot, CheckCircle, XCircle, Info, Sparkles } from 'lucide-react';

export default function GuardianLogsView() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ approvedCount: 0, flaggedCount: 0, blockedCount: 0, safetyPassRate: '100%' });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [simulating, setSimulating] = useState(false);
  const [demoSuccessMsg, setDemoSuccessMsg] = useState(null);

  const fetchGuardianLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guardian/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setMetrics(data.metrics || { approvedCount: 0, flaggedCount: 0, blockedCount: 0, safetyPassRate: '100%' });
      }
    } catch (e) {
      console.error("Error fetching Guardian logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardianLogs();
  }, []);

  const triggerMisbehaviorSimulation = async (simType) => {
    setSimulating(true);
    setDemoSuccessMsg(null);
    try {
      const res = await fetch('/api/guardian/simulate-misbehavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationType: simType })
      });
      const data = await res.json();
      if (data.success) {
        setDemoSuccessMsg(data.pitchDemoSummary);
        fetchGuardianLogs();
      }
    } catch (e) {
      console.error("Error simulating misbehavior:", e);
    } finally {
      setSimulating(false);
    }
  };

  const clearLogs = async () => {
    if (window.confirm("Clear all Guardian supervision logs?")) {
      await fetch('/api/guardian/clear', { method: 'POST' });
      fetchGuardianLogs();
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'APPROVED') return log.guardianVerdict === 'APPROVE';
    if (filter === 'FLAGGED') return log.guardianVerdict === 'FLAG_FOR_REVIEW';
    if (filter === 'BLOCKED') return log.guardianVerdict === 'BLOCK';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Guardian Agent Oversight
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase tracking-wider">
                    Autonomous AI Safety Supervisor
                  </span>
                </h1>
                <p className="text-sm text-slate-400">
                  Real-time statistical anomaly detection &amp; LLM risk reasoning monitoring main agents (Upsell, AI Buyer, Chat).
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Pitch Demo Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => triggerMisbehaviorSimulation("UNAUTHORIZED_DISCOUNT")}
              disabled={simulating}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
              title="Simulate Main Agent proposing unauthorized 25% discount"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Rogue 25% Discount</span>
            </button>

            <button
              onClick={() => triggerMisbehaviorSimulation("BUDGET_BREACH")}
              disabled={simulating}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
              title="Simulate AI Buyer trying to spend over persona budget"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Budget Overspend</span>
            </button>

            <button
              onClick={fetchGuardianLogs}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Demo Pitch Banner Alert */}
        {demoSuccessMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start space-x-2.5 animate-fadeIn">
            <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-300 uppercase tracking-wider mr-2">[LIVE GUARDIAN INTERVENTION]</span>
              <span>{demoSuccessMsg}</span>
            </div>
          </div>
        )}
      </div>

      {/* Oversight Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>TOTAL ACTIONS AUDITED</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{logs.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Independent safety reviews</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>APPROVED ACTIONS</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{metrics.approvedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Passed statistical &amp; LLM checks</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold mb-1">
            <span>FLAGGED FOR REVIEW</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{metrics.flaggedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Minor statistical deviations</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-red-500/20 bg-red-950/10">
          <div className="flex items-center justify-between text-red-400 text-xs font-semibold mb-1">
            <span>BLOCKED ACTIONS</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-red-400">{metrics.blockedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Hard ceiling or risk violations</p>
        </div>
      </div>

      {/* Filter Tabs & Log Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {['ALL', 'APPROVED', 'FLAGGED', 'BLOCKED'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === type
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors"
            >
              Clear Logs
            </button>
          )}
        </div>

        {/* Supervision Log List */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No Guardian supervision records found for filter '{filter}'.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => {
              const isBlock = log.guardianVerdict === 'BLOCK';
              const isFlag = log.guardianVerdict === 'FLAG_FOR_REVIEW';
              const isApprove = log.guardianVerdict === 'APPROVE';

              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isBlock 
                      ? 'bg-red-950/20 border-red-500/40' 
                      : isFlag 
                      ? 'bg-amber-950/20 border-amber-500/40' 
                      : 'bg-slate-900/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        {/* Verdict Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wider border ${
                          isBlock
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : isFlag
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {log.guardianVerdict}
                        </span>

                        <span className="text-sm font-bold text-white">{log.agentName}</span>
                        <span className="text-xs text-slate-400">• {log.actionType}</span>
                        {log.isDemoSimulation && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md font-mono border border-purple-500/30">
                            DEMO SIMULATION
                          </span>
                        )}
                      </div>

                      {/* Reasoning Text */}
                      <p className="text-xs text-slate-300 font-medium mt-1">
                        <span className="text-purple-400 font-bold mr-1">Guardian Rationale:</span>
                        {log.reasoning}
                      </p>
                    </div>

                    {/* Risk & Anomaly Score Pills */}
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Risk Score</div>
                        <div className={`font-mono font-extrabold ${isBlock ? 'text-red-400' : isFlag ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {log.riskScore}/100
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Stat Anomaly</div>
                        <div className="font-mono font-bold text-slate-300">
                          {log.statisticalScore}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
