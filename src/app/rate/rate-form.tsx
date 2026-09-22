"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Poster } from "@/components/poster";
import {
  answerComparison, manualIndexFromScore, manualScoreFromIndex, startComparison,
  type ComparisonAnswer,
} from "@/lib/rating-comparison";
import type { TmdbTitle } from "@/lib/tmdb";
import { saveRating } from "./actions";

export type RatingReference = { score: number; title: string; posterPath: string | null };

type Props = {
  title: TmdbTitle;
  current: number | null;
  references: RatingReference[];
  officialRating: { score: number; rating_count: number } | null;
};

function scoreValue(score: number) {
  return score === 0 || score === 1 ? String(score) : score.toFixed(1);
}

function RatingFields({ title, score }: { title: TmdbTitle; score: number }) {
  return <>
    <input type="hidden" name="type" value={title.mediaType} />
    <input type="hidden" name="id" value={title.tmdbId} />
    <input type="hidden" name="score" value={scoreValue(score)} />
  </>;
}

function ReferenceCard({ reference }: { reference: RatingReference }) {
  return <div className="comparison-title-card">
    <div className="comparison-poster"><Poster path={reference.posterPath} title={reference.title} /></div>
    <div className="comparison-card-caption"><span>REFERENS {reference.score.toFixed(1)}</span><strong>{reference.title}</strong></div>
  </div>;
}

