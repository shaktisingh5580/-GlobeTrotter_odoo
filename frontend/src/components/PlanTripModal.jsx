/**
 * PlanTripModal Component
 *
 * Purpose:
 * Renders an interactive overlay modal allowing the user to create a new trip itinerary.
 *
 * Responsibility:
 * - Renders a form with fields for Trip Name, Destination, Start Date, and End Date.
 * - Displays a grid of 6 curated place/activity suggestions.
 * - Allows users to click-select/toggle these suggestions with active border outlines.
 * - Manages modal backdrop click close triggers and validation states.
 * - Sticks the footer (Cancel/Save buttons) at the bottom of the modal container.
 * - Removes the upper right close "x" button per the user request.
 *
 * Why this file exists:
 * Centralizes the new trip wizard form and recommendations grid, keeping form states isolated.
 *
 * Used by:
 * - pages/index.js
 *
 * Accessibility:
 * Uses semantic buttons, manages backdrop closes, focus trap placeholders, and handles Escape key triggers.
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  varanasi_photo,
  font_varanasi,
  ladakh_magnetic_hill,
  ladakh_nubra_valley,
  font_ladakh,
  manali_hidimba_devi,
  font_manali,
  shimla_toy_train,
  font_shimla,
  udaipur_lake_pichola,
  font_hawa_mahal
} from "@/assets";

const SUGGESTIONS = [
  {
    id: 1,
    title: "Varanasi Ganga Aarti",
    category: "Sightseeing",
    image: varanasi_photo,
    fontImage: font_varanasi
  },
  {
    id: 2,
    title: "Ladakh Magnetic Hill",
    category: "Adventure",
    image: ladakh_magnetic_hill,
    fontImage: font_ladakh
  },
  {
    id: 3,
    title: "Ladakh Nubra Valley",
    category: "Sightseeing",
    image: ladakh_nubra_valley,
    fontImage: font_ladakh
  },
  {
    id: 4,
    title: "Manali Hidimba Temple",
    category: "Culture",
    image: manali_hidimba_devi,
    fontImage: font_manali
  },
  {
    id: 5,
    title: "Shimla Toy Train",
    category: "Adventure",
    image: shimla_toy_train,
    fontImage: font_shimla
  },
  {
    id: 6,
    title: "Udaipur Lake Pichola",
    category: "Leisure",
    image: udaipur_lake_pichola,
    fontImage: font_hawa_mahal
  }
];

const PlanTripModal = ({ isOpen, onClose, onCreateTrip }) => {
  const [tripName, setTripName] = useState('');
  const [place, setPlace] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);

  // Listen to Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleSuggestion = (id) => {
    if (selectedSuggestions.includes(id)) {
      setSelectedSuggestions(selectedSuggestions.filter(item => item !== id));
    } else {
      setSelectedSuggestions([...selectedSuggestions, id]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tripName || !place || !startDate || !endDate) return;
    
    if (onCreateTrip) {
      onCreateTrip({
        tripName,
        place,
        startDate,
        endDate,
        activities: selectedSuggestions
      });
    }
    // Reset form states
    setTripName('');
    setPlace('');
    setStartDate('');
    setEndDate('');
    setSelectedSuggestions([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      {/* Modal Backdrop Click Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <form onSubmit={handleSubmit} className="relative w-full max-w-4xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-zinc-900">
            Plan a new trip
          </h2>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-grow overflow-y-auto p-6 sm:p-8 flex flex-col gap-8 scrollbar-none">
          
          {/* Form Fields: 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Trip Name (First Start Date label in wireframe) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-700 font-sans">
                Trip Name:
              </label>
              <input
                type="text"
                required
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g. Summer Vacation 2026"
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm sm:text-base"
              />
            </div>

            {/* Select a Place */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-700 font-sans">
                Select a Place:
              </label>
              <input
                type="text"
                required
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. Kyoto, Japan"
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm sm:text-base"
              />
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-700 font-sans">
                Start Date:
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm sm:text-base"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-700 font-sans">
                End Date:
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm sm:text-base"
              />
            </div>
          </div>

          <hr className="border-zinc-100" />

          {/* Suggestions Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-500 tracking-wider uppercase font-sans">
              Suggestions for Places to Visit / Activities to perform
            </h3>

            {/* Suggestions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {SUGGESTIONS.map((sug) => {
                const isSelected = selectedSuggestions.includes(sug.id);

                return (
                  <div
                    key={sug.id}
                    onClick={() => toggleSuggestion(sug.id)}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 select-none shadow-sm ${
                      isSelected 
                        ? 'border-sky-600 shadow-md ring-4 ring-sky-600/10 scale-[0.98]' 
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <Image
                      src={sug.image}
                      alt={sug.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* Shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
                    
                    {/* Typography Font Overlay */}
                    {sug.fontImage && (
                      <div className="absolute inset-x-0 top-[15%] bottom-[30%] flex items-center justify-center px-4 pointer-events-none">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <Image
                            src={sug.fontImage}
                            alt={`${sug.title} font`}
                            className="object-contain max-h-full max-w-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)]"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}

                    {/* Suggestion text overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-0.5 text-white">
                      <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                        {sug.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold leading-tight">
                        {sug.title}
                      </h4>
                    </div>

                    {/* Selection Indicator check badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-sky-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Action buttons footer (Sticky/Stuck down at bottom of form container) */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent text-zinc-500 hover:text-zinc-800 rounded-xl px-5 py-2.5 font-sans font-semibold transition-all active:scale-95 cursor-pointer text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-6 py-2.5 font-sans font-semibold transition-all active:scale-95 cursor-pointer text-sm sm:text-base shadow-lg shadow-sky-600/10"
          >
            Save Trip
          </button>
        </div>

      </form>
    </div>
  );
};

export default PlanTripModal;
