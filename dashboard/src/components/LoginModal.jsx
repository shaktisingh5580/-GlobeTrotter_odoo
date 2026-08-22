import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, Loader2, Sparkles } from 'lucide-react';

export default function LoginModal() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('admin@globetrotter.internal');
  const [password, setPassword] = useState('AdminSecretPass123!');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      // Handled by context
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@globetrotter.internal');
    setPassword('AdminSecretPass123!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0e14]/90 backdrop-blur-md">
      <div className="bg-[#161c28] border border-[#283347] rounded-3xl w-full max-w-md p-8 shadow-2xl animate-fade-in relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20 text-2xl">
            🌍
          </div>
          <h2 className="font-handwritten text-4xl font-bold text-white tracking-wide">
            GlobalTrotter
          </h2>
          <p className="text-xs font-semibold text-slate-400">
            Administrative & Telemetry Operations Portal
          </p>
        </div>

        {/* Quick Fill Demo Admin Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleQuickFill}
            className="w-full py-2 px-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl text-xs font-bold text-sky-400 hover:text-sky-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Use Default Seed Admin Credentials</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300">Admin Email</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@globetrotter.internal"
                className="w-full bg-[#10141d] border border-[#283347] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-colors font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Password</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#10141d] border border-[#283347] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-colors font-mono"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-sky-600/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShieldCheck size={16} />
            )}
            <span>Authenticate as Admin</span>
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-slate-500">
          Protected by NestJS Role Guards & 16-Tier Security Pipeline
        </div>
      </div>
    </div>
  );
}
