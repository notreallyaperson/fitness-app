import Link from "next/link";
import { format, startOfWeek, subDays } from "date-fns";
import { ArrowRight, Clock, Flame, Plus } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/db/profiles";
import {
  activeElapsedSeconds,
  type PauseInterval,
} from "@/lib/session-duration";
import { kgToLbs } from "@/lib/units";
import { cn } from "@/lib/utils";
import { Metric } from "@/components/ui/metric";
import { LiveTimer } from "@/components/live-timer";
import { buttonVariants } from "@/components/ui/button";

type DashRow = {
  id: string;
  name: string;
  performed_on: string;
  started_at: string;
  ended_at: string | null;
  pause_intervals: PauseInterval[] | null;
  session_exercises: { id: string; sets: { id: string }[] }[];
};

function compactNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(n)}`;
}

function compactDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}`;
  return `${m}m`;
}

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Consecutive-day streak of completed sessions ending today (or yesterday if
 * today isn't logged yet). Bounded by the rows we fetch. */
function dayStreak(completedDates: Set<string>): number {
  const today = format(new Date(), "yyyy-MM-dd");
  let cursor = completedDates.has(today) ? new Date() : subDays(new Date(), 1);
  let streak = 0;
  while (completedDates.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export default async function Dashboard() {
  const { supabase, user } = await requireUser();
  const profile = await getMyProfile();

  const { data } = await supabase
    .from("sessions")
    .select(
      "id, name, performed_on, started_at, ended_at, pause_intervals, session_exercises(id, sets(id))",
    )
    .eq("user_id", user.id)
    .order("performed_on", { ascending: false })
    .order("started_at", { ascending: false })
    .limit(40);

  const rows = (data ?? []) as unknown as DashRow[];
  const inProgress = rows.find((r) => !r.ended_at) ?? null;
  const completed = rows.filter((r) => r.ended_at);

  // — weekly summary (real) —
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeek = completed.filter(
    (r) => new Date(r.performed_on) >= weekStart,
  );
  const workouts = thisWeek.length;
  const weekTime = thisWeek.reduce(
    (sum, r) =>
      sum +
      activeElapsedSeconds({
        startedAt: r.started_at,
        endedAt: r.ended_at,
        pauseIntervals: r.pause_intervals ?? [],
        // completed sessions clamp to ended_at; now is unused but required
        now: r.ended_at ? new Date(r.ended_at).getTime() : 0,
      }),
    0,
  );

  let volumeKg = 0;
  if (thisWeek.length) {
    const { data: vols } = await supabase
      .from("set_volumes")
      .select("volume_kg, is_warmup, session_id")
      .in(
        "session_id",
        thisWeek.map((r) => r.id),
      );
    volumeKg = (vols ?? [])
      .filter((v) => !v.is_warmup)
      .reduce((s, v) => s + (v.volume_kg ?? 0), 0);
  }
  const weightUnit = profile.units_weight;
  const volumeDisplay = weightUnit === "lbs" ? kgToLbs(volumeKg) : volumeKg;

  const streak = dayStreak(new Set(completed.map((r) => r.performed_on)));

  // — recent (real) —
  const recent = completed.slice(0, 3).map((r) => ({
    id: r.id,
    name: r.name,
    performed_on: r.performed_on,
    sets: r.session_exercises.reduce((n, ex) => n + ex.sets.length, 0),
    duration: activeElapsedSeconds({
      startedAt: r.started_at,
      endedAt: r.ended_at,
      pauseIntervals: r.pause_intervals ?? [],
      now: r.ended_at ? new Date(r.ended_at).getTime() : 0,
    }),
  }));

  // — in-progress detail —
  const ipTotal = inProgress?.session_exercises.length ?? 0;
  const ipDone =
    inProgress?.session_exercises.filter((ex) => ex.sets.length > 0).length ?? 0;
  const ipSets =
    inProgress?.session_exercises.reduce((n, ex) => n + ex.sets.length, 0) ?? 0;

  const initials = (profile.display_name || user.email || "A")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="space-y-6 pt-1">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-muted-foreground">
            {format(new Date(), "EEEE, MMM d")}
          </p>
          <h1 className="text-[27px] leading-tight font-bold tracking-[-0.03em]">
            {greetingFor(new Date().getHours())}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          {streak > 0 && (
            <span className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-success/15 px-3 text-success">
              <Flame className="size-4" strokeWidth={2} />
              <Metric className="text-sm">{streak}</Metric>
            </span>
          )}
          <div className="flex size-[38px] items-center justify-center rounded-full border border-border bg-card text-sm font-semibold">
            {initials}
          </div>
        </div>
      </header>

      {/* Weekly summary — shadow-less strip */}
      <div className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-card">
        <Stat label="Workouts" value={`${workouts}`} />
        <Stat
          label="Volume"
          value={`${compactNum(volumeDisplay)}`}
          unit={weightUnit}
        />
        <Stat label="Time" value={compactDuration(weekTime)} />
      </div>

      {/* Continue (focal) */}
      {inProgress && (
        <div className="rounded-lg border border-border bg-elevated p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="size-2 animate-live-dot rounded-full bg-primary" />
            <span className="text-[11px] font-semibold tracking-[0.07em] text-primary uppercase">
              In progress
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              Started {format(new Date(inProgress.started_at), "h:mm a")}
            </span>
          </div>
          <p className="mt-3 text-[17px] font-semibold">{inProgress.name}</p>
          <p className="text-sm text-muted-foreground">
            {ipDone} of {ipTotal} exercises · {ipSets} sets logged
          </p>
          <LiveTimer
            startedAt={inProgress.started_at}
            endedAt={inProgress.ended_at}
            pauseIntervals={inProgress.pause_intervals ?? []}
            className="mt-2 block text-[34px] text-foreground"
          />
          {ipTotal > 0 && (
            <div className="mt-3 flex gap-1">
              {Array.from({ length: ipTotal }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < ipDone ? "bg-foreground" : "bg-border",
                  )}
                />
              ))}
            </div>
          )}
          <Link
            href={`/sessions/${inProgress.id}`}
            className={buttonVariants({
              variant: "outline",
              className:
                "mt-4 h-11 w-full border-primary text-primary hover:bg-primary/10 hover:text-primary",
            })}
          >
            Resume <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between px-0.5">
            <h2 className="text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
              Recent
            </h2>
            <Link href="/sessions" className="text-xs text-muted-foreground">
              All
            </Link>
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/sessions/${r.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.sets} sets</p>
                </div>
                <div className="text-right">
                  <Metric className="flex items-center justify-end gap-1 text-sm text-foreground">
                    <Clock className="size-3.5 text-muted-foreground" />
                    {compactDuration(r.duration)}
                  </Metric>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.performed_on), "EEE")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!inProgress && recent.length === 0 && (
        <div className="rounded-lg border border-dashed border-border-strong bg-card px-6 py-10 text-center">
          <p className="font-medium">No workouts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start your first session to begin tracking.
          </p>
        </div>
      )}

      {/* Start CTA */}
      <Link
        href="/sessions/start"
        className={buttonVariants({
          className: "h-[54px] w-full rounded-lg text-base shadow-cta",
        })}
      >
        <Plus className="size-5" strokeWidth={2.4} />
        Start Session
      </Link>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-[11px] tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <Metric className="text-[26px] text-foreground">{value}</Metric>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
