import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireMember } from "@/lib/auth";
import { RatingsLibrary } from "./ratings-library";

export default async function MyRatingsPage() {
  const { supabase, user, profile } = await requireMember();
  const { data: ratings, error } = await supabase.from("ratings")
    .select("id, score, updated_at, titles(title, media_type, tmdb_id, poster_path, release_year)")
    .eq("user_id", user!.id).order("updated_at", { ascending: false });

  const collection = (ratings ?? []).flatMap((rating) => rating.titles ? [{
    id: rating.id,
    score: Number(rating.score),
    updatedAt: rating.updated_at,
    title: rating.titles.title,
    mediaType: rating.titles.media_type,
    tmdbId: rating.titles.tmdb_id,
    posterPath: rating.titles.poster_path,
    releaseYear: rating.titles.release_year,
  }] : []);

  return <main className="app-shell">
    <AppHeader admin={profile?.is_admin ?? false} />
    {error ? <div className="my-ratings-empty"><h1>My Ratings</h1><p className="error-message">Could not load your ratings.</p></div>
      : collection.length ? <RatingsLibrary ratings={collection} />
        : <div className="my-ratings-empty"><h1>My Ratings</h1><h2>No ratings yet</h2><Link className="button primary" href="/rate">Rate something</Link></div>}
  </main>;
}
