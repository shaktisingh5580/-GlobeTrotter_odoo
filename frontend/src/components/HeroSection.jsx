/**
 * HeroSection Component
 *
 * Purpose:
 * Renders the main visual landing banner at the top of the Home page.
 *
 * Responsibility:
 * - Displays a responsive layout with custom background images (`globe` for desktop and `globe2` for mobile).
 * - Overlays the centered title brand `font` logo.
 * - Adheres strictly to the layout structure of bg-motorland-landing.
 *
 * Why this file exists:
 * Keeps the landing visual showcase isolated from global layouts and content-heavy dashboard routing.
 *
 * Used by:
 * - pages/index.js
 *
 * Boundary:
 * Does not manage global navigation, search filters, or user-trip state.
 */

"use client";

import { globe, globe2, font } from "@/assets";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="relative w-full flex flex-col justify-between gap-8 md:gap-0 overflow-hidden aspect-[2/3] md:aspect-[16/9] rounded-b-[2rem]"
    >
      {/* Background Images */}
      <Image
        src={globe2}
        alt="GlobeTrotter Mobile Hero"
        className="w-full h-auto object-contain md:hidden"
        priority
        unoptimized
      />
      <Image
        src={globe}
        alt="GlobeTrotter Desktop Hero"
        className="w-full h-auto object-contain hidden md:flex"
        priority
        unoptimized
      />

      {/* Top-Centered Overlay Font Image (adapted for fixed header) */}
      <div className="absolute inset-x-0 top-[20%] flex justify-center z-10 px-4">
        <div className="w-full max-w-[240px] sm:max-w-[380px] md:max-w-[520px] lg:max-w-[620px]">
          <Image
            src={font}
            alt="GlobeTrotter Title Logo"
            className="w-full h-auto object-contain animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"
            priority
            unoptimized
          />
        </div>
      </div>
    </section>
  );
}
