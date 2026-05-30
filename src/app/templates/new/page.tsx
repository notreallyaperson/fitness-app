import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createTemplateAction } from "@/server/actions/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewTemplatePage() {
  return (
    <div className="space-y-4 pt-1">
      <Link
        href="/templates"
        className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Templates
      </Link>
      <h1 className="text-[27px] font-bold tracking-[-0.03em]">New template</h1>
      <form action={createTemplateAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Push Day"
            required
            className="h-12 bg-muted"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" name="notes" className="bg-muted" />
        </div>
        <Button type="submit" className="h-12 w-full rounded-lg shadow-cta">
          Create template
        </Button>
      </form>
    </div>
  );
}
