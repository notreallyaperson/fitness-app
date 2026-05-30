import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Ledger's signature numeral — tabular, slashed-zero, tight tracking.
 * The brand is "the number is the interface": every weight, rep count and
 * timer renders through this. Use `mono` for countdowns/timers.
 */
export function Metric({
  className,
  mono,
  ...props
}: ComponentProps<"span"> & { mono?: boolean }) {
  return (
    <span className={cn("metric", mono && "font-mono", className)} {...props} />
  );
}
