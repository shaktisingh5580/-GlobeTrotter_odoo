/**
 * Dynamic Trip Details Page Component (Itinerary View - Screen 9)
 *
 * Purpose:
 * Renders the detailed itinerary timeline for a specific trip, structured by days with activity and expense columns.
 *
 * Responsibility:
 * - Reads dynamic routing query values (userId and tripId) using Next.js useRouter.
 * - Queries the local storage trips database to locate the matching itinerary details.
 * - Groups itinerary sections dynamically by day compared to the trip start date.
 * - Displays the Day-by-Day timeline flow where activities are connected by downward arrows.
 * - Displays parallel Expense slots next to each Activity card matching the wireframe.
 *
 * Why this file exists:
 * Dynamically serves context-specific itineraries under structured user routing slots.
 *
 * Used by:
 * - Next.js Router (/[userId]/trip/[tripId])
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../pages/Layout/Layout';
import SearchControlBar from '../../../components/SearchControlBar';

export default function TripDetailsPage() {
  const router = useRouter();
  const { userId, tripId } = router.query;
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    const storedTrips = localStorage.getItem('globe_trips');
    if (storedTrips) {
      const tripsArray = JSON.parse(storedTrips);
      const foundTrip = tripsArray.find(
        (t) => t.userId === userId && t.tripId === tripId
      );
      setTrip(foundTrip || null);
    }
    setLoading(false);
  }, [router.isReady, userId, tripId]);

  if (loading) {
    return (
      <Layout>
        <div className="w-full min-h-screen bg-white flex items-center justify-center">
          <p className="text-zinc-500 font-sans text-sm">Loading itinerary details...</p>
        </div>
      </Layout>
    );
  }

  if (!trip) {
    return (
      <Layout>
        <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-serif text-zinc-800">Itinerary Not Found</h2>
          <p className="text-sm text-zinc-400 font-sans">
            The requested travel details could not be located.
          </p>
          <button
            onClick={() => router.push('/trips')}
            className="bg-zinc-950 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:bg-zinc-800 cursor-pointer"
          >
            Go to Trips
          </button>
        </div>
      </Layout>
    );
  }

  // Group sections dynamically by days
  const getDaysGrouped = () => {
    if (!trip.sections) return {};
    
    // Sort sections by date
    const sorted = [...trip.sections].sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    const tripStart = new Date(trip.startDate);
    const groups = {};

    sorted.forEach((sec, idx) => {
      let dayName = 'Day 1';
      if (sec.startDate) {
        const secDate = new Date(sec.startDate);
        const diffTime = Math.abs(secDate - tripStart);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        dayName = `Day ${isNaN(diffDays) ? 1 : diffDays}`;
      } else {
        // Fallback to sequential grouping if dates are missing
        dayName = `Day ${Math.floor(idx / 3) + 1}`;
      }

      if (!groups[dayName]) groups[dayName] = [];
      groups[dayName].push(sec);
    });

    return groups;
  };

  const daysGrouped = getDaysGrouped();

  // Filtered entries helper based on search query
  const matchesQuery = (text) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <Layout>
      <div className="w-full bg-white min-h-screen pt-24 pb-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          
          {/* Back Nav */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <button
              onClick={() => router.push('/trips')}
              className="text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-950 flex items-center gap-2 cursor-pointer transition-colors"
            >
              &larr; Back to Trips
            </button>
            <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold tracking-wider uppercase font-sans">
              Itinerary View (Screen 9)
            </span>
          </div>

          {/* Page Heading */}
          <div className="text-center my-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-zinc-950">
              Itinerary for {trip.tripName}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              📍 Destination: {trip.place} | Date Range: {trip.startDate} to {trip.endDate}
            </p>
          </div>

          {/* Search bar controls at top */}
          <SearchControlBar onSearch={(q) => setSearchQuery(q)} />

          {/* Itinerary Column Headers */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-100 mt-4 text-xs font-bold text-zinc-400 uppercase tracking-wider font-sans">
            <span>Physical Activity</span>
            <span>Expense</span>
          </div>

          {/* Days Groupings list */}
          <div className="flex flex-col gap-10 mt-6">
            {Object.keys(daysGrouped).map((dayKey) => {
              const daySections = daysGrouped[dayKey].filter(sec => 
                matchesQuery(sec.title) || matchesQuery(sec.description)
              );

              if (daySections.length === 0) return null;

              return (
                <div key={dayKey} className="flex flex-col gap-6">
                  {/* Day Label */}
                  <div>
                    <span className="inline-block bg-zinc-900 text-white font-sans text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                      {dayKey}
                    </span>
                  </div>

                  {/* Flow Timeline */}
                  <div className="flex flex-col gap-4">
                    {daySections.map((sec, secIdx) => (
                      <React.Fragment key={sec.id || secIdx}>
                        {/* Activity Row matching wireframe */}
                        <div className="flex items-stretch gap-4 sm:gap-6">
                          {/* Physical Activity Box */}
                          <div className="flex-grow bg-white border border-zinc-200 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)] hover:border-sky-500 transition-all flex flex-col gap-1">
                            <h3 className="text-sm sm:text-base font-bold text-zinc-800">
                              {sec.title}
                            </h3>
                            <p className="text-zinc-500 text-xs leading-relaxed max-w-3xl">
                              {sec.description}
                            </p>
                            {sec.startDate && (
                              <span className="text-[10px] text-zinc-400 font-semibold mt-1">
                                ⏱ Time: {sec.startDate} to {sec.endDate}
                              </span>
                            )}
                          </div>

                          {/* Expense Box */}
                          <div className="w-24 sm:w-36 border border-zinc-200 bg-zinc-50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shrink-0 text-center">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                              Cost
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-zinc-800 font-sans">
                              {sec.budget || '$0'}
                            </span>
                          </div>
                        </div>

                        {/* Connected Arrow Down */}
                        {secIdx < daySections.length - 1 && (
                          <div className="flex justify-start pl-8 sm:pl-12 my-1">
                            <svg 
                              className="w-5 h-5 text-zinc-300 animate-pulse" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                              />
                            </svg>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </Layout>
  );
}
