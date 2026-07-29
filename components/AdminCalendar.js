"use client";

import { useState } from "react";

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function buildMonthGrid(year, month) {
  // month is 0-indexed. Returns a flat array of Date objects covering
  // full weeks (Mon-start) so the grid is always a clean rectangle.
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function AdminCalendar({ events, onDateClick, onEventClick }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const days = buildMonthGrid(cursor.getFullYear(), cursor.getMonth());
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  function eventsOnDay(iso) {
    return events.filter((e) => e.startDate <= iso && e.endDate >= iso);
  }

  function shiftMonth(delta) {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  }

  return (
    <div className="border border-line rounded-lg overflow-hidden bg-white mb-6">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <button
          onClick={() => shiftMonth(-1)}
          className="text-ink/50 hover:text-ink px-2 text-lg leading-none"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 className="font-display font-semibold">{monthLabel}</h3>
        <button
          onClick={() => shiftMonth(1)}
          className="text-ink/50 hover:text-ink px-2 text-lg leading-none"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 bg-ink/5 border-b border-line">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="font-mono text-[0.65rem] uppercase text-ink/40 text-center py-1.5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((d) => {
          const iso = toISODate(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = iso === toISODate(today);
          const dayEvents = eventsOnDay(iso);
          const activeEvents = dayEvents.filter((e) => e.status !== "cancelled");
          const isClash = activeEvents.length > 1;

          return (
            <button
              key={iso}
              onClick={() => onDateClick(iso)}
              className={`min-h-[84px] text-left border-b border-r border-line last:border-r-0 p-1.5 align-top transition-colors hover:bg-ink/5 ${
                inMonth ? "bg-white" : "bg-ink/[0.02]"
              } ${isClash ? "ring-1 ring-inset ring-clash/50 bg-clash/5" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-mono text-xs ${
                    inMonth ? "text-ink/60" : "text-ink/25"
                  } ${isToday ? "bg-amber text-ink rounded-full w-5 h-5 flex items-center justify-center" : ""}`}
                >
                  {d.getDate()}
                </span>
                {isClash && (
                  <span className="status-badge text-clash text-[0.6rem]">clash</span>
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    role="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onEventClick(e);
                    }}
                    className={`text-[0.65rem] leading-tight px-1 py-0.5 rounded truncate ${
                      e.status === "cancelled"
                        ? "bg-ink/5 text-ink/30 line-through"
                        : e.status === "full"
                        ? "bg-amber/15 text-ink/70"
                        : "bg-teal/15 text-teal"
                    }`}
                    title={e.title}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[0.6rem] text-ink/40 font-mono">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
