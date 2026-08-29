import React, { useState, useEffect } from 'react';
import { Package, Truck, MessageSquare, Send, CheckCircle2, Clock, ArrowRight, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config/api';


export default function OrdersView() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  // Post Purchase Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.orders && data.orders.length > 0 && !selectedOrderId) {
          setSelectedOrderId(data.orders[0].orderId);
          initChatForOrder(data.orders[0]);
        }
      }
    } catch (err) {
      console.error("Orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);


  const initChatForOrder = (order) => {
    setChatMessages([
      {
        sender: 'bot',
        text: `Hello! I am your Post-Purchase Support Agent for Order #${order.orderId}. Ask me "When will this arrive?" or "What accessories pair well with what I bought?"`
      }
    ]);
  };

  const handleSelectOrder = (ord) => {
    setSelectedOrderId(ord.orderId);
    initChatForOrder(ord);
  };

  const handleSendPostPurchaseChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !selectedOrderId) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await authFetch('/api/orders/post-purchase-chat', {
        method: 'POST',
        body: JSON.stringify({ orderId: selectedOrderId, message: userMsg })
      });
      const data = await res.json();


      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: data.reply,
          recommendedProducts: data.recommendedProducts || []
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { sender: 'bot', text: "Sorry, I ran into an issue connecting to the Post-Purchase Agent." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const selectedOrder = orders.find(o => o.orderId === selectedOrderId) || orders[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-[#ede0d5] dark:border-slate-800 bg-[#fffaf5] dark:bg-slate-900/90">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#5b824b]/10 text-[#5b824b] dark:text-emerald-400 border border-[#5b824b]/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold text-[#3a2e2a] dark:text-white">Order History &amp; Post-Purchase Agent</h1>
            <p className="text-xs text-[#6e5d57] dark:text-slate-400">Track completed orders &amp; ask the Post-Purchase Agent for delivery updates or cross-sell recommendations</p>
          </div>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#f5e9de] dark:bg-slate-800 text-[#3a2e2a] dark:text-slate-300 font-bold text-xs border border-[#ede0d5] dark:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Order History List */}
        <div className="space-y-3 lg:col-span-1">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#6e5d57] dark:text-slate-400 px-1">
            Completed Orders ({orders.length})
          </h3>

          {orders.map((ord) => {
            const isSelected = ord.orderId === selectedOrderId;
            return (
              <div
                key={ord.orderId}
                onClick={() => handleSelectOrder(ord)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-[#f4795b]/10 dark:bg-indigo-950/40 border-[#f4795b] shadow-md'
                    : 'glass-card bg-[#fffaf5] dark:bg-slate-900 border-[#ede0d5] dark:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#f4795b] dark:text-indigo-400 block">{ord.orderId}</span>
                    <span className="text-[10px] text-[#94827b] dark:text-slate-500 font-mono block mt-0.5">
                      {new Date(ord.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#5b824b]/15 text-[#5b824b] dark:text-emerald-300 border border-[#5b824b]/30 font-mono text-[10px] font-bold">
                    COMPLETED
                  </span>
                </div>

                <div className="mt-2 text-xs text-[#3a2e2a] dark:text-white font-medium line-clamp-1">
                  {ord.items?.map(i => i.name).join(', ') || 'Items'}
                </div>

                <div className="mt-2 flex justify-between items-center text-xs pt-2 border-t border-[#ede0d5] dark:border-slate-800">
                  <span className="text-[#6e5d57] dark:text-slate-400 font-mono text-[11px]">{ord.trackingNumber}</span>
                  <span className="font-mono font-extrabold text-[#3a2e2a] dark:text-white">₹{ord.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Order Breakdown & Interactive Post-Purchase Agent */}
        {selectedOrder && (
          <div className="lg:col-span-2 space-y-4">
            
            {/* Order Detail Summary Card */}
            <div className="glass-panel p-5 rounded-2xl border border-[#ede0d5] dark:border-slate-800 bg-[#fffaf5] dark:bg-slate-900/90 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#ede0d5] dark:border-slate-800">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#3a2e2a] dark:text-white">Order Details #{selectedOrder.orderId}</h3>
                  <p className="text-[11px] font-mono text-[#5b824b] dark:text-emerald-400 mt-0.5">{selectedOrder.estimatedDelivery}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#94827b] uppercase font-bold block">Total Paid</span>
                  <span className="font-mono font-extrabold text-base text-[#3a2e2a] dark:text-white">₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-[#fdf3ea] dark:bg-slate-950 border border-[#ede0d5] dark:border-slate-800">
                    <span className="font-medium text-[#3a2e2a] dark:text-white">{item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                    <span className="font-mono font-bold text-[#3a2e2a] dark:text-white">₹{(item.price * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Post-Purchase Support Agent Window */}
            <div className="glass-panel rounded-2xl border border-[#ede0d5] dark:border-slate-800 bg-[#fffaf5] dark:bg-slate-900 overflow-hidden flex flex-col h-[380px]">
              
              {/* Agent Window Header */}
              <div className="p-3.5 bg-[#fdf3ea] dark:bg-slate-950 border-b border-[#ede0d5] dark:border-slate-800 flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#f5b759]/20 text-[#d97706] dark:text-amber-400 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-[#3a2e2a] dark:text-white">Post-Purchase Agent (Order #{selectedOrder.orderId})</h4>
                  <p className="text-[10px] text-[#d97706] dark:text-amber-400 font-semibold">Delivery Tracking &amp; Complementary Cross-Sell Engine</p>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-[#fceef0]/20 dark:bg-transparent">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-3 rounded-2xl ${
                      m.sender === 'user'
                        ? 'bg-[#f4795b] text-white font-medium rounded-br-none'
                        : 'bg-[#fffaf5] dark:bg-slate-950 text-[#3a2e2a] dark:text-slate-200 border border-[#f5b759]/30 rounded-bl-none shadow-sm'
                    }`}>
                      <p>{m.text}</p>

                      {/* Recommended Products Carousel if returned */}
                      {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[#ede0d5] dark:border-slate-800 space-y-1.5">
                          {m.recommendedProducts.map((p) => (
                            <div key={p.id} className="p-2 rounded-lg bg-[#fdf3ea] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800 flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-[#3a2e2a] dark:text-white block">{p.name}</span>
                                <span className="text-[10px] text-[#6e5d57] dark:text-slate-400">{p.category}</span>
                              </div>
                              <span className="font-mono font-bold text-[#f4795b] dark:text-indigo-400">₹{p.price?.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="text-xs text-[#d97706] font-medium animate-pulse">
                    Post-Purchase Agent analyzing past order details...
                  </div>
                )}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendPostPurchaseChat} className="p-3 bg-[#fffaf5] dark:bg-slate-950 border-t border-[#ede0d5] dark:border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Ask delivery status or 'What accessories pair well?'..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#fdf3ea] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800 text-xs text-[#3a2e2a] dark:text-white focus:outline-none focus:border-[#f4795b]"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-2 rounded-xl bg-[#f4795b] text-white font-bold transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
