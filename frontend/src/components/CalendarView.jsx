/**
 * CalendarView Component
 *
 * Purpose:
 * Renders a monthly calendar grid showing the user's planned trips as
 * horizontal event banners spanning from start_date to end_date.
 *
 * Responsibility:
 * - Manages the active month/year via prev/next navigation arrows.
 * - Computes which trips overlap the visible month.
 * - Draws day cells with correctly aligned trip event banners.
 * - Supports clicking an event to navigate to the trip detail page.
 *
 * Used by:
 * - pages/trips.js
 */

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// A small palette of pleasant, distinct colors for trip banners
const TRIP_COLORS = [
  { bg: 'bg-sky-500',     text: 'text-white',      light: 'bg-sky-100',     border: 'border-sky-300'     },
  { bg: 'bg-violet-500',  text: 'text-white',      light: 'bg-violet-100',  border: 'border-violet-300'  },
  { bg: 'bg-emerald-500', text: 'text-white',      light: 'bg-emerald-100', border: 'border-emerald-300' },
  { bg: 'bg-amber-500',   text: 'text-white',      light: 'bg-amber-100',   border: 'border-amber-300'   },
  { bg: 'bg-rose-500',    text: 'text-white',      light: 'bg-rose-100',    border: 'border-rose-300'    },
  { bg: 'bg-cyan-500',    text: 'text-white',      light: 'bg-cyan-100',    border: 'border-cyan-300'    },
  { bg: 'bg-fuchsia-500', text: 'text-white',      light: 'bg-fuchsia-100', border: 'border-fuchsia-300' },
  { bg: 'bg-teal-500',    text: 'text-white',      light: 'bg-teal-100',    border: 'border-teal-300'    },
];

/** Strip time portion and return a local midnight Date */
function toDay(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Build an array of Date objects for every day visible in the 6-week grid */
function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0=Sun … 6=Sat
  const days = [];
  // Start from the Sunday before the 1st
  const start = new Date(firstDay);
  start.setDate(1 - startOffset);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * For each trip compute how it spans the calendar grid.
 * Returns an array of { trip, colorIdx, rows } where rows is a map:
 *   rowIndex → { startCell, endCell, isStart, isEnd }
 */
function computeTripLayout(trips, calendarDays, year, month) {
  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0);

  return trips
    .map((trip, idx) => {
      const tripStart = toDay(trip.start_date);
      const tripEnd   = toDay(trip.end_date);
      if (!tripStart || !tripEnd) return null;
      // Only include trips that intersect the visible month
      if (tripEnd < monthStart || tripStart > monthEnd) return null;

      const color = TRIP_COLORS[idx % TRIP_COLORS.length];

      // Find the cell indices that this trip occupies in the 42-cell grid
      const cellStart = calendarDays.findIndex(
        d => d.getTime() === Math.max(tripStart.getTime(), calendarDays[0].getTime())
      );
      const cellEnd = calendarDays.findIndex(
        d => d.getTime() === Math.min(tripEnd.getTime(), calendarDays[41].getTime())
      );

      if (cellStart === -1 || cellEnd === -1) return null;

      // Split by rows (7 days each)
      const segments = [];
      for (let row = 0; row < 6; row++) {
        const rowStart = row * 7;
        const rowEnd   = rowStart + 6;
        if (cellEnd < rowStart || cellStart > rowEnd) continue;
        segments.push({
          row,
          colStart: Math.max(cellStart, rowStart) - rowStart,
          colEnd:   Math.min(cellEnd,   rowEnd)   - rowStart,
          isStart:  cellStart >= rowStart,
          isEnd:    cellEnd   <= rowEnd,
        });
      }

      return { trip, color, colorIdx: idx, segments };
    })
    .filter(Boolean);
}

