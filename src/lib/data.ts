import type { SupabaseClient } from "@supabase/supabase-js";
import type { TmdbTitle } from "./tmdb";
import type { Database } from "./supabase/database.types";

export async function ensureTitle(supabase: SupabaseClient<Database>, item: TmdbTitle) {
  const { error: insertError } = await supabase.from("titles").upsert({
    media_type: item.mediaType,
    tmdb_id: item.tmdbId,
    title: item.title,
    poster_path: item.posterPath,
    release_year: item.releaseYear,
  }, { onConflict: "media_type,tmdb_id", ignoreDuplicates: true });
  if (insertError) throw new Error("Kunde inte spara titeln.");
  const { data, error } = await supabase.from("titles")
    .select("id").eq("media_type", item.mediaType).eq("tmdb_id", item.tmdbId).single();
  if (error || !data) throw new Error("Kunde inte läsa titeln.");
  return data.id as string;
}
