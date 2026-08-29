import React from 'react';
import { Plus, Check, Star, AlertTriangle, Tag, Heart } from 'lucide-react';

export default function ProductCard({ 
  product, 
  onAddToCart, 
  isInCart, 
  isWishlisted = false, 
  onToggleWishlist 
}) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className={`group rounded-2xl glass-card overflow-hidden flex flex-col justify-between relative ${
      isOutOfStock ? 'opacity-60 border-[#c85450]/30' : ''
    }`}>
      <div>
        {/* Product Visual Container with Clean Backing */}
        <div className="relative h-44 w-full overflow-hidden bg-[#fdf3ea] dark:bg-slate-900">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3a2e2a]/40 dark:from-slate-950 via-transparent to-transparent opacity-80" />

          {/* Category Tag */}
          <div className="absolute top-3 left-3 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#fffaf5]/90 dark:bg-slate-950/80 backdrop-blur-md border border-[#ede0d5] dark:border-slate-700 text-[11px] font-semibold text-[#f4795b] dark:text-indigo-300 shadow-sm">
            <Tag className="w-3 h-3 text-[#f4795b] dark:text-indigo-400" />
            <span>{product.category}</span>
          </div>

          {/* Wishlist Heart Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleWishlist) onToggleWishlist(product);
            }}
            className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md transition-all z-10 ${
              isWishlisted
                ? 'bg-[#c85450] text-white shadow-md'
                : 'bg-[#fffaf5]/90 dark:bg-slate-900/90 text-[#94827b] hover:text-[#c85450] dark:text-slate-300 border border-[#ede0d5] dark:border-slate-700'
            }`}
            title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
          </button>

          {/* Stock Badge */}
          <div className="absolute bottom-2 left-3">
            {isOutOfStock ? (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#c85450]/15 dark:bg-rose-950/90 text-[#c85450] dark:text-rose-300 border border-[#c85450]/30 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3" />
                <span>Out of Stock</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-[#fffaf5]/90 dark:bg-slate-900/90 text-[#3a2e2a] dark:text-slate-300 border border-[#ede0d5] dark:border-slate-700 text-[10px] font-medium font-mono shadow-sm">
                Stock: {product.stock}
              </span>
            )}
          </div>
        </div>

        {/* Product Info Body */}
        <div className="p-4">
          <div className="flex items-center space-x-1.5 mb-1.5 text-[#d98e32] dark:text-amber-400 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-[#f5b759] text-[#f5b759]" />
            <span className="font-mono">{product.rating || '4.5'}</span>
            <span className="text-[#94827b] dark:text-slate-500 font-normal">({product.tags ? product.tags.slice(0, 2).join(', ') : 'Popular'})</span>
          </div>

          <h3 className="font-display font-bold text-[#3a2e2a] dark:text-white text-sm leading-snug group-hover:text-[#f4795b] dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-[#6e5d57] dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer Price & Add CTA */}
      <div className="p-4 pt-0 flex items-center justify-between mt-2 border-t border-[#ede0d5] dark:border-slate-800/80 pt-3">
        <div>
          <span className="text-[10px] text-[#94827b] dark:text-slate-400 font-bold uppercase tracking-wider block">Price</span>
          <span className="text-lg font-mono font-extrabold text-[#3a2e2a] dark:text-white">₹{product.price.toLocaleString('en-IN')}</span>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm ${
            isOutOfStock
              ? 'bg-[#f5e9de] dark:bg-slate-800 text-[#94827b] cursor-not-allowed border border-[#ede0d5] dark:border-slate-700'
              : isInCart
              ? 'bg-[#5b824b]/15 text-[#5b824b] dark:text-emerald-300 border border-[#5b824b]/30 hover:bg-[#5b824b]/25'
              : 'bg-[#f4795b] hover:bg-[#e26243] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-[#f4795b]/20 active:scale-95'
          }`}
        >
          {isInCart ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
