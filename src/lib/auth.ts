import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getViewer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, is_active, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, user, profile };
}

export async function requireMember() {
  const viewer = await getViewer();
  if (!viewer.user || !viewer.profile?.is_active) redirect("/");
  return viewer;
}

export async function requireAdmin() {
  const viewer = await requireMember();
  if (!viewer.profile?.is_admin) redirect("/");
  return viewer;
}
