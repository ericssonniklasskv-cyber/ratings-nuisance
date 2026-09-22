"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Poster } from "@/components/poster";
import { answerComparison, manualIndexFromScore, manualScoreFromIndex, rewindComparison, startComparison, type ComparisonAnswer } from "@/lib/rating-comparison";
import type { TmdbTitle } from "@/lib/tmdb";
import { saveRating } from "./actions";

export type RatingReference = { score: number; title: string; posterPath: string | null };
type Props = { title: TmdbTitle; current: number | null; references: RatingReference[]; officialRating: { score: number; rating_count: number } | null };

function ratingValue(score: number) { return score === 0 || score === 1 ? String(score) : score.toFixed(1); }
function RatingFields({ title, score }: { title: TmdbTitle; score: number }) {
  return <><input type="hidden" name="type" value={title.mediaType} /><input type="hidden" name="id" value={title.tmdbId} /><input type="hidden" name="score" value={ratingValue(score)} /></>;
}
function ComparisonCard({ title, label, size = "comparison" }: { title: TmdbTitle | RatingReference; label: string; size?: "comparison" | "reference" }) {
  return <div className="comparison-title-card">
    <div className="comparison-poster"><Poster path={"posterPath" in title ? title.posterPath : null} title={title.title} size={size} /></div>
    <div className="comparison-card-caption"><span>{label}</span><strong>{title.title}</strong></div>
  </div>;
}

