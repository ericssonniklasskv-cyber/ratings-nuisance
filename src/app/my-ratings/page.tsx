import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Poster } from "@/components/poster";
import { requireMember } from "@/lib/auth";
import { deleteRating } from "@/app/rate/actions";

export default async function MyRatingsPage() {
  const { supabase, user, profile } = await requireMember();
  const { data: ratings, error } = await supabase.from("ratings")
    .select("id, score, updated_at, titles(title, media_type, tmdb_id, poster_path, release_year)")
    .eq("user_id", user!.id).order("updated_at", { ascending: false });

  return <main className="app-shell">
    <AppHeader admin={profile!.is_admin} />
    <div className="page-heading"><p className="kicker">02 / YOUR COLLECTION</p><h1>My Ratings</h1><p className="muted">Dina betyg, senast uppdaterade först.</p></div>
    {error ? <p className="error-message">Kunde inte läsa dina betyg.</p> : ratings?.length ? <div className="rating-list">
      {ratings.map((rating) => rating.titles && <article className="rating-item" key={rating.id}>
        <Link className="rating-item-main" href={`/rate/${rating.titles.media_type}/${rating.titles.tmdb_id}`}>
          <div className="list-poster"><Poster path={rating.titles.poster_path} title={rating.titles.title} /></div>
          <div><strong>{rating.titles.title}</strong><span>{rating.titles.release_year ?? "År okänt"} · {rating.titles.media_type === "movie" ? "Film" : "TV"}</span><small>TMDb #{rating.titles.tmdb_id}</small></div>
        </Link>
        <div className="rating-item-end"><strong className="score-pill">{Number(rating.score).toFixed(1)}</strong><form action={deleteRating}><input type="hidden" name="ratingId" value={rating.id} /><button className="text-button danger" aria-label={`Ta bort betyg för ${rating.titles.title}`}>Ta bort</button></form></div>
      </article>)}
    </div> : <div className="empty-state"><h2>Inga betyg än</h2><p>Din lista fylls när du börjar sätta betyg.</p><Link className="button primary" href="/rate">Hitta en titel</Link></div>}
  </main>;
}
