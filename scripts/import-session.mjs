// On-demand: import ONE coaching session into the hosted Supabase project for
// avinash@qworky.tech, dated to the day you train (defaults to today).
//
// Usage:
//   node scripts/import-session.mjs <day> [YYYY-MM-DD]
//   day = mon | tue | wed | thu   (keys in coach-sessions.json)
//   date defaults to today's local date.
//
// Creates a prefilled session (target loads from your history) that you then
// open in the app and log your actual numbers against. Idempotent: skips if a
// session with the same name + date already exists.
import { readFileSync } from "node:fs";

const day = (process.argv[2] || "").toLowerCase();
const dateArg = process.argv[3];
const plan = JSON.parse(readFileSync(new URL("./coach-sessions.json", import.meta.url), "utf8"));
if (!plan[day]) {
  console.error(`Unknown day "${day}". Use one of: ${Object.keys(plan).join(", ")}`);
  process.exit(1);
}

const performed_on = dateArg || new Date().toISOString().slice(0, 10);

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = "eb40db35-ee09-4ccd-9411-6d668c624434"; // avinash@qworky.tech
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function rest(path, opts = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text}`);
  return text ? JSON.parse(text) : null;
}

const session = plan[day];

// resolve exercise names -> ids
const exRows = await rest("exercises?owner_user_id=is.null&select=id,name&limit=2000");
const idByName = new Map();
for (const e of exRows) if (!idByName.has(e.name)) idByName.set(e.name, e.id);
const missing = session.exercises.map((e) => e.name).filter((n) => !idByName.has(n));
if (missing.length) { console.error("Missing exercises in catalog:", missing); process.exit(1); }

// idempotency
const existing = await rest(
  `sessions?user_id=eq.${USER_ID}&name=eq.${encodeURIComponent(session.name)}&performed_on=eq.${performed_on}&select=id`,
);
if (existing.length) {
  console.log(`Already imported: "${session.name}" on ${performed_on} (id ${existing[0].id}).`);
  process.exit(0);
}

const started_at = `${performed_on}T17:00:00+00:00`;
const [created] = await rest("sessions", {
  method: "POST", headers: { Prefer: "return=representation" },
  body: JSON.stringify([{ user_id: USER_ID, name: session.name, notes: session.notes, performed_on, started_at }]),
});

const seRows = session.exercises.map((ex, i) => ({
  session_id: created.id, exercise_id: idByName.get(ex.name), position: i, notes: null,
}));
const inserted = await rest("session_exercises", {
  method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(seRows),
});
const seIdByPos = new Map(inserted.map((r) => [r.position, r.id]));

const setRows = session.exercises.flatMap((ex, i) =>
  ex.sets.map((s, p) => ({
    session_exercise_id: seIdByPos.get(i),
    position: p,
    is_warmup: s.is_warmup ?? false,
    reps: s.reps ?? null,
    weight: s.weight ?? null,
    weight_unit: s.weight_unit ?? null,
    time_seconds: s.time_seconds ?? null,
    distance: s.distance ?? null,
    distance_unit: s.distance_unit ?? null,
    rpe: s.rpe ?? null,
    notes: null,
  })),
);
if (setRows.length) await rest("sets", { method: "POST", body: JSON.stringify(setRows) });

console.log(`Imported "${session.name}" -> ${performed_on}  (${seRows.length} exercises, ${setRows.length} sets). Session id: ${created.id}`);
