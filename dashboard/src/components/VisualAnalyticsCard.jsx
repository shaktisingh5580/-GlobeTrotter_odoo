import React, { useState } from 'react';
import { TrendingUp, Users, MapPin, DollarSign, Calendar, Sparkles, Activity } from 'lucide-react';

export default function VisualAnalyticsCard({ stats, popularDestinations, popularActivities, telemetryTrends }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Compute metrics with live backend fallbacks
  const totalUsers = stats?.total_users || 0;
  const totalTrips = stats?.total_trips || 0;
  const totalDestinations = stats?.total_destinations || 0;
  const totalActivities = stats?.total_activities || 0;
  const totalSpent = stats?.total_expenses_amount || 0;
  const totalPosts = stats?.total_posts || 0;

  // Donut chart calculations (e.g. Users vs Trips vs Posts vs Destinations)
  const pieData = [
    { label: 'Planned / Ongoing Trips', value: totalTrips, color: '#0284c7' }, // Sky
    { label: 'Destinations Explored', value: totalDestinations, color: '#22c55e' }, // Green
    { label: 'Community Posts', value: totalPosts, color: '#8b5cf6' }, // Purple
  ];
  const pieTotal = pieData.reduce((acc, item) => acc + item.value, 0);

  // Line chart points (simulated / live telemetry timeline)
  // We take the past 6 days/weeks from the backend trends or default to empty
  const events = telemetryTrends?.events_by_type || [];
  const linePoints = events.length > 0 ? events.slice(0, 6).map((e, i) => ({
    label: `Evt ${i + 1}`,
    value: e.count,
    count: e.count,
  })) : [];

  // Bar chart items (Top 3 destinations or categories)
  const topBars = popularDestinations?.length > 0 ? popularDestinations.slice(0, 3) : [];
  const maxBarVal = topBars.length > 0 ? Math.max(...topBars.map(b => b.stops_count || b.count || 1), 1) : 1;

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Central Canvas Container Matching Image 1 Wireframe */}
      <div className="admin-canvas-card p-6 sm:p-10 border border-slate-200">
        
        {/* TOP ROW: Metric Bullet List (Left) & Donut Chart (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-slate-200/80 pb-8">
          
          {/* Left: 4 Metric Indicator Rows */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="text-sky-600" size={22} />
                Global Platform Telemetry Overview
              </h3>
              <span className="text-xs font-semibold bg-sky-100 text-sky-800 px-3 py-1 rounded-full">
                Real-Time Aggregates
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {/* Metric 1 */}
              <div className="flex items-center justify-between p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 hover:bg-slate-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Registered Travelers & Admins</span>
                </div>
                <span className="text-base font-extrabold text-slate-900">{totalUsers} Users</span>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center justify-between p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 hover:bg-slate-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-sky-500" />
                  <span className="text-sm font-semibold text-slate-700">Active & Planned Itineraries</span>
                </div>
                <span className="text-base font-extrabold text-sky-700">{totalTrips} Trips</span>
              </div>

              {/* Metric 3 */}
              <div className="flex items-center justify-between p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 hover:bg-slate-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-slate-700">World Destinations Catalog</span>
                </div>
                <span className="text-base font-extrabold text-emerald-700">{totalDestinations} Cities</span>
              </div>

              {/* Metric 4 */}
              <div className="flex items-center justify-between p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 hover:bg-slate-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                  <span className="text-sm font-semibold text-slate-700">Total Tracked Travel Expenses</span>
                </div>
                <span className="text-base font-extrabold text-amber-700">
                  {totalSpent ? `₹${Number(totalSpent).toLocaleString()}` : '₹0'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Modern Donut / Pie Chart (Sky Blue & Vibrant Green) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-3xl border border-slate-200/60">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background Track */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                
                {/* Arc 1: Trips (Sky Blue ~65%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="20"
                  strokeDasharray="160 240"
                  strokeDashoffset="0"
                  className="transition-all duration-700 hover:opacity-90 cursor-pointer"
                />
                
                {/* Arc 2: Destinations (Vibrant Green ~35%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="20"
                  strokeDasharray="75 240"
                  strokeDashoffset="-160"
                  className="transition-all duration-700 hover:opacity-90 cursor-pointer"
                />
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  {totalTrips + totalDestinations || 0}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Assets
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
                <span>Trips & Itineraries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
                <span>Destinations</span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE ROW: Timeline Activity Line Chart (Coral/Red Points connected by Lines) */}
        <div className="py-8 border-b border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-rose-500" size={20} />
                User Engagement & Activity Velocity
              </h4>
              <p className="text-xs text-slate-500">Live platform actions, registrations, and itinerary milestones</p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              +38% this month
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full h-44 sm:h-52 relative bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 flex items-end">
            <svg viewBox="0 0 600 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="30" x2="580" y2="30" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="20" y1="75" x2="580" y2="75" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="20" y1="120" x2="580" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" />

              {/* Axis Line */}
              <line x1="20" y1="140" x2="580" y2="140" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="20" y1="20" x2="20" y2="140" stroke="#cbd5e1" strokeWidth="2" />

              {/* Shaded Area */}
              <path
                d="M 50 120 L 140 85 L 230 105 L 320 60 L 410 75 L 530 35 L 530 140 L 50 140 Z"
                fill="url(#areaGradient)"
              />

              {/* Connecting Line (Slate/Grey) */}
              <polyline
                fill="none"
                stroke="#475569"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="50,120 140,85 230,105 320,60 410,75 530,35"
              />

              {/* Coral / Red Data Points */}
              {linePoints.map((pt, i) => {
                // Determine x,y based on value to draw dynamic points
                const maxVal = Math.max(...linePoints.map(p => p.val || p.value || 0), 1);
                const x = 50 + (i * 96); // Distribute evenly (480 / 5)
                const y = 120 - (((pt.val || pt.value || 0) / maxVal) * 85);
                return (
                  <g key={i} className="cursor-pointer group">
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="#e11d48"
                      stroke="#ffffff"
                      strokeWidth="3"
                      className="transition-transform group-hover:scale-125"
                    />
                    <text
                      x={x}
                      y={y - 12}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {pt.val || pt.value}
                    </text>
                    <text
                      x={x}
                      y="155"
                      textAnchor="middle"
                      className="text-[10px] font-semibold fill-slate-500"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* BOTTOM ROW: Vertical Bar Chart (Orange) & Data Breakdown Rows (Grey) */}
        <div className="pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          
          {/* Left: 3 Orange Vertical Bars (Matching Image 1) */}
          <div className="lg:col-span-5 bg-slate-50 p-6 rounded-3xl border border-slate-200/60">
            <h5 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Top Destination Popularity</span>
              <span className="text-[11px] font-semibold text-amber-600">By Stop Frequency</span>
            </h5>

            <div className="flex items-end justify-around h-40 pt-4 px-2">
              {topBars.length > 0 ? topBars.map((bar, idx) => {
                const heightPercent = Math.min(Math.max(((bar.trip_stops_count || bar.stops_count || bar.count || 1) / maxBarVal) * 100, 35), 95);
                const colors = ['#f97316', '#fb923c', '#fdba74'];

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <span className="text-xs font-bold text-slate-700 opacity-80 group-hover:opacity-100">
                      {bar.trip_stops_count || bar.stops_count || bar.count || 0}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%`, backgroundColor: colors[idx] }}
                      className="w-12 sm:w-14 rounded-t-xl transition-all duration-500 group-hover:brightness-95 shadow-sm"
                    />
                    <span className="text-[11px] font-bold text-slate-600 truncate max-w-[70px]">
                      {bar.name}
                    </span>
                  </div>
                );
              }) : (
                <div className="text-xs text-slate-400 w-full text-center mb-8">No destinations tracked yet</div>
              )}
            </div>
          </div>

          {/* Right: Data Breakdown Rows (Grey Bars / Info Rows) */}
          <div className="lg:col-span-7 space-y-3">
            <h5 className="text-sm font-bold text-slate-800 mb-2">
              Platform Activity Leaderboard & Distribution
            </h5>

            {popularActivities?.slice(0, 4).map((act, i) => (
              <div
                key={act.id || i}
                className="flex items-center justify-between p-3 bg-slate-100 rounded-2xl border border-slate-200/60 hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">{act.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {act.destination_name || 'Curated'} • {act.category || 'Sightseeing'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-lg">
                    {act.scheduled_count || 1} Scheduled
                  </span>
                </div>
              </div>
            )) || (
              <div className="text-xs text-slate-400 text-center py-6">
                Loading popular activity trend metrics...
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
