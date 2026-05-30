"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Minus, Play, Plus, RotateCcw, SkipForward } from "lucide-react";
import { remainingSeconds } from "@/lib/rest-timer";
import { formatDuration } from "@/lib/units";
import { playBell } from "@/lib/sound";
import { Metric } from "@/components/ui/metric";

interface Props {
  startedAt: number | null;
  defaultSeconds: number;
  onStart?: () => void;
  onAdjust?: (newSeconds: number) => void;
  onCancel?: () => void;
}

export function RestTimer({
  startedAt,
  defaultSeconds,
  onStart,
  onAdjust,
  onCancel,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [duration, setDuration] = useState(defaultSeconds);
  const firedRef = useRef(false);

  // Reset the fired latch when a fresh rest begins (ref mutation only).
  useEffect(() => {
    firedRef.current = false;
  }, [startedAt]);

  // Tick while running.
  useEffect(() => {
    if (startedAt == null) return;
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [startedAt]);

  // Ring the bell once on completion. We no longer auto-dismiss — the user
  // chooses to restart or dismiss from the "done" state.
  useEffect(() => {
    if (startedAt == null || firedRef.current) return;
    const left = remainingSeconds({ startedAt, durationMs: duration * 1000, now });
    if (left > 0) return;
    firedRef.current = true;
    playBell(2, 660);
  }, [now, startedAt, duration]);

  const adjust = (delta: number) => {
    const next = Math.max(0, duration + delta);
    setDuration(next);
    onAdjust?.(next);
  };

  // — idle —
  if (startedAt == null) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
        <Clock className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Rest</span>
        <Metric className="text-sm text-foreground">{formatDuration(duration)}</Metric>
        <div className="ml-auto flex items-center gap-1">
          <StepBtn label="−15s" onClick={() => adjust(-15)}>
            <Minus className="size-3.5" />
          </StepBtn>
          <StepBtn label="+15s" onClick={() => adjust(15)}>
            <Plus className="size-3.5" />
          </StepBtn>
          {onStart && (
            <button
              type="button"
              aria-label="Start rest"
              onClick={onStart}
              className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-[120ms] ease-tap active:scale-95"
            >
              <Play className="size-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const left = remainingSeconds({ startedAt, durationMs: duration * 1000, now });

  // — done —
  if (left <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-success/15 px-3 py-2">
        <span className="text-sm font-medium text-success">Rest complete</span>
        <div className="ml-auto flex items-center gap-1.5">
          {onStart && (
            <button
              type="button"
              onClick={onStart}
              className="flex items-center gap-1 rounded-md border border-border-strong bg-card px-2.5 py-1.5 text-xs font-medium transition-transform duration-[120ms] ease-tap active:scale-95"
            >
              <RotateCcw className="size-3.5" /> Restart
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
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
    <div className="rounded-md bg-primary/10 px-3 py-2">
      <div className="flex items-center gap-3">
        <Metric mono className="text-[34px] text-primary">
          {formatDuration(left)}
        </Metric>
        <button
          type="button"
          onClick={onCancel}
          className="ml-auto flex items-center gap-1 rounded-md border border-border-strong bg-card px-3 py-1.5 text-xs font-medium transition-transform duration-[120ms] ease-tap active:scale-95"
        >
          <SkipForward className="size-3.5" /> Skip
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
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
