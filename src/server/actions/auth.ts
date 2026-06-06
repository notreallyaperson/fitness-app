"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { OtpTokenSchema } from "@/lib/validation";

const Email = z.string().email();

export interface AuthState {
  error?: string;
}

/**
 * Send a login email. The email contains a magic link (for desktop) and — once
 * the Supabase template includes {{ .Token }} — a 6-digit code to enter directly
 * in the app. The code path is what works inside the iOS home-screen PWA, which
 * the Safari-opened magic link can't log in.
 */
export async function requestOtp(emailRaw: string): Promise<AuthState> {
  const parsed = Email.safeParse(emailRaw);
  if (!parsed.success) return { error: "Enter a valid email." };

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  return {};
}

/** Verify the 6-digit code; on success the session cookie is set here. */
export async function verifyEmailOtp(
  emailRaw: string,
  tokenRaw: string,
): Promise<AuthState> {
  const email = Email.safeParse(emailRaw);
  const token = OtpTokenSchema.safeParse(tokenRaw);
  if (!email.success) return { error: "Enter a valid email." };
  if (!token.success) return { error: "Enter the 6-digit code." };

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.verifyOtp({
    email: email.data,
    token: token.data,
    type: "email",
  });
  if (error) return { error: "Invalid or expired code. Try again." };

  redirect("/");
}

export async function signOut() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
