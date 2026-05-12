import Link from "next/link";
import { format } from "date-fns";
import { listSessions } from "@/lib/db/sessions";
import { buttonVariants } from "@/components/ui/button";

export default async function SessionsPage() {
  const sessions = await listSessions();
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <Link href="/sessions/start" className={buttonVariants({ size: "sm" })}>
          + Start
        </Link>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/sessions/${s.id}`} className="block p-3">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(s.performed_on), "EEE, MMM d")}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
