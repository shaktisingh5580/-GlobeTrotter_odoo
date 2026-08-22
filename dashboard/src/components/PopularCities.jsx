import React, { useState } from 'react';
import { MapPin, Plus, TrendingUp, DollarSign, Compass, Globe, Sparkles } from 'lucide-react';

export default function PopularCities({
  destinations = [],
  popularRankings = [],
  onAddDestination,
  searchQuery = '',
  selectedFilter = null,
  selectedSort = null,
}) {
  // Merge destinations with live popularity rankings
  const mergedList = destinations.map(dest => {
    const popularItem = popularRankings.find(p => p.id === dest.id || p.name === dest.name);
    return {
      ...dest,
      stops_count: popularItem?.trip_stops_count ?? popularItem?.stops_count ?? 0,
      popularity_score: dest.popularity_score || popularItem?.popularity_score || 70,
    };
  });

  // Filter
  let filtered = mergedList.filter(dest => {
    const matchesSearch =
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dest.region && dest.region.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = selectedFilter
      ? dest.region?.toUpperCase() === selectedFilter.toUpperCase() ||
        (selectedFilter === 'POPULAR' && (dest.stops_count > 0 || dest.popularity_score >= 85))
      : true;

    return matchesSearch && matchesFilter;
  });

  // Sort
  if (selectedSort === 'popularity' || !selectedSort) {
    filtered.sort((a, b) => (b.stops_count || 0) - (a.stops_count || 0) || (b.popularity_score || 0) - (a.popularity_score || 0));
  } else if (selectedSort === 'name_asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (selectedSort === 'cost_asc') {
    filtered.sort((a, b) => (a.cost_index || 1) - (b.cost_index || 1));
  } else if (selectedSort === 'cost_desc') {
    filtered.sort((a, b) => (b.cost_index || 1) - (a.cost_index || 1));
  }

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fade-in">
      <div className="bg-[#161c28] border border-[#283347] rounded-3xl p-6 sm:p-8 shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#283347]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <MapPin className="text-emerald-400" size={24} />
              Popular Cities & Travel Hotspots
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live ranking of destination popularity based on traveler trip stops and itinerary schedules.
            </p>
          </div>
          <button
            onClick={onAddDestination}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Destination</span>
          </button>
        </div>

        {/* Destination Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <MapPin size={36} className="mx-auto text-slate-600 mb-2" />
              <div className="font-semibold text-slate-300">No destinations found</div>
              <div className="text-xs text-slate-500">Try adjusting your filters or add a new curated city.</div>
            </div>
          ) : (
            filtered.map((dest, index) => (
              <div
                key={dest.id}
                className="bg-[#10141d] border border-[#283347] rounded-2xl overflow-hidden hover:border-emerald-500/60 transition-all duration-300 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col"
              >
                {/* Image & Rank Badge */}
                <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                  {dest.image_url ? (
                    <img
                      src={dest.image_url}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 text-slate-600">
                      <Globe size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10141d] via-transparent to-black/40" />

                  {/* Rank Badge */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-xl text-xs font-black text-white flex items-center gap-1 shadow-lg">
                    <span className="text-amber-400">#</span>
                    <span>{index + 1}</span>
                  </div>

                  {/* Stops Count Badge */}
                  <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-xl text-[11px] font-extrabold shadow-lg flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span>{dest.stops_count} Visits</span>
                  </div>

                  {/* Title & Country in Image Overlay */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold text-white leading-tight group-hover:text-emerald-300 transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1">
                      <MapPin size={11} className="text-emerald-400" />
                      {dest.country} {dest.region ? `• ${dest.region}` : ''}
                    </p>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {dest.description || 'Curated global destination for modern travelers.'}
                  </p>

                  <div className="pt-3 border-t border-[#222c3f] flex items-center justify-between text-xs text-slate-300 font-semibold">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Cost:</span>
                      <span className="text-amber-400 font-bold">
                        {'$'.repeat(Math.min(Math.max(dest.cost_index || 2, 1), 4))}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                      <Sparkles size={12} className="text-sky-400" />
                      <span className="text-sky-300">{dest.popularity_score}% Score</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
