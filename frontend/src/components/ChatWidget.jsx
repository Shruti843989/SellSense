import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, X, Plus, Check, Bot, User } from 'lucide-react';

export default function ChatWidget({ isOpen, onClose, onAddToCart }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your NudgeAI Shopping Assistant. Tell me what you are looking for (e.g., "Find power bank under 2000" or "Recommend bluetooth headphones")!'
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
        { sender: 'bot', text: 'Sorry, I encountered an error connecting to the NudgeAI Agent.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col h-[520px]">
      
      {/* Header */}
      <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">NudgeAI Shopping Assistant</h3>
            <p className="text-[11px] text-emerald-400 font-medium">Conversational Intent Parser</p>
          </div>
        </div>

        <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl ${
              m.sender === 'user' 
                ? 'bg-cyan-500 text-slate-950 font-medium rounded-br-none' 
                : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
            }`}>
              <p className="leading-relaxed">{m.text}</p>

              {/* Products list in chat */}
              {m.products && m.products.length > 0 && (
                <div className="mt-3 space-y-2 pt-2 border-t border-slate-700/50">
                  {m.products.map((prod) => (
                    <div key={prod.id} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <img src={prod.image} alt={prod.name} className="w-9 h-9 rounded-lg object-cover" />
                        <div>
                          <h5 className="font-bold text-white text-[11px] line-clamp-1">{prod.name}</h5>
                          <span className="text-emerald-400 font-bold">₹{prod.price}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddToCart(prod)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-3 rounded-2xl text-slate-400 flex items-center space-x-2 text-xs">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>NudgeAI Assistant thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask for recommendations (e.g. power bank under 2000)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
