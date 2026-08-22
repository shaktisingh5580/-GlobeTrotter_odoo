import React from 'react';
import { X, Shield, Terminal, Clock, User, FileCode } from 'lucide-react';

export default function AuditLogDetailModal({ log, onClose }) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161c28] border border-[#283347] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#283347]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">{log.action}</h3>
              <p className="text-xs text-slate-400">Security Audit Forensic Inspector</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-[#10141d] p-4 rounded-2xl border border-[#283347]">
            <div>
              <span className="text-slate-500">Resource Target:</span>
              <div className="font-bold text-slate-200 mt-0.5">{log.resource_type} ({log.resource_id || 'Global'})</div>
            </div>
            <div>
              <span className="text-slate-500">Timestamp:</span>
              <div className="font-bold text-slate-200 mt-0.5">{new Date(log.created_at).toISOString()}</div>
            </div>
            <div>
              <span className="text-slate-500">Actor User ID:</span>
              <div className="font-bold text-slate-200 mt-0.5">{log.actor_user_id || 'System / Unauthenticated'}</div>
            </div>
            <div>
              <span className="text-slate-500">Request ID:</span>
              <div className="font-bold text-sky-400 mt-0.5">{log.request_id || 'N/A'}</div>
            </div>
          </div>

          {/* New Values JSON */}
          <div>
            <div className="text-slate-400 font-bold mb-1.5 flex items-center gap-1.5">
              <FileCode size={14} className="text-emerald-400" />
              <span>Applied Values / State Payload (new_values):</span>
            </div>
            <pre className="bg-[#0b0e14] border border-[#283347] p-4 rounded-2xl text-emerald-300 text-xs overflow-x-auto">
              {JSON.stringify(log.new_values || {}, null, 2)}
            </pre>
          </div>

          {/* Old Values JSON (if any) */}
          {log.old_values && Object.keys(log.old_values).length > 0 && (
            <div>
              <div className="text-slate-400 font-bold mb-1.5 flex items-center gap-1.5">
                <FileCode size={14} className="text-amber-400" />
                <span>Previous State Snapshot (old_values):</span>
              </div>
              <pre className="bg-[#0b0e14] border border-[#283347] p-4 rounded-2xl text-amber-300 text-xs overflow-x-auto">
                {JSON.stringify(log.old_values, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#283347] bg-[#10141d] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
