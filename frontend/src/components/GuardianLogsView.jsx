import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertOctagon, RefreshCw, Zap, Bot, CheckCircle, XCircle, Info, Sparkles, Activity } from 'lucide-react';

// Signature Visual Component: Guardian Radial Risk Arc Gauge
function GuardianRiskGauge({ score = 0, verdict = 'APPROVE' }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#5b824b'; // Warm Sage Green for Light Mode
  if (verdict === 'BLOCK' || score > 60) {
    strokeColor = '#c85450'; // Terracotta Red
  } else if (verdict === 'FLAG_FOR_REVIEW' || score > 30) {
    strokeColor = '#d98e32'; // Golden Amber
  }

  return (
    <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background Track Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="7"
          className="text-[#ede0d5] dark:text-slate-800"
          fill="transparent"
        />
        {/* Animated Score Arc */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={strokeColor}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Inner Metric Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-base font-extrabold text-[#3a2e2a] dark:text-white leading-none">{score}</span>
        <span className="text-[9px] text-[#6e5d57] dark:text-slate-400 uppercase font-bold tracking-wider mt-0.5">RISK</span>
      </div>
    </div>
  );
}

export default function GuardianLogsView() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ 
    approvedCount: 0, 
    flaggedCount: 0, 
    blockedCount: 0, 
    safetyPassRate: '100%',
    driftStatus: 'HEALTHY',
    recentAvgPrice: 0,
    priceShiftPct: 0,
    categoryConcentrationPct: 0,
    driftReason: 'Operating within normal behavioral baseline bounds'
  });
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
        setMetrics(data.metrics || { 
          approvedCount: 0, 
          flaggedCount: 0, 
          blockedCount: 0, 
          safetyPassRate: '100%',
          driftStatus: 'HEALTHY',
          recentAvgPrice: 0,
          priceShiftPct: 0,
          categoryConcentrationPct: 0,
          driftReason: 'Operating within normal behavioral baseline bounds'
        });
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

  const isDriftDetected = metrics.driftStatus === 'DRIFT_DETECTED';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner with Dusty Rose Wash */}
      <div className="glass-panel p-6 rounded-2xl border border-[#ede0d5] dark:border-slate-800 bg-[#fffaf5] dark:bg-slate-900/90 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#c85450]/10 text-[#c85450] dark:text-rose-400 border border-[#c85450]/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display text-xl font-extrabold text-[#3a2e2a] dark:text-white tracking-tight flex items-center gap-2">
                  Guardian Agent Oversight
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#c85450]/10 text-[#c85450] dark:text-rose-300 border border-[#c85450]/20 font-mono font-bold uppercase tracking-wider">
                    AI Safety Supervisor
                  </span>
                </h1>
                <p className="text-xs text-[#6e5d57] dark:text-slate-400">
                  Independent statistical anomaly detection, rolling behavioral drift monitoring, &amp; fail-safe security checkpoint.
                </p>
              </div>
            </div>
          </div>

          {/* Simulation Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => triggerMisbehaviorSimulation("UNAUTHORIZED_DISCOUNT")}
              disabled={simulating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#c85450] hover:bg-[#b54440] dark:bg-rose-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Rogue Discount</span>
            </button>

            <button
              onClick={() => triggerMisbehaviorSimulation("BEHAVIORAL_DRIFT")}
              disabled={simulating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#d98e32] hover:bg-[#c57d24] dark:bg-amber-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Simulate Price Drift</span>
            </button>

            <button
              onClick={fetchGuardianLogs}
              className="p-2 rounded-xl bg-[#f5e9de] dark:bg-slate-800 hover:bg-[#ede0d5] dark:hover:bg-slate-700 text-[#3a2e2a] dark:text-slate-300 transition-all border border-[#ede0d5] dark:border-slate-700"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Demo Pitch Alert */}
        {demoSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-[#c85450]/10 border border-[#c85450]/30 text-[#8a2420] dark:text-rose-200 text-xs flex items-start space-x-2 animate-slide-up">
            <AlertOctagon className="w-4 h-4 text-[#c85450] dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-mono font-bold text-[#c85450] dark:text-rose-300 uppercase tracking-wider mr-2">[GUARDIAN INTERVENTION]</span>
              <span>{demoSuccessMsg}</span>
            </div>
          </div>
        )}
      </div>

      {/* Priority 6: System Health & Behavioral Drift Monitoring Panel */}
      <div className={`glass-panel p-5 rounded-2xl border transition-all ${
        isDriftDetected 
          ? 'bg-[#fdf0d8] border-[#f5b759]/60 dark:bg-amber-950/20 dark:border-amber-500/40' 
          : 'bg-[#fffaf5] dark:bg-slate-900/60 border-[#ede0d5] dark:border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <Activity className={`w-4 h-4 ${isDriftDetected ? 'text-[#d98e32] dark:text-amber-400 animate-pulse' : 'text-[#5b824b] dark:text-emerald-400'}`} />
              <span className="font-display text-xs font-extrabold text-[#3a2e2a] dark:text-white tracking-wide uppercase">System Health &amp; Behavioral Drift Status</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                isDriftDetected 
                  ? 'bg-[#fdf0d8] text-[#8c5000] dark:text-amber-300 border-[#f5b759]/40'
                  : 'bg-[#e8f0e3] text-[#5b824b] dark:text-emerald-300 border-[#5b824b]/40'
              }`}>
                {metrics.driftStatus}
              </span>
            </div>
            <p className="text-xs text-[#6e5d57] dark:text-slate-400 font-medium">
              {metrics.driftReason || 'Rolling 20-recommendation window monitoring average price shift and category concentration.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="bg-[#fdf3ea] dark:bg-slate-950/60 px-3 py-1.5 rounded-xl border border-[#ede0d5] dark:border-slate-800 text-right">
              <span className="text-[9px] text-[#94827b] dark:text-slate-400 font-bold uppercase block">Recent Avg Price</span>
              <span className="font-mono font-extrabold text-[#3a2e2a] dark:text-white">₹{metrics.recentAvgPrice ? metrics.recentAvgPrice.toLocaleString() : '1,500'}</span>
            </div>

            <div className="bg-[#fdf3ea] dark:bg-slate-950/60 px-3 py-1.5 rounded-xl border border-[#ede0d5] dark:border-slate-800 text-right">
              <span className="text-[9px] text-[#94827b] dark:text-slate-400 font-bold uppercase block">Price Shift vs Baseline</span>
              <span className={`font-mono font-extrabold ${metrics.priceShiftPct > 35 ? 'text-[#d98e32] dark:text-amber-400' : 'text-[#3a2e2a] dark:text-slate-300'}`}>
                {metrics.priceShiftPct > 0 ? `+${metrics.priceShiftPct}%` : `${metrics.priceShiftPct}%`}
              </span>
            </div>

            <div className="bg-[#fdf3ea] dark:bg-slate-950/60 px-3 py-1.5 rounded-xl border border-[#ede0d5] dark:border-slate-800 text-right">
              <span className="text-[9px] text-[#94827b] dark:text-slate-400 font-bold uppercase block">Category Concentration</span>
              <span className={`font-mono font-extrabold ${metrics.categoryConcentrationPct > 70 ? 'text-[#d98e32] dark:text-amber-400' : 'text-[#3a2e2a] dark:text-slate-300'}`}>
                {metrics.categoryConcentrationPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Oversight Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-[#ede0d5] dark:border-slate-800 bg-[#fffaf5] dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-[#6e5d57] dark:text-slate-400 text-xs font-semibold mb-1">
            <span>TOTAL ACTIONS AUDITED</span>
            <Bot className="w-4 h-4 text-[#f4795b] dark:text-indigo-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-[#3a2e2a] dark:text-white">{logs.length}</div>
          <p className="text-[11px] text-[#94827b] dark:text-slate-500 mt-1">Independent safety reviews</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-[#5b824b]/30 bg-[#e8f0e3]/40 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between text-[#5b824b] dark:text-emerald-400 text-xs font-semibold mb-1">
            <span>APPROVED ACTIONS</span>
            <CheckCircle className="w-4 h-4 text-[#5b824b] dark:text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-[#5b824b] dark:text-emerald-400">{metrics.approvedCount}</div>
          <p className="text-[11px] text-[#6e5d57] dark:text-slate-400 mt-1">Passed statistical &amp; LLM checks</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-[#d98e32]/30 bg-[#fdf0d8]/50 dark:bg-amber-950/10">
          <div className="flex items-center justify-between text-[#d98e32] dark:text-amber-400 text-xs font-semibold mb-1">
            <span>FLAGGED FOR REVIEW</span>
            <AlertTriangle className="w-4 h-4 text-[#d98e32] dark:text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-[#d98e32] dark:text-amber-400">{metrics.flaggedCount}</div>
          <p className="text-[11px] text-[#6e5d57] dark:text-slate-400 mt-1">Behavioral drift or anomaly</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-[#c85450]/30 bg-[#fce8e6]/60 dark:bg-rose-950/10">
          <div className="flex items-center justify-between text-[#c85450] dark:text-rose-400 text-xs font-semibold mb-1">
            <span>BLOCKED ACTIONS</span>
            <XCircle className="w-4 h-4 text-[#c85450] dark:text-rose-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-[#c85450] dark:text-rose-400">{metrics.blockedCount}</div>
          <p className="text-[11px] text-[#6e5d57] dark:text-slate-400 mt-1">Hard ceiling or risk violations</p>
        </div>
      </div>

      {/* Filter Tabs & Log Table */}
      <div className="glass-panel p-6 rounded-2xl border border-[#ede0d5] dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-1.5 bg-[#f5e9de] dark:bg-slate-950 p-1 rounded-xl border border-[#ede0d5] dark:border-slate-800">
            {['ALL', 'APPROVED', 'FLAGGED', 'BLOCKED'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === type
                    ? 'bg-[#f4795b] dark:bg-indigo-600 text-white shadow-sm'
                    : 'text-[#6e5d57] dark:text-slate-400 hover:text-[#3a2e2a] dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="text-xs font-medium text-[#6e5d57] dark:text-slate-400 hover:text-[#c85450] dark:hover:text-rose-400 transition-colors"
            >
              Clear Logs
            </button>
          )}
        </div>

        {/* Supervision Log List */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-[#94827b] dark:text-slate-500 text-sm">
            No Guardian supervision records found for filter '{filter}'.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => {
              const isBlock = log.guardianVerdict === 'BLOCK';
              const isFlag = log.guardianVerdict === 'FLAG_FOR_REVIEW';

              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-xl border transition-all animate-slide-up flex items-center justify-between gap-4 ${
                    isBlock 
                      ? 'bg-[#fce8e6]/80 dark:bg-rose-950/20 border-[#c85450]/30 dark:border-rose-500/40' 
                      : isFlag 
                      ? 'bg-[#fdf0d8]/80 dark:bg-amber-950/20 border-[#d98e32]/30 dark:border-amber-500/40' 
                      : 'bg-[#fffaf5] dark:bg-slate-900/50 border-[#ede0d5] dark:border-slate-800/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Signature Arc Risk Gauge Component */}
                    <GuardianRiskGauge score={log.riskScore || 15} verdict={log.guardianVerdict} />

                    <div className="space-y-1 my-auto">
                      <div className="flex items-center space-x-2.5 flex-wrap">
                        {/* Verdict Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold tracking-wider border ${
                          isBlock
                            ? 'bg-[#fce8e6] text-[#c85450] dark:bg-rose-500/20 dark:text-rose-300 border-[#c85450]/40'
                            : isFlag
                            ? 'bg-[#fdf0d8] text-[#8c5000] dark:bg-amber-500/20 dark:text-amber-300 border-[#f5b759]/40'
                            : 'bg-[#e8f0e3] text-[#5b824b] dark:bg-emerald-500/20 dark:text-emerald-300 border-[#5b824b]/40'
                        }`}>
                          {log.guardianVerdict}
                        </span>

                        <span className="font-display font-bold text-[#3a2e2a] dark:text-white text-sm">{log.agentName}</span>
                        <span className="text-xs text-[#6e5d57] dark:text-slate-400">• {log.actionType}</span>
                        {log.isDemoSimulation && (
                          <span className="text-[9px] bg-[#f4795b]/10 text-[#f4795b] dark:text-indigo-300 px-2 py-0.5 rounded-md font-mono border border-[#f4795b]/20">
                            DEMO SIMULATION
                          </span>
                        )}
                      </div>

                      {/* Reasoning Text */}
                      <p className="text-xs text-[#3a2e2a] dark:text-slate-300 font-medium mt-1">
                        <span className="text-[#d98e32] dark:text-amber-400 font-bold mr-1">Guardian Rationale:</span>
                        {log.reasoning}
                      </p>
                    </div>
                  </div>

                  {/* Stat Anomaly Badge */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-[10px] text-[#94827b] dark:text-slate-400 font-bold uppercase">Stat Anomaly</div>
                    <div className="font-mono text-sm font-bold text-[#3a2e2a] dark:text-slate-200">{log.statisticalScore}%</div>
                    <div className="text-[10px] text-[#94827b] dark:text-slate-400 font-mono mt-0.5">{log.timestamp?.slice(11, 19)}</div>
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
