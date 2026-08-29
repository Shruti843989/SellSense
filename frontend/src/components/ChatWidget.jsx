import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, X, Plus, Check, Bot, User, ChevronRight, ChevronLeft, Brain } from 'lucide-react';

export default function ChatWidget({ isOpen, onClose, onAddToCart }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your SellSense Shopping Assistant. Tell me what you are looking for (e.g., "Find power bank under 2000" or "I need something under 500")!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: data.reply || "Here are matching recommendations:",
          products: data.recommendedProducts || []
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an error connecting to the SellSense Agent.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-[#fffaf5] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col h-[540px] animate-slide-up">
      
      {/* Header */}
      <div className="px-5 py-4 bg-[#fdf3ea] dark:bg-slate-950 border-b border-[#ede0d5] dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#f5b759]/20 text-[#d97706] dark:text-amber-400 border border-[#f5b759]/40 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-[#3a2e2a] dark:text-white text-xs">SellSense Session Assistant</h3>
            <p className="text-[10px] text-[#d97706] dark:text-amber-400 font-semibold tracking-wide uppercase">Conversational Memory &amp; Budget Engine</p>
          </div>
        </div>

        <button onClick={onClose} className="p-1.5 rounded-lg text-[#94827b] hover:text-[#3a2e2a] dark:hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-[#fceef0]/30 dark:bg-transparent">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}>
            <div className={`max-w-[90%] p-3.5 rounded-2xl ${
              m.sender === 'user' 
                ? 'bg-[#f4795b] dark:bg-indigo-600 text-white font-medium rounded-br-none shadow-sm' 
                : 'bg-[#fffaf5] dark:bg-slate-950 text-[#3a2e2a] dark:text-slate-200 border border-[#f5b759]/30 rounded-bl-none shadow-sm'
            }`}>
              <p className="leading-relaxed">{m.text}</p>

              {/* Horizontal Product Carousel in Chat */}
              {m.products && m.products.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#ede0d5] dark:border-slate-800/80">
                  <div className="flex space-x-2.5 overflow-x-auto pb-1 scrollbar-thin">
                    {m.products.map((prod) => (
                      <div 
                        key={prod.id} 
                        className="w-40 shrink-0 p-2.5 rounded-xl bg-[#fdf3ea] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800 flex flex-col justify-between space-y-2 hover:border-[#f4795b]/40 transition-all shadow-sm"
                      >
                        <img src={prod.image} alt={prod.name} className="w-full h-20 rounded-lg object-cover" />
                        <div>
                          <h5 className="font-display font-bold text-[#3a2e2a] dark:text-white text-[11px] line-clamp-1">{prod.name}</h5>
                          <p className="text-[10px] text-[#6e5d57] dark:text-slate-400 line-clamp-1">{prod.category}</p>
                          <div className="text-[#3a2e2a] dark:text-white font-mono font-extrabold text-xs mt-0.5">₹{prod.price?.toLocaleString('en-IN')}</div>
                        </div>

                        <button
                          onClick={() => onAddToCart(prod)}
                          className="w-full py-1.5 rounded-lg bg-[#f4795b] hover:bg-[#e26243] dark:bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center space-x-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-message-in">
            <div className="bg-[#fffaf5] dark:bg-slate-950 p-3.5 rounded-2xl border border-[#f5b759]/40 text-[#8c5000] dark:text-amber-300 flex items-center space-x-2 text-xs shadow-sm">
              <span className="flex space-x-1">
                <span className="agent-thinking-dot"></span>
                <span className="agent-thinking-dot"></span>
                <span className="agent-thinking-dot"></span>
              </span>
              <span className="font-medium text-[11px] ml-1">SellSense Agent evaluating session memory...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-[#fffaf5] dark:bg-slate-950 border-t border-[#ede0d5] dark:border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask for recommendations (e.g. budget is 2000)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-3.5 py-2 rounded-xl bg-[#fdf3ea] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800 text-xs text-[#3a2e2a] dark:text-white placeholder-[#94827b] focus:outline-none focus:border-[#f4795b]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-[#f4795b] hover:bg-[#e26243] text-white font-bold transition-all disabled:opacity-50 active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