export function RateForm({ title, current, references, officialRating }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveRating, { message: "", saved: false, score: null });
  const [mode, setMode] = useState<"current" | "compare" | "manual">(current === null ? "compare" : "current");
  const [flow, setFlow] = useState(() => startComparison(references.map((reference) => reference.score)));
  const [tenths, setTenths] = useState<number | null>(null);
  const [manualIndex, setManualIndex] = useState(current === null ? 52 : manualIndexFromScore(current));

  useEffect(() => { if (state.saved) router.refresh(); }, [state.saved, router]);

  function beginComparison() {
    setFlow(startComparison(references.map((reference) => reference.score)));
    setTenths(null);
    setMode("compare");
  }

  function compare(answer: ComparisonAnswer) {
    const next = answerComparison(flow, answer);
    setFlow(next);
    if (next.result) setTenths(next.result.suggestedTenths);
  }

  const selectedReference = references.find((reference) => reference.score === flow.currentReference);
  const lowerReference = references.find((reference) => reference.score === flow.result?.lowerReference);
  const upperReference = references.find((reference) => reference.score === flow.result?.upperReference);
  const manualScore = manualScoreFromIndex(manualIndex);
  const finalScore = tenths === null ? null : tenths / 10;

  return <section className="rating-journey" aria-label="Sätt betyg">
    {state.saved && state.score !== null ? <div className="rating-result">
      <p className="kicker">BETYGET ÄR SPARAT</p>
      <h2>Du gav {title.title}</h2>
      <strong className="rating-result-score">{state.score.toFixed(1)}</strong>
      {officialRating && <p className="muted">Officiellt gruppbetyg: {Number(officialRating.score).toFixed(1)} · {officialRating.rating_count} betrodda betyg</p>}
      <div className="rating-result-actions"><Link className="button primary" href="/my-ratings">My Ratings</Link><Link className="button subtle" href="/rate">Rate another</Link></div>
    </div> : <>
      {current !== null && mode === "current" ? <div className="existing-rating">
        <p className="kicker">DITT BETYG</p>
        <div className="existing-rating-row"><strong>{current.toFixed(1)}</strong><span>Vill du placera titeln på nytt?</span></div>
        <div className="journey-actions"><button type="button" className="button primary" onClick={beginComparison}>Rate again</button><button type="button" className="text-button" onClick={() => setMode("manual")}>Edit rating manually</button></div>
      </div> : <>
        <div className="rating-quick-options">
          <span>Snabbval</span>
          <form action={action}><RatingFields title={title} score={0} /><button disabled={pending}>0 — Sög</button></form>
          <form action={action}><RatingFields title={title} score={1} /><button disabled={pending}>1 — Inte sevärd</button></form>
        </div>

        {mode === "compare" && <>
          {flow.fallback ? <div className="comparison-fallback">
            <p className="kicker">REFERENSER SAKNAS</p>
            <h2>För få referenstitlar för jämförelse.</h2>
            <p className="muted">Minst två referenser behövs. Du kan sätta betyg manuellt redan nu.</p>
            <button type="button" className="button primary" onClick={() => setMode("manual")}>Set rating manually</button>
          </div> : selectedReference ? <div className="comparison-step">
            <div className="comparison-progress"><span>JÄMFÖRELSE {flow.history.length + 1}</span>{flow.history.length > 0 && <button type="button" className="text-button" onClick={beginComparison}>Börja om</button>}</div>
            <h2>Vilken är bättre?</h2>
            <div className="comparison-pair">
              <div className="comparison-title-card"><div className="comparison-poster"><Poster path={title.posterPath} title={title.title} /></div><div className="comparison-card-caption"><span>DU BETYGSÄTTER</span><strong>{title.title}</strong></div></div>
              <span className="comparison-versus">VS</span>
              <ReferenceCard reference={selectedReference} />
            </div>
            <p className="comparison-question">Är <strong>{title.title}</strong> bättre eller sämre än <strong>{selectedReference.title}</strong> ({selectedReference.score.toFixed(1)})?</p>
            <div className="comparison-choices">
              <button type="button" onClick={() => compare("worse")}>Sämre <span>↓</span></button>
              <button type="button" onClick={() => compare("better")}>Bättre <span>↑</span></button>
              <button type="button" className="same-choice" onClick={() => compare("same")}>Ungefär lika bra <span>≈</span></button>
            </div>
          </div> : flow.result && <div className="comparison-finish">
            <p className="kicker">PLACERING KLAR</p>
            <h2>{flow.result.kind === "between" ? "Du placerade titeln mellan" : flow.result.kind === "equal" ? "Ungefär lika bra som" : flow.result.kind === "above" ? "Bättre än högsta referensen" : "Sämre än lägsta referensen"}</h2>
            <div className="comparison-bounds">
              {lowerReference && <ReferenceCard reference={lowerReference} />}
              {upperReference && upperReference.score !== lowerReference?.score && <ReferenceCard reference={upperReference} />}
            </div>
            <div className="decimal-picker">
              <label htmlFor="decimal-score">Finjustera ditt betyg</label>
              <strong>{finalScore?.toFixed(1)}</strong>
              <input id="decimal-score" type="range" min={flow.result.minTenths} max={flow.result.maxTenths} step="1" value={tenths ?? flow.result.suggestedTenths} onChange={(event) => setTenths(Number(event.target.value))} />
              <div className="slider-endpoints"><span>{(flow.result.minTenths / 10).toFixed(1)}</span><span>{(flow.result.maxTenths / 10).toFixed(1)}</span></div>
            </div>
            {finalScore !== null && <form action={action}><RatingFields title={title} score={finalScore} /><button className="button primary confirm-rating" disabled={pending}>{pending ? "Sparar…" : "Confirm rating"}</button></form>}
            <button type="button" className="text-button" onClick={beginComparison}>Börja om jämförelsen</button>
          </div>}
          {!flow.fallback && <button type="button" className="text-button manual-link" onClick={() => setMode("manual")}>Set rating manually</button>}
        </>}

        {mode === "manual" && <div className="manual-rating">
          <p className="kicker">MANUELLT BETYG</p>
          <h2>Välj ditt betyg</h2>
          <strong>{manualScore.toFixed(1)}</strong>
          <label htmlFor="manual-score">Betyg från 0 till 10</label>
          <input id="manual-score" type="range" min="0" max="82" step="1" value={manualIndex} onChange={(event) => setManualIndex(Number(event.target.value))} />
          <div className="slider-endpoints"><span>0 — Sög</span><span>10.0</span></div>
          <p className="small muted">0 = sög · 1 = inte sevärd · 2.0–10.0 = sevärd, i steg om 0.1.</p>
          <form action={action}><RatingFields title={title} score={manualScore} /><button className="button primary confirm-rating" disabled={pending}>{pending ? "Sparar…" : "Confirm rating"}</button></form>
          {!flow.fallback && <button type="button" className="text-button" onClick={beginComparison}>Till jämförelserna</button>}
        </div>}
      </>}
      {state.message && <p role="status" className={state.saved ? "success-message" : "error-message"}>{state.message}</p>}
    </>}
  </section>;
}
