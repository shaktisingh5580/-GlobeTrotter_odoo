import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { X, Calendar, DollarSign, MapPin, Compass, AlertCircle, Loader2 } from 'lucide-react';

export default function UserTripsModal({ user, onClose }) {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchUserTrips = async () => {
      setIsLoading(true);
      try {
        const res = await api.getUserTrips(user.id);
        setTrips(res.data?.items || res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load user trips');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserTrips();
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161c28] border border-[#283347] rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#283347]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Trips Created by</span>
              <span className="text-sky-400 font-extrabold">{user.first_name} {user.last_name}</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-sky-400" />
              <span className="text-xs font-semibold">Loading traveler itineraries...</span>
            </div>
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Compass size={36} className="mx-auto text-slate-600" />
              <div className="font-bold text-slate-300">No Trips Created Yet</div>
              <div className="text-xs text-slate-500">This user has not initiated any itineraries on GlobeTrotter.</div>
            </div>
          ) : (
            trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-[#10141d] border border-[#283347] rounded-2xl p-5 hover:border-sky-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-white">{trip.title}</h4>
                    {trip.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{trip.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                      trip.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : trip.status === 'ONGOING'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {trip.status}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#222c3f] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar size={13} className="text-sky-400" />
                    <span>{trip.start_date || 'TBD'} → {trip.end_date || 'TBD'}</span>
                  </div>

                  {trip.budget_limit && (
                    <div className="flex items-center gap-1 font-bold text-emerald-400">
                      <DollarSign size={13} />
                      <span>Budget: {trip.currency || '₹'} {trip.budget_limit.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin size={13} className="text-amber-400" />
                    <span>{trip.stops?.length || 0} Stops Configured</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#283347] bg-[#10141d] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
