"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

const Email = z.string().email();

export interface MagicLinkState {
  error?: string;
  sent?: boolean;
}

export async function sendMagicLink(
  _prev: MagicLinkState | null,
  formData: FormData,
): Promise<MagicLinkState> {
  const parsed = Email.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email." };

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  return { sent: true };
}

export async function signOut() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
