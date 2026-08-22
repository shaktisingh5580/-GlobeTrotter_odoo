import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-900 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} GlobeTrotter. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Made with ❤️ for adventurers
        </p>
      </div>
    </footer>
  );
};

export default Footer;
