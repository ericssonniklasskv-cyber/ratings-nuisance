import type { ComparisonAnswer, ComparisonResult } from "./rating-comparison";

export type PersonalAnchor = {
  titleId: string;
  mediaType: "movie" | "tv";
  tmdbId: number;
  title: string;
  posterPath: string | null;
  score: number;
  updatedAt: string;
};

export type PersonalStep = { scoreTenths: number; answer: ComparisonAnswer };

export type PersonalPlacement = {
  anchors: (PersonalAnchor & { scoreTenths: number })[];
  minTenths: number;
  maxTenths: number;
  lowerTenths: number | null;
  upperTenths: number | null;
  currentAnchor: (PersonalAnchor & { scoreTenths: number }) | null;
  history: PersonalStep[];
  suggestedTenths: number;
  finished: boolean;
};

const MAX_COMPARISONS = 2;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function suggestion(min: number, max: number, lower: number | null, upper: number | null) {
  const first = lower === null ? min : Math.max(min, lower + 1);
  const last = upper === null ? max : Math.min(max, upper - 1);
  if (first <= last) return Math.round((first + last) / 2);
  // Adjacent anchors leave no representable tenth strictly between them.
  return clamp(Math.round(((lower ?? min) + (upper ?? max)) / 2), min, max);
}

function nextAnchor(anchors: PersonalPlacement["anchors"], lower: number | null, upper: number | null) {
  const available = anchors.filter((anchor) =>
    (lower === null || anchor.scoreTenths > lower) && (upper === null || anchor.scoreTenths < upper));
  if (!available.length) return null;
  const midpoint = (available[0].scoreTenths + available[available.length - 1].scoreTenths) / 2;
  return available.reduce((best, anchor) =>
    Math.abs(anchor.scoreTenths - midpoint) < Math.abs(best.scoreTenths - midpoint) ? anchor : best);
}

export function startPersonalPlacement(
  candidates: PersonalAnchor[],
  result: ComparisonResult,
  currentTitle: { mediaType: "movie" | "tv"; tmdbId: number; titleId?: string | null },
): PersonalPlacement {
  const byScore = new Map<number, PersonalPlacement["anchors"][number]>();
  // Most recently updated title represents duplicate scores; title ID breaks ties.
  for (const candidate of [...candidates].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt) || a.titleId.localeCompare(b.titleId))) {
    if ((currentTitle.titleId && candidate.titleId === currentTitle.titleId) ||
      (candidate.mediaType === currentTitle.mediaType && candidate.tmdbId === currentTitle.tmdbId)) continue;
    const scoreTenths = Math.round(candidate.score * 10);
    if (Math.abs(candidate.score * 10 - scoreTenths) > 1e-7 ||
      scoreTenths < result.minTenths || scoreTenths > result.maxTenths) continue;
    if (!byScore.has(scoreTenths)) byScore.set(scoreTenths, { ...candidate, scoreTenths });
  }
  const anchors = [...byScore.values()].sort((a, b) => a.scoreTenths - b.scoreTenths);
  return {
    anchors, minTenths: result.minTenths, maxTenths: result.maxTenths,
    lowerTenths: null, upperTenths: null, currentAnchor: nextAnchor(anchors, null, null),
    history: [], suggestedTenths: clamp(result.suggestedTenths, result.minTenths, result.maxTenths),
    finished: anchors.length === 0,
  };
}

export function answerPersonalPlacement(state: PersonalPlacement, answer: ComparisonAnswer): PersonalPlacement {
  const anchor = state.currentAnchor;
  if (state.finished || !anchor) return state;
  const history = [...state.history, { scoreTenths: anchor.scoreTenths, answer }];
  if (answer === "same") return {
    ...state, history, currentAnchor: null, suggestedTenths: anchor.scoreTenths, finished: true,
  };
  const lowerTenths = answer === "better" ? anchor.scoreTenths : state.lowerTenths;
  const upperTenths = answer === "worse" ? anchor.scoreTenths : state.upperTenths;
  const suggestedTenths = suggestion(state.minTenths, state.maxTenths, lowerTenths, upperTenths);
  const candidate = history.length < MAX_COMPARISONS ? nextAnchor(state.anchors, lowerTenths, upperTenths) : null;
  // A further comparison cannot improve a range with at most one possible tenth.
  const first = lowerTenths === null ? state.minTenths : Math.max(state.minTenths, lowerTenths + 1);
  const last = upperTenths === null ? state.maxTenths : Math.min(state.maxTenths, upperTenths - 1);
  const currentAnchor = first < last ? candidate : null;
  return {
    ...state, lowerTenths, upperTenths, history, currentAnchor, suggestedTenths,
    finished: currentAnchor === null,
  };
}

export function rewindPersonalPlacement(state: PersonalPlacement): PersonalPlacement {
  const initial: PersonalPlacement = {
    ...state, lowerTenths: null, upperTenths: null,
    currentAnchor: nextAnchor(state.anchors, null, null), history: [],
    suggestedTenths: Math.round((state.minTenths + state.maxTenths) / 2),
    finished: state.anchors.length === 0,
  };
  return state.history.slice(0, -1).reduce((previous, step) => answerPersonalPlacement(previous, step.answer), initial);
}
