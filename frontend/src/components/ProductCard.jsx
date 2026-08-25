import React from 'react';
import { Plus, Check, Star, AlertTriangle, Tag } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, isInCart }) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className={`group rounded-2xl glass-card overflow-hidden transition-all duration-300 flex flex-col justify-between ${
      isOutOfStock ? 'opacity-70 border-rose-900/30' : 'hover:-translate-y-1'
    }`}>
      <div>
        {/* Product Visual Container */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-900">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

          {/* Category Tag */}
          <div className="absolute top-3 left-3 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[11px] font-semibold text-cyan-400">
            <Tag className="w-3 h-3 text-cyan-400" />
            <span>{product.category}</span>
          </div>

          {/* Stock Badge */}
          <div className="absolute top-3 right-3">
            {isOutOfStock ? (
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-950/90 text-rose-300 border border-rose-800 text-[11px] font-bold">
                <AlertTriangle className="w-3 h-3" />
                <span>Out of Stock</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[11px] font-medium">
                Stock: {product.stock}
              </span>
            )}
          </div>
        </div>

        {/* Product Info Body */}
        <div className="p-5">
          <div className="flex items-center space-x-1 mb-2 text-amber-400 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{product.rating || '4.5'}</span>
            <span className="text-slate-500 font-normal">({product.tags ? product.tags.slice(0, 2).join(', ') : 'Popular'})</span>
          </div>

          <h3 className="font-bold text-white text-base leading-snug group-hover:text-cyan-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer Price & Add CTA */}
      <div className="p-5 pt-0 flex items-center justify-between mt-2 border-t border-slate-800/60 pt-4">
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider block">Price</span>
          <span className="text-xl font-extrabold text-white">₹{product.price.toLocaleString('en-IN')}</span>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm ${
            isOutOfStock
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : isInCart
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20 active:scale-95'
          }`}
        >
          {isInCart ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
