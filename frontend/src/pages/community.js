/**
 * Community Page Component
 *
 * Purpose:
 * Renders the traveler social sharing route (/community) (Screen 10 in wireframes).
 *
 * Responsibility:
 * - Displays a search input to filter community posts.
 * - Renders a vertical feed of social posts featuring user avatars, posts, and interactive likes.
 * - embeds travel itinerary preview cards inside posts.
 * - Integrates mock user feedback interactions (Likes, comments, shares count).
 *
 * Why this file exists:
 * Standalone page coordinator inside the Page Router structure for community posts.
 *
 * Used by:
 * - Next.js Router (/community)
 */

import React, { useState } from 'react';
import Layout from './Layout/Layout';
import api from '../services/api';
import SearchControlBar from '../components/SearchControlBar';

const MOCK_POSTS = [
  {
    id: 1,
    author: {
      name: "Ritesh Patel",
      username: "ritesh_patel",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    },
    time: "2 hours ago",
    content: "Just came back from a wonderful 5-day trip to Kyoto! Shared my full itinerary below, featuring the best sushi spots in Gion and a quiet temple walk around Arashiyama.",
    likes: 42,
    comments: 8,
    sharedTrip: {
      title: "Kyoto Autumn Retreat",
      place: "Kyoto, Japan",
      budget: "$850",
      sectionsCount: 4
    }
  },
  {
    id: 2,
    author: {
      name: "Sarah Jenkins",
      username: "sarah_travels",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
    },
    time: "5 hours ago",
    content: "Here is my ultimate paragliding and hiking itinerary for Switzerland! Spent a week soaring over Interlaken and hiking Chamonix. Extreme adventure lovers, this one is for you!",
    likes: 128,
    comments: 31,
    sharedTrip: {
      title: "Swiss Alps Adventure",
      place: "Interlaken, Switzerland",
      budget: "$1200",
      sectionsCount: 5
    }
  },
  {
    id: 3,
    author: {
      name: "Marco Silva",
      username: "marco_explorer",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80"
    },
    time: "1 day ago",
    content: "Diving in the Great Barrier Reef was a bucket list dream come true. Here is the daily breakdown of boat trips, gear rentals, and diving spots near Cairns.",
    likes: 95,
    comments: 14,
    sharedTrip: {
      title: "Barrier Reef Scuba Expedition",
      place: "Cairns, Australia",
      budget: "$950",
      sectionsCount: 3
    }
  },
  {
    id: 4,
    author: {
      name: "Emily Wong",
      username: "emily_w",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
    },
    time: "3 days ago",
    content: "My weekend itinerary for exploring historical monuments, food spots, and cafes around Rome. Keeps it low budget but extremely high fun!",
    likes: 67,
    comments: 5,
    sharedTrip: {
      title: "Rome Quick Weekend Escape",
      place: "Rome, Italy",
      budget: "$350",
      sectionsCount: 3
    }
  }
];

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    api.get('/community/posts')
      .then(data => {
        setPosts(Array.isArray(data) ? data : (data?.items || []));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch posts:', err);
        setLoading(false);
      });
  }, []);

  const filteredPosts = posts.filter(post => 
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="w-full bg-[#FCF8F2]/20 min-h-screen pt-24 pb-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          
          {/* Main Title Header */}
          <div className="pb-2">
            <h1 className="text-xl sm:text-2xl font-serif font-normal text-zinc-950">
              Community Tab
            </h1>
          </div>

          {/* Search bar controls at top */}
          <SearchControlBar onSearch={(q) => setSearchQuery(q)} />

          {/* Posts Feed Listings */}
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full mt-4">
            {loading ? (
              <p className="text-sm text-zinc-500 font-sans text-center mt-10">Loading community posts...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-sm text-zinc-500 font-sans text-center mt-10">No community posts found.</p>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                  
                  {/* Author Meta */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={post.author?.avatar_url || "https://ui-avatars.com/api/?name=" + (post.author?.first_name || 'U')} 
                      alt={post.author?.first_name} 
                      className="w-10 h-10 rounded-full object-cover bg-zinc-200"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-zinc-900 text-sm">
                          {post.author?.first_name} {post.author?.last_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div>
                    <h3 className="font-bold text-zinc-800 text-md">{post.title}</h3>
                    <p className="text-sm text-zinc-600 font-sans leading-relaxed mt-1">
                      {post.content}
                    </p>
                  </div>

                  {/* Embedded Shared Itinerary */}
                  {post.trip_id && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                            Shared Itinerary
                          </span>
                        </div>
                        <h4 className="font-bold text-zinc-900 text-sm">{post.destination?.name || 'Travel Trip'}</h4>
                        <span className="text-xs text-zinc-500">
                          Click to view full shared itinerary
                        </span>
                      </div>
                      <button 
                        onClick={() => window.location.href = `/shared/${post.trip_id}`}
                        className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-5 py-2 text-xs font-bold shadow-sm transition-colors shrink-0"
                      >
                        View Itinerary
                      </button>
                    </div>
                  )}

                  {/* Footer Stats */}
                  <div className="flex items-center gap-6 mt-2 pt-4 border-t border-zinc-50">
                    <button className="flex items-center gap-1.5 text-zinc-400 hover:text-sky-600 transition-colors text-xs font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                      {post.reactions_count?.like || 0}
                    </button>
                    <button className="flex items-center gap-1.5 text-zinc-400 hover:text-sky-600 transition-colors text-xs font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                      {post.comments_count || 0}
                    </button>
                  </div>
                  
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
