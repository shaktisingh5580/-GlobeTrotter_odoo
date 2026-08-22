/**
 * Trips Page Component
 *
 * Purpose:
 * Renders the user's travel list page (/trips) by loading saved trip summaries from NestJS backend APIs.
 *
 * Responsibility:
 * - Fetches user trip records from /trips.
 * - Sorts trips dynamically into Ongoing, Upcoming, and Completed categories based on date checks.
 * - Supports Grouping (by Status or Location), Filtering (by Budget Limit thresholds), and Sorting.
 *
 * Used by:
 * - Next.js Router (/trips)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../pages/Layout/Layout';
import SearchControlBar from '../components/SearchControlBar';
import CalendarView from '../components/CalendarView';
import api from '../services/api';

export default function Trips() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('list'); // 'list' | 'calendar'
  
  // Selection states
  const [groupBy, setGroupBy] = useState('none');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Read auth session and fetch trips from NestJS database
  useEffect(() => {
    const storedUser = localStorage.getItem('globe_user');

    if (!storedUser) {
      router.push('/');
    } else {
      setUser(JSON.parse(storedUser));
      
      // Fetch user's trips from NestJS
      api.get('/trips')
        .then(data => {
          setTrips(data.items || []);
        })
        .catch(err => {
          console.error('Failed to fetch trips:', err);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('globe_user');
    localStorage.removeItem('globe_access_token');
    localStorage.removeItem('globe_refresh_token');
    router.push('/');
  };

  // 1. Process Filtering & Searching
  let processedTrips = trips.filter(trip => {
    // Search query check
    const matchesSearch = 
      (trip.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Filter check
    let matchesFilter = true;
    const budgetVal = parseFloat(trip.budget_limit) || 0;
    if (filterBy === 'rating') {
      matchesFilter = budgetVal >= 50000; // Premium trips
    } else if (filterBy === 'budget') {
      matchesFilter = budgetVal > 0 && budgetVal < 50000; // Budget friendly
    }

    return matchesSearch && matchesFilter;
  });

  // 2. Process Sorting
  if (sortBy === 'price_asc') {
    processedTrips.sort((a, b) => (parseFloat(a.budget_limit) || 0) - (parseFloat(b.budget_limit) || 0));
  } else if (sortBy === 'price_desc') {
    processedTrips.sort((a, b) => (parseFloat(b.budget_limit) || 0) - (parseFloat(a.budget_limit) || 0));
  } else if (sortBy === 'rating_desc') {
    // Sort by start date latest
    processedTrips.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  }

  // Categorize trips by dates
  const getTripStatus = (startDateStr, endDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (today >= start && today <= end) {
      return 'ongoing';
    } else if (today < start) {
      return 'upcoming';
    } else {
      return 'completed';
    }
  };

  // 3. Process Grouping
  const getGroupedTrips = () => {
    if (groupBy === 'none') return null;

    const groups = {};
    processedTrips.forEach(trip => {
      let key = 'Other';
      if (groupBy === 'category') {
        key = getTripStatus(trip.start_date, trip.end_date).toUpperCase();
      } else {
        key = trip.description || 'Global Destination';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(trip);
    });
    return groups;
  };

  const groupedTrips = getGroupedTrips();

  // Split into flat categories for default view
  const ongoingTrips = processedTrips.filter(t => getTripStatus(t.start_date, t.end_date) === 'ongoing');
  const upcomingTrips = processedTrips.filter(t => getTripStatus(t.start_date, t.end_date) === 'upcoming');
  const completedTrips = processedTrips.filter(t => getTripStatus(t.start_date, t.end_date) === 'completed');

  const userId = user?.id || 'me';

  return (
    <Layout>
      <div className="w-full bg-white min-h-screen pt-24 pb-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
          
          {/* User Profile Welcome Header */}
          {user && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border border-zinc-200 overflow-hidden shrink-0 shadow-sm bg-zinc-100 flex items-center justify-center">
                  {user.photo ? (
                    <img 
                      src={user.photo}
                      alt={user.username}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-zinc-400">
                      {(user.username || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-normal text-zinc-950">
                    Welcome back, {user.username}!
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Manage and review all your planned travel itineraries.
                  </p>
                </div>
              </div>
              <div>
                <button
                  onClick={handleLogout}
                  className="bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}

          {/* View Toggle + Search Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* List / Calendar Toggle */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setActiveView('list')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeView === 'list'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                ☰ List
              </button>
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeView === 'calendar'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                📅 Calendar
              </button>
            </div>

            {/* Only show search/sort/filter in list view */}
            {activeView === 'list' && (
              <div className="flex-grow w-full">
                <SearchControlBar 
                  onSearch={(query) => setSearchQuery(query)}
                  onGroup={(val) => setGroupBy(val)}
                  onFilter={(val) => setFilterBy(val)}
                  onSort={(val) => setSortBy(val)}
                />
              </div>
            )}
          </div>

          {/* ── Calendar View ── */}
          {activeView === 'calendar' && (
            <CalendarView trips={processedTrips} userId={userId} />
          )}

          {/* ── List View ── */}
          {activeView === 'list' && (
          <div className="flex flex-col gap-10 mt-2">
            
            {groupBy === 'none' ? (
              // Default chronological categories view
              <>
                {/* 1. ONGOING TRIPS */}
                <div>
                  <h2 className="text-lg sm:text-xl font-serif font-normal text-zinc-800 border-b border-zinc-100 pb-3 mb-5">
                    Ongoing
                  </h2>
                  {ongoingTrips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {ongoingTrips.map((trip, idx) => (
                        <TripOverviewCard key={idx} trip={trip} />
                      ))}
                    </div>
                  ) : (
                    <EmptyGroupPlaceholder text="No ongoing trips right now." />
                  )}
                </div>

                {/* 2. UPCOMING TRIPS */}
                <div>
                  <h2 className="text-lg sm:text-xl font-serif font-normal text-zinc-800 border-b border-zinc-100 pb-3 mb-5">
                    Up-coming
                  </h2>
                  {upcomingTrips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {upcomingTrips.map((trip, idx) => (
                        <TripOverviewCard key={idx} trip={trip} />
                      ))}
                    </div>
                  ) : (
                    <EmptyGroupPlaceholder text="No upcoming trips planned." />
                  )}
                </div>

                {/* 3. COMPLETED TRIPS */}
                <div>
                  <h2 className="text-lg sm:text-xl font-serif font-normal text-zinc-800 border-b border-zinc-100 pb-3 mb-5">
                    Completed
                  </h2>
                  {completedTrips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {completedTrips.map((trip, idx) => (
                        <TripOverviewCard key={idx} trip={trip} />
                      ))}
                    </div>
                  ) : (
                    <EmptyGroupPlaceholder text="No completed trips recorded." />
                  )}
                </div>
              </>
            ) : (
              // Custom grouped list view
              <div className="flex flex-col gap-8">
                {Object.keys(groupedTrips).map(groupTitle => (
                  <div key={groupTitle} className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-sky-600 bg-sky-50/50 py-1.5 px-3 rounded-lg border border-sky-100/50 inline-self-start tracking-wider uppercase">
                      {groupTitle}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {groupedTrips[groupTitle].map((trip, idx) => (
                        <TripOverviewCard key={idx} trip={trip} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
          )}

        </div>
      </div>
    </Layout>
  );
}

/**
 * TripOverviewCard Inner Component
 */
function TripOverviewCard({ trip }) {
  const router = useRouter();

  const handleCardClick = () => {
    const userStr = localStorage.getItem('globe_user');
    const user = JSON.parse(userStr || '{}');
    const userId = user.id || 'me';
    if (trip.id) {
      router.push(`/${userId}/trip/${trip.id}`);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-zinc-50/50 hover:bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] transition-all flex flex-col gap-4 cursor-pointer"
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">
            {trip.description || 'Global Destination'}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5 leading-tight">
            {trip.title}
          </h3>
        </div>
        <div className="bg-sky-50 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
          Planned
        </div>
      </div>

      <div className="text-xs sm:text-sm text-zinc-500 font-medium">
        📅 {trip.start_date ? trip.start_date.split('T')[0] : 'Anytime'} to {trip.end_date ? trip.end_date.split('T')[0] : 'Anytime'}
      </div>

      {trip.budget_limit && (
        <div className="text-xs font-bold text-emerald-600">
          Budget Limit: {trip.currency} {parseFloat(trip.budget_limit)}
        </div>
      )}
    </div>
  );
}

/**
 * EmptyGroupPlaceholder Inner Component
 */
function EmptyGroupPlaceholder({ text }) {
  return (
    <div className="w-full border border-dashed border-zinc-200 bg-zinc-50/10 rounded-2xl py-6 text-center text-xs sm:text-sm text-zinc-400 font-medium">
      {text}
    </div>
  );
}
