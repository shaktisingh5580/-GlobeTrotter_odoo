/**
 * SearchControlBar Component
 *
 * Purpose:
 * Provides a responsive control bar for searching, grouping, filtering, and sorting content.
 *
 * Responsibility:
 * - Renders a stylized search input field with an inline search icon, soft shadows, and focus states.
 * - Renders micro-interactive filter buttons ("Group by", "Filter", "Sort by...") with hover and active animations.
 * - Adapts layout responsively from vertical stacking on mobile to horizontal row on desktop.
 *
 * Why this file exists:
 * Elevates the visual details of the core search control wireframe to meet premium design aesthetics.
 *
 * Used by:
 * - pages/index.js
 *
 * Boundary:
 * Does not directly filter trip database arrays. Exposes events and handlers so the parent page component handles filtering.
 */

import React, { useState } from 'react';

const SearchControlBar = ({ onSearch, onGroup, onFilter, onSort }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap items-stretch sm:items-center gap-4 w-full">
        
        {/* Search Input Container */}
        <div className="relative flex-grow min-w-0">
          {/* Magnifying Glass Icon */}
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
            onClick={onGroup}
            className="flex-grow sm:flex-grow-0 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-sky-600 border border-zinc-200 hover:border-sky-500 rounded-2xl px-6 py-3 text-sm sm:text-base font-semibold shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98] cursor-pointer"
          >
            Group by
          </button>

          {/* Filter Button */}
          <button
            onClick={onFilter}
            className="flex-grow sm:flex-grow-0 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-sky-600 border border-zinc-200 hover:border-sky-500 rounded-2xl px-6 py-3 text-sm sm:text-base font-semibold shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98] cursor-pointer"
          >
            Filter
          </button>

          {/* Sort by Button */}
          <button
            onClick={onSort}
            className="flex-grow sm:flex-grow-0 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-sky-600 border border-zinc-200 hover:border-sky-500 rounded-2xl px-6 py-3 text-sm sm:text-base font-semibold shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98] cursor-pointer"
          >
            Sort by...
          </button>

        </div>

      </div>
    </div>
  );
};

export default SearchControlBar;
