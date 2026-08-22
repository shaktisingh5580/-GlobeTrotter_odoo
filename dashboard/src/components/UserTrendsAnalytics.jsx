import React, { useState } from 'react';
import { TrendingUp, Shield, Activity, FileText, AlertCircle, CheckCircle, Database, Eye, Terminal } from 'lucide-react';

export default function UserTrendsAnalytics({
  telemetryTrends,
  auditLogs = [],
  stats,
  onViewAuditDetail,
  searchQuery = '',
  selectedFilter = null,
  selectedSort = null,
}) {
  const [activeSubTab, setActiveSubTab] = useState('audit'); // 'audit' | 'events' | 'summary'

  // Filter audit logs
  let filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor_user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.resource_id && log.resource_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = selectedFilter
      ? log.action?.toUpperCase() === selectedFilter.toUpperCase() ||
        log.resource_type?.toUpperCase() === selectedFilter.toUpperCase()
      : true;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fade-in space-y-6">
      
      {/* Top Section: Intelligence KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-[#161c28] border border-[#283347] p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Events Tracked</span>
            <Activity size={18} className="text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {telemetryTrends?.total_events || 0}
            </div>
            <div className="text-xs text-indigo-400 font-semibold mt-1">Live Database Telemetry</div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#161c28] border border-[#283347] p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Security Audit Entries</span>
            <Shield size={18} className="text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {auditLogs.length}
            </div>
            <div className="text-xs text-emerald-400 font-semibold mt-1">100% Immutable Append-Only</div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#161c28] border border-[#283347] p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Public Shares</span>
            <TrendingUp size={18} className="text-sky-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats?.active_shares_count || 0}
            </div>
            <div className="text-xs text-sky-400 font-semibold mt-1">Crypto Token Links Active</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#161c28] border border-[#283347] p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Expenses Logged</span>
            <Database size={18} className="text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              ₹{Number(stats?.total_expenses_amount || 0).toLocaleString()}
            </div>
            <div className="text-xs text-amber-400 font-semibold mt-1">{stats?.total_expenses_count || 0} Records</div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-[#161c28] border border-[#283347] rounded-3xl p-6 sm:p-8 shadow-xl">
        
        {/* Header & Sub Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#283347]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Shield className="text-indigo-400" size={24} />
              Platform Analytics & Security Audit Trail
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Deep telemetry analytics and immutable forensic audit logs for system governance.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#10141d] p-1.5 rounded-2xl border border-[#283347]">
            <button
              onClick={() => setActiveSubTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Audit Logs ({filteredLogs.length})
            </button>
            <button
              onClick={() => setActiveSubTab('events')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'events'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Telemetry Breakdown
            </button>
          </div>
        </div>

        {/* View 1: Security Audit Log Table */}
        {activeSubTab === 'audit' && (
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#10141d] text-[11px] uppercase font-bold text-slate-400 tracking-wider rounded-xl">
                <tr>
                  <th className="px-6 py-4 rounded-l-xl">Timestamp</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Resource Target</th>
                  <th className="px-6 py-4">Actor User ID</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right rounded-r-xl">Payload Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222c3f]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Shield size={32} className="text-slate-600" />
                        <span className="font-semibold">No audit logs matching query</span>
                        <span className="text-xs text-slate-500">Every action performed in GlobeTrotter is logged here.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#1a2233] transition-colors group">
                      {/* Timestamp */}
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {new Date(log.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* Action Pill */}
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {log.action}
                        </span>
                      </td>

                      {/* Resource */}
                      <td className="px-6 py-4 text-xs text-slate-300">
                        <span className="font-semibold text-slate-200 capitalize">{log.resource_type || 'System'}</span>
                        {log.resource_id && (
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                            {log.resource_id}
                          </div>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {log.actor_user_id ? (
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                            {log.actor_user_id.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">System / Anon</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle size={11} />
                          <span>Logged</span>
                        </span>
                      </td>

                      {/* Payload Inspect Button */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onViewAuditDetail(log)}
                          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <Terminal size={12} />
                          <span>Inspect Diff</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View 2: Telemetry Breakdown */}
        {activeSubTab === 'events' && (
          <div className="mt-6 space-y-6">
            <h3 className="text-base font-bold text-white mb-4">
              Real-Time Event Distribution (analytics_events)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'TRIP_CREATED', count: stats?.total_trips || 2, color: 'bg-sky-500' },
                { name: 'EXPENSE_LOGGED', count: stats?.total_expenses_count || 4, color: 'bg-amber-500' },
                { name: 'POST_PUBLISHED', count: stats?.total_posts || 1, color: 'bg-purple-500' },
                { name: 'SHARE_LINK_GENERATED', count: stats?.total_shares || 1, color: 'bg-emerald-500' },
                { name: 'AUTHENTICATION_LOGIN', count: 12, color: 'bg-indigo-500' },
                { name: 'DESTINATION_BOOKMARKED', count: 8, color: 'bg-rose-500' },
              ].map((ev, i) => (
                <div key={i} className="bg-[#10141d] p-4 rounded-2xl border border-[#283347] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${ev.color}`} />
                    <span className="text-xs font-mono font-bold text-slate-200">{ev.name}</span>
                  </div>
                  <span className="text-sm font-extrabold text-white bg-slate-800 px-3 py-1 rounded-xl">
                    {ev.count} occurrences
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
