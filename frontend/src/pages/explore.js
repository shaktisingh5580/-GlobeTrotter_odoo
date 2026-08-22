/**
 * Explore Page Component
 *
 * Purpose:
 * Renders the Experience and Destination Explore route (/explore) (formerly Search Page).
 *
 * Responsibility:
 * - Queries and processes a list of activities matching search, filter, group, and sort states.
 * - Handles grouping by category or location, displaying subheaders.
 * - Handles filtering (Rating 4.8+, Budget friendly) and sorting (Price low-high, high-low, Rating).
 *
 * Used by:
 * - Next.js Router (/explore)
 */

import React, { useState } from 'react';
import Layout from './Layout/Layout';
import SearchControlBar from '../components/SearchControlBar';
import {
  varanasi_photo,
  font_varanasi,
  ladakh_magnetic_hill,
  ladakh_nubra_valley,
  font_ladakh,
  manali_hidimba_devi,
  manali_rohtang_pass,
  font_manali,
  shimla_toy_train,
  font_shimla,
  udaipur_lake_pichola,
  font_hawa_mahal
} from "@/assets";

const MOCK_RESULTS = [
  {
    id: 1,
    title: "Ganga Aarti Ritual and Boat Ride",
    location: "Varanasi, India",
    category: "Sightseeing",
    rating: "4.9",
    reviews: "340",
    price: "$45",
    image: varanasi_photo,
    fontImage: font_varanasi,
    description: "Witness the magnificent spiritual fire offering ritual (Aarti) on the ghats of the Ganges River and enjoy a serene evening boat tour."
  },
  {
    id: 2,
    title: "Magnetic Hill Mystery Tour",
    location: "Ladakh, India",
    category: "Adventure",
    rating: "4.8",
    reviews: "215",
    price: "$95",
    image: ladakh_magnetic_hill,
    fontImage: font_ladakh,
    description: "Experience the optical illusion where vehicles seem to defy gravity and roll uphill on the Leh-Kargil highway."
  },
  {
    id: 3,
    title: "Nubra Valley Camel Safari",
    location: "Ladakh, India",
    category: "Sightseeing",
    rating: "4.9",
    reviews: "182",
    price: "$110",
    image: ladakh_nubra_valley,
    fontImage: font_ladakh,
    description: "Ride the double-humped Bactrian camels across the cold desert dunes of Nubra Valley against the backdrop of snowy mountain peaks."
  },
  {
    id: 4,
    title: "Solang Valley Paragliding & Adventure",
    location: "Manali, India",
    category: "Adventure",
    rating: "4.7",
    reviews: "95",
    price: "$150",
    image: manali_rohtang_pass,
    fontImage: font_manali,
    description: "Glide high over the lush meadows and snow-covered slopes of Solang Valley with experienced tandem pilots in Manali."
  },
  {
    id: 5,
    title: "Hidimba Devi Historic Temple Walk",
    location: "Manali, India",
    category: "Culture",
    rating: "4.9",
    reviews: "410",
    price: "$35",
    image: manali_hidimba_devi,
    fontImage: font_manali,
    description: "Explore the ancient wooden pagoda temple built in 1553, surrounded by a thick cedar forest in the beautiful town of Manali."
  },
  {
    id: 6,
    title: "Kalka-Shimla Toy Train Ride",
    location: "Shimla, India",
    category: "Adventure",
    rating: "4.8",
    reviews: "167",
    price: "$60",
    image: shimla_toy_train,
    fontImage: font_shimla,
    description: "Enjoy the breathtaking views of pine-covered hills and historic bridges on the UNESCO World Heritage toy train ride in Shimla."
  },
  {
    id: 7,
    title: "Lake Pichola Romantic Boat Cruise",
    location: "Udaipur, India",
    category: "Leisure",
    rating: "4.9",
    reviews: "680",
    price: "$80",
    image: udaipur_lake_pichola,
    fontImage: font_hawa_mahal,
    description: "Cruise the placid waters of Lake Pichola at sunset, witnessing the majestic Lake Palace and City Palace lit up in Udaipur."
  }
];

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Helper to parse numeric prices e.g. "$180" -> 180
  const getNumericPrice = (pStr) => {
    return parseFloat(pStr.replace(/[^0-9.]/g, '')) || 0;
  };

  // 1. Process Filtering & Searching
  let processed = MOCK_RESULTS.filter(item => {
    // Search query check
    const matchesSearch = 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.location.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase());

    // Filter check
    let matchesFilter = true;
    if (filterBy === 'rating') {
      matchesFilter = parseFloat(item.rating) >= 4.8;
    } else if (filterBy === 'budget') {
      matchesFilter = getNumericPrice(item.price) < 120;
    }

    return matchesSearch && matchesFilter;
  });

  // 2. Process Sorting
  if (sortBy === 'price_asc') {
    processed.sort((a, b) => getNumericPrice(a.price) - getNumericPrice(b.price));
  } else if (sortBy === 'price_desc') {
    processed.sort((a, b) => getNumericPrice(b.price) - getNumericPrice(a.price));
  } else if (sortBy === 'rating_desc') {
    processed.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  }

  // 3. Process Grouping
  const getGroupedData = () => {
    if (groupBy === 'none') return null;
    
    const groups = {};
    processed.forEach(item => {
      const key = groupBy === 'category' ? item.category : item.location;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  };

  const groupedData = getGroupedData();

  return (
    <Layout>
      <div className="w-full bg-white min-h-screen pt-24 pb-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          
          {/* Main Title Header */}
          <div className="pb-2">
            <h1 className="text-xl sm:text-2xl font-serif font-normal text-zinc-950">
              Explore Experiences & Destinations
            </h1>
          </div>

          {/* Search Controls */}
          <SearchControlBar 
            onSearch={(text) => setQuery(text)}
            onGroup={(val) => setGroupBy(val)}
            onFilter={(val) => setFilterBy(val)}
            onSort={(val) => setSortBy(val)}
          />

          {/* Results Listings */}
          <div className="flex flex-col gap-5 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-sans">
                Results ({processed.length})
              </h2>
            </div>

            {processed.length > 0 ? (
              groupBy === 'none' ? (
                // Flat List view
                <div className="flex flex-col gap-4">
                  {processed.map((item) => (
                    <ActivityRowCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                // Grouped views
                <div className="flex flex-col gap-8">
                  {Object.keys(groupedData).map((groupTitle) => (
                    <div key={groupTitle} className="flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-sky-600 bg-sky-50/50 py-1.5 px-3 rounded-lg border border-sky-100/50 inline-self-start tracking-wider uppercase">
                        {groupTitle}
                      </h3>
                      <div className="flex flex-col gap-4">
                        {groupedData[groupTitle].map((item) => (
                          <ActivityRowCard key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="w-full border border-dashed border-zinc-200 bg-zinc-50/10 rounded-2xl py-12 text-center text-xs sm:text-sm text-zinc-400 font-medium">
                No matching activities found.
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}

/**
 * Activity Card row item component
 */
function ActivityRowCard({ item }) {
  return (
    <div
      className="bg-zinc-50/50 hover:bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] transition-all flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch cursor-pointer group"
    >
      {/* Thumbnail Image */}
      <div className="w-full sm:w-44 h-40 sm:h-32 relative rounded-xl overflow-hidden shrink-0 bg-zinc-100">
        <img 
          src={item.image?.src || item.image} 
          alt={item.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
        />
        
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors pointer-events-none" />

        {/* Typography Font Overlay */}
        {item.fontImage && (
          <div className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none">
            <div className="relative w-[75%] h-[75%] flex items-center justify-center">
              <img
                src={item.fontImage?.src || item.fontImage}
                alt={`${item.title} font`}
                className="object-contain max-h-full max-w-full drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]"
              />
            </div>
          </div>
        )}

        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
          {item.category}
        </span>
      </div>

      {/* Text Details Content */}
      <div className="flex-grow flex flex-col justify-between gap-2">
        <div>
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-sky-600 transition-colors leading-tight">
              {item.title}
            </h3>
            <span className="text-sm sm:text-base font-bold text-zinc-950 font-sans shrink-0">
              {item.price}
            </span>
          </div>
          <p className="text-zinc-500 text-[11px] sm:text-xs font-semibold mt-0.5">
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
  );
}
