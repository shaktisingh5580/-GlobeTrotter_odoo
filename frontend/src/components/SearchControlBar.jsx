/**
 * SearchControlBar Component
 *
 * Purpose:
 * Provides a responsive control bar for searching, grouping, filtering, and sorting content.
 *
 * Responsibility:
 * - Renders a search input field that communicates search queries in real time.
 * - Integrates active toggle drawers for Group, Filter, and Sort actions with pill selection chips.
 * - Triggers callback events (onGroup, onFilter, onSort) with selected parameters.
 *
 * Used by:
 * - pages/index.js
 * - pages/explore.js
 * - pages/trips.js
 */

import React, { useState } from 'react';

const SearchControlBar = ({ onSearch, onGroup, onFilter, onSort }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Menu visibility toggles
  const [activeMenu, setActiveMenu] = useState(null); // 'group' | 'filter' | 'sort' | null

  // Selection states
  const [groupVal, setGroupVal] = useState('none');
  const [filterVal, setFilterVal] = useState('all');
  const [sortVal, setSortVal] = useState('default');

  const toggleMenu = (menuName) => {
    if (activeMenu === menuName) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuName);
    }
  };

  const handleGroupSelect = (val) => {
    setGroupVal(val);
    if (onGroup) onGroup(val);
  };

  const handleFilterSelect = (val) => {
    setFilterVal(val);
    if (onFilter) onFilter(val);
  };

  const handleSortSelect = (val) => {
    setSortVal(val);
    if (onSort) onSort(val);
  };

  return (
    <div className="w-full py-4 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap items-stretch sm:items-center gap-4 w-full">
        
        {/* Search Input Container */}
        <div className="relative flex-grow min-w-0">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg pointer-events-none transition-colors">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search bar ......"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            className="w-full bg-white/70 backdrop-blur-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-2xl px-5 py-3 pl-11 text-sm sm:text-base outline-none shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] hover:border-zinc-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-sans"
          />
        </div>

        {/* Action Controls Container */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 shrink-0">
          
          {/* Group by Button */}
          <button
            type="button"
            onClick={() => toggleMenu('group')}
            className={`flex-grow sm:flex-grow-0 border rounded-2xl px-6 py-3 text-sm sm:text-base font-semibold shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98] cursor-pointer ${
              activeMenu === 'group' 
                ? 'bg-sky-50 border-sky-500 text-sky-700' 
                : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}
          >
            Group by {groupVal !== 'none' && `(${groupVal})`}
          </button>

          {/* Filter Button */}
          <button
            type="button"
            onClick={() => toggleMenu('filter')}
            className={`flex-grow sm:flex-grow-0 border rounded-2xl px-6 py-3 text-sm sm:text-base font-semibold shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98] cursor-pointer ${
              activeMenu === 'filter' 
                ? 'bg-sky-50 border-sky-500 text-sky-700' 
                : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}
          >
            Filter {filterVal !== 'all' && `(${filterVal})`}
          </button>

          {/* Sort by Button */}
          <button
            type="button"
            onClick={() => toggleMenu('sort')}
            className={`flex-grow sm:flex-grow-0 border rounded-2xl px-6 py-3 text-sm sm:text-base font-semibold shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98] cursor-pointer ${
              activeMenu === 'sort' 
                ? 'bg-sky-50 border-sky-500 text-sky-700' 
                : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}
          >
            Sort by... {sortVal !== 'default' && `(${sortVal})`}
          </button>

        </div>

      </div>

      {/* DYNAMIC SELECTION DRAWERS */}
      {activeMenu === 'group' && (
        <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl animate-in slide-in-from-top-2 duration-200">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider self-center px-2">Group:</span>
          {['none', 'category', 'location'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => handleGroupSelect(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                groupVal === g 
                  ? 'bg-zinc-950 text-white' 
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {activeMenu === 'filter' && (
        <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl animate-in slide-in-from-top-2 duration-200">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider self-center px-2">Filter:</span>
          {[
            { id: 'all', label: 'Show All' },
            { id: 'rating', label: '⭐ Rating 4.8+' },
            { id: 'budget', label: 'Budget/Eco Friendly' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFilterSelect(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterVal === f.id 
                  ? 'bg-zinc-950 text-white' 
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {activeMenu === 'sort' && (
        <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl animate-in slide-in-from-top-2 duration-200">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider self-center px-2">Sort:</span>
          {[
            { id: 'default', label: 'Default' },
            { id: 'price_asc', label: 'Price: Low to High' },
            { id: 'price_desc', label: 'Price: High to Low' },
            { id: 'rating_desc', label: 'Rating: High to Low' }
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSortSelect(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sortVal === s.id 
                  ? 'bg-zinc-950 text-white' 
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

    </div>
  );
};

export default SearchControlBar;
