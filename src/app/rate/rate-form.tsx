"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Poster } from "@/components/poster";
import { answerComparison, manualIndexFromScore, manualScoreFromIndex, rewindComparison, startComparison, type ComparisonAnswer } from "@/lib/rating-comparison";
import { answerPersonalPlacement, rewindPersonalPlacement, startPersonalPlacement, type PersonalAnchor, type PersonalPlacement } from "@/lib/personal-placement";
import type { TmdbTitle } from "@/lib/tmdb";
import { saveRating } from "./actions";

export type RatingReference = { score: number; title: string; posterPath: string | null };
type Props = { title: TmdbTitle; current: number | null; references: RatingReference[]; personalAnchors: PersonalAnchor[]; personalUnavailable: boolean; currentTitleId: string | null; officialRating: { score: number; rating_count: number } | null };
type Mode = "current" | "worth" | "not-worth" | "compare" | "manual";
type CompareStage = "reference" | "reference-result" | "personal" | "finish";

function ratingValue(score: number) { return score === 0 || score === 1 ? String(score) : score.toFixed(1); }
function RatingFields({ title, score }: { title: TmdbTitle; score: number }) {
  return <><input type="hidden" name="type" value={title.mediaType} /><input type="hidden" name="id" value={title.tmdbId} /><input type="hidden" name="score" value={ratingValue(score)} /></>;
}
function FilmChoice({ title, label, answer, selected, disabled, onChoose }: { title: TmdbTitle | RatingReference; label: string; answer: ComparisonAnswer; selected: boolean; disabled: boolean; onChoose: (answer: ComparisonAnswer) => void }) {
  return <button type="button" className="film-choice" aria-label={`Choose ${title.title} as the better title`} data-selected={selected || undefined} disabled={disabled} onClick={() => onChoose(answer)}>
    <span className="comparison-poster"><Poster path={title.posterPath} title={title.title} size="comparison" priority={answer === "better"} /></span>
    <span className="comparison-card-caption"><span>{label}</span><strong>{title.title}</strong></span>
  </button>;
}

