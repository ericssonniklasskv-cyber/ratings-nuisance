"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Poster } from "./poster";
import type { TmdbTitle } from "@/lib/tmdb";

export function TitleSearch({ mode = "rate", referenceScore }: { mode?: "rate" | "reference"; referenceScore?: number }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Sökningen misslyckades.");
        setResults(data.results);
        setMessage(data.results.length ? "" : "Inga titlar hittades.");
      } catch (error) {
        if (!controller.signal.aborted) { setResults([]); setMessage(error instanceof Error ? error.message : "Sökningen misslyckades."); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  return <div className="search-block">
    <label className="search-label" htmlFor="title-search">Sök film eller TV-serie</label>
    <input id="title-search" className="search-input" value={query} onChange={(event) => { const value = event.target.value; setQuery(value); if (value.trim().length < 2) { setResults([]); setMessage(""); setLoading(false); } }} placeholder="Sök efter en titel…" autoComplete="off" />
    <div className="search-meta" aria-live="polite">{loading ? "Söker…" : message || (query.length < 2 ? "Skriv minst två tecken." : `${results.length} titlar`)}</div>
    <div className="results-grid">
      {results.map((item) => {
        const href = mode === "reference"
          ? `/admin/references/${referenceScore}/${item.mediaType}/${item.tmdbId}`
          : `/rate/${item.mediaType}/${item.tmdbId}`;
        return <Link key={`${item.mediaType}-${item.tmdbId}`} className="result-card" href={href}>
          <Poster path={item.posterPath} title={item.title} />
          <div className="result-copy"><strong>{item.title}</strong><span>{item.releaseYear ?? "År okänt"} · {item.mediaType === "movie" ? "Film" : "TV"}</span><small>TMDb #{item.tmdbId}</small></div>
        </Link>;
      })}
    </div>
  </div>;
}
