import React from 'react';
import { Settings, Key, CreditCard, X, Save, RefreshCw } from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  apiKey, 
  setApiKey, 
  razorpayKey, 
  setRazorpayKey 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 glass-panel z-10 my-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Evaluator Credentials &amp; API Settings</h3>
              <p className="text-xs text-slate-400">Configure custom keys or use pre-loaded buildathon test defaults</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-4 text-xs">
          
          {/* OpenAI Key */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center space-x-1">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>OpenAI API Key (Optional)</span>
            </label>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              If left blank, the backend automatically uses the built-in AI Semantic Rule-Guided Recommender Engine for 100% reliable evaluation.
            </p>
          </div>

          {/* Razorpay Key */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="font-semibold text-slate-300 flex items-center space-x-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>Razorpay Key ID (Test Mode)</span>
            </label>
            <input
              type="text"
              placeholder="rzp_test_..."
              value={razorpayKey}
              onChange={(e) => setRazorpayKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Default buildathon test key ID loaded. You may enter your custom Razorpay Dashboard test key ID here.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Close Settings</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
