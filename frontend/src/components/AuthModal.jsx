import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' or 'signup'
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (tab === 'signup') {
        if (!name.trim()) {
          throw new Error("Please enter your name.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        await signup(name, email, password);
        setSuccessMsg("Account created successfully!");
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        await login(email, password);
        setSuccessMsg("Logged in successfully!");
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#fffaf5] dark:bg-slate-900 border border-[#ede0d5] dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#6e5d57] dark:text-slate-400 hover:bg-[#fceef0] dark:hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#f4795b]/10 dark:bg-indigo-500/10 text-[#f4795b] dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-[#f4795b]/20">
            {tab === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h2 className="font-display text-2xl font-extrabold text-[#3a2e2a] dark:text-white tracking-tight">
            {tab === 'login' ? 'Welcome Back to SellSense' : 'Create Customer Account'}
          </h2>
          <p className="text-xs text-[#6e5d57] dark:text-slate-400 mt-1 font-medium">
            {tab === 'login' 
              ? 'Log in with your email to access saved cart, wishlist & order history' 
              : 'Join SellSense to unlock persistent shopping context across devices'}
          </p>
        </div>

        {/* Tab Switcher Segmented Control */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#f5e9de] dark:bg-slate-950 rounded-2xl mb-6 border border-[#ede0d5] dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); setSuccessMsg(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-white dark:bg-slate-800 text-[#f4795b] dark:text-indigo-400 shadow-md'
                : 'text-[#6e5d57] dark:text-slate-400 hover:text-[#3a2e2a]'
            }`}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); setSuccessMsg(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'signup'
                ? 'bg-white dark:bg-slate-800 text-[#f4795b] dark:text-indigo-400 shadow-md'
                : 'text-[#6e5d57] dark:text-slate-400 hover:text-[#3a2e2a]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-[#3a2e2a] dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-[#94827b] dark:text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-[#ede0d5] dark:border-slate-800 text-xs text-[#3a2e2a] dark:text-white focus:outline-none focus:border-[#f4795b] dark:focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#3a2e2a] dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#94827b] dark:text-slate-500" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-[#ede0d5] dark:border-slate-800 text-xs text-[#3a2e2a] dark:text-white focus:outline-none focus:border-[#f4795b] dark:focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3a2e2a] dark:text-slate-300 mb-1">
              Password {tab === 'signup' && <span className="text-[10px] text-[#94827b] font-normal">(Min 6 chars)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#94827b] dark:text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-[#ede0d5] dark:border-slate-800 text-xs text-[#3a2e2a] dark:text-white focus:outline-none focus:border-[#f4795b] dark:focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-[#f4795b] hover:bg-[#e26243] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-[#f4795b]/20 dark:shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="inline-block animate-spin font-mono">↻ Processing...</span>
            ) : (
              <>
                {tab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{tab === 'login' ? 'Log In to Account' : 'Create Account'}</span>
              </>
            )}
          </button>

        </form>

        {/* Footer Note */}
        <p className="text-[11px] text-[#94827b] dark:text-slate-500 text-center mt-6">
          Protected by bcrypt hashing &amp; signed JWT session tokens.
        </p>

      </div>
    </div>
  );
}
