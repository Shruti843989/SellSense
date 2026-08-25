import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal > 2000 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + delivery;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">Your Cart</h2>
                <p className="text-xs text-slate-400">{cart.length} item(s) selected</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4 border border-slate-700">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-white text-base">Your cart is empty</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Add products from our catalog to test the AI Upsell Agent.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cart Contents</span>
                  <button 
                    onClick={onClearCart}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cart</span>
                  </button>
                </div>

                {cart.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl glass-card flex items-center space-x-4">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover bg-slate-800 border border-slate-700" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-cyan-400 font-semibold mt-0.5">₹{item.price.toLocaleString('en-IN')}</p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 mt-2">
                        <button 
                          onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-2">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer & Checkout Trigger */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-slate-800 bg-slate-950/60 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Standard Shipping</span>
                  <span>{delivery === 0 ? <span className="text-emerald-400 font-semibold">FREE</span> : `₹${delivery}`}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-slate-800">
                  <span>Cart Total</span>
                  <span className="text-cyan-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Bounded Rules Preview Pill */}
              <div className="px-3 py-2 rounded-lg bg-blue-950/40 border border-blue-800/50 text-[11px] text-blue-300 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Bounded Rule Check will filter AI suggestions (max 30% price cap)</span>
              </div>

              {/* Trigger AI Checkout */}
              <button
                onClick={onProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 group active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
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
