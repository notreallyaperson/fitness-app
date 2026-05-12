import { listTemplates } from "@/lib/db/templates";
import {
  startFreshAction,
  startFromTemplateAction,
  startRepeatLastAction,
} from "@/server/actions/sessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StartSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>;
}) {
  const sp = await searchParams;
  const templates = await listTemplates();

  return (
    <div className="space-y-6 pt-2">
      <h1 className="text-2xl font-semibold">Start a session</h1>
      {sp.empty && (
        <p className="text-sm text-amber-600">
          No previous session to repeat — pick another option.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repeat last session</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={startRepeatLastAction}>
            <Button type="submit" className="w-full">
              Repeat last
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">From template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates yet.</p>
          ) : (
            templates.map((t) => (
              <form key={t.id} action={startFromTemplateAction.bind(null, t.id)}>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>{t.name}</span>
                  <span aria-hidden>→</span>
                </Button>
              </form>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fresh</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={startFreshAction}>
            <Button type="submit" variant="outline" className="w-full">
              Start empty
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
