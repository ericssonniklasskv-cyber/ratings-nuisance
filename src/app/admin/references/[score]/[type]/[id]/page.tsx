import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Poster } from "@/components/poster";
import { requireAdmin } from "@/lib/auth";
import { getTmdbTitle, type MediaType } from "@/lib/tmdb";
import { setReference } from "@/app/admin/references/actions";

export default async function ConfirmReferencePage({ params }: { params: Promise<{ score: string; type: string; id: string }> }) {
  await requireAdmin();
  const { score: rawScore, type, id: rawId } = await params;
  const score = Number(rawScore), id = Number(rawId);
  if (!Number.isInteger(score) || score < 2 || score > 10 || (type !== "movie" && type !== "tv") || !Number.isSafeInteger(id) || id <= 0) notFound();
  const title = await getTmdbTitle(type as MediaType, id);
  if (!title) return <main className="app-shell"><AppHeader admin /><div className="empty-state"><h1>Titeln kunde inte hämtas</h1><p>Kontrollera TMDb-nyckeln eller försök igen senare.</p></div></main>;
  return <main className="app-shell"><AppHeader admin /><Link className="back-link" href={`/admin/references/select?score=${score}`}>← Tillbaka till sökning</Link><div className="detail-layout"><div className="detail-poster"><Poster path={title.posterPath} title={title.title} priority /></div><div className="detail-main"><p className="kicker">REFERENS {score}</p><h1>{title.title}</h1><p className="muted">{title.releaseYear ?? "År okänt"} · {type === "movie" ? "Film" : "TV"} · TMDb #{id}</p><p>Vill du använda den här titeln som gruppens referens för betyg {score}?</p><form action={setReference}><input type="hidden" name="score" value={score} /><input type="hidden" name="type" value={type} /><input type="hidden" name="id" value={id} /><button className="button primary">Spara referens</button></form></div></div></main>;
}
