import React, { useState } from 'react';
import { Users, Shield, MapPin, Trash2, Edit3, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function ManageUsers({
  users = [],
  isLoading,
  onViewTrips,
  onChangeRole,
  onDeleteUser,
  searchQuery = '',
  selectedFilter = null,
  selectedSort = null,
}) {
  const [deletingId, setDeletingId] = useState(null);

  // Filter users based on search & filter selection
  let filtered = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.city && user.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.country && user.country.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = selectedFilter
      ? user.role?.toUpperCase() === selectedFilter.toUpperCase()
      : true;

    return matchesSearch && matchesFilter;
  });

  // Sort users
  if (selectedSort === 'name_asc') {
    filtered.sort((a, b) => a.first_name.localeCompare(b.first_name));
  } else if (selectedSort === 'trips_desc') {
    filtered.sort((a, b) => (b.trips_count || 0) - (a.trips_count || 0));
  } else if (selectedSort === 'newest') {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const handleDeleteClick = async (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.first_name} ${user.last_name}" (${user.email})? This will immediately revoke their sessions.`)) {
      setDeletingId(user.id);
      try {
        await onDeleteUser(user.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fade-in">
      <div className="bg-[#161c28] border border-[#283347] rounded-3xl p-6 sm:p-8 shadow-xl">
        
        {/* Header Title & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#283347]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Users className="text-sky-400" size={24} />
              Manage Users & System Access
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Inspect traveler profiles, review authored itineraries, modify administrative roles, and enforce moderation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-700">
              Showing {filtered.length} of {users.length} Users
            </span>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#10141d] text-[11px] uppercase font-bold text-slate-400 tracking-wider rounded-xl">
              <tr>
                <th className="px-6 py-4 rounded-l-xl">User Profile</th>
                <th className="px-6 py-4">Role & Verification</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">Trips Made</th>
                <th className="px-6 py-4 text-center">Community Posts</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222c3f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} className="text-slate-600" />
                      <span className="font-semibold">No matching users found</span>
                      <span className="text-xs text-slate-500">Try adjusting your search keywords or filter pills.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1a2233] transition-colors group">
                    {/* User Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-sky-300 transition-colors">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Verification */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-slate-700/50 text-slate-300 border-slate-600'
                          }`}
                        >
                          {user.role}
                        </span>
                        {user.email_verified ? (
                          <span title="Email Verified" className="text-emerald-400 flex items-center">
                            <CheckCircle size={14} />
                          </span>
                        ) : (
                          <span title="Email Unverified" className="text-amber-400 flex items-center">
                            <AlertTriangle size={14} />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {user.city || user.country ? (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {[user.city, user.country].filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Not set</span>
                      )}
                    </td>

                    {/* Trips Count */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onViewTrips(user)}
                        className="inline-flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
                        title="Click to view all trips made by this user"
                      >
                        <Eye size={12} />
                        <span>{user.trips_count || 0} Trips</span>
                      </button>
                    </td>

                    {/* Community Posts */}
                    <td className="px-6 py-4 text-center font-bold text-slate-300">
                      {user.posts_count || 0}
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Trips */}
                        <button
                          onClick={() => onViewTrips(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View Trips"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Change Role */}
                        <button
                          onClick={() => onChangeRole(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Change Role"
                        >
                          <Edit3 size={16} />
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteClick(user)}
                          disabled={deletingId === user.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
