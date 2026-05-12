import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/supabase/server";

export default async function Dashboard() {
  await requireUser();
  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-2xl font-semibold">Today</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start a session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/sessions/start"
              className={buttonVariants({ className: "w-full" })}
            >
              Start workout
            </Link>
            <Link
              href="/templates"
              className={buttonVariants({
                variant: "outline",
                className: "w-full",
              })}
            >
              Manage templates
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Browse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/exercises"
              className={buttonVariants({
                variant: "outline",
                className: "w-full",
              })}
            >
              Exercise library
            </Link>
            <Link
              href="/sessions"
              className={buttonVariants({
                variant: "outline",
                className: "w-full",
              })}
            >
              Session history
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
