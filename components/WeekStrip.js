"use client";

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

export default function WeekStrip({ events, onSelect, weekOffset, onWeekChange }) {
  const anchor = new Date();
  anchor.setDate(anchor.getDate() + weekOffset * 7);
  const monday = startOfWeek(anchor);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const dayLabel = (d) => d.toLocaleDateString("en-GB", { weekday: "short" });
  const dateLabel = (d) => d.getDate();
  const monthLabel = (d) => d.toLocaleDateString("en-GB", { month: "short" });

  return (
    <div className="border border-line rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between bg-ink text-paper px-3 py-2 border-b border-paper/10">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-paper/60">
          {monthLabel(days[0])} {days[0].getFullYear()}
          {monthLabel(days[0]) !== monthLabel(days[6]) ? ` – ${monthLabel(days[6])}` : ""}
        </p>
        <div className="flex items-center gap-1">
          {weekOffset !== 0 && (
            <button
              onClick={() => onWeekChange(0)}
              className="font-mono text-[0.65rem] uppercase tracking-widest text-paper/60 hover:text-paper mr-1"
            >
              Today
            </button>
          )}
          <button
            aria-label="Previous week"
            onClick={() => onWeekChange(weekOffset - 1)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-paper/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            aria-label="Next week"
            onClick={() => onWeekChange(weekOffset + 1)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-paper/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-line bg-ink text-paper">
        {days.map((d) => {
          const iso = toISODate(d);
          const isToday = iso === toISODate(new Date());
          return (
            <div
              key={iso}
              className={`px-2 py-2 text-center border-r border-paper/10 last:border-r-0 ${
                isToday ? "bg-amber text-ink" : ""
              }`}
            >
              <div className="font-mono text-[0.65rem] uppercase tracking-wide opacity-80">
                {dayLabel(d)}
              </div>
              <div className="font-display font-semibold text-lg">{dateLabel(d)}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[92px]">
        {days.map((d) => {
          const iso = toISODate(d);
          const dayEvents = events.filter(
            (e) => e.status !== "cancelled" && e.startDate <= iso && e.endDate >= iso
          );
          return (
            <div key={iso} className="border-r border-line last:border-r-0 p-1.5 space-y-1">
              {dayEvents.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onSelect(e)}
                  className={`w-full text-left text-[0.68rem] leading-tight px-1.5 py-1 rounded border transition-colors ${
                    e.status === "full"
                      ? "border-amber/40 bg-amber/10 text-ink/80"
                      : "border-teal/30 bg-teal/10 text-teal"
                  } hover:brightness-95`}
                  title={e.title}
                >
                  {e.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
