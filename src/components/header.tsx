import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export async function Header() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 p-3">
        <Link href="/" className="font-semibold">
          Tracker
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/exercises" className="hover:underline">
            Exercises
          </Link>
          <Link href="/templates" className="hover:underline">
            Templates
          </Link>
          <Link href="/sessions" className="hover:underline">
            History
          </Link>
          <Link href="/settings" className="hover:underline">
            Settings
          </Link>
          {user && (
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
