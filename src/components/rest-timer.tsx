"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { remainingSeconds } from "@/lib/rest-timer";
import { formatDuration } from "@/lib/units";

interface Props {
  startedAt: number | null;
  defaultSeconds: number;
  onAdjust?: (newSeconds: number) => void;
  onCancel?: () => void;
}

export function RestTimer({ startedAt, defaultSeconds, onAdjust, onCancel }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [duration, setDuration] = useState(defaultSeconds);

  useEffect(() => {
    if (startedAt == null) return;
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [startedAt]);

  useEffect(() => {
    if (startedAt == null) return;
    const left = remainingSeconds({ startedAt, durationMs: duration * 1000, now });
    if (left === 0) {
      try {
        navigator.vibrate?.(200);
      } catch {
        /* noop */
      }
    }
  }, [now, startedAt, duration]);

  if (startedAt == null) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Rest: {duration}s</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const next = Math.max(0, duration - 15);
            setDuration(next);
            onAdjust?.(next);
          }}
        >
          -15s
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const next = duration + 15;
            setDuration(next);
            onAdjust?.(next);
          }}
        >
          +15s
        </Button>
      </div>
    );
  }

  const left = remainingSeconds({ startedAt, durationMs: duration * 1000, now });
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-mono">{formatDuration(left)}</span>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Skip
      </Button>
    </div>
  );
}
