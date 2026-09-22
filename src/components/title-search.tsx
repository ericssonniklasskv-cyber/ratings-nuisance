"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Poster } from "./poster";
import type { TmdbTitle } from "@/lib/tmdb";

const searchCache = new Map<string, { results: TmdbTitle[]; expiresAt: number }>();
function cachedResults(term: string) {
  const key = term.toLocaleLowerCase();
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) { searchCache.delete(key); return null; }
  return entry.results;
}

export function TitleSearch({ mode = "rate", referenceScore }: { mode?: "rate" | "reference"; referenceScore?: number }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resultQuery, setResultQuery] = useState("");
  const normalizedQuery = query.trim();
  const visibleResults = resultQuery === normalizedQuery ? results : [];

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const cached = cachedResults(term);
    if (cached) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Sökningen misslyckades.");
        searchCache.set(term.toLocaleLowerCase(), { results: data.results, expiresAt: Date.now() + 60_000 });
        if (searchCache.size > 20) searchCache.delete(searchCache.keys().next().value!);
        setResults(data.results);
        setResultQuery(term);
        setMessage(data.results.length ? "" : "No titles found.");
      } catch (error) {
        if (!controller.signal.aborted) { setResults([]); setMessage(error instanceof Error ? error.message : "Search failed."); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  return <div className="search-block">
    <label className="search-label" htmlFor="title-search">Movie or TV show</label>
    <input id="title-search" className="search-input" value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setMessage(""); const term = value.trim(); if (term.length < 2) { setResults([]); setLoading(false); } else { const cached = cachedResults(term); if (cached) { setResults(cached); setResultQuery(term); setLoading(false); } else setLoading(true); } }} placeholder="Search titles…" autoComplete="off" />
    <div className="search-meta" aria-live="polite">{loading ? "Searching…" : message || (normalizedQuery.length < 2 ? "Search movies and TV shows" : resultQuery === normalizedQuery ? `${visibleResults.length} titles` : "Searching…")}</div>
    <div className="results-grid">
      {loading && <div className="search-skeleton" aria-hidden="true">{[1, 2, 3].map((item) => <div className="result-skeleton" key={item}><span /><i /></div>)}</div>}
      {!loading && visibleResults.map((item) => {
        const href = mode === "reference"
          ? `/admin/references/${referenceScore}/${item.mediaType}/${item.tmdbId}`
          : `/rate/${item.mediaType}/${item.tmdbId}`;
        return <Link key={`${item.mediaType}-${item.tmdbId}`} className="result-card" href={href}>
          <Poster path={item.posterPath} title={item.title} size="search" />
          <div className="result-copy"><strong>{item.title}</strong><span>{item.releaseYear ?? "Year unknown"} · {item.mediaType === "movie" ? "Movie" : "TV"}</span></div>
        </Link>;
      })}
    </div>
  </div>;
}
