import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, Plus } from "lucide-react";
import { listSessions } from "@/lib/db/sessions";
import { buttonVariants } from "@/components/ui/button";

export default async function SessionsPage() {
  const sessions = await listSessions();
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between">
        <h1 className="text-[27px] font-bold tracking-[-0.03em]">History</h1>
        <Link
          href="/sessions/start"
          className={buttonVariants({ size: "sm", className: "rounded-md" })}
        >
          <Plus className="size-4" /> Start
        </Link>
      </div>
      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          No sessions logged yet.
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(s.performed_on), "EEE, MMM d")}
                  {!s.ended_at && (
                    <span className="ml-2 font-medium text-primary">
                      In progress
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-faint" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
