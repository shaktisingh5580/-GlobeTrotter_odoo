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
  const [posts, setPosts] = useState(MOCK_POSTS);

  const handleLikeClick = (id) => {
    setPosts(prevPosts => 
      prevPosts.map(p => 
        p.id === id ? { ...p, likes: p.likes + 1, liked: true } : p
      )
    );
  };

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.sharedTrip.place.toLowerCase().includes(searchQuery.toLowerCase())
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
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <div key={post.id} className="flex gap-4 items-start bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] transition-all">
                  
                  {/* Left Column: User Avatar (◯) */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-zinc-200 overflow-hidden shrink-0 shadow-sm">
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>

                  {/* Right Column: Post Body */}
                  <div className="flex-grow flex flex-col gap-3">
                    
                    {/* Author Meta Details */}
                    <div>
                      <span className="font-bold text-zinc-800 text-xs sm:text-sm">
                        {post.author.name}
                      </span>
                      <span className="text-[10px] sm:text-xs text-zinc-400 ml-2 font-medium">
                        @{post.author.username} • {post.time}
                      </span>
                    </div>

                    {/* Post Text Description */}
                    <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Shared Trip Preview Box */}
                    <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-sky-500 transition-colors">
                      <div>
                        <span className="text-[9px] text-sky-600 font-bold uppercase tracking-wider block">
                          📍 Shared Itinerary
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-800 mt-0.5">
                          {post.sharedTrip.title} ({post.sharedTrip.place})
                        </h4>
                        <span className="text-[11px] text-zinc-400 font-semibold font-sans mt-0.5 block">
                          {post.sharedTrip.sectionsCount} Sections | Est. Budget: {post.sharedTrip.budget}
                        </span>
                      </div>
                      <button className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-4 py-2 text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-sm">
                        View Itinerary
                      </button>
                    </div>

                    {/* Social Feed Actions Bar */}
                    <div className="flex items-center gap-6 border-t border-zinc-100 pt-3 text-xs font-semibold text-zinc-400 font-sans">
                      <button
                        onClick={() => handleLikeClick(post.id)}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer hover:text-rose-500 ${post.liked ? 'text-rose-500' : ''}`}
                      >
                        <span>{post.liked ? '❤️' : '♡'}</span>
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 transition-colors cursor-pointer hover:text-sky-600">
                        <span>💬</span>
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-1.5 transition-colors cursor-pointer hover:text-zinc-950">
                        <span>🔗</span>
                        <span>Share</span>
                      </button>
                    </div>

                  </div>

                </div>
              ))
            ) : (
              <div className="w-full border border-dashed border-zinc-200 bg-zinc-50/10 rounded-2xl py-12 text-center text-xs sm:text-sm text-zinc-400 font-medium">
                No community posts match "{searchQuery}".
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
