"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { ensureTitle } from "@/lib/data";
import { getTmdbTitle, type MediaType } from "@/lib/tmdb";

export async function saveRating(_state: { message: string; saved: boolean }, formData: FormData) {
  const type = String(formData.get("type"));
  const id = Number(formData.get("id"));
  const rawScore = String(formData.get("score") || "").trim();
  if ((type !== "movie" && type !== "tv") || !Number.isSafeInteger(id) || id <= 0)
    return { message: "Ogiltig titel.", saved: false };
  if (!/^(?:0|1|(?:[2-9]|10)(?:\.[0-9])?)$/.test(rawScore))
    return { message: "Använd 0, 1 eller ett betyg från 2.0 till 10.0 med högst en decimal.", saved: false };
  const score = Number(rawScore);
  if (score > 10) return { message: "Betyget får högst vara 10.", saved: false };
  const { supabase, user } = await requireMember();
  const title = await getTmdbTitle(type as MediaType, id);
  if (!title) return { message: "Kunde inte hämta titeln från TMDb.", saved: false };
  try {
    const titleId = await ensureTitle(supabase, title);
    const { error } = await supabase.from("ratings").upsert({
      user_id: user!.id, title_id: titleId, score, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,title_id" });
    if (error) throw error;
    revalidatePath(`/rate/${type}/${id}`);
    revalidatePath("/my-ratings");
    return { message: "Betyget är sparat.", saved: true };
  } catch {
    return { message: "Kunde inte spara betyget. Försök igen.", saved: false };
  }
}

export async function deleteRating(formData: FormData) {
  const ratingId = String(formData.get("ratingId") || "");
  const { supabase, user } = await requireMember();
  await supabase.from("ratings").delete().eq("id", ratingId).eq("user_id", user!.id);
  revalidatePath("/my-ratings");
}
