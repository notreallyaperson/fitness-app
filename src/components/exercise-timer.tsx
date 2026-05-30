"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Play, Plus, RotateCcw, Timer } from "lucide-react";
import { Metric } from "@/components/ui/metric";
import { cn } from "@/lib/utils";
import { playBell } from "@/lib/sound";
import { formatDuration } from "@/lib/units";

const LEAD_IN_OPTIONS = [0, 3, 5, 10] as const;

/**
 * A self-run countdown for timed exercises (planks, carries, etc.). Set a
 * target plus an optional lead-in ("get ready" countdown), tap Start, and it
 * rings a bell when the work begins and again at zero — so you can time
 * yourself without watching the screen.
 */
export function ExerciseTimer({ defaultSeconds = 30 }: { defaultSeconds?: number }) {
  const [duration, setDuration] = useState(defaultSeconds);
  const [lead, setLead] = useState(3);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const startFired = useRef(false);
  const endFired = useRef(false);

  // Reset both bell latches when a fresh run begins.
  useEffect(() => {
    startFired.current = false;
    endFired.current = false;
  }, [startedAt]);

  useEffect(() => {
    if (startedAt == null) return;
    const i = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(i);
  }, [startedAt]);

  const elapsed = startedAt == null ? 0 : Math.max(0, (now - startedAt) / 1000);
  const inLead = startedAt != null && elapsed < lead;
  const leadLeft = Math.max(0, Math.ceil(lead - elapsed));
  const workElapsed = Math.max(0, elapsed - lead);
  const left =
    startedAt == null ? duration : Math.max(0, duration - Math.floor(workElapsed));

  // Ring the "go" bell when the lead-in ends and work begins.
  useEffect(() => {
    if (startedAt == null || startFired.current || inLead) return;
    startFired.current = true;
    playBell(1, 880);
  }, [startedAt, inLead]);

  // Ring the end bell once at zero.
  useEffect(() => {
    if (startedAt == null || endFired.current || inLead || left > 0) return;
    endFired.current = true;
    playBell(2, 660);
  }, [startedAt, inLead, left]);

  const start = () => {
    setNow(Date.now());
    setStartedAt(Date.now());
  };
  const reset = () => setStartedAt(null);
  const adjust = (d: number) => setDuration((x) => Math.max(5, x + d));

  // — idle —
  if (startedAt == null) {
    return (
      <div className="space-y-2 rounded-md bg-muted px-3 py-2">
        <div className="flex items-center gap-2">
          <Timer className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Timer</span>
          <Metric className="text-sm text-foreground">
            {formatDuration(duration)}
          </Metric>
          <div className="ml-auto flex items-center gap-1">
            <StepBtn label="−15s" onClick={() => adjust(-15)}>
              <Minus className="size-3.5" />
            </StepBtn>
            <StepBtn label="+15s" onClick={() => adjust(15)}>
              <Plus className="size-3.5" />
            </StepBtn>
            <button
              type="button"
              aria-label="Start timer"
              onClick={start}
              className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-[120ms] ease-tap active:scale-95"
            >
              <Play className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Lead-in</span>
          {LEAD_IN_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={lead === p}
              onClick={() => setLead(p)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                lead === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border-strong bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {p === 0 ? "Off" : `${p}s`}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // — lead-in (get ready) —
  if (inLead) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
        <span className="text-sm font-medium text-muted-foreground">
          Get ready…
        </span>
        <Metric mono className="text-[34px] text-warning">
          {leadLeft}
        </Metric>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1 rounded-md border border-border-strong bg-card px-3 py-1.5 text-xs font-medium transition-transform duration-[120ms] ease-tap active:scale-95"
        >
          <RotateCcw className="size-3.5" /> Cancel
        </button>
      </div>
    );
  }

  // — done —
  if (left <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-success/15 px-3 py-2">
        <span className="text-sm font-medium text-success">Time!</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={start}
            className="flex items-center gap-1 rounded-md border border-border-strong bg-card px-2.5 py-1.5 text-xs font-medium transition-transform duration-[120ms] ease-tap active:scale-95"
          >
            <RotateCcw className="size-3.5" /> Again
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-success px-2.5 py-1.5 text-xs font-medium text-success-foreground transition-transform duration-[120ms] ease-tap active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // — running —
  const pct = Math.max(0, Math.min(1, left / duration));
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-3">
        <Metric mono className="text-[34px] text-foreground">
          {formatDuration(left)}
        </Metric>
        <button
          type="button"
          onClick={reset}
          className="ml-auto flex items-center gap-1 rounded-md border border-border-strong bg-card px-3 py-1.5 text-xs font-medium transition-transform duration-[120ms] ease-tap active:scale-95"
        >
          <RotateCcw className="size-3.5" /> Reset
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-200 ease-linear"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

function StepBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md border border-border-strong bg-card text-foreground transition-transform duration-[120ms] ease-tap active:scale-95"
    >
      {children}
    </button>
  );
}
