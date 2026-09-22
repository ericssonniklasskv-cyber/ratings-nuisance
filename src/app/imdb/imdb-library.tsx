"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { Poster } from "@/components/poster";

type Entry = {
  id: string; imdbId: string; title: string; year: number | null;
  mediaType: string | null; tmdbId: number | null; posterPath: string | null;
  attempted: boolean; rated: boolean;
};
type SearchResult = { tmdbId: number; mediaType: "movie" | "tv"; title: string; releaseYear: number | null; posterPath: string | null };

export function ImdbLibrary({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showRated, setShowRated] = useState(false);
  const [matching, setMatching] = useState<Entry | null>(null);
  const [matchQuery, setMatchQuery] = useState("");
  const [matchResults, setMatchResults] = useState<SearchResult[]>([]);
  const movies = entries.filter((entry) => entry.mediaType !== "tv");
  const series = entries.filter((entry) => entry.mediaType === "tv");
  const todo = movies.filter((entry) => !entry.rated).length;
  const shown = movies.filter((entry) => (showRated || !entry.rated) && entry.title.toLowerCase().includes(query.toLowerCase()));

  async function matchPending() {
    let processed = 0;
    while (true) {
      const response = await fetch("/api/imdb/resolve", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not match titles.");
      processed += result.processed;
      setProgress(`Matching titles with TMDb… ${processed} checked`);
      if (!result.remaining || result.processed === 0) break;
    }
    router.refresh();
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(""); setProgress("Importing IMDb titles…");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch("/api/imdb/import", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Import failed.");
      setProgress(`${result.imported} titles saved. Matching with TMDb…`);
      await matchPending();
      setProgress("Import complete. Ratings in Nuisance are unchanged.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed.");
      router.refresh();
    } finally { setBusy(false); event.target.value = ""; }
  }

  async function retry() {
    setBusy(true); setError("");
    try { await matchPending(); setProgress("Matching complete."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not match titles."); }
    finally { setBusy(false); }
  }

  async function searchMatch() {
    if (matchQuery.trim().length < 2) return;
    setError("");
    const response = await fetch(`/api/search?q=${encodeURIComponent(matchQuery.trim())}`);
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "Search failed."); return; }
    setMatchResults((result.results as SearchResult[]).filter((item) => !matching?.mediaType || item.mediaType === matching.mediaType));
  }

  async function saveMatch(result: SearchResult) {
    if (!matching) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/imdb/link", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importId: matching.id, mediaType: result.mediaType, tmdbId: result.tmdbId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not save match.");
      setMatching(null); setMatchResults([]); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save match."); }
    finally { setBusy(false); }
  }

  return <div className="imdb-page">
    <div className="page-heading"><p className="kicker">YOUR WATCH HISTORY</p><h1>From IMDb</h1>
      <p>{todo} films to rate · {series.length} series saved for later</p></div>
    <div className="imdb-import-box">
      <p>Export your <a href="https://www.imdb.com/list/ratings/" target="_blank" rel="noreferrer">IMDb ratings</a> as a CSV, then import it here. IMDb scores are ignored; every title needs a new Nuisance rating.</p>
      <label className="button primary imdb-upload">{busy ? "Importing…" : "Choose IMDb CSV"}<input type="file" accept=".csv,text/csv" disabled={busy} onChange={upload} /></label>
      {entries.some((entry) => !entry.attempted) && !busy && <button className="button" type="button" onClick={retry}>Resume matching</button>}
      {progress && <p role="status">{progress}</p>}{error && <p className="error-message" role="alert">{error}</p>}
    </div>
    {entries.length > 0 && <>
      <div className="imdb-controls"><input aria-label="Search imported titles" placeholder="Search imported titles" value={query} onChange={(event) => setQuery(event.target.value)} />
        <label><input type="checkbox" checked={showRated} onChange={(event) => setShowRated(event.target.checked)} /> Show rated</label></div>
      {matching && <div className="imdb-match-panel"><div className="imdb-match-heading"><h2>Find {matching.title} on TMDb</h2><button className="text-button" onClick={() => { setMatching(null); setMatchResults([]); }} type="button">Close</button></div>
        <form onSubmit={(event) => { event.preventDefault(); void searchMatch(); }}><input aria-label="Search TMDb" value={matchQuery} onChange={(event) => setMatchQuery(event.target.value)} /><button className="button secondary" type="submit">Search</button></form>
        <div className="imdb-match-results">{matchResults.map((result) => <button key={`${result.mediaType}-${result.tmdbId}`} type="button" disabled={busy} onClick={() => saveMatch(result)}><div><Poster path={result.posterPath} title={result.title} size="list" /></div><span><strong>{result.title}</strong><small>{result.releaseYear ?? ""} · {result.mediaType === "tv" ? "TV" : "Movie"}</small></span></button>)}</div>
      </div>}
      <div className="imdb-grid">{shown.map((entry) => <div key={entry.id} className="imdb-item">
        {entry.tmdbId && (entry.mediaType === "movie" || entry.mediaType === "tv") ? <Link href={`/rate/${entry.mediaType}/${entry.tmdbId}`} aria-label={`Rate ${entry.title}`}>
          <Poster path={entry.posterPath} title={entry.title} size="collection" /><strong>{entry.title}</strong><span>{entry.year ?? ""} · {entry.rated ? "Rated" : "Rate in Nuisance →"}</span>
        </Link> : <><Poster path={entry.posterPath} title={entry.title} size="collection" /><strong>{entry.title}</strong><span>{entry.year ?? ""} · {entry.attempted ? "No TMDb match" : "Matching pending"}</span>
          {entry.attempted && <button className="text-button imdb-find" type="button" onClick={() => { setMatching(entry); setMatchQuery(entry.title); setMatchResults([]); }}>Find match</button>}</>}
      </div>)}</div>
      {!shown.length && <p className="empty-state">No titles match this view.</p>}
      {series.length > 0 && <details className="imdb-series"><summary>TV series saved for later ({series.length})</summary>
        <ul>{series.map((entry) => <li key={entry.id}>{entry.title}{entry.year ? ` (${entry.year})` : ""}</li>)}</ul>
      </details>}
    </>}
  </div>;
}
