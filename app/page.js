// app/user/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import WeekStrip from "@/components/WeekStrip";
import EventModal from "@/components/EventModal";
import StatusBadge from "@/components/StatusBadge";

// --- Configuration Constants ---
const SECTORS = ["all", "general", "tech", "engineering"];
const TYPES = ["all", "public", "university", "sector"];
const TYPE_LABELS = { public: "Public", university: "University", sector: "Sector" };
const DATE_RANGES = [
  { value: "all", label: "All upcoming" },
  { value: "30", label: "Next 30 days" },
  { value: "month", label: "This month" },
  { value: "90", label: "Next 3 months" },
];

// --- Helper Functions ---
function formatRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options = { day: "numeric", month: "short" };
  
  if (start === end) return startDate.toLocaleDateString("en-GB", options);
  return `${startDate.toLocaleDateString("en-GB", options)} – ${endDate.toLocaleDateString("en-GB", options)}`;
}

// Updated to return an object with both the label and the raw day difference
function getDaysToGoInfo(startDate, endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (today >= start && today <= end) return { label: "Happening now", diff: 0 };
  const diffInDays = Math.round((start - today) / 86400000);
  if (diffInDays === 0) return { label: "Today", diff: 0 };
  if (diffInDays === 1) return { label: "Tomorrow", diff: 1 };
  if (diffInDays > 1) return { label: `${diffInDays} days to go`, diff: diffInDays };
  
  return null;
}

function isWithinDateRange(event, range) {
  if (range === "all") return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(event.startDate);

  if (range === "month") {
    return start.getFullYear() === today.getFullYear() && start.getMonth() === today.getMonth();
  }
  const days = Number(range);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  return start <= cutoff;
}

// --- Main Component ---
export default function UserPanel() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [sector, setSector] = useState("all");
  const [type, setType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);

  async function fetchEvents() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchEvents(); }, []);

  const visibleEvents = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    return events
      .filter((event) => event.status !== "draft")
      .filter((event) => event.endDate >= todayISO)
      .filter((event) => sector === "all" || event.sector === sector)
      .filter((event) => type === "all" || event.type === type)
      .filter((event) => isWithinDateRange(event, dateRange));
  }, [events, sector, type, dateRange]);

  const totalPublishedEvents = events.filter((event) => event.status !== "draft").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-4xl mx-auto w-full px-5 py-12 flex-1">
        
        {/* Header Section */}
        <header className="mb-12 text-center md:text-left">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold tracking-wide uppercase mb-4 shadow-sm border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Talentbank Career Fairs
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            This week, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">every week.</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
            A running calendar of every Talentbank fair. Plan around it, register in advance, and see the moment something changes.
          </p>
        </header>

        <WeekStrip 
          events={events} 
          onSelect={setSelectedEvent} 
          weekOffset={weekOffset} 
          onWeekChange={setWeekOffset} 
        />

        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 mt-10 mb-8 flex flex-col gap-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSector(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                    sector === s
                      ? "bg-slate-900 text-white shadow-md scale-105"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-lg">
              {visibleEvents.length} <span className="font-normal">of</span> {totalPublishedEvents} events
            </p>
          </div>

          <div className="h-px w-full bg-slate-100" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200 border ${
                    type === t
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                      : "bg-transparent text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {t === "all" ? "Any type" : TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm font-medium border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              {DATE_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Event List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">📅</span>
            </div>
            <h3 className="text-slate-900 font-semibold mb-1">No events found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your filters to see more upcoming fairs.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleEvents.map((event) => {
              const countdown = getDaysToGoInfo(event.startDate, event.endDate);
              
              return (
                <li key={event.id} className="group">
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-lg group-hover:text-indigo-600 transition-colors">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {formatRange(event.startDate, event.endDate)}
                        </span>
                        <span>·</span>
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-100 sm:border-0">
                      {countdown && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${
                          countdown.diff < 14 
                            ? "text-rose-500 bg-rose-50" // Only red if < 14 days
                            : "text-slate-500 bg-slate-100" // Neutral otherwise
                        }`}>
                          {countdown.label}
                        </span>
                      )}
                      <StatusBadge status={event.status} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-200 text-sm font-medium text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>© 2026 Talentbank Career Fair Calendar</span>
          <a href="/admin" className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
            Admin Login 🔒
          </a>
        </footer>

        <EventModal 
        key={selected?.id} 
        event={selected} 
        onClose={() => setSelected(null)} 
        onRegistered={load} 
        />
      </div>
    </div>
  );
}