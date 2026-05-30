// One-off: import sessions.json into the hosted Supabase project as historical
// workouts for avinash@qworky.tech, dating each session from its title (or the
// agreed scheme for weekday-only titles). Uses the service role key (bypasses
// RLS). Idempotent: a session with the same (user, name, performed_on) is
// skipped, so re-running won't duplicate.
//
// Run: node scripts/import-sessions-history.mjs
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = "eb40db35-ee09-4ccd-9411-6d668c624434"; // avinash@qworky.tech
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

// session name -> performed_on date (YYYY-MM-DD)
const DATES = {
  "Monday 30 March - Gym + Ball Work": "2026-03-30",
  "Wednesday 1 April - Upper Body + Core": "2026-04-01",
  "Sunday 4 May - Athletic Full Body": "2026-05-04",
  "Tuesday - Speed Mechanics + Football + Recovery Strength": "2026-05-19",
  "Saturday - Upper Body Optional": "2026-05-23",
  "Monday - Performance Lower Body + Acceleration": "2026-05-25",
  "Tuesday - Upper Athletic + Football": "2026-05-26",
  "Wednesday - Sprint Endurance + Movement": "2026-05-27",
  "Thursday - Match Prep Recovery": "2026-05-28",
  "Friday - Match Day": "2026-05-29",
  "Saturday - Recovery Swim": "2026-05-30",
};

async function rest(path, opts = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text}`);
  return text ? JSON.parse(text) : null;
}

// Build name -> exercise_id (system rows). On duplicate names keep the first.
const exRows = await rest("exercises?owner_user_id=is.null&select=id,name&limit=2000");
const idByName = new Map();
for (const e of exRows) if (!idByName.has(e.name)) idByName.set(e.name, e.id);

const sessions = JSON.parse(readFileSync(new URL("../sessions.json", import.meta.url), "utf8"));

// Verify every name resolves before writing anything.
const unresolved = new Set();
for (const s of sessions) for (const ex of s.exercises) if (!idByName.has(ex.name)) unresolved.add(ex.name);
if (unresolved.size) { console.error("Unresolved exercise names:", [...unresolved]); process.exit(1); }

let imported = 0, skipped = 0;
for (const s of sessions) {
  const performed_on = DATES[s.name];
  if (!performed_on) { console.error(`No date mapping for "${s.name}" — skipping`); continue; }

  // idempotency guard
  const existing = await rest(
    `sessions?user_id=eq.${USER_ID}&name=eq.${encodeURIComponent(s.name)}&performed_on=eq.${performed_on}&select=id`,
  );
  if (existing.length) { console.log(`SKIP (exists): ${performed_on}  ${s.name}`); skipped++; continue; }

  const started_at = `${performed_on}T17:00:00+00:00`;
  const ended_at = `${performed_on}T18:00:00+00:00`; // placeholder 1h duration
  const [session] = await rest("sessions", {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify([{ user_id: USER_ID, name: s.name, notes: s.notes ?? null, performed_on, started_at, ended_at }]),
  });

  const seRows = s.exercises.map((ex, i) => ({
    session_id: session.id, exercise_id: idByName.get(ex.name), position: i, notes: null,
  }));
  const inserted = await rest("session_exercises", {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify(seRows),
  });
  const seIdByPos = new Map(inserted.map((r) => [r.position, r.id]));

  // Uniform-key set rows (PostgREST needs matching keys for a bulk insert).
  const setRows = s.exercises.flatMap((ex, i) =>
    ex.sets.map((st, p) => ({
      session_exercise_id: seIdByPos.get(i),
      position: p,
      is_warmup: st.is_warmup ?? false,
      reps: st.reps ?? null,
      weight: st.weight ?? null,
      weight_unit: st.weight_unit ?? null,
      time_seconds: st.time_seconds ?? null,
      distance: st.distance ?? null,
      distance_unit: st.distance_unit ?? null,
      rpe: st.rpe ?? null,
      notes: null,
    })),
  );
  if (setRows.length) await rest("sets", { method: "POST", body: JSON.stringify(setRows) });

  console.log(`OK ${performed_on}  ${s.name}  (${seRows.length} exercises, ${setRows.length} sets)`);
  imported++;
}
console.log(`\nDone. imported=${imported} skipped=${skipped}`);
