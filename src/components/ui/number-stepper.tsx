"use client";

import { Minus, Plus } from "lucide-react";

/**
 * Composed number field-box (NOT a stock input): a `.metric` value flanked by
 * two icon buttons. The center stays freely typeable; the buttons step it.
 * `prev` renders a greyed reference target (planned "previous performance").
 */
export function NumberStepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  prev,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: number;
  min?: number;
  prev?: string;
}) {
  const bump = (delta: number) => {
    const base = value === "" ? 0 : Number(value);
    const next = Math.max(min, Math.round((base + delta) * 100) / 100);
    onChange(String(next));
  };

  return (
    <div className="rounded-md bg-muted p-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        {prev && <span className="text-[10px] text-faint">prev {prev}</span>}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => bump(-step)}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border-strong bg-card text-foreground transition-transform duration-[120ms] ease-tap active:scale-95"
        >
          <Minus className="size-4" />
        </button>
        <input
          inputMode="decimal"
          type="number"
          step={step}
          value={value}
          placeholder="0"
          onChange={(e) => onChange(e.target.value)}
          className="metric w-full min-w-0 [appearance:textfield] bg-transparent text-center text-[26px] text-foreground outline-none placeholder:text-faint [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => bump(step)}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border-strong bg-card text-foreground transition-transform duration-[120ms] ease-tap active:scale-95"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
