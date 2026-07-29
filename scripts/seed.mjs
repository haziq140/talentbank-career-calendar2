// scripts/seed.mjs
// Run with: node scripts/seed.mjs
//
// Pushes realistic sample events straight into your Firestore "events"
// collection (using fixed IDs, so re-running this just overwrites the
// same 8 demo events instead of duplicating them).

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Same config as lib/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyBuXcGqumJ6aRjokXDgm5dFEAUgqNm-b0E",
  authDomain: "talentbank-calander.firebaseapp.com",
  projectId: "talentbank-calander",
  storageBucket: "talentbank-calander.firebasestorage.app",
  messagingSenderId: "534955262434",
  appId: "1:534955262434:web:477d4e20b1c4e6742e79bb",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = new Date().toISOString();

const events = [
  {
    id: "evt_seed_1",
    title: "Talentbank Penang Career Fair",
    type: "public",
    sector: "general",
    startDate: "2026-08-01",
    endDate: "2026-08-01",
    location: "Penang",
    capacity: 500,
    registeredCount: 500, // intentionally full, to demo the fill-up flow
    status: "full",
    registrationLink: "https://www.talentbank.io/career-fairs/penang",
    lastEditedBy: "seed",
    lastEditedAt: now,
    createdAt: now,
  },
  {
    id: "evt_seed_2",
    title: "Universiti Tunku Abdul Rahman Career Fair",
    type: "university",
    sector: "general",
    startDate: "2026-08-05",
    endDate: "2026-08-05",
    location: "UTAR Campus",
    capacity: null,
    registeredCount: 180,
    status: "published",
    registrationLink: "https://www.talentbank.io/career-fairs/utar",
    lastEditedBy: "seed",
    lastEditedAt: now,
    createdAt: now,
  },
  {
    id: "evt_seed_3",
    title: "Talentbank Engineering Career Fair",
    type: "sector",
    sector: "engineering",
    startDate: "2026-08-22",
    endDate: "2026-08-22",
    location: "Kuala Lumpur Convention Centre",
    capacity: 800,
    registeredCount: 410,
    status: "published",
    registrationLink: "https://www.talentbank.io/career-fairs/engineering",
    lastEditedBy: "seed",
    lastEditedAt: now,
    createdAt: now,
  },
  {
    id: "evt_seed_4",
    title: "Talentbank BAFI Career Fair",
    type: "sector",
    sector: "general",
    startDate: "2026-09-12",
    endDate: "2026-09-12",
    location: "Sunway Pyramid Convention Centre",
    capacity: 600,
    registeredCount: 95,
    status: "published",
    registrationLink: "https://www.talentbank.io/career-fairs/bafi",
    lastEditedBy: "seed",
    lastEditedAt: now,
    createdAt: now,
  },
  {
    id: "evt_seed_5",
    title: "Talentbank Tech Career Fair",
    type: "sector",
    sector: "tech",
    startDate: "2026-10-03",
    endDate: "2026-10-03",
    location: "Sunway Pyramid Convention Centre",
    capacity: 700,
    registeredCount: 240,
    status: "published",
    registrationLink: "https://www.talentbank.io/career-fairs/tech",
    lastEditedBy: "seed",
    lastEditedAt: now,
    createdAt: now,
  },
  {
    id: "evt_seed_6",
    title: "Talentbank Johor Career Fair",
    type: "public",
    sector: "general",
    // deliberately overlaps with evt_seed_5 above, to demo the clash warning
    startDate: "2026-10-03",
    endDate: "2026-10-04",
    location: "Johor Bahru",
    capacity: null,
    registeredCount: 60,
    status: "published",
    registrationLink: "https://www.talentbank.io/career-fairs/johor",
    lastEditedBy: "seed",
    lastEditedAt: now,
    createdAt: now,
  },
  {
    id: "evt_seed_7",
    title: "Swinburne University Career Fair",
    type: "university",
    sector: "general",
    startDate: "2026-09-30",
    endDate: "2026-09-30",
    location: "Swinburne Sarawak Campus",
    capacity: 300,
    registeredCount: 40,
    status: "cancelled",
    registrationLink: "https://www.talentbank.io/career-fairs/swinburne",
    lastEditedBy: "seed",
    lastEditedAt: now,
    createdAt: now,
  },
  {
    id: "evt_seed_8",
    title: "Universiti Sains Islam Malaysia Career Fair",
    type: "university",
    sector: "general",
    startDate: "2026-10-14",
    endDate: "2026-10-14",
    location: "USIM Campus, Nilai",
    capacity: 350,
    registeredCount: 10,
    status: "draft", // events team hasn't published this yet
    registrationLink: "",
    lastEditedBy: "seed",
    lastEditedAt: now,
    createdAt: now,
  },
];

for (const { id, ...data } of events) {
  await setDoc(doc(db, "events", id), data);
  console.log(`Seeded ${id} — ${data.title}`);
}

console.log(`\nDone. Seeded ${events.length} events into Firestore.`);
process.exit(0);
