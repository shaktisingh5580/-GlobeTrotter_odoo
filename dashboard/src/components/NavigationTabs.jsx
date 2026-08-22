import React from 'react';
import { Users, MapPin, Compass, TrendingUp, ShieldAlert } from 'lucide-react';

export default function NavigationTabs({ activeTab, onTabChange, stats }) {
  const tabs = [
    {
      id: 'users',
      label: 'Manage Users',
      icon: Users,
      badge: stats?.total_users !== undefined ? stats.total_users : null,
      color: 'sky',
    },
    {
      id: 'popular_cities',
      label: 'Popular cities',
      icon: MapPin,
      badge: stats?.total_destinations !== undefined ? stats.total_destinations : null,
      color: 'emerald',
    },
    {
      id: 'popular_activities',
      label: 'Popular Activites',
      icon: Compass,
      badge: stats?.total_activities !== undefined ? stats.total_activities : null,
      color: 'orange',
    },
    {
      id: 'trends_analytics',
      label: 'User Trends and Analytics',
      icon: TrendingUp,
      badge: 'Live',
      color: 'indigo',
    },
  ];

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center sm:justify-between px-5 py-3.5 rounded-2xl border font-semibold text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 border-white shadow-[0_4px_20px_-4px_rgba(255,255,255,0.25)] scale-[1.01]'
                  : 'bg-[#161c28] text-slate-300 border-[#283347] hover:border-slate-500 hover:text-white hover:bg-[#1c2433]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  size={18}
                  className={isActive ? 'text-sky-600' : 'text-slate-400'}
                />
                <span className="truncate">{tab.label}</span>
              </div>

              {tab.badge !== null && (
                <span
                  className={`hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-[#283347] text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
