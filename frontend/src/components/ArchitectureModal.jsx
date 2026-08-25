import React from 'react';
import { Cpu, ShieldCheck, CreditCard, Database, ArrowRight, X, Sparkles, CheckCircle2, Brain } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 glass-panel z-10 my-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg">NudgeAI ML Architecture Blueprint</h3>
              <p className="text-xs text-slate-400">Razorpay AI Buildathon (Track: AI Growth &amp; Agentic Commerce)</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Pipeline flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative py-4">
          
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Step 1: Frontend</div>
            <h4 className="font-bold text-white text-sm">React + Client</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Captures active cart items, categories, &amp; subtotal. Calls FastAPI POST /suggest.
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center text-slate-600">
            <ArrowRight className="w-5 h-5 text-cyan-500" />
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 space-y-2">
            <div className="text-purple-400 text-xs font-bold uppercase tracking-wider">Step 2: ML Engine</div>
            <h4 className="font-bold text-white text-sm">scikit-learn ML</h4>
            <p className="text-[11px] text-purple-200 leading-relaxed">
              Computes co-purchase Cosine Similarity on order matrix &amp; TF-IDF text embeddings.
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center text-slate-600">
            <ArrowRight className="w-5 h-5 text-purple-500" />
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
            <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Step 3: Gated Rules</div>
            <h4 className="font-bold text-white text-sm">Python Rule Engine</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Filters suggestions: Stock check, 30% Cart Price Cap, Max 2 suggestions limit, 10% Discount Cap.
            </p>
          </div>

        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
              <CreditCard className="w-4 h-4" />
              <span>Razorpay Test Mode Payment</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              FastAPI backend order creation (`/api/payment/create-order`), client-side Razorpay popup widget, signature HMAC verification, and built-in payment failure simulation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <Database className="w-4 h-4" />
              <span>SQLAlchemy SQLite Audit Trail</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Stores detailed audit trails for every NudgeAI session: timestamp, cart contents, ML candidate similarity scores, rule pass/fail status, user response, and Razorpay payment verification.
            </p>
          </div>

        </div>

        {/* Checklist */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Buildathon Evaluation Criteria Compliance</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Python FastAPI Backend with scikit-learn ML Engine</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Synthetic Order Dataset generator (pandas/numpy)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Bounded Rule Engine (30% price cap + stock gate)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Razorpay Test Mode checkout + failure simulation</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
