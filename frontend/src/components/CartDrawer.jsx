import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart, Sparkles, ArrowRight, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  onUpdateQty, 
  onRemoveItem, 
  onClearCart, 
  onProceedToCheckout 
}) {
  if (!isOpen) return null;

  const [abandonedNudge, setAbandonedNudge] = useState(null);
  const [triggeringNudge, setTriggeringNudge] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal > 2000 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + delivery;

  const handleTriggerAbandonedCartNudge = async () => {
    if (cart.length === 0) return;
    setTriggeringNudge(true);
    setAbandonedNudge(null);

    try {
      const res = await fetch(getApiUrl('/api/abandoned-cart/trigger'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: cart })
      });
      const data = await res.json();

      setAbandonedNudge(data);
    } catch (err) {
      console.error("Abandoned cart trigger error:", err);
    } finally {
      setTriggeringNudge(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#fffaf5] dark:bg-slate-900 border-l border-[#ede0d5] dark:border-slate-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-[#ede0d5] dark:border-slate-800 flex items-center justify-between bg-[#fdf3ea] dark:bg-slate-950">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#f4795b]/10 text-[#f4795b] dark:text-indigo-400 border border-[#f4795b]/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-[#3a2e2a] dark:text-white text-lg">Your Cart</h2>
                <p className="text-xs text-[#6e5d57] dark:text-slate-400">{cart.length} item(s) selected</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-[#94827b] hover:text-[#3a2e2a] dark:hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-[#fdf3ea] dark:bg-slate-800/80 flex items-center justify-center text-[#94827b] mb-4 border border-[#ede0d5] dark:border-slate-700">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-[#3a2e2a] dark:text-white text-base">Your cart is empty</h3>
                <p className="text-xs text-[#6e5d57] dark:text-slate-400 mt-1 max-w-xs">Add products from our catalog to test the AI Upsell Agent.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center pb-2 border-b border-[#ede0d5] dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6e5d57] dark:text-slate-400">Cart Contents</span>
                  <button 
                    onClick={onClearCart}
                    className="text-xs text-[#c85450] hover:text-[#b54440] flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cart</span>
                  </button>
                </div>

                {cart.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl glass-card bg-[#fffaf5] dark:bg-slate-900 border-[#ede0d5] dark:border-slate-800 flex items-center space-x-4">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover bg-[#fdf3ea] dark:bg-slate-800 border border-[#ede0d5] dark:border-slate-700" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#3a2e2a] dark:text-white text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-[#f4795b] dark:text-indigo-400 font-semibold mt-0.5">₹{item.price.toLocaleString('en-IN')}</p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 mt-2">
                        <button 
                          onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                          className="p-1 rounded-md bg-[#fdf3ea] dark:bg-slate-800 hover:bg-[#f5e9de] dark:hover:bg-slate-700 text-[#3a2e2a] dark:text-slate-300 transition-all border border-[#ede0d5] dark:border-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-[#3a2e2a] dark:text-white px-2">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                          className="p-1 rounded-md bg-[#fdf3ea] dark:bg-slate-800 hover:bg-[#f5e9de] dark:hover:bg-slate-700 text-[#3a2e2a] dark:text-slate-300 transition-all border border-[#ede0d5] dark:border-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-[#94827b] hover:text-[#c85450] transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Abandoned Cart Demo Trigger Button */}
                <div className="pt-2">
                  <button
                    onClick={handleTriggerAbandonedCartNudge}
                    disabled={triggeringNudge}
                    className="w-full py-2 px-3 rounded-xl bg-[#f5b759]/15 hover:bg-[#f5b759]/25 text-[#8c5000] dark:text-amber-300 border border-[#f5b759]/40 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Simulate Abandoned Cart Recovery Agent Nudge</span>
                  </button>
                </div>

                {/* Abandoned Cart Nudge Output Card */}
                {abandonedNudge && (
                  <div className="p-3.5 rounded-xl bg-[#fdf0d8] dark:bg-amber-950/30 border border-[#f5b759]/50 text-xs space-y-1.5 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[10px] text-[#8c5000] dark:text-amber-300 uppercase tracking-wider">
                        [AGENT: {abandonedNudge.agentName}]
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#5b824b]/15 text-[#5b824b] font-mono text-[9px] font-bold">
                        {abandonedNudge.guardianVerdict}
                      </span>
                    </div>
                    <p className="text-[#3a2e2a] dark:text-amber-100 italic leading-relaxed">"{abandonedNudge.message}"</p>
                    <div className="text-[10px] text-[#8c5000] dark:text-amber-400 font-mono font-bold">
                      ✓ Logged in SQLite Audit Trail under session <span className="underline">{abandonedNudge.auditId}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer & Checkout Trigger */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-[#ede0d5] dark:border-slate-800 bg-[#fdf3ea] dark:bg-slate-950/60 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#6e5d57] dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-[#3a2e2a] dark:text-white font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#6e5d57] dark:text-slate-400 text-xs">
                  <span>Standard Shipping</span>
                  <span>{delivery === 0 ? <span className="text-[#5b824b] font-semibold">FREE</span> : `₹${delivery}`}</span>
                </div>
                <div className="flex justify-between text-[#3a2e2a] dark:text-white font-bold text-base pt-2 border-t border-[#ede0d5] dark:border-slate-800">
                  <span>Cart Total</span>
                  <span className="text-[#f4795b] dark:text-indigo-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Bounded Rules Preview Pill */}
              <div className="px-3 py-2 rounded-lg bg-[#5b824b]/10 border border-[#5b824b]/30 text-[11px] text-[#5b824b] dark:text-emerald-300 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Bounded Rule Check will filter AI suggestions (max 30% price cap)</span>
              </div>

              {/* Trigger AI Checkout */}
              <button
                onClick={onProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-[#f4795b] hover:bg-[#e26243] dark:bg-indigo-600 text-white font-bold text-sm transition-all shadow-lg shadow-[#f4795b]/20 flex items-center justify-center space-x-2 group active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Proceed to AI Checkout</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