export function RateForm({ title, current, references, personalAnchors, personalUnavailable, currentTitleId, officialRating }: Props) {
  const [state, action, pending] = useActionState(saveRating, { message: "", saved: false, score: null as number | null, group: null as { score: number; rating_count: number } | null });
  const [mode, setMode] = useState<Mode>(current === null ? "worth" : "current");
  const [manualReturn, setManualReturn] = useState<Mode>("worth");
  const [flow, setFlow] = useState(() => startComparison(references.map((reference) => reference.score)));
  const [compareStage, setCompareStage] = useState<CompareStage>("reference");
  const [personal, setPersonal] = useState<PersonalPlacement | null>(null);
  const [finishNote, setFinishNote] = useState<string | null>(null);
  const [manualFinishOrigin, setManualFinishOrigin] = useState<"personal" | "reference-result" | null>(null);
  const [tenths, setTenths] = useState<number | null>(null);
  const [manualIndex, setManualIndex] = useState(current === null ? 52 : manualIndexFromScore(current));
  const [selection, setSelection] = useState<ComparisonAnswer | null>(null);
  const selectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (selectionTimer.current) clearTimeout(selectionTimer.current); }, []);

  const reference = references.find((item) => item.score === flow.currentReference);
  const personalAnchor = personal?.currentAnchor;
  const lower = references.find((item) => item.score === flow.result?.lowerReference);
  const upper = references.find((item) => item.score === flow.result?.upperReference);
  const finalScore = tenths === null ? null : tenths / 10;
  const manualScore = manualScoreFromIndex(manualIndex);

  function cancelSelection() {
    if (selectionTimer.current) clearTimeout(selectionTimer.current);
    selectionTimer.current = null;
    setSelection(null);
  }
  function restart() {
    cancelSelection();
    setFlow(startComparison(references.map((item) => item.score)));
    setTenths(null);
    setPersonal(null);
    setCompareStage("reference");
    setFinishNote(null);
    setManualFinishOrigin(null);
    setMode("worth");
  }
  function back() {
    cancelSelection();
    if (compareStage === "finish") {
      if (manualFinishOrigin === "personal" && personal?.currentAnchor) {
        setCompareStage("personal");
      } else if (manualFinishOrigin === "reference-result") {
        setCompareStage("reference-result");
      } else if (personal?.history.length) {
        const previous = rewindPersonalPlacement(personal);
        setPersonal(previous);
        setTenths(previous.suggestedTenths);
        setCompareStage("personal");
      } else setCompareStage("reference-result");
      return;
    }
    if (compareStage === "personal") {
      if (personal?.history.length) setPersonal(rewindPersonalPlacement(personal));
      else setCompareStage("reference-result");
      return;
    }
    if (compareStage === "reference-result") {
      setFlow(rewindComparison(flow));
      setPersonal(null);
      setCompareStage("reference");
      setTenths(null);
      return;
    }
    if (flow.history.length === 0) { setMode("worth"); return; }
    setFlow(rewindComparison(flow));
    setTenths(null);
  }
  function openManual(from: Mode) {
    setManualReturn(from);
    if (from === "compare") setManualIndex((index) => Math.max(2, index));
    setMode("manual");
  }
  function choose(answer: ComparisonAnswer) {
    if (selection !== null) return;
    setSelection(answer);
    selectionTimer.current = setTimeout(() => {
      if (compareStage === "personal" && personal) {
        const next = answerPersonalPlacement(personal, answer);
        setPersonal(next);
        setTenths(next.suggestedTenths);
        if (next.finished) { setCompareStage("finish"); setFinishNote(null); }
        setManualFinishOrigin(null);
      } else {
        const next = answerComparison(flow, answer);
        setFlow(next);
        if (next.result) {
          const placement = startPersonalPlacement(personalUnavailable ? [] : personalAnchors, next.result, { mediaType: title.mediaType, tmdbId: title.tmdbId, titleId: currentTitleId });
          setPersonal(placement);
          setTenths(next.result.suggestedTenths);
          if (next.result.kind === "equal" || placement.finished) {
            setCompareStage("finish");
            setManualFinishOrigin(null);
            setFinishNote(personalUnavailable ? "Your previous ratings are unavailable. Set this rating manually." : placement.finished && next.result.kind !== "equal" ? "No previous ratings in this range yet." : null);
          } else setCompareStage("personal");
        }
      }
      setSelection(null);
      selectionTimer.current = null;
    }, 90);
  }

  function finishManually(origin: "personal" | "reference-result") {
    if (!flow.result) return;
    cancelSelection();
    setTenths(flow.result.suggestedTenths);
    setFinishNote("Set your rating manually within this range.");
    setManualFinishOrigin(origin);
    setCompareStage("finish");
  }

  function resumePersonal() {
    if (!personal?.currentAnchor) return;
    setCompareStage("personal");
    setFinishNote(null);
    setManualFinishOrigin(null);
  }

  return <section className="rating-journey" aria-label="Rate title">
    {state.saved && state.score !== null ? <div className="rating-result" role="status">
      <p className="kicker">RATING SAVED</p>
      <h1>{title.title}</h1>
      <div className="rating-summary"><div><span>Your rating</span><strong>{ratingValue(state.score)}</strong></div><div><span>Group rating</span>{state.group ? <><strong>{state.group.score.toFixed(1)}</strong><small>{state.group.rating_count} trusted ratings</small></> : <p>No group rating yet</p>}</div></div>
      <div className="rating-result-actions"><Link className="button primary" href="/rate">Rate another</Link><Link className="button secondary" href="/my-ratings">Sazed</Link></div>
    </div> : <>
      {mode === "current" && current !== null && <div className="existing-rating">
        <p className="kicker">YOUR RATING</p><h1>{title.title}</h1><strong className="existing-score">{ratingValue(current)}</strong>
        {officialRating && <p className="muted">Group rating {officialRating.score.toFixed(1)} · {officialRating.rating_count} trusted ratings</p>}
        <div className="journey-actions"><button type="button" className="button primary" onClick={restart}>Rate again</button><button type="button" className="button ghost" onClick={() => openManual("current")}>Edit manually</button></div>
      </div>}

      {mode === "worth" && <div className="worth-step">
        <div className="worth-feature"><div className="worth-poster"><Poster path={title.posterPath} title={title.title} size="comparison" priority /></div><div><p className="kicker">{title.mediaType === "movie" ? "MOVIE" : "TV"} · {title.releaseYear ?? "YEAR UNKNOWN"}</p><h1>{title.title}</h1></div></div>
        <h2>Worth watching?</h2>
        <div className="worth-actions"><button type="button" className="button primary" onClick={() => setMode("compare")}>Yes</button><button type="button" className="button secondary" onClick={() => setMode("not-worth")}>No</button></div>
      </div>}

      {mode === "not-worth" && <div className="not-worth-step">
        <p className="kicker">{title.title}</p><h1>How bad was it?</h1>
        <div className="not-worth-actions">
          <form action={action}><RatingFields title={title} score={1} /><button className="not-worth-choice" disabled={pending}><strong>1</strong><span>Not worth watching</span></button></form>
          <form action={action}><RatingFields title={title} score={0} /><button className="not-worth-choice" disabled={pending}><strong>0</strong><span>Exceptionally bad</span></button></form>
        </div>
        <button type="button" className="text-button" onClick={() => setMode("worth")}>← Back</button>
      </div>}

      {mode === "compare" && flow.fallback && <div className="comparison-fallback"><p className="kicker">{title.title}</p><h1>No references yet</h1><p className="muted">You can still choose a rating manually.</p><button type="button" className="button primary" onClick={() => openManual("compare")}>Set rating manually</button><button type="button" className="text-button" onClick={back}>← Back</button></div>}

      {mode === "compare" && compareStage === "reference" && reference && <div className="comparison-step">
        <div className="comparison-progress"><span>RATING · {title.title}</span><span aria-live="polite">COMPARISON {flow.history.length + 1}</span></div>
        <h1 className="comparison-prompt">Which is better?</h1>
        <div className="comparison-pair" role="group" aria-label="Choose the better title or about the same">
          <FilmChoice title={title} label="YOUR TITLE" answer="better" selected={selection === "better"} disabled={selection !== null} onChoose={choose} />
          <div className="comparison-middle"><span className="comparison-versus" aria-hidden="true">VS</span><button type="button" className="same-choice" data-selected={selection === "same" || undefined} disabled={selection !== null} onClick={() => choose("same")}>About the same</button></div>
          <FilmChoice title={reference} label={`REFERENCE · ${reference.score.toFixed(1)}`} answer="worse" selected={selection === "worse"} disabled={selection !== null} onChoose={choose} />
        </div>
        <div className="comparison-tools"><button type="button" className="text-button" onClick={back}>← Back</button><button type="button" className="text-button" onClick={() => openManual("compare")}>Set manually</button>{flow.history.length > 0 && <button type="button" className="text-button" onClick={restart}>Start over</button>}</div>
      </div>}

      {mode === "compare" && compareStage === "reference-result" && flow.result && <div className="comparison-finish">
        <p className="kicker">REFERENCE PLACEMENT · {title.title}</p>
        <h1>{flow.result.kind === "between" ? `Between ${flow.result.lowerReference} and ${flow.result.upperReference}` : flow.result.kind === "equal" ? `About the same as ${flow.result.lowerReference}` : flow.result.kind === "above" ? `Above ${flow.result.lowerReference}` : `Below ${flow.result.upperReference}`}</h1>
        <p className="muted">Your available range is {(flow.result.minTenths / 10).toFixed(1)}–{(flow.result.maxTenths / 10).toFixed(1)}.</p>
        <div className="journey-actions">{personal?.currentAnchor && <button type="button" className="button primary" onClick={resumePersonal}>Compare with your ratings</button>}<button type="button" className="button secondary" onClick={() => finishManually("reference-result")}>Set manually</button></div>
        <button type="button" className="text-button" onClick={back}>← Back</button>
      </div>}

      {mode === "compare" && compareStage === "personal" && personalAnchor && <div className="comparison-step">
        <div className="comparison-progress"><span>RATING · {title.title}</span><span aria-live="polite">FINE TUNING · {personal!.history.length + 1}</span></div>
        <h1 className="comparison-prompt">Which is better?</h1>
        <div className="comparison-pair" role="group" aria-label="Choose the better title or about the same">
          <FilmChoice title={title} label="YOUR TITLE" answer="better" selected={selection === "better"} disabled={selection !== null} onChoose={choose} />
          <div className="comparison-middle"><span className="comparison-versus" aria-hidden="true">VS</span><button type="button" className="same-choice" data-selected={selection === "same" || undefined} disabled={selection !== null} onClick={() => choose("same")}>About the same</button></div>
          <FilmChoice title={personalAnchor} label={`YOUR RATING · ${(personalAnchor.scoreTenths / 10).toFixed(1)}`} answer="worse" selected={selection === "worse"} disabled={selection !== null} onChoose={choose} />
        </div>
        <div className="comparison-tools"><button type="button" className="text-button" onClick={back}>← Back</button><button type="button" className="text-button" onClick={() => finishManually("personal")}>Set manually</button></div>
      </div>}

      {mode === "compare" && compareStage === "finish" && flow.result && finalScore !== null && <div className="comparison-finish">
        <p className="kicker">FINE TUNE · {title.title}</p>
        <h1>{flow.result.kind === "between" ? `Between ${flow.result.lowerReference} and ${flow.result.upperReference}` : flow.result.kind === "equal" ? `About the same as ${flow.result.lowerReference}` : flow.result.kind === "above" ? `Above ${flow.result.lowerReference}` : `Below ${flow.result.upperReference}`}</h1>
        <p className="reference-context">{[lower, upper].filter((item, index, all) => item && all.findIndex((candidate) => candidate?.score === item.score) === index).map((item) => `${item!.title} · ${item!.score}`).join("  /  ")}</p>
        {finishNote && <p className="muted">{finishNote}</p>}
        <div className="decimal-picker"><label htmlFor="decimal-score">{personal?.history.length && !finishNote ? "Suggested rating" : "Your rating"}</label><strong>{finalScore.toFixed(1)}</strong><div className="score-adjust"><button type="button" aria-label="Decrease rating by 0.1" disabled={tenths === flow.result.minTenths} onClick={() => setTenths(Math.max(flow.result!.minTenths, tenths! - 1))}>−</button><input id="decimal-score" type="range" min={flow.result.minTenths} max={flow.result.maxTenths} step="1" value={tenths ?? flow.result.suggestedTenths} onChange={(event) => setTenths(Number(event.target.value))} /><button type="button" aria-label="Increase rating by 0.1" disabled={tenths === flow.result.maxTenths} onClick={() => setTenths(Math.min(flow.result!.maxTenths, tenths! + 1))}>+</button></div><div className="slider-endpoints"><span>{(flow.result.minTenths / 10).toFixed(1)}</span><span>{(flow.result.maxTenths / 10).toFixed(1)}</span></div></div>
        <form action={action}><RatingFields title={title} score={finalScore} /><button className="button primary confirm-rating" disabled={pending}>{pending ? "Saving…" : "Save rating"}</button></form>
        {flow.result.kind === "equal" && personal?.currentAnchor && personal.history.length === 0 && !personalUnavailable && <button type="button" className="text-button" onClick={resumePersonal}>Fine tune with your ratings</button>}
        <button type="button" className="text-button" onClick={back}>← Back</button>
      </div>}

      {mode === "manual" && <div className="manual-rating"><p className="kicker">MANUAL RATING · {title.title}</p><h1>Choose your rating</h1><strong>{ratingValue(manualScore)}</strong><label htmlFor="manual-score">Rating from {manualReturn === "compare" ? "2" : "0"} to 10</label><input id="manual-score" type="range" min={manualReturn === "compare" ? 2 : 0} max="82" step="1" value={manualIndex} onChange={(event) => setManualIndex(Number(event.target.value))} /><div className="slider-endpoints"><span>{manualReturn === "compare" ? "2.0" : "0 · Exceptionally bad"}</span><span>10.0</span></div><p className="small muted">{manualReturn === "compare" ? "2.0–10.0 = worth watching" : "0 = exceptionally bad · 1 = not worth watching · 2.0–10.0 = worth watching"}</p><form action={action}><RatingFields title={title} score={manualScore} /><button className="button primary confirm-rating" disabled={pending}>{pending ? "Saving…" : "Save rating"}</button></form><button type="button" className="text-button" onClick={() => setMode(manualReturn)}>← Back</button></div>}
      {state.message && <p role="status" className={state.saved ? "success-message" : "error-message"}>{state.message}</p>}
    </>}
  </section>;
}
