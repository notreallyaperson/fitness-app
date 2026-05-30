"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/units";
import {
  activeElapsedSeconds,
  isPaused,
  type PauseInterval,
} from "@/lib/session-duration";

/**
 * Ticking session elapsed-time readout. Freezes when paused or ended (the math
 * clamps it), so we only run the interval while the clock is truly running.
 */
export function LiveTimer({
  startedAt,
  endedAt,
  pauseIntervals,
  className,
}: {
  startedAt: string;
  endedAt: string | null;
  pauseIntervals: PauseInterval[];
  className?: string;
}) {
  const paused = isPaused(pauseIntervals);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endedAt || paused) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [endedAt, paused]);

  const elapsed = activeElapsedSeconds({ startedAt, endedAt, pauseIntervals, now });
  return (
    <span className={cn("metric font-mono", className)}>
      {formatDuration(elapsed)}
    </span>
  );
}
