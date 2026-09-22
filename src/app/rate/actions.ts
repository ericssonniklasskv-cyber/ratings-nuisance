"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { ensureTitle } from "@/lib/data";
import { getTmdbTitle, type MediaType } from "@/lib/tmdb";

type SaveState = { message: string; saved: boolean; score: number | null; group: { score: number; rating_count: number } | null };
const saveError = (message: string): SaveState => ({ message, saved: false, score: null, group: null });

export async function saveRating(_state: SaveState, formData: FormData): Promise<SaveState> {
  const type = String(formData.get("type"));
  const id = Number(formData.get("id"));
  const rawScore = String(formData.get("score") || "").trim();
  if ((type !== "movie" && type !== "tv") || !Number.isSafeInteger(id) || id <= 0)
    return saveError("Invalid title.");
  if (!/^(?:0|1|(?:[2-9]|10)(?:\.[0-9])?)$/.test(rawScore))
    return saveError("Use 0, 1 or a score from 2.0 to 10.0 with one decimal.");
  const score = Number(rawScore);
  if (score > 10) return saveError("The highest rating is 10.");
  const { supabase, user } = await requireMember();
  try {
    const { data: stored, error: lookupError } = await supabase.from("titles").select("id").eq("media_type", type).eq("tmdb_id", id).maybeSingle();
    if (lookupError) throw lookupError;
    let titleId = stored?.id;
    if (!titleId) {
      const title = await getTmdbTitle(type as MediaType, id);
      if (!title) return saveError("Could not load this title from TMDb.");
      titleId = await ensureTitle(supabase, title);
    }
    const { error } = await supabase.from("ratings").upsert({
      user_id: user!.id, title_id: titleId, score, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,title_id" });
    if (error) throw error;
    const { data: group } = await supabase.from("official_group_ratings").select("score, rating_count").eq("title_id", titleId).maybeSingle();
    revalidatePath(`/rate/${type}/${id}`);
    revalidatePath("/my-ratings");
    return { message: "Rating saved.", saved: true, score, group: group ? { score: Number(group.score), rating_count: group.rating_count ?? 0 } : null };
  } catch {
    return saveError("Could not save your rating. Try again.");
  }
}

export async function deleteRating(_state: { error: string }, formData: FormData) {
  const ratingId = String(formData.get("ratingId") || "");
  const { supabase, user } = await requireMember();
  const { error } = await supabase.from("ratings").delete().eq("id", ratingId).eq("user_id", user!.id);
  if (error) return { error: "Could not delete your rating. Try again." };
  revalidatePath("/my-ratings");
  return { error: "" };
}