export function RateForm({ title, current, references, officialRating }: Props) {
  const [state, action, pending] = useActionState(saveRating, { message: "", saved: false, score: null as number | null, group: null as { score: number; rating_count: number } | null });
  const [mode, setMode] = useState<"current" | "compare" | "manual">(current === null ? "compare" : "current");
  const [flow, setFlow] = useState(() => startComparison(references.map((reference) => reference.score)));
  const [tenths, setTenths] = useState<number | null>(null);
  const [manualIndex, setManualIndex] = useState(current === null ? 52 : manualIndexFromScore(current));
  const reference = references.find((item) => item.score === flow.currentReference);
  const lower = references.find((item) => item.score === flow.result?.lowerReference);
  const upper = references.find((item) => item.score === flow.result?.upperReference);
  const finalScore = tenths === null ? null : tenths / 10;
  const manualScore = manualScoreFromIndex(manualIndex);

  function restart() { setFlow(startComparison(references.map((item) => item.score))); setTenths(null); setMode("compare"); }
  function back() { setFlow(rewindComparison(flow)); setTenths(null); }
  function compare(answer: ComparisonAnswer) { const next = answerComparison(flow, answer); setFlow(next); if (next.result) setTenths(next.result.suggestedTenths); }

  return <section className="rating-journey" aria-label="Rate title">
    {state.saved && state.score !== null ? <div className="rating-result" role="status">
      <p className="kicker">RATING SAVED</p>
      <h2>{title.title}</h2>
      <div className="rating-summary"><div><span>Your rating</span><strong>{ratingValue(state.score)}</strong></div><div><span>Group rating</span>{state.group ? <><strong>{state.group.score.toFixed(1)}</strong><small>{state.group.rating_count} trusted ratings</small></> : <p>No group rating yet</p>}</div></div>
      <div className="rating-result-actions"><Link className="button primary" href="/rate">Rate another</Link><Link className="button secondary" href="/my-ratings">My Ratings</Link></div>
    </div> : <>
      {current !== null && mode === "current" ? <div className="existing-rating">
        <p className="kicker">YOUR RATING</p><strong className="existing-score">{ratingValue(current)}</strong>
        {officialRating && <p className="muted">Group rating {officialRating.score.toFixed(1)} · {officialRating.rating_count} trusted ratings</p>}
        <div className="journey-actions"><button type="button" className="button primary" onClick={restart}>Rate again</button><button type="button" className="button ghost" onClick={() => setMode("manual")}>Edit manually</button></div>
      </div> : <>
        {mode === "compare" && (flow.fallback ? <div className="comparison-fallback"><h2>No references yet</h2><p className="muted">You can still choose a rating manually.</p><button type="button" className="button primary" onClick={() => setMode("manual")}>Set rating manually</button></div> : reference ? <div className="comparison-step">
          <div className="comparison-progress"><span>COMPARISON {flow.history.length + 1}</span><span>Against a rated reference</span></div>
          <div className="comparison-pair">
            <ComparisonCard title={title} label="YOUR TITLE" />
            <span className="comparison-versus" aria-hidden="true">VS</span>
            <ComparisonCard title={reference} label={`REFERENCE · ${reference.score.toFixed(1)}`} />
          </div>
          <div className="comparison-choices" aria-label="How does your title compare to the reference?">
            <button type="button" onClick={() => compare("worse")}>Worse <span aria-hidden="true">↓</span></button>
            <button type="button" onClick={() => compare("same")}>About the same <span aria-hidden="true">≈</span></button>
            <button type="button" onClick={() => compare("better")}>Better <span aria-hidden="true">↑</span></button>
          </div>
          <div className="comparison-tools">{flow.history.length > 0 && <button type="button" className="text-button" onClick={back}>← Back</button>}<button type="button" className="text-button" onClick={() => setMode("manual")}>Set manually</button>{flow.history.length > 0 && <button type="button" className="text-button" onClick={restart}>Start over</button>}</div>
        </div> : flow.result && finalScore !== null && <div className="comparison-finish">
          <p className="kicker">FINE TUNE</p>
          <h2>{flow.result.kind === "between" ? `Between ${flow.result.lowerReference} and ${flow.result.upperReference}` : flow.result.kind === "equal" ? `About the same as ${flow.result.lowerReference}` : flow.result.kind === "above" ? `Above ${flow.result.lowerReference}` : `Below ${flow.result.upperReference}`}</h2>
          <p className="reference-context">{[lower, upper].filter((item, index, all) => item && all.findIndex((candidate) => candidate?.score === item.score) === index).map((item) => `${item!.title} · ${item!.score}`).join("  /  ")}</p>
          <div className="decimal-picker"><label htmlFor="decimal-score">Your rating</label><strong>{finalScore.toFixed(1)}</strong><div className="score-adjust"><button type="button" aria-label="Decrease rating by 0.1" disabled={tenths === flow.result.minTenths} onClick={() => setTenths(Math.max(flow.result!.minTenths, tenths! - 1))}>−</button><input id="decimal-score" type="range" min={flow.result.minTenths} max={flow.result.maxTenths} step="1" value={tenths ?? flow.result.suggestedTenths} onChange={(event) => setTenths(Number(event.target.value))} /><button type="button" aria-label="Increase rating by 0.1" disabled={tenths === flow.result.maxTenths} onClick={() => setTenths(Math.min(flow.result!.maxTenths, tenths! + 1))}>+</button></div><div className="slider-endpoints"><span>{(flow.result.minTenths / 10).toFixed(1)}</span><span>{(flow.result.maxTenths / 10).toFixed(1)}</span></div></div>
          <form action={action}><RatingFields title={title} score={finalScore} /><button className="button primary confirm-rating" disabled={pending}>{pending ? "Saving…" : "Save rating"}</button></form>
          <button type="button" className="text-button" onClick={back}>← Back</button>
        </div>)}
        {mode === "manual" && <div className="manual-rating"><p className="kicker">MANUAL RATING</p><h2>Choose your rating</h2><strong>{ratingValue(manualScore)}</strong><label htmlFor="manual-score">Rating from 0 to 10</label><input id="manual-score" type="range" min="0" max="82" step="1" value={manualIndex} onChange={(event) => setManualIndex(Number(event.target.value))} /><div className="slider-endpoints"><span>0 · Awful</span><span>10.0</span></div><p className="small muted">0 = awful · 1 = not worth watching · 2.0–10.0 = worth watching</p><form action={action}><RatingFields title={title} score={manualScore} /><button className="button primary confirm-rating" disabled={pending}>{pending ? "Saving…" : "Save rating"}</button></form>{!flow.fallback && <button type="button" className="text-button" onClick={() => setMode("compare")}>← Back to comparisons</button>}</div>}
        <div className="rating-quick-options"><span>NOT WORTH WATCHING?</span><form action={action}><RatingFields title={title} score={0} /><button disabled={pending}>0 · Awful</button></form><form action={action}><RatingFields title={title} score={1} /><button disabled={pending}>1 · Not worth watching</button></form></div>
      </>}
      {state.message && <p role="status" className={state.saved ? "success-message" : "error-message"}>{state.message}</p>}
    </>}
  </section>;
}
