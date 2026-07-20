#!/usr/bin/env node
// push-schedule.js — run once to seed schedule into D1
// Usage: node push-schedule.js YOUR_ADMIN_PASSWORD
//
// ⚠️  WARNING: running this CREATES slots — running it against a database that
// already has slots will create DUPLICATES. The live schedule was last rewritten
// in place on 2026-07-20 (zone rework, 6-week cycle). This script documents that
// configuration and can rebuild it from an empty schedule_slots/slot_patterns.

const WORKER = 'https://sdc-worker.solitary-truth-a9af.workers.dev';
const SECRET = process.argv[2];
const ANCHOR  = '2026-07-20'; // Monday July 20 2026 = Week 1 of the 6-week cycle

if (!SECRET) { console.error('Usage: node push-schedule.js YOUR_ADMIN_PASSWORD'); process.exit(1); }

// ── Zones (reworked 2026-07-20) ────────────────────────────────────────────
// Core ZIPs get every slot on their zone's day. AM-only ZIPs are the far ends
// of each zone — 8:00 + 10:30 slots only. Renton (home) is bookable 8:00 or
// 15:30 on ANY worked day regardless of zone. The south "north band"
// (Burien/SeaTac/Tukwila — close to home) rides the full south day AND the
// 15:30 slot on west days.

const WEST_CORE = [ // Seattle / I-5
  '98101','98102','98103','98104','98105','98106','98107','98108','98109',
  '98112','98115','98116','98117','98118','98119','98121','98122','98125',
  '98126','98133','98134','98136','98144','98155','98177','98195','98199',
];
const WEST_AM = ['98020','98026','98036','98037','98043','98087'];

const EAST_CORE = [ // 405 / Eastside
  '98004','98005','98006','98007','98008','98027','98029','98033','98034',
  '98039','98040','98052','98053','98074','98075',
];
const EAST_AM = ['98011','98012','98021','98028','98072','98077','98082'];

const SOUTH_CORE = ['98030','98031','98032','98038','98042','98198']; // valley
const SOUTH_AM   = ['98001','98002','98003','98023','98092'];         // far south
const SOUTH_NB   = ['98146','98148','98158','98166','98168','98178','98188']; // north band

const RENTON = ['98055','98056','98057','98058','98059'];

// ── 6-week rotation (anchor Mon 2026-07-20 = Week 1) ───────────────────────
// One zone per day. South gets Tue on odd weeks / Thu on even weeks; West and
// East split the rest, balancing to 5 days each per 3-week half (the Saturday
// goes to whichever got fewer weekdays that half: wk1-3 Sat = East, wk4-6 = West).
// Saturdays: the pattern only sets the ZONE — which Saturdays are actually
// worked (~1 in 3) is controlled manually via block_dates in the admin app.
// Wed & Fri 15:30 are warranty blocks: those slots are DISABLED but carry the
// same zone patterns as everything else, so re-enabling them someday just works.
//
//        Tue   Wed   Thu   Fri   Sat
// Wk 1   S     W     E     W     E
// Wk 2   W     E     S     E     E
// Wk 3   S     W     E     W     E
// Wk 4   E     W     S     E     W
// Wk 5   S     W     E     E     W
// Wk 6   W     E     S     W     W

const GRID = {
  tue: ['S','W','S','E','S','W'],
  wed: ['W','E','W','W','W','E'],
  thu: ['E','S','E','S','E','S'],
  fri: ['W','E','W','E','E','W'],
  sat: ['E','E','E','W','W','W'],
};

const TIMES = [
  { start:'08:00', end:'10:00', label:'8am'   },
  { start:'10:30', end:'12:30', label:'10:30' },
  { start:'13:00', end:'15:00', label:'1pm'   },
  { start:'15:30', end:'17:30', label:'3:30'  },
];

// Wed & Fri 3:30 = warranty blocks (slot disabled, but patterns kept in line)
const WARRANTY = { wed:'15:30', fri:'15:30' };

function zipsFor(zone, start) {
  if (zone === 'S') {
    if (start === '08:00') return [...SOUTH_CORE, ...SOUTH_AM, ...SOUTH_NB, ...RENTON];
    if (start === '10:30') return [...SOUTH_CORE, ...SOUTH_AM, ...SOUTH_NB];
    if (start === '13:00') return [...SOUTH_CORE, ...SOUTH_NB];
    return [...SOUTH_CORE, ...SOUTH_NB, ...RENTON]; // 15:30
  }
  if (zone === 'W') {
    if (start === '08:00') return [...WEST_CORE, ...WEST_AM, ...RENTON];
    if (start === '10:30') return [...WEST_CORE, ...WEST_AM];
    if (start === '13:00') return [...WEST_CORE];
    return [...WEST_CORE, ...SOUTH_NB, ...RENTON]; // 15:30 — north band rides west 3:30
  }
  // East
  if (start === '08:00') return [...EAST_CORE, ...EAST_AM, ...RENTON];
  if (start === '10:30') return [...EAST_CORE, ...EAST_AM];
  if (start === '13:00') return [...EAST_CORE];
  return [...EAST_CORE, ...RENTON]; // 15:30
}

const slots = [];
for (const day of Object.keys(GRID)) {
  for (const t of TIMES) {
    const isWarranty = WARRANTY[day] === t.start;
    slots.push({
      days: [day], start: t.start, end: t.end,
      label: `${day[0].toUpperCase()}${day.slice(1)} ${t.label}${isWarranty ? ' (warranty block)' : ''}`,
      enabled: isWarranty ? 0 : 1,
      patterns: GRID[day].map((zone, i) => ({ week_label: String(i + 1), zips: zipsFor(zone, t.start) })),
    });
  }
}

async function createSlot(slot) {
  const res = await fetch(`${WORKER}/admin/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SECRET}` },
    body: JSON.stringify({
      days_of_week: slot.days,
      start_time:   slot.start,
      end_time:     slot.end,
      capacity:     1,
      enabled:      slot.enabled,
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
