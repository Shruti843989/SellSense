import React from 'react';
import { ShoppingBag, ShieldCheck, ShieldAlert, Cpu, Settings, Brain, MessageSquare, TrendingUp, Bot, Sun, Moon, Laptop, Heart, Package } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  cartCount, 
  wishlistCount = 0,
  setIsCartOpen, 
  setIsWishlistOpen,
  setIsSettingsOpen, 
  setIsArchOpen,
  setIsChatOpen,
  apiConnected,
  themeMode,
  setThemeMode
}) {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-[#ede0d5] dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('store')}>
            <div className="w-9 h-9 rounded-xl bg-[#f4795b] dark:bg-indigo-600 flex items-center justify-center shadow-md shadow-[#f4795b]/20 dark:shadow-indigo-600/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-lg tracking-tight text-[#3a2e2a] dark:text-white">
                  Sell<span className="text-[#f4795b] dark:text-indigo-400">Sense</span>
                </span>
              </div>
              <p className="text-[11px] text-[#6e5d57] dark:text-slate-400 font-medium hidden sm:block">Agentic Commerce &amp; ML Revenue Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('store')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'store' 
                  ? 'bg-[#f4795b]/10 text-[#f4795b] dark:bg-indigo-500/10 dark:text-indigo-300 border border-[#f4795b]/30 dark:border-indigo-500/30 shadow-sm' 
                  : 'text-[#6e5d57] dark:text-slate-300 hover:text-[#3a2e2a] dark:hover:text-white hover:bg-[#fceef0] dark:hover:bg-slate-800/50'
              }`}
            >
              Storefront
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'orders' 
                  ? 'bg-[#5b824b]/10 text-[#5b824b] dark:bg-emerald-500/10 dark:text-emerald-300 border border-[#5b824b]/30 dark:border-emerald-500/30 shadow-sm' 
                  : 'text-[#6e5d57] dark:text-slate-300 hover:text-[#3a2e2a] dark:hover:text-white hover:bg-[#fceef0] dark:hover:bg-slate-800/50'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-[#5b824b] dark:text-emerald-400" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'campaigns' 
                  ? 'bg-[#f5b759]/15 text-[#b45309] dark:bg-amber-500/10 dark:text-amber-300 border border-[#f5b759]/40 dark:border-amber-500/30 shadow-sm' 
                  : 'text-[#6e5d57] dark:text-slate-300 hover:text-[#3a2e2a] dark:hover:text-white hover:bg-[#fceef0] dark:hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#d97706] dark:text-amber-400" />
              <span>AI Campaigns</span>
            </button>

            <button
              onClick={() => setActiveTab('agent_api')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'agent_api' 
                  ? 'bg-[#f4795b]/10 text-[#f4795b] dark:bg-indigo-500/10 dark:text-indigo-300 border border-[#f4795b]/30 dark:border-indigo-500/30 shadow-sm' 
                  : 'text-[#6e5d57] dark:text-slate-300 hover:text-[#3a2e2a] dark:hover:text-white hover:bg-[#fceef0] dark:hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-[#f4795b] dark:text-indigo-400" />
              <span>Agent API &amp; Buyer</span>
            </button>

            <button
              onClick={() => setActiveTab('guardian')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'guardian' 
                  ? 'bg-[#c85450]/10 text-[#c85450] dark:bg-rose-500/10 dark:text-rose-300 border border-[#c85450]/30 dark:border-rose-500/30 shadow-sm' 
                  : 'text-[#6e5d57] dark:text-slate-300 hover:text-[#3a2e2a] dark:hover:text-white hover:bg-[#fceef0] dark:hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#c85450] dark:text-rose-400" />
              <span>Guardian Safety</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'logs' 
                  ? 'bg-[#5b824b]/10 text-[#5b824b] dark:bg-emerald-500/10 dark:text-emerald-300 border border-[#5b824b]/30 dark:border-emerald-500/30 shadow-sm' 
                  : 'text-[#6e5d57] dark:text-slate-300 hover:text-[#3a2e2a] dark:hover:text-white hover:bg-[#fceef0] dark:hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#5b824b] dark:text-emerald-400" />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={() => setIsArchOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6e5d57] dark:text-slate-300 hover:text-[#3a2e2a] dark:hover:text-white hover:bg-[#fceef0] dark:hover:bg-slate-800/50 transition-all"
            >
              <Cpu className="w-3.5 h-3.5 text-[#f5b759] dark:text-amber-400" />
              <span>Blueprint</span>
            </button>
          </nav>

          {/* Actions, Wishlist, Theme Switcher & Chat Trigger */}
          <div className="flex items-center space-x-2">
            
            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2 rounded-xl bg-[#fdf3ea] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800 text-[#c85450] dark:text-rose-400 hover:bg-[#fceef0] transition-all"
              title="Saved Wishlist Items"
            >
              <Heart className="w-4 h-4 fill-[#c85450]/20" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#c85450] text-white font-mono font-bold text-[10px] flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Theme Switcher Segmented Control */}
            <div className="flex items-center space-x-0.5 p-1 rounded-xl bg-[#f5e9de] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800">
              <button
                onClick={() => setThemeMode('light')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  themeMode === 'light'
                    ? 'bg-[#fffaf5] text-[#f4795b] shadow-sm font-bold'
                    : 'text-[#6e5d57] hover:text-[#3a2e2a] dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Warm Pastel Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setThemeMode('dark')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  themeMode === 'dark'
                    ? 'bg-slate-800 text-indigo-400 shadow-sm font-bold'
                    : 'text-[#6e5d57] hover:text-[#3a2e2a] dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Dark Theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setThemeMode('system')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  themeMode === 'system'
                    ? 'bg-[#f4795b] dark:bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-[#6e5d57] hover:text-[#3a2e2a] dark:text-slate-400 dark:hover:text-white'
                }`}
                title="System OS Preference"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chat Assistant Trigger */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#f5b759]/15 hover:bg-[#f5b759]/25 border border-[#f5b759]/30 text-[#8c5000] dark:text-amber-300 transition-all flex items-center space-x-1.5 text-xs font-bold shadow-sm"
              title="Conversational Session Agent"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#d97706] dark:text-amber-400" />
              <span className="hidden sm:inline">AI Chat</span>
            </button>

            {/* Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-xl text-[#6e5d57] dark:text-slate-400 hover:text-[#3a2e2a] dark:hover:text-white hover:bg-[#fceef0] dark:hover:bg-slate-800 transition-all border border-transparent"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[#f4795b] hover:bg-[#e26243] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-[#f4795b]/20 dark:shadow-indigo-600/20 active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#f5b759] text-slate-950 font-mono font-bold text-[10px] flex items-center justify-center ml-0.5">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
