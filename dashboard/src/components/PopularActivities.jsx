import React from 'react';
import { Compass, Plus, Clock, DollarSign, Star, Flame, Tag } from 'lucide-react';

export default function PopularActivities({
  popularActivities = [],
  destinations = [],
  onAddActivity,
  searchQuery = '',
  selectedFilter = null,
  selectedSort = null,
}) {
  // Filter activities
  let filtered = popularActivities.filter(act => {
    const matchesSearch =
      act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.destination_name && act.destination_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (act.description && act.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (act.category && act.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = selectedFilter
      ? act.category?.toUpperCase() === selectedFilter.toUpperCase()
      : true;

    return matchesSearch && matchesFilter;
  });

  // Sort activities
  if (selectedSort === 'popularity' || !selectedSort) {
    filtered.sort((a, b) => (b.scheduled_count || 0) - (a.scheduled_count || 0));
  } else if (selectedSort === 'name_asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (selectedSort === 'cost_asc') {
    filtered.sort((a, b) => (a.estimated_cost || 0) - (b.estimated_cost || 0));
  } else if (selectedSort === 'cost_desc') {
    filtered.sort((a, b) => (b.estimated_cost || 0) - (a.estimated_cost || 0));
  }

  const categoryColors = {
    SIGHTSEEING: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    FOOD: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    ADVENTURE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    CULTURE: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    RELAXATION: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    SHOPPING: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    NIGHTLIFE: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fade-in">
      <div className="bg-[#161c28] border border-[#283347] rounded-3xl p-6 sm:p-8 shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#283347]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Compass className="text-amber-400" size={24} />
              Popular Activities & Curated Experiences
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Top booked and scheduled activities across user itineraries in real-time.
            </p>
          </div>
          <button
            onClick={onAddActivity}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Curated Activity</span>
          </button>
        </div>

        {/* Activities Table / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Compass size={36} className="mx-auto text-slate-600 mb-2" />
              <div className="font-semibold text-slate-300">No activities found</div>
              <div className="text-xs text-slate-500">Try changing filter categories or add a new activity.</div>
            </div>
          ) : (
            filtered.map((act, index) => (
              <div
                key={act.id || index}
                className="bg-[#10141d] border border-[#283347] rounded-2xl p-5 hover:border-amber-500/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Rank & Scheduled Count */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                      Rank #{index + 1}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                      <Flame size={12} />
                      <span>{act.scheduled_count || 1} Scheduled</span>
                    </span>
                  </div>

                  {/* Activity Name & Destination */}
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {act.name}
                  </h3>
                  <div className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
                    <span className="text-slate-200">{act.destination_name || 'Global Catalog'}</span>
                  </div>

                  {/* Category Pill */}
                  <div className="mt-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        categoryColors[act.category] || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {act.category || 'Sightseeing'}
                    </span>
                  </div>

                  {/* Description */}
                  {act.description && (
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  )}
                </div>

                {/* Bottom Meta info: Cost, Duration, Rating */}
                <div className="pt-4 mt-4 border-t border-[#222c3f] flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-1 font-bold text-slate-200">
                    <DollarSign size={14} className="text-emerald-400" />
                    <span>
                      {act.estimated_cost ? `${act.currency || '₹'} ${act.estimated_cost.toLocaleString()}` : 'Free / Included'}
                    </span>
                  </div>

                  {act.duration_minutes && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock size={13} />
                      <span>{act.duration_minutes} mins</span>
                    </div>
                  )}

                  {act.rating && (
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star size={13} className="fill-amber-400" />
                      <span>{act.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
