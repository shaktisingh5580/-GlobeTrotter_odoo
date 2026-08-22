/**
 * Search Page Component
 *
 * Purpose:
 * Renders the Activity and City Search route (/search) (Screen 8 in wireframes).
 *
 * Responsibility:
 * - Displays a search input pre-populated with "Paragliding" and controls (Group, Filter, Sort).
 * - Queries and filters a list of activities matching the user's search text.
 * - Renders a vertical list of detailed search result cards with pricing, ratings, and descriptions.
 * - Provides interactive search triggers that update results in real time.
 *
 * Why this file exists:
 * Standalone search result coordinator, keeping list lookup logic separate from dashboards.
 *
 * Used by:
 * - Next.js Router (/search)
 */

import React, { useState } from 'react';
import Layout from './Layout/Layout';
import SearchControlBar from '../components/SearchControlBar';

const MOCK_RESULTS = [
  {
    id: 1,
    title: "Tandem Paragliding Flight in Interlaken",
    location: "Interlaken, Switzerland",
    category: "Adventure",
    rating: "4.9",
    reviews: "340",
    price: "$180",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    description: "Soar over the stunning Swiss Alps and clear blue lakes of Interlaken with a certified professional pilot. Includes transport and gear."
  },
  {
    id: 2,
    title: "Lake Pokhara Paragliding Flight",
    location: "Pokhara, Nepal",
    category: "Sightseeing",
    rating: "4.8",
    reviews: "215",
    price: "$95",
    image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=600&q=80",
    description: "Take off from Sarangkot and enjoy magnificent views of the Annapurna mountain range and clear reflection views of Phewa Lake."
  },
  {
    id: 3,
    title: "Skyline Paragliding Pokhara Adventure",
    location: "Pokhara, Nepal",
    category: "Extreme Sports",
    rating: "4.9",
    reviews: "182",
    price: "$110",
    image: "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=600&q=80",
    description: "Experience thermaling with hawks while overlooking the Himalayan peaks in Pokhara's premier tandem tour."
  },
  {
    id: 4,
    title: "Queenstown Paragliding Flight from Gondola",
    location: "Queenstown, New Zealand",
    category: "Adventure",
    rating: "4.7",
    reviews: "95",
    price: "$150",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80",
    description: "Launch from the top of the Skyline Gondola and glide smoothly over the beautiful Lake Wakatipu and Remarkables mountain range."
  },
  {
    id: 5,
    title: "Alpine Hiking & Wilderness Trek",
    location: "Chamonix, France",
    category: "Hiking",
    rating: "4.9",
    reviews: "410",
    price: "$75",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    description: "Walk the path of legends under the gaze of Mont Blanc. Scenic day hikes through alpine meadows and rocky peaks."
  },
  {
    id: 6,
    title: "Fjord Kayaking & Gorge Exploration",
    location: "Lofoten, Norway",
    category: "Water Sports",
    rating: "4.8",
    reviews: "167",
    price: "$120",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
    description: "Paddle through crystal-clear Arctic waters surrounded by dramatic towering mountains in Norway's pristine fjords."
  },
  {
    id: 7,
    title: "Scuba Diving in Great Barrier Reef",
    location: "Cairns, Australia",
    category: "Marine Life",
    rating: "4.9",
    reviews: "680",
    price: "$210",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    description: "Explore the world's largest coral reef system. Swim alongside colorful tropical fish, sea turtles, and marine life."
  }
];

export default function SearchPage() {
  // Pre-fill the search input with "Paragliding" by default as in the wireframe
  const [query, setQuery] = useState('Paragliding');

  const filteredResults = MOCK_RESULTS.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.location.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout>
      <div className="w-full bg-white min-h-screen pt-24 pb-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          
          {/* Main Title Header */}
          <div className="pb-2">
            <h1 className="text-xl sm:text-2xl font-serif font-normal text-zinc-950">
              Activity Search Results
            </h1>
          </div>

          {/* Search Controls (Prefilled with query value) */}
          <SearchControlBar 
            onSearch={(text) => setQuery(text)}
          />

          {/* Results Listings (Matches Stacked Row Wireframe) */}
          <div className="flex flex-col gap-5 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-sans">
                Results ({filteredResults.length})
              </h2>
            </div>

            {filteredResults.length > 0 ? (
              <div className="flex flex-col gap-4">
                {filteredResults.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-50/50 hover:bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] transition-all flex flex-col sm:flex-row gap-5 items-stretch cursor-pointer group"
                  >
                    {/* Thumbnail Image */}
                    <div className="w-full sm:w-44 h-32 relative rounded-xl overflow-hidden shrink-0 bg-zinc-100">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                      />
                      <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                        {item.category}
                      </span>
                    </div>

                    {/* Text Details Content */}
                    <div className="flex-grow flex flex-col justify-between gap-2">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-base sm:text-lg font-bold text-zinc-900 group-hover:text-sky-600 transition-colors leading-tight">
                            {item.title}
                          </h3>
                          <span className="text-base sm:text-lg font-bold text-zinc-950 font-sans shrink-0">
                            {item.price}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-xs sm:text-sm font-semibold mt-0.5">
                          📍 {item.location}
                        </p>
                      </div>

                      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold border-t border-zinc-100 pt-2.5 mt-1">
                        <span>⭐ {item.rating}</span>
                        <span className="text-zinc-300 font-normal">|</span>
                        <span>({item.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full border border-dashed border-zinc-200 bg-zinc-50/10 rounded-2xl py-12 text-center text-xs sm:text-sm text-zinc-400 font-medium">
                No matching activities found for "{query}".
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
