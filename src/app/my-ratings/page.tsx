import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Poster } from "@/components/poster";
import { DeleteRatingButton } from "@/components/delete-rating-button";
import { requireMember } from "@/lib/auth";

export default async function MyRatingsPage() {
  const { supabase, user, profile } = await requireMember();
  const { data: ratings, error } = await supabase.from("ratings")
    .select("id, score, updated_at, titles(title, media_type, tmdb_id, poster_path, release_year)")
    .eq("user_id", user!.id).order("updated_at", { ascending: false });

  return <main className="app-shell">
    <AppHeader admin={profile?.is_admin ?? false} />
    <div className="page-heading"><p className="kicker">YOUR COLLECTION</p><h1>My Ratings</h1><p className="muted">Most recently rated first</p></div>
    {error ? <p className="error-message">Could not load your ratings.</p> : ratings?.length ? <div className="rating-list">
      {ratings.map((rating) => rating.titles && <article className="rating-item" key={rating.id}>
        <Link className="rating-item-main" href={`/rate/${rating.titles.media_type}/${rating.titles.tmdb_id}`}>
          <div className="list-poster"><Poster path={rating.titles.poster_path} title={rating.titles.title} size="list" /></div>
          <div><strong>{rating.titles.title}</strong><span>{rating.titles.release_year ?? "Year unknown"} · {rating.titles.media_type === "movie" ? "Movie" : "TV"}</span></div>
        </Link>
        <div className="rating-item-end"><strong className="score-pill" aria-label={`Your rating ${Number(rating.score).toFixed(1)}`}>{Number(rating.score).toFixed(1)}</strong><DeleteRatingButton id={rating.id} title={rating.titles.title} /></div>
      </article>)}
    </div> : <div className="empty-state"><h2>No ratings yet</h2><p>Your collection starts with one film or show.</p><Link className="button primary" href="/rate">Find a title</Link></div>}
  </main>;
}
