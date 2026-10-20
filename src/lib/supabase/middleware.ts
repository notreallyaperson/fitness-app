import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";
import { publicEnv } from "@/lib/env";
import { appUrl } from "@/lib/app-url";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const url = request.nextUrl.pathname;

  if (!user && !PUBLIC_PATHS.some((p) => url.startsWith(p))) {
    return NextResponse.redirect(appUrl(publicEnv.NEXT_PUBLIC_APP_URL, "/login"));
  }
  return response;
}
