import React, { useState, useEffect } from 'react';
import { Bot, Code, Play, CheckCircle2, RefreshCw, Sparkles, Terminal, Copy } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function AgentCatalogView() {
  const [catalogSchema, setCatalogSchema] = useState(null);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [simulationResult, setSimulationResult] = useState(null);
  const [runningSimulation, setRunningSimulation] = useState(false);

  const fetchAgentSchema = async () => {
    setLoadingSchema(true);
    try {
      const res = await fetch(getApiUrl('/api/catalog/agent'));
      const data = await res.json();
      setCatalogSchema(data);
    } catch (err) {
      console.error("Agent catalog fetch error:", err);
    } finally {
      setLoadingSchema(false);
    }
  };

  useEffect(() => {
    fetchAgentSchema();
  }, []);

  const handleRunSimulation = async () => {
    setRunningSimulation(true);
    setSimulationResult(null);
    try {
      const res = await fetch(getApiUrl('/api/buyer-simulation/run'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: "Tech enthusiast searching for a fast-charging accessory under ₹2,000"
        })
      });
      const data = await res.json();

      setSimulationResult(data);
    } catch (err) {
      console.error("Buyer simulation error:", err);
    } finally {
      setRunningSimulation(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">Agent-to-Agent Commerce Portal</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Machine-Readable Schema (`GET /api/catalog/agent`) &amp; Autonomous AI Buyer Simulator</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={runningSimulation}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-white ${runningSimulation ? 'animate-spin' : ''}`} />
          <span>{runningSimulation ? 'Running Agent Simulation...' : 'Run Autonomous AI Buyer Simulation'}</span>
        </button>
      </div>

      {/* Autonomous AI Buyer Simulation Result Box */}
      {simulationResult && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-indigo-500/30 space-y-4 shadow-xl animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm">Autonomous Agent-to-Agent Purchase Complete</h3>
                <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400">Order Number: {simulationResult.orderNumber}</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30">
              SUCCESS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Step Trace */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Agent Execution Step Trace</h4>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                {simulationResult.stepTrace?.map((step, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Decision Summary */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Buyer Decision Summary</h4>
              <div className="space-y-1 text-slate-700 dark:text-slate-300">
                <p><strong className="text-slate-500 dark:text-slate-400">Buyer Persona:</strong> {simulationResult.persona}</p>
                <p><strong className="text-slate-500 dark:text-slate-400">Product Selected:</strong> {simulationResult.chosenProduct?.title}</p>
                <p><strong className="text-slate-500 dark:text-slate-400">Total Paid (Razorpay Sandbox):</strong> <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">₹{simulationResult.totalAmount}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Machine-Readable JSON Schema View */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm">GET /api/catalog/agent (Machine Schema Output)</h3>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">schema_version: 2.0-agentic</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 text-indigo-300 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono overflow-x-auto max-h-[420px]">
          <pre>{JSON.stringify(catalogSchema, null, 2)}</pre>
        </div>
      </div>

    </div>
  );
}
