import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Poster } from "@/components/poster";
import { requireAdmin } from "@/lib/auth";

export default async function ReferencesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireAdmin();
  const { data: references, error: loadError } = await supabase.from("reference_titles")
    .select("score, titles(title, media_type, tmdb_id, poster_path, release_year)")
    .order("score");
  const byScore = new Map(references?.map((reference) => [reference.score, reference.titles]) || []);
  const error = (await searchParams).error;
  return <main className="app-shell">
    <AppHeader admin />
    <div className="page-heading"><p className="kicker">ADMIN</p><h1>References</h1><p className="muted">One title for each whole-number rating from 2 to 10.</p></div>
    {error && <p className="error-message">Could not save the reference. It may already be used for another rating.</p>}
    {loadError ? <p role="alert" className="error-message">Could not load references. Try again later.</p> : <div className="reference-grid">{Array.from({ length: 9 }, (_, i) => i + 2).map((score) => {
      const title = byScore.get(score);
      return <div className="reference-card" key={score}>
        <span className="reference-score">{score}</span>
        {title ? <div className="reference-title"><div className="reference-poster"><Poster path={title.poster_path} title={title.title} size="reference" /></div><div><strong>{title.title}</strong><small>{title.release_year ?? "Year unknown"} · {title.media_type === "movie" ? "Movie" : "TV"}</small></div></div> : <p className="muted">No reference selected</p>}
        <Link href={`/admin/references/select?score=${score}`} className="text-button">{title ? "Change title" : "Choose title"} →</Link>
      </div>;
    })}</div>}
  </main>;
}
