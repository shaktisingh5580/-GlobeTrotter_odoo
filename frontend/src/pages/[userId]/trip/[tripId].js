/**
 * Dynamic Trip Details Page Component (Itinerary View - Screen 9)
 *
 * Purpose:
 * Renders the detailed itinerary timeline for a specific trip, structured by days with activity and expense columns,
 * loading data from NestJS backend APIs.
 *
 * Responsibility:
 * - Reads dynamic routing query values (userId and tripId) using Next.js useRouter.
 * - Queries the NestJS database (GET /trips/:tripId/full) to retrieve the full itinerary details.
 * - Groups itinerary sections dynamically by day compared to the trip start date.
 * - Displays the Day-by-Day timeline flow where activities are connected by downward arrows.
 * - Displays parallel Expense slots next to each Activity card matching the wireframe.
 *
 * Used by:
 * - Next.js Router (/[userId]/trip/[tripId])
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../pages/Layout/Layout';
import SearchControlBar from '../../../components/SearchControlBar';
import api from '../../../services/api';

export default function TripDetailsPage() {
  const router = useRouter();
  const { userId, tripId } = router.query;
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [communityPosting, setCommunityPosting] = useState(false);
  const [communityPostSuccess, setCommunityPostSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!router.isReady || !tripId) return;

    // Fetch the full trip details including stops and sections from NestJS
    api.get(`/trips/${tripId}/full`)
      .then(data => {
        setTrip(data || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch full trip details:', err);
        setLoading(false);
      });
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
            The requested travel details could not be located on the server.
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

  // Filtered entries helper based on search query
  const matchesQuery = (text) => {
    if (!searchQuery) return true;
    return (text || '').toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Calculate total budget of the trip
  const calculateTotalBudget = () => {
    if (!trip.sections) return 'INR 0';
    let total = 0;
    trip.sections.forEach(sec => {
      if (sec.planned_budget) {
        total += parseFloat(sec.planned_budget);
      }
    });
    return total > 0 ? `${trip.currency || 'INR'} ${total}` : 'Unspecified';
  };

  const handleShareClick = async () => {
    setIsShareModalOpen(true);
    setSharing(true);
    try {
      const response = await api.post(`/sharing/trips/${tripId}/share`, {
        visibility: 'LINK_ONLY',
        expires_in_days: 30
      });
      setShareData(response);
    } catch (err) {
      console.error('Failed to generate share link:', err);
      alert('Failed to generate share link.');
    } finally {
      setSharing(false);
    }
  };

  const handlePostToCommunity = async () => {
    if (communityPosting || communityPostSuccess) return;
    setCommunityPosting(true);
    try {
      await api.post('/community/posts', {
        title: `Just planned a trip to ${trip.description || 'a new destination'}!`,
        content: `Check out my itinerary for ${trip.title}.`,
        trip_id: tripId
      });
      setCommunityPostSuccess(true);
      setTimeout(() => {
        setIsShareModalOpen(false);
        setCommunityPostSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to post to community:', err);
      alert('Failed to post to community.');
    } finally {
      setCommunityPosting(false);
    }
  };

  return (
    <Layout>
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-5 border border-zinc-100">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-lg font-serif font-semibold text-zinc-900">Share Your Itinerary</h3>
              <button onClick={() => { setIsShareModalOpen(false); setShareData(null); setCopied(false); }} className="text-zinc-400 hover:text-zinc-800 transition-colors">
                ✕
              </button>
            </div>
            
            {sharing ? (
              <p className="text-sm text-zinc-500 py-4 text-center">Generating secure link...</p>
            ) : shareData ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-zinc-600 font-sans leading-relaxed">
                  Anyone with this link can view a read-only version of your itinerary. Budgets and private notes are hidden.
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={shareData.share_url} 
                    className="flex-grow bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(shareData.share_url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center gap-4 my-2">
                  <hr className="flex-grow border-zinc-100" />
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">OR</span>
                  <hr className="flex-grow border-zinc-100" />
                </div>

                <button 
                  onClick={handlePostToCommunity}
                  disabled={communityPosting || communityPostSuccess}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors flex justify-center items-center gap-2 ${
                    communityPostSuccess 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                      : 'bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white'
                  }`}
                >
                  {communityPostSuccess ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Posted to Community!
                    </>
                  ) : communityPosting ? (
                    'Posting...'
                  ) : (
                    'Post to Community Feed'
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm text-red-500 py-4 text-center">Failed to load share data.</p>
            )}
          </div>
        </div>
      )}

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
          <div className="text-center my-2 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-serif font-normal text-zinc-950">
                Itinerary for {trip.title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                📍 Destination: {trip.description || 'Global'} | Date Range: {trip.start_date ? trip.start_date.split('T')[0] : ''} to {trip.end_date ? trip.end_date.split('T')[0] : ''}
              </p>
            </div>

            {/* Total Budget Badge & Share Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <button
                onClick={handleShareClick}
                className="bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 border border-sky-200 rounded-xl px-5 py-2.5 text-sm font-bold tracking-wide transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                Share
              </button>
              
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 sm:p-5 flex flex-col gap-1 items-start sm:items-end shrink-0">
                <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider">
                  Total Budget
                </span>
                <span className="text-xl sm:text-2xl font-bold text-sky-900 font-sans">
                  {calculateTotalBudget()}
                </span>
              </div>
            </div>
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
