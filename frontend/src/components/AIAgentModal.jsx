import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Check, Plus, AlertCircle, ArrowRight, X, ChevronDown, ChevronUp, Tag, Brain, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AIAgentModal({ 
  isOpen, 
  onClose, 
  loading, 
  suggestionData, 
  cartSubtotal,
  onAcceptSuggestions,
  onSkipSuggestions 
}) {
  if (!isOpen) return null;

  const [selectedProductIds, setSelectedProductIds] = useState(
    suggestionData?.approvedSuggestions?.map(s => s.id) || []
  );
  const [showRuleAudit, setShowRuleAudit] = useState(false);

  const toggleSelect = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(item => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const selectedItems = (suggestionData?.approvedSuggestions || []).filter(s => selectedProductIds.includes(s.id));
  const upsellTotal = selectedItems.reduce((sum, item) => sum + item.finalPrice, 0);
  const finalPayableTotal = cartSubtotal + upsellTotal;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel z-10 my-8 animate-slide-up">
        
        {/* Modal Top Banner */}
        <div className="relative px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">SellSense Recommendation Agent</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                  scikit-learn ML + Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Cosine similarity co-purchase matrix + NLP text vector scoring</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="flex space-x-1.5 mb-4">
              <span className="agent-thinking-dot"></span>
              <span className="agent-thinking-dot"></span>
              <span className="agent-thinking-dot"></span>
            </div>
            <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">Running SellSense ML Inference Pipeline...</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
              1. Computing scikit-learn cosine similarity &amp; description TF-IDF embeddings.<br />
              2. Python AI Agent synthesizing rationale.<br />
              3. Executing Bounded Safety Gates (Stock, 30% Price Cap).
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* Rule Engine Verification Summary Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Rule Engine Gate Passed</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-900 font-mono">
                      {suggestionData?.passedCount || 0} Approved
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Evaluated {suggestionData?.totalEvaluated || 0} candidates • Max 30% cart price limit strictly enforced
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRuleAudit(!showRuleAudit)}
                className="flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <span>Audit Breakdown</span>
                {showRuleAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Collapsible Rule Engine Audit Log */}
            {showRuleAudit && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <h5 className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">Rule Engine Evaluation Log</h5>
                <div className="space-y-2">
                  {suggestionData?.ruleResults?.map((res, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${res.overallPass ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-900 dark:text-white">{res.productName} (₹{res.productPrice})</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${res.overallPass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                          {res.overallPass ? 'PASS' : 'REJECTED BY GATED RULE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Carousel Recommendations Display */}
            {(!suggestionData?.approvedSuggestions || suggestionData.approvedSuggestions.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">No Suggestions Met Bounded Criteria</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  All ML candidates were filtered out by the Python Rule Engine to protect cart value bounds (e.g. price exceeded 30% limit or item out of stock).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-slate-900 dark:text-white text-xs">Recommended Add-Ons for Your Order</h4>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Click to select</span>
                </div>

                {/* Horizontal Sliding Carousel */}
                <div className="flex space-x-4 overflow-x-auto pb-3 scrollbar-thin">
                  {suggestionData.approvedSuggestions.map((item) => {
                    const isSelected = selectedProductIds.includes(item.id);
                    const mlConfidence = item.ml_metrics?.ml_confidence_percent || 85;

                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleSelect(item.id)}
                        className={`w-64 shrink-0 cursor-pointer p-4 rounded-xl transition-all border flex flex-col justify-between relative ${
                          isSelected 
                            ? 'bg-indigo-500/10 dark:bg-indigo-950/40 border-indigo-500 shadow-md' 
                            : 'glass-card border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Checkbox badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected ? 'bg-indigo-600 text-white font-bold' : 'border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>

                        <div>
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-28 rounded-lg object-cover bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" 
                          />
                          <div className="flex items-center space-x-1.5 pt-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-bold">
                              {mlConfidence}% ML Match
                            </span>
                          </div>
                          <h5 className="font-display font-bold text-slate-900 dark:text-white text-xs mt-1 line-clamp-1">{item.name}</h5>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[11px] text-slate-400 line-through font-mono">₹{item.price}</span>
                            <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">₹{item.finalPrice}</span>
                          </div>

                          {/* AI Rationale Box */}
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-amber-500/20 text-[11px] text-slate-700 dark:text-slate-300 mt-2">
                            <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-bold text-[9px] uppercase tracking-wider">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>SellSense Rationale</span>
                            </div>
                            <p className="italic text-[10px] leading-relaxed line-clamp-2 mt-0.5">"{item.rationale}"</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total Calculation & CTA buttons */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Cart Subtotal</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              
              {selectedItems.length > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400">
                  <span>Selected Add-ons ({selectedItems.length})</span>
                  <span className="font-mono font-semibold">+ ₹{upsellTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-extrabold pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-900 dark:text-white">Total Amount to Pay</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 text-base">₹{finalPayableTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => onSkipSuggestions()}
                  className="py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold text-xs transition-all border border-slate-300 dark:border-slate-700 text-center"
                >
                  Skip Add-ons &amp; Pay Base
                </button>

                <button
                  onClick={() => onAcceptSuggestions(selectedItems)}
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 active:scale-95"
                >
                  <span>Add &amp; Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
