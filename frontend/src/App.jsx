import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import AIAgentModal from './components/AIAgentModal';
import RazorpayCheckoutModal from './components/RazorpayCheckoutModal';
import AuditLogsView from './components/AuditLogsView';
import ArchitectureModal from './components/ArchitectureModal';
import SettingsModal from './components/SettingsModal';
import ChatWidget from './components/ChatWidget';
import CampaignDashboard from './components/CampaignDashboard';
import AgentCatalogView from './components/AgentCatalogView';
import GuardianLogsView from './components/GuardianLogsView';
import OrdersView from './components/OrdersView';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { useTheme } from './hooks/useTheme';
import { getApiUrl } from './config/api';

import { Sparkles, ShieldCheck, Tag, ShoppingBag, ArrowRight, Brain, MessageSquare, TrendingUp, Bot, Package, Heart, Plus } from 'lucide-react';

export default function App() {
  const { themeMode, setThemeMode } = useTheme();
  const { user, token, authFetch, isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [smartBundles, setSmartBundles] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('store');
  const [apiConnected, setApiConnected] = useState(false);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // AI & Payment Data
  const [agentLoading, setAgentLoading] = useState(false);
  const [suggestionData, setSuggestionData] = useState(null);
  const [checkoutOrderData, setCheckoutOrderData] = useState(null);

  // API Credentials
  const [apiKey, setApiKey] = useState('');
  const [razorpayKey, setRazorpayKey] = useState('rzp_test_AiBuildathon2026');

  // Load Store Products & Smart AI Bundles
  const fetchProductsAndBundles = async () => {
    try {
      const resP = await fetch(getApiUrl('/api/products'));
      const dataP = await resP.json();
      if (dataP.success) {
        setProducts(dataP.products || []);
        setApiConnected(true);
      }

      const resB = await fetch(getApiUrl('/api/bundles'));
      const dataB = await resB.json();
      if (dataB.success) {
        setSmartBundles(dataB.bundles || []);
      }
    } catch (err) {
      console.error("Backend fetch error:", err);
      setApiConnected(false);
    }
  };


  // Sync user-scoped Cart & Wishlist from PostgreSQL database
  const syncUserCartAndWishlist = async () => {
    if (!token) {
      // Clear in-memory cart/wishlist on logout
      setCart([]);
      setWishlist([]);
      return;
    }
    try {
      // Sync Cart
      const resC = await authFetch('/api/cart');
      const dataC = await resC.json();
      if (dataC.success) {
        setCart(dataC.items || []);
      }

      // Sync Wishlist
      const resW = await authFetch('/api/wishlist');
      const dataW = await resW.json();
      if (dataW.success) {
        setWishlist(dataW.items || []);
      }
    } catch (err) {
      console.error("Failed to sync user cart/wishlist from PostgreSQL:", err);
    }
  };

  useEffect(() => {
    fetchProductsAndBundles();
  }, []);

  useEffect(() => {
    syncUserCartAndWishlist();
  }, [user, token]);

  // Cart operations (Account-Scoped PostgreSQL Persistence when logged in)
  const addToCart = async (product) => {
    if (product.stock <= 0) return;

    if (user && token) {
      try {
        const res = await authFetch('/api/cart/add', {
          method: 'POST',
          body: JSON.stringify({ product_id: product.id, quantity: 1 })
        });
        const data = await res.json();
        if (data.success) {
          setCart(data.items || []);
          return;
        }
      } catch (err) {
        console.error("Failed to add to DB cart:", err);
      }
    }

    // Unauthenticated Fallback
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const addBundleToCart = async (bundle) => {
    for (const item of bundle.items) {
      await addToCart(item);
    }
    setIsCartOpen(true);
  };

  const updateCartQty = async (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }

    if (user && token) {
      try {
        const res = await authFetch('/api/cart/update', {
          method: 'PUT',
          body: JSON.stringify({ product_id: id, quantity: newQty })
        });
        const data = await res.json();
        if (data.success) {
          setCart(data.items || []);
          return;
        }
      } catch (err) {
        console.error("Failed to update DB cart qty:", err);
      }
    }

    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const removeFromCart = async (id) => {
    if (user && token) {
      try {
        const res = await authFetch(`/api/cart/item/${id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          setCart(data.items || []);
          return;
        }
      } catch (err) {
        console.error("Failed to remove from DB cart:", err);
      }
    }

    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = async () => {
    if (user && token) {
      try {
        await authFetch('/api/cart/clear', { method: 'DELETE' });
        setCart([]);
        return;
      } catch (err) {
        console.error("Failed to clear DB cart:", err);
      }
    }
    setCart([]);
  };

  // Wishlist operations (Account-Scoped PostgreSQL Persistence when logged in)
  const toggleWishlist = async (product) => {
    if (user && token) {
      try {
        const res = await authFetch('/api/wishlist/toggle', {
          method: 'POST',
          body: JSON.stringify({ product_id: product.id })
        });
        const data = await res.json();
        if (data.success) {
          setWishlist(data.items || []);
          return;
        }
      } catch (err) {
        console.error("Failed to toggle DB wishlist:", err);
      }
    }

    setWishlist(prev => {
      const exists = prev.some(i => i.id === product.id);
      if (exists) return prev.filter(i => i.id !== product.id);
      return [...prev, product];
    });
  };

  const moveToCartFromWishlist = async (product) => {
    await addToCart(product);
    if (user && token) {
      await authFetch(`/api/wishlist/${product.id}`, { method: 'DELETE' });
      syncUserCartAndWishlist();
    } else {
      setWishlist(prev => prev.filter(i => i.id !== product.id));
    }
    setIsCartOpen(true);
  };

  // Trigger Upsell Agent (incorporating wishlist personalization signal)
  const handleProceedToAICheckout = async () => {
    setIsCartOpen(false);
    setIsAgentModalOpen(true);
    setAgentLoading(true);
    setSuggestionData(null);

    try {
      const res = await authFetch('/api/suggest', {
        method: 'POST',
        body: JSON.stringify({
          cartItems: cart,
          wishlistItems: wishlist,
          apiKey,
          sessionId: `sess_${Date.now()}`
        })
      });
      const data = await res.json();
      setSuggestionData(data);
    } catch (err) {
      console.error("SellSense Suggestion error:", err);
    } finally {
      setAgentLoading(false);
    }
  };

  // User accepts AI suggestions
  const handleAcceptSuggestions = async (selectedAddons = []) => {
    const auditId = suggestionData?.auditId;

    if (auditId) {
      try {
        await authFetch('/api/suggest/action', {
          method: 'POST',
          body: JSON.stringify({
            auditId,
            action: 'accepted',
            acceptedProducts: selectedAddons
          })
        });
      } catch (e) {}
    }

    const combinedItems = [
      ...cart.map(i => ({ ...i, finalPrice: i.price })),
      ...selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.finalPrice, quantity: 1, image: a.image }))
    ];

    const totalAmount = combinedItems.reduce((sum, item) => sum + (item.finalPrice || item.price) * (item.quantity || 1), 0);

    setCheckoutOrderData({
      auditId,
      items: combinedItems,
      cartSubtotal: cart.reduce((s, i) => s + i.price * (i.quantity || 1), 0),
      totalAmount,
      selectedAddons
    });

    setIsAgentModalOpen(false);
    setIsRazorpayModalOpen(true);
  };

  // User skips AI suggestions
  const handleSkipSuggestions = async () => {
    const auditId = suggestionData?.auditId;
    if (auditId) {
      try {
        await authFetch('/api/suggest/action', {
          method: 'POST',
          body: JSON.stringify({
            auditId,
            action: 'skipped',
            acceptedProducts: []
          })
        });
      } catch (e) {}
    }

    const totalAmount = cart.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
    setCheckoutOrderData({
      auditId,
      items: cart.map(i => ({ ...i, finalPrice: i.price })),
      totalAmount,
      selectedAddons: []
    });

    setIsAgentModalOpen(false);
    setIsRazorpayModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    clearCart();
    fetchProductsAndBundles();
  };

  const categories = ['All', ...new Set(products.map((p) => p.category))];
  const filteredProducts = categoryFilter === 'All'
    ? products
    : products.filter((p) => p.category === categoryFilter);

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        setIsCartOpen={setIsCartOpen}
        setIsWishlistOpen={setIsWishlistOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsArchOpen={setIsArchOpen}
        setIsChatOpen={setIsChatOpen}
        setIsAuthOpen={setIsAuthOpen}
        apiConnected={apiConnected}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />

      {/* Main Body Content */}
      <main className="flex-1">
        {activeTab === 'store' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
            
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl glass-panel border border-[#ede0d5] dark:border-slate-800 p-8 sm:p-10 shadow-xl bg-gradient-to-r from-[#fffaf5] via-[#fceef0] to-[#fffaf5] dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
              <div className="relative z-10 max-w-2xl space-y-4">
                
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f4795b]/10 text-[#f4795b] dark:bg-indigo-500/10 dark:text-indigo-300 border border-[#f4795b]/20 dark:border-indigo-500/20 text-xs font-mono font-bold uppercase tracking-wider">
                  <Brain className="w-3.5 h-3.5 text-[#f4795b] dark:text-indigo-400" />
                  <span>SellSense Multi-User Platform • PostgreSQL Engine</span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#3a2e2a] dark:text-white leading-tight tracking-tight">
                  Real ML Inference &amp; <span className="text-[#f4795b] dark:text-indigo-400">Agentic Commerce Engine</span>
                </h1>

                <p className="text-xs sm:text-sm text-[#6e5d57] dark:text-slate-300 leading-relaxed font-medium">
                  Persistent PostgreSQL database, bcrypt authentication, account-scoped cart &amp; wishlist, admin operations panel, and real-time ML inference.
                </p>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      const demoItem = products.find(p => p.id === 'prod-1') || products[0];
                      if (demoItem) addToCart(demoItem);
                      setIsCartOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#f4795b] hover:bg-[#e26243] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-[#f4795b]/20 dark:shadow-indigo-600/20 flex items-center space-x-2 active:scale-95"
                  >
                    <Brain className="w-4 h-4 text-white" />
                    <span>Try SellSense Upsell Agent</span>
                  </button>

                  {!user && (
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-[#f5b759]/15 hover:bg-[#f5b759]/25 text-[#8c5000] dark:text-amber-300 font-bold text-xs transition-all border border-[#f5b759]/30 flex items-center space-x-1.5 active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4 text-[#d97706] dark:text-amber-400" />
                      <span>Log In / Sign Up</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Smart AI-Generated Bundles Carousel Section */}
            {smartBundles.length > 0 && (
              <div className="space-y-4 p-6 rounded-3xl glass-panel bg-[#fdf3ea]/80 dark:bg-slate-950/40 border border-[#f5b759]/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-xl bg-[#f5b759]/20 text-[#d97706]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-display text-base font-extrabold text-[#3a2e2a] dark:text-white tracking-tight">
                        Smart AI-Generated Product Bundles
                      </h2>
                      <p className="text-[11px] text-[#6e5d57] dark:text-slate-400">Co-purchase affinity bundles with 10% bounded discount verified by Rule Engine</p>
                    </div>
                  </div>

                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#5b824b]/15 text-[#5b824b] font-mono font-bold border border-[#5b824b]/30">
                    10% DISCOUNT CAP PASSED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {smartBundles.map((b) => (
                    <div key={b.id} className="p-4 rounded-2xl glass-card bg-[#fffaf5] dark:bg-slate-900 border-[#ede0d5] dark:border-slate-800 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-display font-bold text-sm text-[#3a2e2a] dark:text-white">{b.title}</h3>
                          <span className="px-2 py-0.5 rounded bg-[#f4795b]/10 text-[#f4795b] font-mono font-bold text-[10px]">
                            Save 10%
                          </span>
                        </div>
                        <p className="text-xs text-[#6e5d57] dark:text-slate-400 mt-1 line-clamp-1">{b.tagline}</p>

                        <div className="space-y-2 mt-3">
                          {b.items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-2 p-1.5 rounded-xl bg-[#fdf3ea] dark:bg-slate-950 border border-[#ede0d5] dark:border-slate-800 text-xs">
                              <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover" />
                              <div className="flex-1 truncate">
                                <span className="font-medium text-[#3a2e2a] dark:text-white block truncate">{item.name}</span>
                                <span className="font-mono text-[10px] text-[#6e5d57]">₹{item.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#ede0d5] dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#94827b] line-through font-mono block">₹{b.rawSubtotal}</span>
                          <span className="font-mono text-base font-extrabold text-[#5b824b] dark:text-emerald-400">₹{b.bundledPrice}</span>
                        </div>

                        <button
                          onClick={() => addBundleToCart(b)}
                          className="px-3.5 py-2 rounded-xl bg-[#f4795b] hover:bg-[#e26243] text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Bundle to Cart</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="flex items-center justify-between border-b border-[#ede0d5] dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-[#f4795b] dark:bg-indigo-600 text-white shadow-md'
                        : 'bg-[#fffaf5] dark:bg-slate-900 text-[#6e5d57] dark:text-slate-400 hover:text-[#3a2e2a] dark:hover:text-white hover:bg-[#fceef0] dark:hover:bg-slate-800 border border-[#ede0d5] dark:border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <span className="text-xs text-[#6e5d57] dark:text-slate-400 hidden sm:block">
                Catalog: <strong className="font-mono text-[#3a2e2a] dark:text-white">{products.length}</strong> products ({categories.length - 1} categories)
              </span>
            </div>

            {/* Product Catalog Display — Sliding Category Carousels */}
            {categoryFilter === 'All' ? (
              <div className="space-y-10">
                {categories.filter(c => c !== 'All').map((cat, idx) => {
                  const catProducts = products.filter(p => p.category === cat);
                  if (catProducts.length === 0) return null;
                  const isBlushSection = idx % 2 === 1;

                  return (
                    <div 
                      key={cat} 
                      className={`p-5 rounded-3xl transition-all border ${
                        isBlushSection 
                          ? 'bg-[#fceef0]/70 dark:bg-slate-900/40 border-[#ede0d5] dark:border-slate-800/80' 
                          : 'bg-transparent border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <h2 className="font-display text-lg font-extrabold text-[#3a2e2a] dark:text-white tracking-tight">{cat}</h2>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdf3ea] dark:bg-slate-800 text-[#6e5d57] dark:text-slate-400 font-mono font-semibold border border-[#ede0d5] dark:border-slate-700">
                            {catProducts.length} items
                          </span>
                        </div>
                        <button
                          onClick={() => setCategoryFilter(cat)}
                          className="text-xs font-semibold text-[#f4795b] dark:text-indigo-400 hover:underline transition-colors"
                        >
                          View All in {cat} →
                        </button>
                      </div>

                      {/* Horizontal Sliding Carousel Row */}
                      <div className="relative group">
                        <div 
                          id={`carousel-${cat}`} 
                          className="flex space-x-4 overflow-x-auto pb-2 pt-1 scroll-smooth scrollbar-thin"
                        >
                          {catProducts.map((product) => {
                            const isInCart = cart.some((i) => i.id === product.id);
                            const isWishlisted = wishlist.some((i) => i.id === product.id);
                            return (
                              <div key={product.id} className="w-64 shrink-0">
                                <ProductCard
                                  product={product}
                                  onAddToCart={addToCart}
                                  isInCart={isInCart}
                                  isWishlisted={isWishlisted}
                                  onToggleWishlist={toggleWishlist}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-extrabold text-[#3a2e2a] dark:text-white tracking-tight">{categoryFilter} Products</h2>
                  <button 
                    onClick={() => setCategoryFilter('All')}
                    className="text-xs font-semibold text-[#f4795b] dark:text-indigo-400 hover:underline"
                  >
                    ← Back to All Categories
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => {
                    const isInCart = cart.some((i) => i.id === product.id);
                    const isWishlisted = wishlist.some((i) => i.id === product.id);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        isInCart={isInCart}
                        isWishlisted={isWishlisted}
                        onToggleWishlist={toggleWishlist}
                      />
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'campaigns' && <CampaignDashboard />}
        {activeTab === 'agent_api' && <AgentCatalogView />}
        {activeTab === 'guardian' && <GuardianLogsView />}
        {activeTab === 'logs' && <AuditLogsView />}
      </main>

      {/* Floating Bottom Bar when Cart has items */}
      {cart.length > 0 && activeTab === 'store' && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center space-x-3 px-5 py-3 rounded-2xl bg-[#f4795b] dark:bg-indigo-600 text-white font-bold text-xs shadow-xl shadow-[#f4795b]/30 dark:shadow-indigo-600/30 hover:bg-[#e26243] dark:hover:bg-indigo-500 active:scale-95 transition-all border border-[#f4795b]/30"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#f5b759] text-slate-950 font-mono font-bold text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <span>Checkout Cart (<strong className="font-mono">₹{cartSubtotal.toLocaleString('en-IN')}</strong>)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#ede0d5] dark:border-slate-800/80 bg-[#fceef0]/60 dark:bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-[#6e5d57] dark:text-slate-500 space-y-1">
          <p className="font-semibold text-[#3a2e2a] dark:text-slate-400">SellSense • Agentic Commerce &amp; ML Revenue Platform</p>
        </div>
      </footer>

      {/* Slide-over & Dialog Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={updateCartQty}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onProceedToCheckout={handleProceedToAICheckout}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={(id) => {
          const item = wishlist.find(i => i.id === id);
          if (item) toggleWishlist(item);
        }}
        onMoveToCart={moveToCartFromWishlist}
      />

      <AIAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        loading={agentLoading}
        suggestionData={suggestionData}
        cartSubtotal={cartSubtotal}
        onAcceptSuggestions={handleAcceptSuggestions}
        onSkipSuggestions={handleSkipSuggestions}
      />

      <RazorpayCheckoutModal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        orderData={checkoutOrderData}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailed={() => {}}
        razorpayKey={razorpayKey}
      />

      <ArchitectureModal
        isOpen={isArchOpen}
        onClose={() => setIsArchOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        razorpayKey={razorpayKey}
        setRazorpayKey={setRazorpayKey}
      />

      <ChatWidget
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onAddToCart={addToCart}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

    </div>
  );
}
