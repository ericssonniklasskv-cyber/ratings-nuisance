import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireMember } from "@/lib/auth";
import { getTmdbTitle, type MediaType } from "@/lib/tmdb";
import type { RatingReference } from "@/app/rate/rate-form";
import { TitleDetail } from "./title-detail";

export default async function TitlePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id: rawId } = await params;
  const id = Number(rawId);
  if ((type !== "movie" && type !== "tv") || !Number.isSafeInteger(id) || id <= 0) notFound();
  const { supabase, user, profile } = await requireMember();
  const [item, { data: stored, error: storedError }, { data: references, error: referencesError }] = await Promise.all([
    getTmdbTitle(type as MediaType, id),
    supabase.from("titles").select("id").eq("media_type", type).eq("tmdb_id", id).maybeSingle(),
    supabase.from("reference_titles").select("score, titles(title, poster_path, media_type, tmdb_id)").order("score"),
  ]);
  if (!item) return <main className="app-shell"><AppHeader admin={profile?.is_admin ?? false} /><div className="empty-state"><h1>Title unavailable</h1><p>Try again in a moment.</p><Link href="/rate">Back to search →</Link></div></main>;

  const [{ data: ratings, error: ratingsError }, { data: officialRating, error: officialError }] = await Promise.all([
    stored && !storedError ? supabase.from("ratings").select("id, user_id, score, updated_at, profiles(display_name)").eq("title_id", stored.id).order("updated_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    stored && !storedError ? supabase.from("official_group_ratings").select("score, rating_count").eq("title_id", stored.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const ratingsUnavailable = Boolean(storedError || ratingsError);
  const groupUnavailable = Boolean(storedError || officialError);
  const myRating = ratings?.find((rating) => rating.user_id === user!.id);
  const comparisonReferences: RatingReference[] = (references ?? [])
    .filter((reference) => reference.titles && !(reference.titles.media_type === type && reference.titles.tmdb_id === id))
    .map((reference) => ({ score: reference.score, title: reference.titles!.title, posterPath: reference.titles!.poster_path }));
  const memberRatings = (ratings ?? []).map((rating) => ({
    id: rating.id,
    displayName: rating.profiles?.display_name || "Member",
    isOwn: rating.user_id === user!.id,
    score: Number(rating.score),
  }));

  return <main className="app-shell">
    <AppHeader admin={profile?.is_admin ?? false} />
    <TitleDetail
      title={item}
      current={myRating ? Number(myRating.score) : null}
      officialRating={officialRating ? { score: Number(officialRating.score), rating_count: officialRating.rating_count ?? 0 } : null}
      ratings={memberRatings}
      references={comparisonReferences}
      ratingsUnavailable={ratingsUnavailable}
      groupUnavailable={groupUnavailable}
      referencesUnavailable={Boolean(referencesError)}
    />
  </main>;
}
