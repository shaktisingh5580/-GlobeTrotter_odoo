import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../services/api';

export default function SharedTripPage() {
  const router = useRouter();
  const { shareToken } = router.query;
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || !shareToken) return;

    api.get(`/sharing/shared/${shareToken}`)
      .then(data => {
        setTripData(data || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch shared trip details:', err);
        setLoading(false);
      });
  }, [router.isReady, shareToken]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <p className="text-zinc-500 font-sans text-sm">Loading itinerary details...</p>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-serif text-zinc-800">Itinerary Not Found</h2>
        <p className="text-sm text-zinc-400 font-sans">
          This shared itinerary link may have expired or is invalid.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-zinc-950 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:bg-zinc-800 cursor-pointer"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const trip = tripData;
  const author = null; // not returned in public share

  // Flatten sections from all stops
  const allSections = (trip.stops || []).flatMap(stop => stop.sections || []);

  // Group sections dynamically by days
  const getDaysGrouped = () => {
    if (allSections.length === 0) return {};
    
    const sorted = [...allSections].sort((a, b) => {
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(a.start_date) - new Date(b.start_date);
    });

    const tripStart = new Date(trip.start_date);
    const groups = {};

    sorted.forEach((sec, idx) => {
      let dayName = 'Day 1';
      if (sec.start_date) {
        const secDate = new Date(sec.start_date);
        const diffTime = Math.abs(secDate - tripStart);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        dayName = `Day ${isNaN(diffDays) ? 1 : diffDays}`;
      } else {
        dayName = `Day ${Math.floor(idx / 3) + 1}`;
      }

      if (!groups[dayName]) groups[dayName] = [];
      groups[dayName].push(sec);
    });

    return groups;
  };

  const daysGrouped = getDaysGrouped();

  return (
    <div className="w-full bg-[#FCF8F2]/20 min-h-screen">
      {/* Basic Nav / Header */}
      <div className="w-full bg-white border-b border-zinc-100 py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <span className="text-sky-600 font-bold text-xl">Globe</span>
          <span className="text-yellow-500 font-bold text-xl">Trotter</span>
        </div>
      </div>

      <div className="w-full min-h-screen pt-12 pb-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          
          {/* Page Heading */}
          <div className="text-center my-2 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-serif font-normal text-zinc-950">
                Itinerary for {trip.title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                📍 Destination: {trip.description || 'Global'} | Date Range: {trip.start_date ? trip.start_date.split('T')[0] : ''} to {trip.end_date ? trip.end_date.split('T')[0] : ''}
              </p>
            </div>
          </div>

          {/* Itinerary Column Headers */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-100 mt-4 text-xs font-bold text-zinc-400 uppercase tracking-wider font-sans">
            <span>Physical Activity</span>
            <span>Est. Cost</span>
          </div>

          {/* Days Groupings list */}
          <div className="flex flex-col gap-10 mt-6">
            {Object.keys(daysGrouped).length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-12 text-center flex flex-col items-center gap-3 mt-4">
                <span className="text-4xl">🏕️</span>
                <h3 className="font-bold text-zinc-900 text-lg">Itinerary is Empty</h3>
                <p className="text-zinc-500 text-sm max-w-md">
                  The author hasn't added any activities to this trip yet. Check back later!
                </p>
              </div>
            ) : (
              Object.keys(daysGrouped).map((dayKey) => {
                const daySections = daysGrouped[dayKey];
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
                            <div className="flex-grow bg-white border border-zinc-200 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)] flex flex-col gap-1">
                              <h3 className="text-sm sm:text-base font-bold text-zinc-800">
                                {sec.title}
                              </h3>
                              <p className="text-zinc-500 text-xs leading-relaxed max-w-3xl">
                                {sec.description}
                              </p>
                              {sec.start_date && (
                                <span className="text-[10px] text-zinc-400 font-semibold mt-1">
                                  ⏱ Time: {sec.start_date.split('T')[0]} to {sec.end_date.split('T')[0]}
                                </span>
                              )}
                            </div>

                            {/* Expense Box */}
                            <div className="w-24 sm:w-36 border border-zinc-200 bg-zinc-50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shrink-0 text-center">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                                Cost
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-zinc-800 font-sans">
                                {trip.currency || 'INR'} {sec.planned_budget ? parseFloat(sec.planned_budget) : 0}
                              </span>
                            </div>
                          </div>

                          {/* Connected Arrow Down */}
                          {secIdx < daySections.length - 1 && (
                            <div className="flex justify-start pl-8 sm:pl-12 my-1">
                              <svg 
                                className="w-5 h-5 text-zinc-300" 
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
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
