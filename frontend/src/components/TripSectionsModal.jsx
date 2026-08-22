/**
 * TripSectionsModal Component
 *
 * Purpose:
 * Renders the second-stage itinerary configuration overlay wizard.
 *
 * Responsibility:
 * - Displays a dynamic list of draggable, re-orderable itinerary sections.
 * - Supports drag-and-drop reordering using native HTML5 drag events, preserving custom titles.
 * - Provides editable title input fields for each section.
 * - Displays a Date Range selector using two side-by-side native HTML5 date picker inputs.
 * - Supports adding sections via "+ Add another Section" (defaulting to 1 section initially).
 * - Supports removing any section.
 * - Sticks the action controls (Cancel / Confirm & Save) to the bottom of the container.
 *
 * Why this file exists:
 * Isolates multi-section detail creation, reordering, and recommendations from index route orchestrations.
 *
 * Used by:
 * - pages/index.js
 */

import React, { useState, useEffect } from 'react';

const TripSectionsModal = ({ isOpen, onClose, tripDetails, onSaveItinerary }) => {
  // Start with exactly 1 section by default
  const [sections, setSections] = useState([
    {
      id: 1,
      title: "Section 1:",
      description: "All the necessary information about this section. This can be travel details, hotels, or any other activity.",
      startDate: "",
      endDate: "",
      budget: ""
    }
  ]);

  const [draggedIndex, setDraggedIndex] = useState(null);

  // Set default dates from trip details when modal opens
  useEffect(() => {
    if (tripDetails && isOpen) {
      setSections(prev => prev.map(sec => ({
        ...sec,
        startDate: sec.startDate || tripDetails.startDate,
        endDate: sec.endDate || tripDetails.endDate
      })));
    }
  }, [tripDetails, isOpen]);

  // Escape key close listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const addSection = () => {
    const nextId = sections.length + 1;
    const defaultStart = tripDetails ? tripDetails.startDate : '';
    const defaultEnd = tripDetails ? tripDetails.endDate : '';
    
    setSections([
      ...sections,
      {
        id: Date.now(),
        title: `Section ${nextId}:`,
        description: "All the necessary information about this section. This can be travel details, hotels, or any other activity.",
        startDate: defaultStart,
        endDate: defaultEnd,
        budget: ""
      }
    ]);
  };

  const removeSection = (id) => {
    setSections(sections.filter(sec => sec.id !== id));
  };

  const updateSectionField = (id, field, value) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === id) {
        return { ...sec, [field]: value };
      }
      return sec;
    }));
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    const items = [...sections];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    
    setSections(items);
    setDraggedIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveItinerary) {
      onSaveItinerary({
        ...tripDetails,
        sections
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <form onSubmit={handleSubmit} className="relative w-full max-w-4xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-zinc-900">
            Configure Trip Itinerary
          </h2>
        </div>

        {/* Scrollable Body */}
        <div className="flex-grow overflow-y-auto p-6 sm:p-8 flex flex-col gap-6 scrollbar-none bg-zinc-50/20">
          
          {sections.map((sec, index) => (
            <div
              key={sec.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`w-full bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] flex flex-col gap-4 transition-all duration-200 ${
                draggedIndex === index ? 'opacity-50 scale-[0.99] border-dashed border-sky-400 bg-sky-50/10' : ''
              }`}
            >
              {/* Section Card Top Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 w-full max-w-[70%] cursor-move">
                  {/* Drag Handle Icon Indicator */}
                  <span className="text-zinc-400 text-lg select-none" title="Drag to reorder">
                    &#8942;&#8942;
                  </span>
                  
                  {/* Editable Title Input */}
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => updateSectionField(sec.id, 'title', e.target.value)}
                    className="bg-transparent text-base sm:text-lg font-bold text-zinc-800 font-sans border-b border-transparent hover:border-zinc-200 focus:border-sky-600 outline-none w-full py-0.5 focus:bg-zinc-50/50 px-1 rounded transition-all"
                    placeholder="e.g. Section 1:"
                  />
                </div>
                
                {/* Remove Section Action Button */}
                <button
                  type="button"
                  onClick={() => removeSection(sec.id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 rounded-lg px-3 py-1.5 transition-colors cursor-pointer shrink-0"
                >
                  Remove
                </button>
              </div>

              {/* Section Description Textarea */}
              <textarea
                value={sec.description}
                onChange={(e) => updateSectionField(sec.id, 'description', e.target.value)}
                placeholder="Enter description, hotels, flights or notes..."
                rows={2}
                className="w-full bg-zinc-50/50 text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm resize-none"
              />

              {/* Controls Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Range Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 tracking-wider uppercase font-sans">
                    Date Range:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={sec.startDate}
                      onChange={(e) => updateSectionField(sec.id, 'startDate', e.target.value)}
                      className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-3 py-2 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs sm:text-sm"
                    />
                    <span className="text-zinc-400 text-xs sm:text-sm select-none">to</span>
                    <input
                      type="date"
                      value={sec.endDate}
                      onChange={(e) => updateSectionField(sec.id, 'endDate', e.target.value)}
                      min={sec.startDate}
                      className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-3 py-2 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Section Budget */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 tracking-wider uppercase font-sans">
                    Budget of this section:
                  </label>
                  <input
                    type="text"
                    value={sec.budget}
                    onChange={(e) => updateSectionField(sec.id, 'budget', e.target.value)}
                    placeholder="e.g. $500"
                    className="w-full bg-transparent text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-sans text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Another Section Button */}
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={addSection}
              className="flex items-center gap-2 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 hover:border-zinc-800 rounded-xl px-6 py-3 font-sans font-semibold transition-all active:scale-95 cursor-pointer text-sm"
            >
              <span className="text-lg">+</span> Add another Section
            </button>
          </div>

        </div>

        {/* Footer (Sticky/Stuck Down) */}
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
            Confirm & Save Itinerary
          </button>
        </div>

      </form>
    </div>
  );
};

export default TripSectionsModal;
