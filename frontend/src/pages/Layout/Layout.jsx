/**
 * Layout Component
 *
 * Purpose:
 * Main layout wrapper for the GlobeTrotter application page routes.
 *
 * Responsibility:
 * - Coordinates the Header, Footer, and page content slots.
 * - Manages global page wrapper styling constraints.
 *
 * Why this file exists:
 * Ensures consistent grid alignments, background colors, and typography across all screens.
 *
 * Used by:
 * - pages/index.js
 *
 * Boundary:
 * Does not contain page-level routing logic or API fetching orchestration.
 */

import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 max-w-[1920px] mx-auto w-full shadow-2xl">
      {/* Toast Placeholder */}
      <div id="toast-container" className="fixed top-4 right-4 z-50"></div>
      
      <Header />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;

