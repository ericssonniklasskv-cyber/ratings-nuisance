"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Poster } from "@/components/poster";

type Entry = {
  id: string; title: string; year: number | null;
  mediaType: string | null; tmdbId: number | null; posterPath: string | null;
  attempted: boolean;
};
type SearchResult = { tmdbId: number; mediaType: "movie" | "tv"; title: string; releaseYear: number | null; posterPath: string | null };

export function ImdbLibrary({ entries, total, page, query, seriesCount, pendingCount }: {
  entries: Entry[]; total: number; page: number; query: string; seriesCount: number; pendingCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState(query);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [matching, setMatching] = useState<Entry | null>(null);
  const [matchQuery, setMatchQuery] = useState("");
  const [matchResults, setMatchResults] = useState<SearchResult[]>([]);
  const matchSearchGeneration = useRef(0);
  const pageCount = Math.max(1, Math.ceil(total / 40));
  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

  function queueUrl(nextPage: number, nextQuery = query) {
    const params = new URLSearchParams({ tab: "to-rate" });
    if (nextQuery) params.set("q", nextQuery);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/my-ratings?${params}`;
  }

  function updateSearch(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => router.replace(queueUrl(1, value.trim())), 350);
  }

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
    const generation = ++matchSearchGeneration.current;
    setError("");
    setMatchResults([]);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(matchQuery.trim())}`);
      const result = await response.json();
      if (generation !== matchSearchGeneration.current) return;
      if (!response.ok) throw new Error(result.error ?? "Search failed.");
      setMatchResults((result.results as SearchResult[]).filter((item) => !matching?.mediaType || item.mediaType === matching.mediaType));
    } catch (cause) {
      if (generation === matchSearchGeneration.current)
        setError(cause instanceof Error ? cause.message : "Search failed. Try again.");
    }
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

  return <section className="imdb-page" aria-label="Imported films to rate">
    <div className="queue-heading"><div><h2>To Rate</h2><p>{total} {total === 1 ? "film" : "films"} in this view · {seriesCount} TV series saved for later</p></div></div>
    <div className="imdb-import-box">
      <p>Export your <a href="https://www.imdb.com/list/ratings/" target="_blank" rel="noreferrer">IMDb ratings</a> as a CSV, then import it here. IMDb scores are ignored; every title needs a new Nuisance rating.</p>
      <label className="button primary imdb-upload">{busy ? "Importing…" : "Choose IMDb CSV"}<input type="file" accept=".csv,text/csv" disabled={busy} onChange={upload} /></label>
      {pendingCount > 0 && !busy && <button className="button" type="button" onClick={retry}>Resume matching ({pendingCount})</button>}
      {progress && <p role="status">{progress}</p>}{error && <p className="error-message" role="alert">{error}</p>}
    </div>
      <div className="imdb-controls"><input type="search" aria-label="Search films to rate" placeholder="Search films to rate" value={search} onChange={(event) => updateSearch(event.target.value)} />
        {query && <Link className="text-button" href="/my-ratings?tab=to-rate">Clear search</Link>}</div>
    {entries.length > 0 && <>
      {matching && <div className="imdb-match-panel"><div className="imdb-match-heading"><h2>Find {matching.title} on TMDb</h2><button className="text-button" onClick={() => { matchSearchGeneration.current++; setMatching(null); setMatchResults([]); }} type="button">Close</button></div>
        <form onSubmit={(event) => { event.preventDefault(); void searchMatch(); }}><input aria-label="Search TMDb" value={matchQuery} onChange={(event) => { matchSearchGeneration.current++; setMatchQuery(event.target.value); setMatchResults([]); }} /><button className="button secondary" type="submit">Search</button></form>
        <div className="imdb-match-results">{matchResults.map((result) => <button key={`${result.mediaType}-${result.tmdbId}`} type="button" disabled={busy} onClick={() => saveMatch(result)}><div><Poster path={result.posterPath} title={result.title} size="list" /></div><span><strong>{result.title}</strong><small>{result.releaseYear ?? ""} · {result.mediaType === "tv" ? "TV" : "Movie"}</small></span></button>)}</div>
      </div>}
      <div className="imdb-grid">{entries.map((entry) => <div key={entry.id} className="imdb-item">
        {entry.tmdbId && (entry.mediaType === "movie" || entry.mediaType === "tv") ? <Link href={`/rate/${entry.mediaType}/${entry.tmdbId}`} aria-label={`Rate ${entry.title}`}>
          <Poster path={entry.posterPath} title={entry.title} size="collection" /><strong>{entry.title}</strong><span>{entry.year ?? ""} · Rate in Nuisance →</span>
        </Link> : <><Poster path={entry.posterPath} title={entry.title} size="collection" /><strong>{entry.title}</strong><span>{entry.year ?? ""} · {entry.attempted ? "No TMDb match" : "Matching pending"}</span>
          {entry.attempted && <button className="text-button imdb-find" type="button" onClick={() => { matchSearchGeneration.current++; setMatching(entry); setMatchQuery(entry.title); setMatchResults([]); setError(""); }}>Find match</button>}</>}
      </div>)}</div>
    </>}
    {!entries.length && <div className="library-no-results"><h2>{query ? `No imported films match “${query}”` : "No films waiting to be rated"}</h2><p>{query ? "Try another title or clear the search." : "Import your IMDb ratings above or find a title to rate."}</p></div>}
    {total > 40 && <nav className="queue-pagination" aria-label="Imported films pages"><span>Page {Math.min(page, pageCount)} of {pageCount}</span>
      <div>{page > 1 && <Link className="button secondary" href={queueUrl(page - 1)}>Previous</Link>}{page < pageCount && <Link className="button secondary" href={queueUrl(page + 1)}>Next</Link>}</div>
    </nav>}
  </section>;
}
