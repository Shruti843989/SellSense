import React from 'react';
import { ShoppingBag, ShieldCheck, ShieldAlert, Cpu, Settings, Brain, MessageSquare, TrendingUp, Bot } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  cartCount, 
  setIsCartOpen, 
  setIsSettingsOpen, 
  setIsArchOpen,
  setIsChatOpen,
  apiConnected 
}) {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Track Badge */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('store')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Brain className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">Sell<span className="text-cyan-400">Sense</span></span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Agentic Commerce &amp; ML Revenue Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('store')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'store' 
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Storefront
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'campaigns' 
                  ? 'bg-slate-800 text-purple-400 border border-purple-500/30 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Campaigns</span>
            </button>

            <button
              onClick={() => setActiveTab('agent_api')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'agent_api' 
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Agent API &amp; Buyer</span>
            </button>

            <button
              onClick={() => setActiveTab('guardian')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'guardian' 
                  ? 'bg-slate-800 text-red-400 border border-red-500/30 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Guardian Safety</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'logs' 
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={() => setIsArchOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Blueprint</span>
            </button>
          </nav>

          {/* Actions & Chat Trigger */}
          <div className="flex items-center space-x-3">
            
            {/* Chat Assistant Trigger */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="p-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 transition-all flex items-center space-x-1.5 text-xs font-semibold"
              title="Conversational AI Assistant"
            >
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">AI Chat</span>
            </button>

            {/* Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
              title="API Keys & Evaluator Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium text-sm hover:from-blue-500 hover:to-cyan-500 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center ml-1 animate-pulse">
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
