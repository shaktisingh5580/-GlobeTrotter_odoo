import React, { useState } from 'react';
import { X, Shield, AlertTriangle, Loader2 } from 'lucide-react';

export default function ChangeRoleModal({ user, onClose, onSave }) {
  const [selectedRole, setSelectedRole] = useState(user?.role || 'USER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(user.id, selectedRole);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161c28] border border-[#283347] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#283347]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield size={20} className="text-purple-400" />
            Modify User Role
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[#10141d] p-4 rounded-2xl border border-[#283347]">
            <div className="text-xs text-slate-400">Target User:</div>
            <div className="text-sm font-bold text-white mt-0.5">{user.first_name} {user.last_name}</div>
            <div className="text-xs text-slate-500 font-mono">{user.email}</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Select Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('USER')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'USER'
                    ? 'bg-sky-500/10 border-sky-500 text-sky-300 shadow-md'
                    : 'bg-[#10141d] border-[#283347] text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-bold text-sm">USER</div>
                <div className="text-[11px] text-slate-400 mt-1">Standard traveler permissions</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'ADMIN'
                    ? 'bg-purple-500/10 border-purple-500 text-purple-300 shadow-md'
                    : 'bg-[#10141d] border-[#283347] text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-bold text-sm">ADMIN</div>
                <div className="text-[11px] text-slate-400 mt-1">Full dashboard & moderation privileges</div>
              </button>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-start gap-2 text-amber-300 text-xs">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>Changing a role will immediately revoke the user's active sessions to enforce fresh token claims.</span>
          </div>

          {error && (
            <div className="text-rose-400 text-xs font-bold">{error}</div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#283347]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
