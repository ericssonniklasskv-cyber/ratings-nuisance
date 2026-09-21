"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ensureTitle } from "@/lib/data";
import { getTmdbTitle, type MediaType } from "@/lib/tmdb";

export async function setReference(formData: FormData) {
  const score = Number(formData.get("score"));
  const type = String(formData.get("type"));
  const id = Number(formData.get("id"));
  if (!Number.isInteger(score) || score < 2 || score > 10 || (type !== "movie" && type !== "tv") || !Number.isSafeInteger(id) || id <= 0) redirect("/admin/references?error=invalid");
  const { supabase, user } = await requireAdmin();
  const title = await getTmdbTitle(type as MediaType, id);
  if (!title) redirect("/admin/references?error=tmdb");
  let failed = false;
  try {
    const titleId = await ensureTitle(supabase, title);
    const { error } = await supabase.from("reference_titles").upsert({ score, title_id: titleId, updated_by: user!.id, updated_at: new Date().toISOString() }, { onConflict: "score" });
    failed = Boolean(error);
  } catch { failed = true; }
  if (failed) redirect("/admin/references?error=save");
  revalidatePath("/admin/references");
  redirect("/admin/references");
}
