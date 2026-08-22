import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, Globe, Sparkles, RefreshCw } from 'lucide-react';

export default function Header({ onRefresh, isRefreshing }) {
  const { adminUser, logout } = useAuth();

  return (
    <header className="w-full border-b border-[#222c3f] bg-[#121722]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between">
        {/* Left: Brand & Admin Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌍</span>
            <h1 className="font-handwritten text-3xl sm:text-4xl text-white tracking-wide font-bold">
              GlobalTrotter
            </h1>
          </div>
          <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <ShieldCheck size={14} className="text-sky-400" />
            Admin Intelligence Hub
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live PostgreSQL Connected
          </span>
        </div>

        {/* Right: Refresh, Admin Profile & Logout */}
        <div className="flex items-center gap-4">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Refresh all metrics"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-sky-400' : ''} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          )}

          <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/60 pl-2 pr-3 py-1.5 rounded-2xl">
            {/* Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {adminUser?.first_name ? adminUser.first_name[0].toUpperCase() : 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-200 leading-none">
                {adminUser?.first_name} {adminUser?.last_name || 'Admin'}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {adminUser?.email || 'admin@globetrotter.internal'}
              </div>
            </div>
            <button
              onClick={logout}
              className="ml-2 text-slate-400 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
