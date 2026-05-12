import Link from "next/link";
import { format } from "date-fns";
import { listTemplates } from "@/lib/db/templates";
import { buttonVariants } from "@/components/ui/button";

export default async function TemplatesPage() {
  const templates = await listTemplates();
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Link href="/templates/new" className={buttonVariants({ size: "sm" })}>
          + New
        </Link>
      </div>
      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No templates yet. Create one to set defaults you can start any day.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {templates.map((t) => (
            <li key={t.id} className="p-3">
              <Link href={`/templates/${t.id}`} className="block">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  Updated {format(new Date(t.updated_at), "MMM d, yyyy")}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
