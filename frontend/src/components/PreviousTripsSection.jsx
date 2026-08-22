/**
 * PreviousTripsSection Component
 *
 * Purpose:
 * Renders an interactive horizontal carousel showing the user's past travels with sliding controls.
 *
 * Responsibility:
 * - Displays a horizontal row of aspect-[3/4] previous trip cards.
 * - Renders navigation arrows (Left and Right) aligned to the right of the "Previous Trips" section heading.
 * - Wireframes action scroll handlers using React refs.
 * - Aligns a "+ Plan a trip" button at the bottom right.
 *
 * Why this file exists:
 * Isolates scroll-snapping math, card layouts, and header controls for the past travels timeline.
 *
 * Used by:
 * - pages/index.js
 */

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  varanasi_photo,
  font_varanasi,
  ladakh_nubra_valley,
  font_ladakh,
  manali_rohtang_pass,
  font_manali,
  shimla_toy_train,
  font_shimla
} from "@/assets";

const PREVIOUS_TRIPS = [
  {
    id: 1,
    destination: "Varanasi, India",
    dates: "Oct 12 - Oct 18, 2025",
    image: varanasi_photo,
    fontImage: font_varanasi,
    days: "6 Days"
  },
  {
    id: 2,
    destination: "Ladakh, India",
    dates: "Jul 05 - Jul 14, 2025",
    image: ladakh_nubra_valley,
    fontImage: font_ladakh,
    days: "9 Days"
  },
  {
    id: 3,
    destination: "Manali, India",
    dates: "May 20 - May 25, 2025",
    image: manali_rohtang_pass,
    fontImage: font_manali,
    days: "5 Days"
  },
  {
    id: 4,
    destination: "Shimla, India",
    dates: "Jan 15 - Jan 22, 2025",
    image: shimla_toy_train,
    fontImage: font_shimla,
    days: "7 Days"
  }
];

const PreviousTripsSection = ({ onPlanTrip }) => {
  const scrollRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Drag-to-scroll support for desktop
  const handleMouseDown = (e) => {
    setIsMouseDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  return (
    <section className="w-full bg-white py-10 sm:py-14 overflow-hidden">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
        
        {/* Header Row: Left Title & Right Navigation Arrows */}
        <div className="flex items-center justify-between w-full pb-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-normal text-zinc-800 tracking-wide">
            Previous Trips
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="w-10 h-10 rounded-full border border-zinc-200 hover:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-950 transition-colors active:scale-95 cursor-pointer"
              aria-label="Scroll Left"
            >
              ←
            </button>
            <button
              onClick={scrollRight}
              className="w-10 h-10 rounded-full border border-zinc-200 hover:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-950 transition-colors active:scale-95 cursor-pointer"
              aria-label="Scroll Right"
            >
              →
            </button>
          </div>
        </div>

        {/* Carousel Scroll Track (Overflow visible vertically to prevent clipping cards shadow) */}
        <div className="w-full overflow-visible">
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex items-center gap-6 overflow-x-auto scrollbar-none py-4 select-none cursor-grab active:cursor-grabbing snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {PREVIOUS_TRIPS.map((trip) => (
              <div
                key={trip.id}
                className="w-[220px] sm:w-[280px] aspect-[3/4] shrink-0 relative rounded-[2rem] overflow-hidden shadow-md group bg-zinc-100 snap-center hover:shadow-xl transition-all duration-300"
              >
                {/* Trip Image */}
                <Image
                  src={trip.image}
                  alt={trip.destination}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                  unoptimized
                />
                
                {/* Dark overlay gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                {/* Typography Font Overlay */}
                {trip.fontImage && (
                  <div className="absolute inset-x-0 top-[15%] bottom-[35%] px-6 pointer-events-none">
                    <div className="relative w-full h-full">
                      <Image
                        src={trip.fontImage}
                        alt={`${trip.destination} font`}
                        fill
                        className="object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)]"
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {/* Card content text at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-1 text-white pointer-events-none">
                  <span className="text-sky-400 text-xs sm:text-sm font-semibold tracking-wider">
                    {trip.days}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                    {trip.destination}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm">
                    {trip.dates}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button aligned to the bottom right */}
        <div className="flex justify-end mt-4">
          <button
            onClick={onPlanTrip}
            className="flex items-center gap-2 bg-transparent text-zinc-950 border border-zinc-900 hover:border-sky-600 hover:text-sky-600 rounded-xl px-6 py-3 font-sans font-semibold transition-all active:scale-95 cursor-pointer text-sm sm:text-base"
          >
            <span className="text-lg">+</span> Plan a trip
          </button>
        </div>

      </div>
    </section>
  );
};

export default PreviousTripsSection;
