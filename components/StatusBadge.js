const STYLES = {
  published: "bg-teal/10 text-teal border-teal/30",
  full: "bg-amber/10 text-amber border-amber/40",
  cancelled: "bg-clash/10 text-clash border-clash/30",
  draft: "bg-ink/5 text-ink/50 border-ink/15",
};

const LABELS = {
  published: "Open",
  full: "Full",
  cancelled: "Cancelled",
  draft: "Draft",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.draft;
  const label = LABELS[status] || status;
  return (
    <span className={`status-badge inline-block px-2 py-1 rounded-full border ${style}`}>
      {label}
    </span>
  );
}
