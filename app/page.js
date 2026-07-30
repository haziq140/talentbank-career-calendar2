// app/user/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import EventModal from "@/components/EventModal";
import StatusBadge from "@/components/StatusBadge";

const SECTORS = ["all", "general", "tech", "engineering"];
const TYPES = ["all", "public", "university", "sector"];
const TYPE_LABELS = { public: "Public", university: "University", sector: "Sector" };
const DATE_RANGES = [
  { value: "all", label: "All upcoming" },
  { value: "30", label: "Next 30 days" },
  { value: "month", label: "This month" },
  { value: "90", label: "Next 3 months" },
];

function formatRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { day: "numeric", month: "short" };
  if (start === end) return s.toLocaleDateString("en-GB", opts);
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

function daysToGo(startDate, endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (today >= start && today <= end) return "Happening now";
  const diff = Math.round((start - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return { label: `${diff} days to go`, diff };
  return null;
}

function withinDateRange(event, range) {
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

const EMAIL_STORAGE_KEY = "tb-user-email";

function loadSavedEmail() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(EMAIL_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function getLocalISODate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// --- Month Calendar Component ---
function MonthCalendar({ events, onSelect }) {
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); 

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  
  const totalCells = days.length > 35 ? 42 : 35;
  while (days.length < totalCells) days.push(null);

  function nextMonth() { setBaseDate(new Date(year, month + 1, 1)); }
  function prevMonth() { setBaseDate(new Date(year, month - 1, 1)); }
  function goToday() {
    const d = new Date();
    d.setDate(1);
    setBaseDate(d);
  }

  const monthName = baseDate.toLocaleString("default", { month: "long", year: "numeric" });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayStr = getLocalISODate(new Date());

  return (
    <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden bg-white shadow-sm mb-6 transition-colors duration-300">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 dark:border-slate-700/60">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{monthName}</h3>
        <div className="flex gap-2">
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            Today
          </button>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">{"<"}</button>
            <button onClick={nextMonth} className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">{">"}</button>
          </div>
        </div>
      </div>
      
      {/* Days of Week */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
        {weekDays.map((d, index) => (
          <div key={d} className={`py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest ${index !== 6 ? 'border-r border-slate-200' : ''}`}>
            {d}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 bg-white">
        {days.map((d, i) => {
          const isLastCol = (i + 1) % 7 === 0;
          const isLastRow = i >= totalCells - 7;
          
          if (!d) return <div key={i} className={`bg-white min-h-[100px] sm:min-h-[120px] border-slate-200 ${!isLastCol ? 'border-r' : ''} ${!isLastRow ? 'border-b' : ''}`}></div>;
          
          const dateStr = getLocalISODate(d);
          const dayEvents = events.filter(e => e.startDate <= dateStr && e.endDate >= dateStr);
          const isToday = todayStr === dateStr;

          return (
            <div key={i} className={`bg-white p-2 min-h-[100px] sm:min-h-[120px] flex flex-col gap-1 border-slate-200 hover:bg-slate-50 transition-colors ${!isLastCol ? 'border-r' : ''} ${!isLastRow ? 'border-b' : ''}`}>
              <div className="flex justify-start mb-1">
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white shadow-md" : "text-slate-600"}`}>
                  {d.getDate()}
                </span>
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {dayEvents.map(e => (
                  <button 
                    key={e.id} 
                    onClick={() => onSelect(e)} 
                    className="text-[10px] text-left truncate px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded hover:bg-indigo-100 transition-all font-medium"
                  >
                    {e.status === "cancelled" ? "❌ " : (e.capacity && e.registeredCount >= e.capacity) ? "🔒 " : ""}
                    {e.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main View ---
export default function UserPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState("all");
  const [type, setType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selected, setSelected] = useState(null);
  const [email, setEmail] = useState("");
  const [registeredIds, setRegisteredIds] = useState(() => new Set());
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("tb-theme");
    if (savedTheme === "light") {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(true);
    }
  }, []);

  // Sync theme changes to the HTML document and localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tb-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tb-theme", "light");
    }
  }, [isDarkMode]);

  async function refreshRegisteredIds(forEmail) {
    if (!forEmail) {
      setRegisteredIds(new Set());
      return;
    }
    try {
      const res = await fetch(`/api/registrations?email=${encodeURIComponent(forEmail)}`);
      const data = await res.json();
      setRegisteredIds(new Set(data.eventIds || []));
    } catch (err) {
      console.error("Failed to load registration status:", err);
    }
  }

  useEffect(() => {
    const savedEmail = loadSavedEmail();
    setEmail(savedEmail);
    refreshRegisteredIds(savedEmail);
    load();
  }, []);

  function handleRegistered(eventId, registeredEmail) {
    setEmail(registeredEmail);
    try {
      window.localStorage.setItem(EMAIL_STORAGE_KEY, registeredEmail);
    } catch {}
    load();
    refreshRegisteredIds(registeredEmail);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(data.events || []);
    setLoading(false);
  }

  const visible = useMemo(() => {
    const today = getLocalISODate(new Date());
    return events
      .filter((e) => e.status !== "draft")
      .filter((e) => e.endDate >= today)
      .filter((e) => sector === "all" || e.sector === sector)
      .filter((e) => type === "all" || e.type === type)
      .filter((e) => withinDateRange(e, dateRange));
  }, [events, sector, type, dateRange]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 font-sans selection:bg-blue-200 dark:selection:bg-blue-500/30 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        
        {/* Top Navbar */}
        <nav className="flex flex-wrap items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm shadow-md dark:shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              📅
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Talentbank</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Event Calendar</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Functional Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-inner"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>

            <div className="flex items-center bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-full p-1">
              <span className="px-3 py-1 rounded-full bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white text-xs font-semibold shadow-sm border border-slate-200 dark:border-slate-700">
                Candidate / Employer
              </span>
              <a href="/admin" className="px-3 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors group">
                Public
                <div className="w-7 h-3.5 bg-slate-300 dark:bg-slate-800 border border-slate-400 dark:border-slate-700 rounded-full relative flex items-center px-0.5 group-hover:border-slate-500 transition-colors">
                  <div className="w-2.5 h-2.5 bg-slate-500 rounded-full"></div>
                </div>
                Admin
              </a>
            </div>
          </div>
        </nav>

        {/* Title & Legend Box */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">Upcoming Career Events</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-5 max-w-2xl">
            Browse and register for career fairs, networking nights, and recruitment drives. Click any event for details.
          </p>

          <div className="flex flex-wrap items-center gap-5 p-3 bg-white dark:bg-[#1e293b]/60 border border-slate-200 dark:border-slate-700/60 rounded-lg text-xs text-slate-600 dark:text-slate-300 inline-flex shadow-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)]"></span> 
              Open for registration
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> 
              Full / waitlist
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.6)]"></span> 
              Cancelled
            </span>
          </div>
        </div>

        <MonthCalendar events={events} onSelect={setSelected} />

        {/* Filters */}
        <div className="flex flex-col gap-3 mt-6 mb-4 border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSector(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 border ${
                    sector === s
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm dark:shadow-blue-900/20"
                      : "bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 flex-wrap">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all duration-200 border ${
                      type === t
                        ? "bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-500"
                        : "bg-transparent border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300"
                    }`}
                  >
                    {t === "all" ? "Any" : TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="text-[11px] font-medium border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                {DATE_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* List Details */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-slate-500 text-xs border border-slate-200 dark:border-slate-800 border-dashed rounded-lg p-6 text-center bg-white dark:bg-slate-900/50">
            No upcoming events match this filter yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {visible.map((e) => {
              const countdown = daysToGo(e.startDate, e.endDate);
              const isRegistered = registeredIds.has(e.id);
              return (
                <li key={e.id}>
                  <button
                    onClick={() => setSelected(e)}
                    className="w-full text-left flex items-center gap-3 border border-slate-200 dark:border-slate-800 border-l-[3px] border-l-blue-500 dark:border-l-blue-500 rounded-lg px-4 py-3 bg-white dark:bg-[#1e293b]/40 hover:bg-slate-50 dark:hover:bg-[#1e293b] dark:hover:border-slate-600 transition-all duration-200 group shadow-sm dark:shadow-none"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{e.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
                        <span className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-medium">{formatRange(e.startDate, e.endDate)}</span> 
                        <span>·</span> 
                        <span className="truncate">{e.location}</span>
                      </p>
                    </div>
                    {isRegistered ? (
                      <span className="font-mono text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/30 rounded-md px-2 py-0.5 whitespace-nowrap shadow-sm">
                        Registered
                      </span>
                    ) : countdown ? (
                      <span className={`font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md whitespace-nowrap hidden sm:block ${
                        countdown.diff < 14 
                          ? "text-rose-600 bg-rose-50 border border-rose-100 dark:text-rose-500 dark:bg-rose-950 dark:border-rose-900" 
                          : "text-slate-500 bg-slate-100 dark:bg-slate-800 border border-transparent"
                      }`}>
                        {countdown.label || countdown}
                      </span>
                    ) : null}
                    <div className="scale-90 origin-right opacity-90 group-hover:opacity-100 transition-opacity">
                      <StatusBadge status={e.status} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="mt-12 pt-5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex justify-between items-center">
          <span>© 2026 Talentbank Career Fair Calendar</span>
          <a href="/admin" className="hover:text-slate-700 dark:hover:text-white transition-colors bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
            Events team login
          </a>
        </footer>

        <EventModal
          key={selected?.id}
          event={selected}
          alreadyRegistered={selected ? registeredIds.has(selected.id) : false}
          defaultEmail={email}
          onClose={() => setSelected(null)}
          onRegistered={handleRegistered}
        />
      </div>
    </div>
  );
}