export default function CalendarView({ trips = [], userId }) {
  const router  = useRouter();
  const today   = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month]);
  const tripLayout   = useMemo(
    () => computeTripLayout(trips, calendarDays, year, month),
    [trips, calendarDays, year, month]
  );

  const goToPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthLabel = new Date(year, month, 1).toLocaleString('default', {
    month: 'long', year: 'numeric'
  });

  const handleTripClick = (trip) => {
    if (trip.id && userId) {
      router.push(`/${userId}/trip/${trip.id}`);
    }
  };

  // Build a lookup: row → array of segments sorted by colStart
  const segsByRow = useMemo(() => {
    const map = {};
    tripLayout.forEach(({ trip, color, segments }) => {
      segments.forEach(seg => {
        if (!map[seg.row]) map[seg.row] = [];
        map[seg.row].push({ ...seg, trip, color });
      });
    });
    // Sort each row's segments by column start
    Object.values(map).forEach(arr => arr.sort((a, b) => a.colStart - b.colStart));
    return map;
  }, [tripLayout]);

  return (
    <div className="w-full bg-white rounded-3xl border border-zinc-200 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.07)] overflow-hidden">

      {/* ── Calendar Header ── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
        <button
          onClick={goToPrevMonth}
          className="w-9 h-9 rounded-full border border-zinc-200 hover:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-950 transition-all active:scale-95 cursor-pointer"
          aria-label="Previous month"
        >
          ←
        </button>
        <h2 className="text-base sm:text-lg font-serif font-normal text-zinc-800 tracking-wide">
          {monthLabel}
        </h2>
        <button
          onClick={goToNextMonth}
          className="w-9 h-9 rounded-full border border-zinc-200 hover:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-950 transition-all active:scale-95 cursor-pointer"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {/* ── Day-of-week labels ── */}
      <div className="grid grid-cols-7 border-b border-zinc-100">
        {DAYS_OF_WEEK.map(d => (
          <div
            key={d}
            className="py-2 text-center text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── 6-row week grid ── */}
      <div className="flex flex-col">
        {[0, 1, 2, 3, 4, 5].map(row => {
          const rowDays   = calendarDays.slice(row * 7, row * 7 + 7);
          const rowSegs   = segsByRow[row] || [];

          return (
            <div key={row} className="relative border-b border-zinc-100 last:border-b-0">
              {/* Day number cells */}
              <div className="grid grid-cols-7">
                {rowDays.map((day, col) => {
                  const isCurrentMonth = day.getMonth() === month;
                  const isToday =
                    day.getDate()     === today.getDate()  &&
                    day.getMonth()    === today.getMonth() &&
                    day.getFullYear() === today.getFullYear();

                  return (
                    <div
                      key={col}
                      className={`
                        min-h-[72px] sm:min-h-[84px] pt-2 pb-8 px-1 sm:px-2
                        border-r border-zinc-100 last:border-r-0
                        ${isCurrentMonth ? 'bg-white' : 'bg-zinc-50/40'}
                      `}
                    >
                      <span
                        className={`
                          inline-flex items-center justify-center
                          w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-semibold
                          ${isToday
                            ? 'bg-sky-600 text-white'
                            : isCurrentMonth
                              ? 'text-zinc-800'
                              : 'text-zinc-300'
                          }
                        `}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Event banners overlaid on the row */}
              <div className="absolute inset-x-0 bottom-1 flex flex-col gap-[3px] px-0 pointer-events-none">
                {rowSegs.map((seg, si) => {
                  // Calculate left/width as percentage of the 7-column grid
                  const leftPct  = (seg.colStart / 7) * 100;
                  const widthPct = ((seg.colEnd - seg.colStart + 1) / 7) * 100;

                  return (
                    <div
                      key={si}
                      style={{
                        position:  'absolute',
                        left:      `calc(${leftPct}% + 2px)`,
                        width:     `calc(${widthPct}% - 4px)`,
                        bottom:    `${si * 22}px`,
                      }}
                      onClick={() => handleTripClick(seg.trip)}
                      className={`
                        pointer-events-auto cursor-pointer
                        h-5 sm:h-[22px] flex items-center px-2 overflow-hidden
                        ${seg.color.bg} ${seg.color.text}
                        ${seg.isStart ? 'rounded-l-full' : ''}
                        ${seg.isEnd   ? 'rounded-r-full' : ''}
                        transition-opacity hover:opacity-80 active:opacity-60
                        shadow-sm
                      `}
                      title={seg.trip.title}
                    >
                      {seg.isStart && (
                        <span className="text-[9px] sm:text-[10px] font-bold truncate leading-none whitespace-nowrap">
                          {seg.trip.title}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Legend ── */}
      {tripLayout.length > 0 && (
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
          <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-2">Trips this month</p>
          <div className="flex flex-wrap gap-2">
            {tripLayout.map(({ trip, color }) => (
              <button
                key={trip.id}
                onClick={() => handleTripClick(trip)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  border text-xs font-semibold transition-all active:scale-95 cursor-pointer
                  ${color.light} ${color.border}
                `}
              >
                <span className={`w-2 h-2 rounded-full ${color.bg} shrink-0`} />
                <span className="text-zinc-700 truncate max-w-[140px]">{trip.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tripLayout.length === 0 && (
        <div className="py-10 text-center text-sm text-zinc-400 font-medium">
          No trips scheduled this month.
        </div>
      )}
    </div>
  );
}
