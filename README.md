# Talentbank Career Fair Calendar — Prototype

A full-year calendar of Talentbank career fairs with a non-technical
admin panel for the events team, and a public panel for candidates
and employers.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the public calendar, and
http://localhost:3000/admin for the events-team panel
(demo password: `talentbank2026`).

Data lives in `data/*.json` (git-ignored after first run). To reset to
the sample dataset at any point:

```bash
node scripts/seed.js
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Note: this prototype's data layer (`lib/store.js`) writes to local JSON
files, which works for `next dev` but **not** for Vercel's serverless
functions (no persistent filesystem between invocations). For a real
deploy, swap `lib/store.js` for Firebase Firestore — every function in
that file (`getEvents`, `createEvent`, `updateEvent`, `findClashes`,
etc.) keeps the same signature, so nothing in `app/` needs to change.
That swap is the natural "next step" to mention in the demo video.

## What's built

- **Public panel** (`/`) — week-strip view of the current week,
  sector filters, live "showing X of Y" counts, registration flow
  with waitlist support for full events.
- **Admin panel** (`/admin`) — summary counts by status, add/edit
  form with live clash warnings on overlapping dates, cancel flow
  that preserves the event (soft delete), recent-activity audit log.
- **Core logic** (`lib/store.js`) — clash detection, auto full/open
  status based on capacity vs. registrations, audit trail on every
  write.

## Known simplifications (for the reflection doc)

- Admin login is a hardcoded password behind `sessionStorage`, not
  real auth — Firebase Auth is the natural production swap.
- Drag-to-move on the admin calendar wasn't built; editing dates via
  the form was the pragmatic trade-off for a 3-day window.
- No real email notifications on cancellation — the audit log entry
  stands in for "who would be notified."
