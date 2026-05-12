import "server-only";
import { requireUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/domain";

export async function getMyProfile(): Promise<Profile> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(patch: Partial<Profile>): Promise<Profile> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
