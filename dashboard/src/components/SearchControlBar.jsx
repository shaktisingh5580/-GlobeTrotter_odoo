import React, { useState } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchControlBar({
  searchQuery,
  onSearchChange,
  activeTab,
  selectedFilter,
  onFilterChange,
  selectedSort,
  onSortChange,
  selectedGroup,
  onGroupChange,
  filterOptions = [],
  sortOptions = [],
  groupOptions = [],
}) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'group' | 'filter' | 'sort' | null

  const toggleDropdown = (name) => {
    setOpenDropdown(prev => (prev === name ? null : name));
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
        
        {/* Search Input Container */}
        <div className="relative flex-grow min-w-0">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder={`Search in ${activeTab || 'admin intelligence'} ......`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#161c28] text-white placeholder-slate-400 border border-[#283347] rounded-2xl px-5 py-3 pl-11 text-sm outline-none shadow-sm hover:border-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Action Controls Container (Group by, Filter, Sort by...) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 relative">
          
          {/* Group by Button & Dropdown */}
          <div className="relative flex-grow sm:flex-grow-0">
            <button
              onClick={() => toggleDropdown('group')}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 bg-[#161c28] hover:bg-[#1f2737] text-slate-200 border rounded-2xl px-5 py-3 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-sm ${
                selectedGroup ? 'border-sky-500 text-sky-400' : 'border-[#283347] hover:border-slate-500'
              }`}
            >
              <span>{selectedGroup ? `Group: ${selectedGroup}` : 'Group by'}</span>
              <ChevronDown size={14} className={`transition-transform ${openDropdown === 'group' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'group' && (
              <div className="absolute right-0 mt-2 w-48 bg-[#161c28] border border-[#283347] rounded-2xl shadow-xl z-50 py-2 animate-fade-in">
                <button
                  onClick={() => { onGroupChange(null); setOpenDropdown(null); }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>None (Default)</span>
                  {!selectedGroup && <Check size={14} className="text-sky-400" />}
                </button>
                {groupOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onGroupChange(opt.value); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    {selectedGroup === opt.value && <Check size={14} className="text-sky-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Button & Dropdown */}
          <div className="relative flex-grow sm:flex-grow-0">
            <button
              onClick={() => toggleDropdown('filter')}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 bg-[#161c28] hover:bg-[#1f2737] text-slate-200 border rounded-2xl px-5 py-3 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-sm ${
                selectedFilter ? 'border-sky-500 text-sky-400' : 'border-[#283347] hover:border-slate-500'
              }`}
            >
              <span>{selectedFilter ? `Filter: ${selectedFilter}` : 'Filter'}</span>
              <ChevronDown size={14} className={`transition-transform ${openDropdown === 'filter' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'filter' && (
              <div className="absolute right-0 mt-2 w-52 bg-[#161c28] border border-[#283347] rounded-2xl shadow-xl z-50 py-2 animate-fade-in">
                <button
                  onClick={() => { onFilterChange(null); setOpenDropdown(null); }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>All Items (No Filter)</span>
                  {!selectedFilter && <Check size={14} className="text-sky-400" />}
                </button>
                {filterOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onFilterChange(opt.value); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    {selectedFilter === opt.value && <Check size={14} className="text-sky-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort by Button & Dropdown */}
          <div className="relative flex-grow sm:flex-grow-0">
            <button
              onClick={() => toggleDropdown('sort')}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 bg-[#161c28] hover:bg-[#1f2737] text-slate-200 border rounded-2xl px-5 py-3 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-sm ${
                selectedSort ? 'border-sky-500 text-sky-400' : 'border-[#283347] hover:border-slate-500'
              }`}
            >
              <span>{selectedSort ? `Sort: ${selectedSort}` : 'Sort by...'}</span>
              <ChevronDown size={14} className={`transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'sort' && (
              <div className="absolute right-0 mt-2 w-52 bg-[#161c28] border border-[#283347] rounded-2xl shadow-xl z-50 py-2 animate-fade-in">
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onSortChange(opt.value); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    {selectedSort === opt.value && <Check size={14} className="text-sky-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
