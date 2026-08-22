/**
 * Header Component
 *
 * Purpose:
 * Renders the main global navigation bar for GlobeTrotter.
 *
 * Responsibility:
 * - Displays the site logo/link.
 * - Renders responsive desktop navigation links.
 * - Exposes and handles an interactive hamburger dropdown menu for mobile devices.
 * - Listens to page scrolling to toggle a blurred glassmorphic overlay effect.
 *
 * Why this file exists:
 * Isolates navigation structure, scroll-triggered visual adjustments, and mobile menu toggling.
 *
 * Used by:
 * - pages/Layout/Layout.jsx
 *
 * Boundary:
 * Does not contain page routing configurations or authentication flow logic directly.
 *
 * Accessibility:
 * Uses semantic <header> and <nav> tags, includes aria-label for mobile menu trigger.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { logo } from '@/assets';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Trips', href: '/trips' },
    { name: 'Search', href: '/search' },
    { name: 'Community', href: '/community' },
    { name: 'Profile', href: '/profile' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header container */}
        <div className={`flex items-center justify-between px-6 sm:px-8 py-3 sm:py-4 rounded-xl border transition-all duration-300 relative z-50 ${isScrolled || isMenuOpen
          ? 'bg-white/80 backdrop-blur-md border-zinc-200/80 shadow-md'
          : 'bg-transparent border-transparent'
          }`}>
          {/* Logo */}
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <div className="w-[120px] sm:w-[155px] flex items-center">
              <Image
                src={logo}
                alt="GlobeTrotter Logo"
                className="w-full h-auto object-contain"
                priority
                unoptimized
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <Link
                key={link.name}
                href={link.href}
                className={`font-medium text-sm transition-colors ${index === 0 ? 'text-sky-600 font-semibold hover:text-sky-500' : 'text-zinc-600 hover:text-zinc-950'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex flex-col justify-between w-6 h-5 focus:outline-none group z-50"
            aria-label="Toggle Menu"
          >
            <span className={`w-full h-[2px] bg-zinc-800 rounded-md transition-all duration-300 ${isMenuOpen ? 'transform rotate-45 translate-y-[9px]' : ''
              }`} />
            <span className={`w-full h-[2px] bg-zinc-800 rounded-md transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`} />
            <span className={`w-full h-[2px] bg-zinc-800 rounded-md transition-all duration-300 ${isMenuOpen ? 'transform -rotate-45 translate-y-[-9px]' : ''
              }`} />
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <div className={`absolute top-full left-4 right-4 mt-2 p-6 rounded-xl border border-zinc-200/80 bg-white/95 backdrop-blur-lg shadow-2xl transition-all duration-300 md:hidden flex flex-col gap-4 z-40 ${isMenuOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}>
          {navLinks.map((link, index) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={`font-semibold text-base py-2 transition-colors border-b border-zinc-100 last:border-0 ${index === 0 ? 'text-sky-600' : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
