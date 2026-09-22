export type ComparisonAnswer = "better" | "worse" | "same";

export type ComparisonResult = {
  kind: "between" | "equal" | "above" | "below";
  lowerReference: number | null;
  upperReference: number | null;
  minTenths: number;
  maxTenths: number;
  suggestedTenths: number;
};

export type ComparisonState = {
  references: number[];
  lowerBound: number | null;
  upperBound: number | null;
  currentReference: number | null;
  history: { reference: number; answer: ComparisonAnswer }[];
  result: ComparisonResult | null;
  fallback: boolean;
};

function nearest(values: number[], target: number) {
  return values.reduce((best, value) =>
    Math.abs(value - target) < Math.abs(best - target) ? value : best);
}

export function startComparison(scores: number[]): ComparisonState {
  const references = [...new Set(scores.filter((score) => Number.isInteger(score) && score >= 2 && score <= 10))].sort((a, b) => a - b);
  return {
    references,
    lowerBound: null,
    upperBound: null,
    currentReference: references.length >= 2 ? (references.includes(5) ? 5 : nearest(references, 5)) : null,
    history: [],
    result: null,
    fallback: references.length < 2,
  };
}

export function answerComparison(state: ComparisonState, answer: ComparisonAnswer): ComparisonState {
  const reference = state.currentReference;
  if (state.fallback || state.result || reference === null) return state;
  const history = [...state.history, { reference, answer }];
  if (answer === "same") {
    return {
      ...state, history, currentReference: null,
      result: {
        kind: "equal", lowerReference: reference, upperReference: reference,
        minTenths: Math.max(20, reference * 10 - 9, state.lowerBound === null ? 20 : state.lowerBound * 10 + 1),
        maxTenths: Math.min(100, reference * 10 + 9, state.upperBound === null ? 100 : state.upperBound * 10 - 1),
        suggestedTenths: reference * 10,
      },
    };
  }

  const lowerBound = answer === "better" ? reference : state.lowerBound;
  const upperBound = answer === "worse" ? reference : state.upperBound;
  const remaining = state.references.filter((score) =>
    (lowerBound === null || score > lowerBound) && (upperBound === null || score < upperBound));
  if (remaining.length) {
    const target = lowerBound !== null && upperBound !== null
      ? (lowerBound + upperBound) / 2
      : remaining[(remaining.length - 1) >> 1];
    return {
      ...state, lowerBound, upperBound, history,
      currentReference: nearest(remaining, target),
    };
  }

  const minTenths = lowerBound === null ? 20 : Math.min(100, lowerBound * 10 + 1);
  const maxTenths = upperBound === null ? 100 : Math.max(20, upperBound * 10 - 1);
  return {
    ...state, lowerBound, upperBound, history, currentReference: null,
    result: {
      kind: lowerBound === null ? "below" : upperBound === null ? "above" : "between",
      lowerReference: lowerBound,
      upperReference: upperBound,
      minTenths,
      maxTenths,
      suggestedTenths: Math.round((minTenths + maxTenths) / 2),
    },
  };
}

export function rewindComparison(state: ComparisonState): ComparisonState {
  return state.history.slice(0, -1).reduce(
    (previous, step) => answerComparison(previous, step.answer),
    startComparison(state.references),
  );
}

export function manualScoreFromIndex(index: number) {
  if (!Number.isInteger(index) || index < 0 || index > 82) throw new RangeError("Invalid manual rating index");
  return index <= 1 ? index : (index + 18) / 10;
}

export function manualIndexFromScore(score: number) {
  if (score === 0 || score === 1) return score;
  const tenths = Math.round(score * 10);
  if (score >= 2 && score <= 10 && Math.abs(score * 10 - tenths) < 1e-9) return tenths - 18;
  throw new RangeError("Invalid rating");
}
