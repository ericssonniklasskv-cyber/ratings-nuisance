import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Poster } from "@/components/poster";
import { requireMember } from "@/lib/auth";
import { getTmdbTitle, type MediaType } from "@/lib/tmdb";
import { RateForm } from "@/app/rate/rate-form";

export default async function TitlePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id: rawId } = await params;
  const id = Number(rawId);
  if ((type !== "movie" && type !== "tv") || !Number.isSafeInteger(id) || id <= 0) notFound();
  const { supabase, user, profile } = await requireMember();
  const item = await getTmdbTitle(type as MediaType, id);
  if (!item) return <main className="app-shell"><AppHeader admin={profile!.is_admin} /><div className="empty-state"><h1>Titeln kunde inte hämtas</h1><p>Kontrollera TMDb-nyckeln eller försök igen senare.</p><Link href="/rate">Tillbaka till sökningen →</Link></div></main>;

  const { data: stored } = await supabase.from("titles").select("id").eq("media_type", type).eq("tmdb_id", id).maybeSingle();
  const [{ data: ratings }, { data: reference }] = await Promise.all([
    stored ? supabase.from("ratings").select("id, user_id, score, updated_at, profiles(display_name)").eq("title_id", stored.id).order("updated_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabase.from("reference_titles").select("score, titles(title, media_type, tmdb_id)").eq("score", 5).maybeSingle(),
  ]);
  const myRating = ratings?.find((rating) => rating.user_id === user!.id);
  return <main className="app-shell">
    <AppHeader admin={profile!.is_admin} />
    <Link className="back-link" href="/rate">← Tillbaka till sökning</Link>
    <div className="detail-layout">
      <div className="detail-poster"><Poster path={item.posterPath} title={item.title} priority /></div>
      <div className="detail-main">
        <p className="kicker">{type === "movie" ? "FILM" : "TV-SERIE"} · {item.releaseYear ?? "ÅR OKÄNT"} · TMDb #{id}</p>
        <h1>{item.title}</h1>
        {reference?.titles && <p className="reference-note">Referens för 5: <Link href={`/rate/${reference.titles.media_type}/${reference.titles.tmdb_id}`}>{reference.titles.title}</Link></p>}
        <RateForm type={type as MediaType} id={id} current={myRating ? Number(myRating.score) : null} />
        <section className="group-ratings"><h2>Gruppens betyg</h2>{ratings?.length ? <div className="group-list">{ratings.map((rating) => <div className="group-row" key={rating.id}><span>{rating.profiles?.display_name || "Medlem"}{rating.user_id === user!.id ? " (du)" : ""}</span><strong>{Number(rating.score).toFixed(1)}</strong></div>)}</div> : <p className="muted">Ingen har betygsatt titeln ännu.</p>}</section>
      </div>
    </div>
  </main>;
}
