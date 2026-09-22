"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Poster } from "@/components/poster";

type Rating = {
  id: string;
  score: number;
  updatedAt: string;
  title: string;
  mediaType: string;
  tmdbId: number;
  posterPath: string | null;
  releaseYear: number | null;
};

type SortOrder = "highest" | "lowest" | "recent";

function formatScore(score: number) {
  return score < 2 ? String(score) : score.toFixed(1);
}

export function RatingsLibrary({ ratings }: { ratings: Rating[] }) {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("highest");
  const visible = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return ratings.filter((rating) => rating.title.toLocaleLowerCase().includes(search)).sort((a, b) => {
      if (sortOrder === "highest") return b.score - a.score || b.updatedAt.localeCompare(a.updatedAt);
      if (sortOrder === "lowest") return a.score - b.score || b.updatedAt.localeCompare(a.updatedAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [ratings, query, sortOrder]);

  return <section className="my-ratings-library" aria-label="My Ratings">
    <div className="library-heading"><div><h1>My Ratings</h1><p>{ratings.length} {ratings.length === 1 ? "title" : "titles"}</p></div></div>
    <div className="library-controls">
      <label className="library-search"><span className="visually-hidden">Search your ratings</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg><input type="search" placeholder="Search your ratings" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <label className="library-sort"><span className="visually-hidden">Sort ratings</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}><option value="highest">Highest rated</option><option value="lowest">Lowest rated</option><option value="recent">Recently rated</option></select></label>
    </div>
    {visible.length ? <div className="library-grid">
      {visible.map((rating) => <Link className="library-card" href={`/rate/${rating.mediaType}/${rating.tmdbId}`} key={rating.id} aria-label={`${rating.title}, ${rating.releaseYear ?? "year unknown"}, rated ${formatScore(rating.score)}`}>
        <div className="library-art"><Poster path={rating.posterPath} title={rating.title} size="collection" /><strong className="library-score">{formatScore(rating.score)}</strong></div>
        <div className="library-card-copy"><strong className="library-title">{rating.title}</strong><span>{rating.releaseYear ?? "Year unknown"}{rating.mediaType === "tv" ? " · TV" : ""}</span></div>
      </Link>)}
    </div> : <div className="library-no-results"><h2>{query.trim() ? `No ratings match “${query.trim()}”` : "No rated titles found"}</h2><button type="button" className="text-button" onClick={() => setQuery("")}>Clear search</button></div>}
  </section>;
}
