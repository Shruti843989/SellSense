import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Check, Plus, AlertCircle, ArrowRight, X, ChevronDown, ChevronUp, Tag, Brain, Cpu } from 'lucide-react';

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
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel z-10 my-8">
        
        {/* Modal Top Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-white text-lg">NudgeAI Recommendation Agent</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
                  scikit-learn ML + Agent
                </span>
              </div>
              <p className="text-xs text-slate-400">Cosine similarity co-purchase matrix + NLP text vector scoring</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-purple-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <h4 className="text-lg font-bold text-white">Running NudgeAI ML Inference Pipeline...</h4>
            <p className="text-xs text-slate-400 mt-2 max-w-sm">
              1. Computing scikit-learn cosine similarity &amp; description TF-IDF embeddings.<br />
              2. Python AI Agent synthesizing rationale.<br />
              3. Executing Bounded Safety Gates (Stock, 30% Price Cap).
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* Rule Engine Verification Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-emerald-400">Rule Engine Gate Passed</span>
                    <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                      {suggestionData?.passedCount || 0} Suggestion(s) Approved
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Evaluated {suggestionData?.totalEvaluated || 0} candidates • Max 30% cart price limit strictly enforced
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRuleAudit(!showRuleAudit)}
                className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700"
              >
                <span>Audit Breakdown</span>
                {showRuleAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Collapsible Rule Engine Audit Log */}
            {showRuleAudit && (
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 text-xs">
                <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Rule Engine Candidate Evaluation Log</h5>
                <div className="space-y-2">
                  {suggestionData?.ruleResults?.map((res, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${res.overallPass ? 'border-emerald-800/50 bg-emerald-950/20' : 'border-rose-800/50 bg-rose-950/20'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white">{res.productName} (₹{res.productPrice})</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${res.overallPass ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                          {res.overallPass ? 'PASS' : 'REJECTED BY GATED RULE'}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                        <p>• Stock Check: <span className="text-slate-200">{res.rules?.stockGate?.detail}</span></p>
                        <p>• 30% Cart Price Cap: <span className="text-slate-200">{res.rules?.priceCapGate?.detail}</span></p>
                        <p>• Discount Limit: <span className="text-slate-200">{res.rules?.discountCapGate?.detail}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Display */}
            {(!suggestionData?.approvedSuggestions || suggestionData.approvedSuggestions.length === 0) ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h4 className="font-bold text-white text-base">No Suggestions Met Bounded Criteria</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  All ML candidates were filtered out by the Python Rule Engine to protect cart value bounds (e.g. price exceeded 30% limit or item out of stock).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Recommended Add-Ons for Your Order</h4>
                  <span className="text-xs text-cyan-400">Click card to select/unselect</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestionData.approvedSuggestions.map((item) => {
                    const isSelected = selectedProductIds.includes(item.id);
                    const mlConfidence = item.ml_metrics?.ml_confidence_percent || 85;

                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleSelect(item.id)}
                        className={`cursor-pointer p-4 rounded-2xl transition-all duration-200 border flex flex-col justify-between relative ${
                          isSelected 
                            ? 'bg-cyan-950/30 border-cyan-500 shadow-lg shadow-cyan-500/10' 
                            : 'glass-card border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Checkbox badge */}
                        <div className="absolute top-3 right-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isSelected ? 'bg-cyan-500 text-slate-950 font-bold scale-110' : 'border border-slate-600 bg-slate-800'
                          }`}>
                            {isSelected && <Check className="w-4 h-4" />}
                          </div>
                        </div>

                        <div>
                          {/* Image & Price Header */}
                          <div className="flex items-center space-x-3 mb-3">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-700" 
                            />
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                                  {mlConfidence}% ML Match
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-blue-950 text-cyan-400 border border-blue-800 text-[10px] font-semibold">
                                  {item.category}
                                </span>
                              </div>
                              <h5 className="font-bold text-white text-sm line-clamp-1 mt-1">{item.name}</h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-slate-400 line-through">₹{item.price}</span>
                                <span className="text-sm font-extrabold text-emerald-400">₹{item.finalPrice}</span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                                  {item.discountPercent}% OFF
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* AI Rationale Box */}
                          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                            <div className="flex items-center space-x-1 text-cyan-400 font-semibold text-[10px] uppercase tracking-wider">
                              <Sparkles className="w-3 h-3" />
                              <span>NudgeAI Rationale</span>
                            </div>
                            <p className="italic text-[11px] leading-relaxed">"{item.rationale}"</p>
                          </div>
                        </div>

                        {/* Gated verification pill */}
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center space-x-1 text-emerald-400">
                            <Check className="w-3 h-3" />
                            <span>Gated: In Stock &amp; &lt;30% Cart</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total Calculation & CTA buttons */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Cart Subtotal</span>
                <span className="text-white font-semibold">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              
              {selectedItems.length > 0 && (
                <div className="flex justify-between items-center text-sm text-emerald-400">
                  <span>Selected NudgeAI Add-ons ({selectedItems.length})</span>
                  <span className="font-semibold">+ ₹{upsellTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-base font-extrabold pt-2 border-t border-slate-800">
                <span className="text-white">Total Amount to Pay</span>
                <span className="text-cyan-400 text-lg">₹{finalPayableTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => onSkipSuggestions()}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all border border-slate-700 text-center"
                >
                  Skip Add-ons &amp; Pay Base
                </button>

                <button
                  onClick={() => onAcceptSuggestions(selectedItems)}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
                >
                  <span>Add &amp; Proceed to Razorpay</span>
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
