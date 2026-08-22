/**
 * Header Component
 *
 * Purpose:
 * Renders the main global navigation bar for GlobeTrotter.
 *
 * Responsibility:
 * - Displays the site logo/link.
 * - Renders responsive desktop navigation links.
 * - Shows a "Log In" pill when the user is not authenticated.
 * - Shows a user avatar + name pill linking to /profile when authenticated.
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
  const [isScrolled, setIsScrolled]   = useState(false);
  const [isMenuOpen, setIsMenuOpen]   = useState(false);
  const [user, setUser]               = useState(null);

  // Read auth session once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('globe_user');
      if (raw) setUser(JSON.parse(raw));
    } catch (_) {}
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home',      href: '/'          },
    { name: 'Trips',     href: '/trips'     },
    { name: 'Explore',   href: '/explore'   },
    { name: 'Community', href: '/community' },
  ];

  /* ── Auth pill rendered on both desktop & mobile ── */
  const AuthPill = ({ mobile = false }) => {
    if (user) {
      // Logged-in: avatar + username pill → /profile
      return (
        <Link
          href="/profile"
          onClick={() => mobile && setIsMenuOpen(false)}
          className={`flex items-center gap-2 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-400 shadow-sm transition-all active:scale-95 ${
            mobile ? 'px-4 py-2.5 mt-2' : 'px-3 py-1.5'
          }`}
        >
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full bg-sky-100 border border-sky-200 overflow-hidden shrink-0 flex items-center justify-center">
            {user.photo ? (
              <img src={user.photo} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-sky-600">
                {(user.username || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          <span className={`font-semibold text-zinc-800 truncate max-w-[100px] ${mobile ? 'text-sm' : 'text-xs'}`}>
            {user.username}
          </span>
        </Link>
      );
    }

    // Not logged in: "Log In" pill → triggers auth modal via home page (redirect to /)
    return (
      <Link
        href="/?login=1"
        onClick={() => mobile && setIsMenuOpen(false)}
        className={`flex items-center gap-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-sm shadow-sky-600/20 transition-all active:scale-95 ${
          mobile ? 'px-5 py-2.5 text-sm mt-2 justify-center' : 'px-4 py-1.5 text-xs'
        }`}
      >
        <span className="text-sm leading-none">→</span>
        Log In
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header container */}
        <div className={`flex items-center justify-between px-6 sm:px-8 py-3 sm:py-4 rounded-xl border transition-all duration-300 relative z-50 ${
          isScrolled || isMenuOpen
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
                className={`font-medium text-sm transition-colors ${
                  index === 0
                    ? 'text-sky-600 font-semibold hover:text-sky-500'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Auth pill — desktop */}
            <AuthPill />
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex flex-col justify-between w-6 h-5 focus:outline-none group z-50"
            aria-label="Toggle Menu"
          >
            <span className={`w-full h-[2px] bg-zinc-800 rounded-md transition-all duration-300 ${isMenuOpen ? 'transform rotate-45 translate-y-[9px]' : ''}`} />
            <span className={`w-full h-[2px] bg-zinc-800 rounded-md transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`w-full h-[2px] bg-zinc-800 rounded-md transition-all duration-300 ${isMenuOpen ? 'transform -rotate-45 translate-y-[-9px]' : ''}`} />
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <div className={`absolute top-full left-4 right-4 mt-2 p-6 rounded-xl border border-zinc-200/80 bg-white/95 backdrop-blur-lg shadow-2xl transition-all duration-300 md:hidden flex flex-col gap-4 z-40 ${
          isMenuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}>
          {navLinks.map((link, index) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={`font-semibold text-base py-2 transition-colors border-b border-zinc-100 last:border-0 ${
                index === 0 ? 'text-sky-600' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {link.name}
            </Link>
          ))}

          {/* Auth pill — mobile */}
          <AuthPill mobile />
        </div>
      </div>
    </header>
  );
};

export default Header;

