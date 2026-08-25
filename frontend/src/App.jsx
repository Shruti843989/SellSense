import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import AIAgentModal from './components/AIAgentModal';
import RazorpayCheckoutModal from './components/RazorpayCheckoutModal';
import AuditLogsView from './components/AuditLogsView';
import ArchitectureModal from './components/ArchitectureModal';
import SettingsModal from './components/SettingsModal';
import ChatWidget from './components/ChatWidget';
import CampaignDashboard from './components/CampaignDashboard';
import AgentCatalogView from './components/AgentCatalogView';
import GuardianLogsView from './components/GuardianLogsView';

import { Sparkles, ShieldCheck, Tag, ShoppingBag, ArrowRight, Zap, RefreshCw, Brain, MessageSquare, TrendingUp, Bot } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'campaigns' | 'agent_api' | 'logs'
  const [apiConnected, setApiConnected] = useState(false);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // AI & Payment Data
  const [agentLoading, setAgentLoading] = useState(false);
  const [suggestionData, setSuggestionData] = useState(null);
  const [checkoutOrderData, setCheckoutOrderData] = useState(null);

  // API Credentials
  const [apiKey, setApiKey] = useState('');
  const [razorpayKey, setRazorpayKey] = useState('rzp_test_AiBuildathon2026');

  // Load Store Products
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setApiConnected(true);
      }
    } catch (err) {
      console.error("Backend fetch error:", err);
      setApiConnected(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) return;
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

  const updateCartQty = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Trigger NudgeAI Checkout Agent
  const handleProceedToAICheckout = async () => {
    setIsCartOpen(false);
    setIsAgentModalOpen(true);
    setAgentLoading(true);
    setSuggestionData(null);

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          apiKey,
          sessionId: `sess_${Date.now()}`
        })
      });
      const data = await res.json();
      setSuggestionData(data);
    } catch (err) {
      console.error("NudgeAI Suggestion error:", err);
    } finally {
      setAgentLoading(false);
    }
  };

  // User accepts AI suggestions
  const handleAcceptSuggestions = async (selectedAddons = []) => {
    const auditId = suggestionData?.auditId;

    if (auditId) {
      try {
        await fetch('/api/suggest/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      cartSubtotal: cart.reduce((s, i) => s + i.price * i.quantity, 0),
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
        await fetch('/api/suggest/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auditId,
            action: 'skipped',
            acceptedProducts: []
          })
        });
      } catch (e) {}
    }

    const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);
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
    fetchProducts();
  };

  const categories = ['All', ...new Set(products.map((p) => p.category))];
  const filteredProducts = categoryFilter === 'All'
    ? products
    : products.filter((p) => p.category === categoryFilter);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        setIsCartOpen={setIsCartOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsArchOpen={setIsArchOpen}
        setIsChatOpen={setIsChatOpen}
        apiConnected={apiConnected}
      />

      {/* Main Body Content */}
      <main className="flex-1">
        {activeTab === 'store' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl glass-panel border border-slate-800 p-8 sm:p-10 shadow-2xl">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-4">
                
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold uppercase tracking-wider">
                  <Brain className="w-3.5 h-3.5" />
                  <span>NudgeAI • AI Agentic Commerce Platform</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
                  Real ML Inference &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">Agent-to-Agent Commerce</span>
                </h1>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Revenue optimization via <strong className="text-cyan-400">scikit-learn co-purchase similarity &amp; NLP vector embeddings</strong>, conversational intent parsing, KMeans stock clustering, and a machine-readable <strong className="text-purple-400">Agent API (`/catalog/agent`)</strong> with Razorpay Test Mode checkout.
                </p>

                {/* Live Demo Quick Action */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      const demoItem = products.find(p => p.id === 'prod-1') || products[0];
                      if (demoItem) addToCart(demoItem);
                      setIsCartOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
                  >
                    <Brain className="w-4 h-4 text-slate-950" />
                    <span>Try NudgeAI Upsell Agent</span>
                  </button>

                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 font-semibold text-xs transition-all border border-purple-800 flex items-center space-x-1.5"
                  >
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span>Open AI Chat Assistant</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400 hidden sm:block">
                Showing <strong className="text-white">{filteredProducts.length}</strong> items
              </span>
            </div>

            {/* Product Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const isInCart = cart.some((i) => i.id === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    isInCart={isInCart}
                  />
                );
              })}
            </div>

          </div>
        )}

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
            className="flex items-center space-x-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all border border-cyan-400/30"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <span>Checkout Cart (₹{cartSubtotal.toLocaleString('en-IN')})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">NudgeAI • AI Agentic Commerce Platform</p>
          <p>Built for Razorpay AI Buildathon 2026 • Track: AI Growth &amp; Agentic Commerce</p>
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

    </div>
  );
}
