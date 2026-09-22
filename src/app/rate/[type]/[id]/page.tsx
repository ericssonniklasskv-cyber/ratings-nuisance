import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireMember } from "@/lib/auth";
import { getTmdbTitle, type MediaType } from "@/lib/tmdb";
import { RateForm, type RatingReference } from "@/app/rate/rate-form";

export default async function TitlePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id: rawId } = await params;
  const id = Number(rawId);
  if ((type !== "movie" && type !== "tv") || !Number.isSafeInteger(id) || id <= 0) notFound();
  const { supabase, user, profile } = await requireMember();
  const [item, { data: stored }, { data: references }] = await Promise.all([
    getTmdbTitle(type as MediaType, id),
    supabase.from("titles").select("id").eq("media_type", type).eq("tmdb_id", id).maybeSingle(),
    supabase.from("reference_titles").select("score, titles(title, poster_path, media_type, tmdb_id)").order("score"),
  ]);
  if (!item) return <main className="app-shell"><AppHeader admin={profile?.is_admin ?? false} /><div className="empty-state"><h1>Title unavailable</h1><p>Try again in a moment.</p><Link href="/rate">Back to search →</Link></div></main>;
  const [{ data: ratings }, { data: officialRating }] = await Promise.all([
    stored ? supabase.from("ratings").select("id, user_id, score, updated_at, profiles(display_name)").eq("title_id", stored.id).order("updated_at", { ascending: false }) : Promise.resolve({ data: [] }),
    stored ? supabase.from("official_group_ratings").select("score, rating_count").eq("title_id", stored.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const myRating = ratings?.find((rating) => rating.user_id === user!.id);
  const comparisonReferences: RatingReference[] = (references ?? [])
    .filter((reference) => reference.titles && !(reference.titles.media_type === type && reference.titles.tmdb_id === id))
    .map((reference) => ({ score: reference.score, title: reference.titles!.title, posterPath: reference.titles!.poster_path }));
  return <main className="app-shell">
    <AppHeader admin={profile?.is_admin ?? false} />
    <Link className="back-link" href="/rate">← Back to search</Link>
    <RateForm title={item} current={myRating ? Number(myRating.score) : null} references={comparisonReferences} officialRating={officialRating ? { score: Number(officialRating.score), rating_count: officialRating.rating_count ?? 0 } : null} />
    <section className="group-ratings"><h2>Group rating</h2>{officialRating ? <p className="official-rating"><strong>{Number(officialRating.score).toFixed(1)}</strong><span>{officialRating.rating_count} trusted ratings</span></p> : <p className="muted">No group rating yet</p>}<h3>All ratings</h3>{ratings?.length ? <div className="group-list">{ratings.map((rating) => <div className="group-row" key={rating.id}><span>{rating.profiles?.display_name || "Member"}{rating.user_id === user!.id ? " (you)" : ""}</span><strong>{Number(rating.score) < 2 ? Number(rating.score) : Number(rating.score).toFixed(1)}</strong></div>)}</div> : <p className="muted">Nobody has rated this title yet.</p>}</section>
  </main>;
}
