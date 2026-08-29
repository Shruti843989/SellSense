import React from 'react';
import { X, Heart, Trash2, Plus, ShoppingCart } from 'lucide-react';

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onMoveToCart
}) {
  if (!isOpen) return null;

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
              <div className="p-2 rounded-xl bg-[#c85450]/10 text-[#c85450] dark:text-rose-400 border border-[#c85450]/20">
                <Heart className="w-5 h-5 fill-[#c85450]/20" />
              </div>
              <div>
                <h2 className="font-bold text-[#3a2e2a] dark:text-white text-lg">Saved Wishlist</h2>
                <p className="text-xs text-[#6e5d57] dark:text-slate-400">{wishlist.length} saved item(s) • ML Soft Personalization Signal</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-[#94827b] hover:text-[#3a2e2a] dark:hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-[#fdf3ea] dark:bg-slate-800 flex items-center justify-center text-[#94827b] mb-4 border border-[#ede0d5] dark:border-slate-700">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-[#3a2e2a] dark:text-white text-base">Your wishlist is empty</h3>
                <p className="text-xs text-[#6e5d57] dark:text-slate-400 mt-1 max-w-xs">
                  Click the heart icon on any product card to save items for later. The ML recommender will factor them into future suggestions!
                </p>
              </div>
            ) : (
              wishlist.map((item) => (
                <div key={item.id} className="p-4 rounded-xl glass-card bg-[#fffaf5] dark:bg-slate-900 border-[#ede0d5] dark:border-slate-800 flex items-center justify-between space-x-4">
                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-[#fdf3ea] dark:bg-slate-800 border border-[#ede0d5] dark:border-slate-700" />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[#3a2e2a] dark:text-white text-xs truncate">{item.name}</h4>
                    <p className="text-xs text-[#f4795b] dark:text-indigo-400 font-mono font-bold mt-0.5">₹{item.price.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] text-[#94827b] dark:text-slate-400 block mt-0.5">{item.category}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onMoveToCart(item)}
                      className="px-3 py-1.5 rounded-lg bg-[#f4795b] hover:bg-[#e26243] text-white text-[11px] font-bold transition-all shadow-sm flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Move to Cart</span>
                    </button>

                    <button
                      onClick={() => onRemoveFromWishlist(item.id)}
                      className="p-1.5 text-[#94827b] hover:text-[#c85450]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-[#fdf3ea] dark:bg-slate-950 border-t border-[#ede0d5] dark:border-slate-800 text-[11px] text-[#6e5d57] dark:text-slate-400 text-center">
            ✓ Wishlist items act as a soft 0.3x weighted personalization signal in the ML recommender matrix.
          </div>

        </div>
      </div>
    </div>
  );
}
