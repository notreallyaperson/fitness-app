"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, History, House, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { isImmersiveRoute } from "@/lib/is-immersive";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/exercises", label: "Library", icon: Dumbbell },
  { href: "/sessions", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Ledger bottom navigation — a custom fixed bar (NOT shadcn Tabs).
 * Four icon+label slots with a center primary "Start" action that lifts above
 * the bar. Hidden on immersive screens (e.g. live session) by not rendering it.
 */
export function BottomNav() {
  const pathname = usePathname();
  // Hide on immersive (live session) and unauthenticated/auth screens.
  if (
    isImmersiveRoute(pathname) ||
    pathname === "/login" ||
    pathname.startsWith("/auth")
  )
    return null;
  const [first, second, third, fourth] = items;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid h-16 max-w-2xl grid-cols-5 items-center px-2">
        <NavSlot pathname={pathname} {...first} />
        <NavSlot pathname={pathname} {...second} />
        <div className="flex justify-center">
          <Link
            href="/sessions/start"
            aria-label="Start session"
            className="-mt-8 flex size-[52px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-cta transition-transform duration-[120ms] ease-tap active:scale-[0.95]"
          >
            <Plus className="size-6" strokeWidth={2.2} />
          </Link>
        </div>
        <NavSlot pathname={pathname} {...third} />
        <NavSlot pathname={pathname} {...fourth} />
      </div>
    </nav>
  );
}

function NavSlot({
  pathname,
  href,
  label,
  icon: Icon,
}: {
  pathname: string;
  href: string;
  label: string;
  icon: typeof House;
}) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1 transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-[23px]" strokeWidth={active ? 2.1 : 1.85} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}
