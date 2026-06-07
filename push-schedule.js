#!/usr/bin/env node
// push-schedule.js — run once to seed schedule into D1
// Usage: node push-schedule.js YOUR_ADMIN_PASSWORD

const WORKER = 'https://sdc-worker.solitary-truth-a9af.workers.dev';
const SECRET = process.argv[2];
const ANCHOR  = '2026-06-09'; // Monday June 9 = Week A

if (!SECRET) { console.error('Usage: node push-schedule.js YOUR_ADMIN_PASSWORD'); process.exit(1); }

// ── Zones ──────────────────────────────────────────────────────────────────
// EAST  — 405 corridor, Renton to Bothell
const EAST = [
  '98039','98040','98004','98005','98006','98007','98008',
  '98027','98028','98029','98033','98034','98052','98053',
  '98055','98056','98057','98058','98059',
  '98072','98074','98075','98077',
  '98011','98021',
];

// WEST  — Seattle city + Shoreline + I-5 north suburbs, down to Rainier Beach
const WEST = [
  '98012','98020','98026','98036','98037','98043','98082','98087',
  '98101','98102','98103','98104','98105','98106','98107','98108',
  '98109','98112','98115','98116','98117','98118','98119','98121',
  '98122','98125','98126','98133','98134','98136','98144',
  '98155','98177','98178','98195','98199',
];

// SOUTH — Kent, Federal Way, Auburn, SeaTac, Burien, Des Moines
const SOUTH = [
  '98001','98002','98003','98023',
  '98030','98031','98032','98038','98042','98092',
  '98146','98148','98158','98166','98168','98188','98198',
];

const ALL = [...EAST, ...WEST, ...SOUTH]; // Saturday: any ZIP, any zone

// ── 2-week rotation ────────────────────────────────────────────────────────
// Week A: Tue=East  Wed=West  Thu=South  Fri=East
// Week B: Tue=West  Wed=South Thu=East   Fri=West
//
// East gets: Tue(A) + Fri(A) + Thu(B) = 3 days per 2-week cycle
// West gets: Wed(A) + Tue(B) + Fri(B) = 3 days per 2-week cycle
// South gets: Thu(A) + Wed(B)          = 2 days per 2-week cycle
//
// Top-demand ZIPs (Fremont/Bellevue/Redmond) available ~every 3-4 days.
// South is lower demand so 2x per cycle is appropriate.

const TIMES = [
  { start:'08:00', end:'10:00', label:'8am'   },
  { start:'10:30', end:'12:30', label:'10:30' },
  { start:'13:00', end:'15:00', label:'1pm'   },
  { start:'15:30', end:'17:30', label:'3:30'  },
];

function daySlots(day, zoneA, zoneB, dayLabel) {
  return TIMES.map(t => ({
    days: [day], start: t.start, end: t.end,
    label: `${dayLabel} ${t.label}`,
    patterns: [
      { week_label: 'A', zips: zoneA },
      { week_label: 'B', zips: zoneB },
    ],
  }));
}

const slots = [
  ...daySlots('tue', EAST,  WEST,  'Tue'),
  ...daySlots('wed', WEST,  SOUTH, 'Wed'),
  ...daySlots('thu', SOUTH, EAST,  'Thu'),
  ...daySlots('fri', EAST,  WEST,  'Fri'),
  // Saturday every other week (Week A only) — all zones, catches anyone who
  // couldn't get a weekday slot
  ...TIMES.map(t => ({
    days: ['sat'], start: t.start, end: t.end,
    label: `Sat ${t.label} (Week A only)`,
    patterns: [{ week_label: 'A', zips: ALL }],
  })),
];

async function createSlot(slot) {
  const res = await fetch(`${WORKER}/admin/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SECRET}` },
    body: JSON.stringify({
      days_of_week: slot.days,
      start_time:   slot.start,
      end_time:     slot.end,
      capacity:     1,
      enabled:      1,
      anchor_date:  ANCHOR,
      patterns:     slot.patterns,
    }),
  });
  const data = await res.json();
  console.log(res.ok ? `  ok  ${slot.label}` : `  ERR ${slot.label}: ${JSON.stringify(data)}`);
}

(async () => {
  console.log(`\nPushing ${slots.length} slots to ${WORKER}\n`);
  for (const slot of slots) await createSlot(slot);
  console.log('\nDone. Reload Schedule Editor to verify.\n');
})();
