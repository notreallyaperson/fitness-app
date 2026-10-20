import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { appUrl } from "@/lib/app-url";
import { publicEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const destination = appUrl(publicEnv.NEXT_PUBLIC_APP_URL, "/");
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await getSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(destination);
}
