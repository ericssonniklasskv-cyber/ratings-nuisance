"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Poster } from "@/components/poster";
import { RateForm, type RatingReference } from "@/app/rate/rate-form";
import type { TmdbTitle } from "@/lib/tmdb";

type GroupRating = { score: number; rating_count: number } | null;
type MemberRating = { id: string; displayName: string; isOwn: boolean; score: number };
type Props = {
  title: TmdbTitle;
  current: number | null;
  officialRating: GroupRating;
  ratings: MemberRating[];
  references: RatingReference[];
  ratingsUnavailable: boolean;
  groupUnavailable: boolean;
  referencesUnavailable: boolean;
};

function scoreLabel(score: number) { return score < 2 ? String(score) : score.toFixed(1); }

export function TitleDetail({ title, current, officialRating, ratings, references, ratingsUnavailable, groupUnavailable, referencesUnavailable }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(false);

  if (rating) return <div className="title-rating-mode">
    <button type="button" className="text-button title-back" onClick={() => { setRating(false); router.refresh(); }}>← Back to title</button>
    {referencesUnavailable ? <p role="alert" className="error-message">Could not load reference titles. Try again in a moment.</p>
      : <RateForm title={title} current={null} references={references} officialRating={groupUnavailable ? null : officialRating} />}
  </div>;

  return <article className="title-detail">
    <Link className="title-back" href={current === null ? "/rate" : "/my-ratings"}>← {current === null ? "Back to search" : "Back to My Ratings"}</Link>
    <div className="title-overview">
      <div className="title-detail-poster"><Poster path={title.posterPath} title={title.title} size="detail" priority /></div>
      <div className="title-detail-content">
        <header className="title-detail-heading"><p>{title.releaseYear ?? "Year unknown"} · {title.mediaType === "movie" ? "Movie" : "TV"}</p><h1>{title.title}</h1></header>
        <div className="title-rating-pair">
          <section aria-label="Your rating" className="title-rating-value"><h2>Your rating</h2>{ratingsUnavailable ? <p role="alert" className="title-rating-error">Could not load your rating</p> : current === null ? <p className="title-rating-missing">Not rated yet</p> : <strong>{scoreLabel(current)}</strong>}</section>
          <section aria-label="Group rating" className="title-rating-value"><h2>Group rating</h2>{groupUnavailable ? <><p role="alert" className="title-rating-error">Could not load group rating</p>{!ratingsUnavailable && <button type="button" className="text-button" onClick={() => router.refresh()}>Try again</button>}</> : officialRating ? <><strong>{officialRating.score.toFixed(1)}</strong><small>{officialRating.rating_count} trusted {officialRating.rating_count === 1 ? "rating" : "ratings"}</small></> : <p className="title-rating-missing">No group rating yet</p>}</section>
        </div>
        {ratingsUnavailable ? <button type="button" className="text-button" onClick={() => router.refresh()}>Try again</button>
          : <button type="button" className="button primary title-rate-action" onClick={() => setRating(true)}>{current === null ? "Rate this title" : "Rate again"}</button>}
      </div>
    </div>
    <section className="title-member-ratings"><h2>Ratings</h2>{ratingsUnavailable ? <p role="alert" className="error-message">Could not load the group’s ratings.</p> : ratings.length ? <div className="title-member-list">{ratings.map((member) => <div className="title-member-row" key={member.id}><span>{member.displayName}{member.isOwn ? " (you)" : ""}</span><strong>{scoreLabel(member.score)}</strong></div>)}</div> : <p className="muted">Nobody has rated this title yet.</p>}</section>
  </article>;
}
