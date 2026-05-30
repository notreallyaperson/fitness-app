import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, Plus } from "lucide-react";
import { listTemplates } from "@/lib/db/templates";
import { buttonVariants } from "@/components/ui/button";

export default async function TemplatesPage() {
  const templates = await listTemplates();
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between">
        <h1 className="text-[27px] font-bold tracking-[-0.03em]">Templates</h1>
        <Link
          href="/templates/new"
          className={buttonVariants({ size: "sm", className: "rounded-md" })}
        >
          <Plus className="size-4" /> New
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          No templates yet. Create one to set defaults you can start any day.
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/templates/${t.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {format(new Date(t.updated_at), "MMM d, yyyy")}
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
