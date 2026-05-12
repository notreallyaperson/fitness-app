import { createTemplateAction } from "@/server/actions/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewTemplatePage() {
  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-2xl font-semibold">New template</h1>
      <form action={createTemplateAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Push Day" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" name="notes" />
        </div>
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}
