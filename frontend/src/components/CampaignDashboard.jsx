import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Zap, AlertTriangle, CheckCircle2, TrendingUp, Tag, RefreshCw } from 'lucide-react';

export default function CampaignDashboard() {
  const [clusterData, setClusterData] = useState(null);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [campaignData, setCampaignData] = useState(null);
  const [orchestrating, setOrchestrating] = useState(false);

  const fetchClusters = async () => {
    setLoadingClusters(true);
    try {
      const res = await fetch('/api/campaign/clusters');
      const data = await res.json();
      if (data.success) {
        setClusterData(data);
      }
    } catch (err) {
      console.error("Cluster fetch error:", err);
    } finally {
      setLoadingClusters(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleRunCampaignOrchestrator = async () => {
    setOrchestrating(true);
    try {
      const res = await fetch('/api/campaign/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setCampaignData(data.validatedCampaign);
      }
    } catch (err) {
      console.error("Campaign orchestrator error:", err);
    } finally {
      setOrchestrating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">AI Campaign Orchestrator</h1>
              <p className="text-xs text-slate-400">scikit-learn KMeans Inventory Velocity Clustering &amp; Bounded Discount Campaigns</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunCampaignOrchestrator}
          disabled={orchestrating}
          className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-bold text-xs hover:from-purple-500 hover:to-cyan-400 transition-all shadow-lg shadow-purple-500/20"
        >
          <Sparkles className={`w-4 h-4 ${orchestrating ? 'animate-spin' : ''}`} />
          <span>{orchestrating ? 'Orchestrating Campaign...' : 'Orchestrate AI Campaign'}</span>
        </button>
      </div>

      {/* KMeans Clusters Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {clusterData?.clusters?.map((c) => (
          <div 
            key={c.cluster_id} 
            className={`p-5 rounded-2xl glass-card border transition-all ${
              c.label.includes('Slow-Moving') 
                ? 'border-amber-500/40 bg-amber-950/10' 
                : c.label.includes('Fast-Moving') 
                ? 'border-emerald-500/40 bg-emerald-950/10' 
                : 'border-slate-800'
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                c.label.includes('Slow-Moving') 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                  : c.label.includes('Fast-Moving') 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              }`}>
                {c.label}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{c.count} items</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Monthly Sales Velocity</span>
                <span className="font-bold text-white">{c.avg_sales_velocity} units/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg In-Stock Units</span>
                <span className="font-bold text-white">{c.avg_stock} units</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active AI Campaign Proposal Box */}
      {campaignData && (
        <div className="p-6 rounded-3xl bg-slate-950 border border-purple-500/40 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">{campaignData.campaign_name}</h3>
                <p className="text-xs text-slate-400">Validated by Python Bounded Rule Engine</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs border border-emerald-500/40">
              ACTIVE CAMPAIGN
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">AI Campaign Rationale</h4>
            <p className="italic text-slate-200 leading-relaxed">"{campaignData.rationale}"</p>
          </div>

          {/* Rule Checks Pill Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Discount Cap Check</span>
                <span className="font-bold text-white">{campaignData.rules_check?.discountCapGate?.detail}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Duration Cap Check</span>
                <span className="font-bold text-white">{campaignData.rules_check?.durationCapGate?.detail}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Target Products Check</span>
                <span className="font-bold text-white">{campaignData.rules_check?.targetProductsGate?.detail}</span>
              </div>
            </div>
          </div>

          {/* Target Slow-Moving Items */}
          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-white text-xs">Target Products in Campaign</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {campaignData.target_products?.map(p => (
                <div key={p.id} className="p-3 rounded-xl glass-card flex items-center space-x-3">
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <h5 className="font-bold text-white text-xs truncate">{p.name}</h5>
                    <span className="text-emerald-400 font-bold text-xs">₹{p.price} (-10%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
