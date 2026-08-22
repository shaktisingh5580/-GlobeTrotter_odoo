/**
 * Trips Page Component
 *
 * Purpose:
 * Renders the user's travel list page (/trips) showcasing active, upcoming, and past trips.
 *
 * Responsibility:
 * - Reads authenticated user state and itinerary details from browser localStorage.
 * - Sorts trips dynamically into Ongoing, Upcoming, and Completed categories based on date checks.
 * - Mounts a search and filter bar allowing users to search trip destinations.
 * - Coordinates responsive grid rendering of trip overview cards.
 *
 * Why this file exists:
 * Standalone page coordinator inside the Page Router structure for authenticated trip management.
 *
 * Used by:
 * - Next.js Router (/trips)
 *
 * Boundary:
 * Restricts access to guest users by redirecting unauthenticated viewports back to home.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../pages/Layout/Layout';
import SearchControlBar from '../components/SearchControlBar';

export default function Trips() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Read auth session and stored trips from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('globe_user');
    const storedTrips = localStorage.getItem('globe_trips');

    if (!storedUser) {
      // Redirect to home if not logged in
      router.push('/');
    } else {
      setUser(JSON.parse(storedUser));
      setTrips(JSON.parse(storedTrips || '[]'));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('globe_user');
    router.push('/');
  };

  // Filter trips based on search query
  const filteredTrips = trips.filter(trip => 
    trip.tripName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.place.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const ongoingTrips = filteredTrips.filter(t => getTripStatus(t.startDate, t.endDate) === 'ongoing');
  const upcomingTrips = filteredTrips.filter(t => getTripStatus(t.startDate, t.endDate) === 'upcoming');
  const completedTrips = filteredTrips.filter(t => getTripStatus(t.startDate, t.endDate) === 'completed');

  return (
    <Layout>
      <div className="w-full bg-white min-h-screen pt-24 pb-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
          
          {/* User Profile Welcome Header */}
          {user && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border border-zinc-200 overflow-hidden shrink-0 shadow-sm">
                  <img 
                    src={user.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                    alt={user.username}
                    className="w-full h-full object-cover pointer-events-none"
                  />
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

          {/* Search & Control Filter Bar */}
          <SearchControlBar 
            onSearch={(query) => setSearchQuery(query)}
          />

          {/* Trips Groups Layout */}
          <div className="flex flex-col gap-10 mt-2">
            
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

          </div>

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
    if (trip.userId && trip.tripId) {
      router.push(`/${trip.userId}/trip/${trip.tripId}`);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-zinc-50/50 hover:bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] transition-all flex flex-col gap-4 cursor-pointer"
    >
      {/* Title block */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">
            {trip.place}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5 leading-tight">
            {trip.tripName}
          </h3>
        </div>
        <div className="bg-sky-50 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
          {trip.sections ? `${trip.sections.length} Sections` : '0 Sections'}
        </div>
      </div>

      {/* Dates & overview */}
      <div className="text-xs sm:text-sm text-zinc-500 font-medium">
        📅 {trip.startDate} to {trip.endDate}
      </div>

      {/* Itinerary Sections preview */}
      {trip.sections && trip.sections.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4 mt-1">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Itinerary Overview
          </h4>
          <div className="flex flex-col gap-2.5">
            {trip.sections.map((sec, sIdx) => (
              <div key={sec.id || sIdx} className="bg-white border border-zinc-100 rounded-xl p-3 flex flex-col gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-700">
                  <span>{sec.title}</span>
                  {sec.budget && <span className="text-zinc-900">{sec.budget}</span>}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {sec.description}
                </p>
                {(sec.startDate || sec.endDate) && (
                  <div className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    ⏱ {sec.startDate || 'Anytime'} to {sec.endDate || 'Anytime'}
                  </div>
                )}
              </div>
            ))}
          </div>
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
