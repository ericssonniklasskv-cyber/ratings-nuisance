import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Poster } from "@/components/poster";
import { requireAdmin } from "@/lib/auth";

export default async function ReferencesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireAdmin();
  const { data: references } = await supabase.from("reference_titles")
    .select("score, titles(title, media_type, tmdb_id, poster_path, release_year)")
    .order("score");
  const byScore = new Map(references?.map((reference) => [reference.score, reference.titles]) || []);
  const error = (await searchParams).error;
  return <main className="app-shell">
    <AppHeader admin />
    <div className="page-heading"><p className="kicker">ADMINISTRATION</p><h1>Referenstitlar</h1><p className="muted">En titel för varje heltalsbetyg från 2 till 10. Dessa hjälper senare i jämförelseflödet.</p></div>
    {error && <p className="error-message">Kunde inte spara referensen. Titeln kanske redan används för ett annat betyg.</p>}
    <div className="reference-grid">{Array.from({ length: 9 }, (_, i) => i + 2).map((score) => {
      const title = byScore.get(score);
      return <div className="reference-card" key={score}>
        <span className="reference-score">{score}</span>
        {title ? <div className="reference-title"><div className="reference-poster"><Poster path={title.poster_path} title={title.title} /></div><div><strong>{title.title}</strong><small>{title.release_year ?? "År okänt"} · {title.media_type === "movie" ? "Film" : "TV"}</small></div></div> : <p className="muted">Ingen referens vald</p>}
        <Link href={`/admin/references/select?score=${score}`} className="text-button">{title ? "Byt titel" : "Välj titel"} →</Link>
      </div>;
    })}</div>
  </main>;
}
