/**
 * AdventureGallery Component
 *
 * Purpose:
 * Renders a stylized showcase gallery for "Top Regional Selections".
 *
 * Responsibility:
 * - Displays a horizontal list of 1:1 square cards in a staggered up-down (vertical offset) arrangement.
 * - Implements a continuous, seamless looping CSS marquee animation that pauses on hover.
 * - Enforces overflow-visible on the slider container but overflow-hidden on the main section.
 * - Displays a section title "Top Regional Selections".
 *
 * Why this file exists:
 * Centralizes the regional gallery slider component, keeping layout code separate from index route orchestration.
 *
 * Used by:
 * - pages/index.js
 *
 * Boundary:
 * Uses Next.js <Image> with pre-loaded Unsplash placeholders. Actual image assets will be provided later.
 */

import React from 'react';
import Image from 'next/image';
import {
  varanasi_photo,
  font_varanasi,
  ladakh_magnetic_hill,
  ladakh_nubra_valley,
  font_ladakh,
  manali_hidimba_devi,
  font_manali,
  shimla_ridge_mall,
  font_shimla,
  udaipur_lake_pichola,
  udaipur_hawa_mahal,
  font_hawa_mahal
} from "@/assets";

const REGIONAL_SELECTIONS = [
  {
    id: 1,
    title: "Varanasi",
    image: varanasi_photo,
    fontImage: font_varanasi
  },
  {
    id: 2,
    title: "Ladakh",
    image: ladakh_magnetic_hill,
    fontImage: font_ladakh
  },
  {
    id: 3,
    title: "Manali",
    image: manali_hidimba_devi,
    fontImage: font_manali
  },
  {
    id: 4,
    title: "Shimla",
    image: shimla_ridge_mall,
    fontImage: font_shimla
  },
  {
    id: 5,
    title: "Udaipur",
    image: udaipur_lake_pichola,
    fontImage: font_hawa_mahal
  },
  {
    id: 6,
    title: "Hawa Mahal",
    image: udaipur_hawa_mahal,
    fontImage: font_hawa_mahal
  }
];

// Duplicate selections to support seamless looping transition
const LOOPED_SELECTIONS = [
  ...REGIONAL_SELECTIONS,
  ...REGIONAL_SELECTIONS
];


const AdventureGallery = () => {
  return (
    <section className="w-full bg-[#FCF8F2] py-6 sm:py-8 overflow-hidden border-y border-zinc-100/50">
      
      {/* Local styling for seamless marquee loops */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-track {
          display: flex;
          gap: 1.5rem; /* gap-6 */
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        @media (min-width: 640px) {
          .marquee-track {
            gap: 2rem; /* gap-8 */
          }
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-normal text-zinc-800 tracking-wide">
            Top Regional Selections
          </h2>
        </div>

        {/* Gallery Slider Outer (Overflow visible vertically for translations) */}
        <div className="w-full overflow-visible py-6">
          
          {/* Marquee Inner Track */}
          <div className="marquee-track">
            {LOOPED_SELECTIONS.map((adv, index) => {
              // Apply staggered up-down translations (even indices go up, odd indices go down)
              const staggeredClass = index % 2 === 0 ? '-translate-y-4' : 'translate-y-4';

              return (
                <div
                  key={`${adv.id}-${index}`}
                  className={`w-[160px] sm:w-[220px] aspect-square shrink-0 relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-md bg-zinc-200 transition-all duration-300 hover:scale-[1.05] ${staggeredClass} group`}
                >
                  <Image
                    src={adv.image}
                    alt={adv.title}
                    fill
                    className="object-cover pointer-events-none"
                    priority
                    unoptimized
                  />
                  {/* Subtle dark overlay for contrast */}
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors pointer-events-none" />

                  {/* Typography Font Overlay */}
                  {adv.fontImage && (
                    <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5 pointer-events-none">
                      <div className="relative w-full h-[60%]">
                        <Image
                          src={adv.fontImage}
                          alt={`${adv.title} font`}
                          fill
                          className="object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};

export default AdventureGallery;
