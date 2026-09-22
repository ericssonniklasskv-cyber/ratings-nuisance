import test from "node:test";
import assert from "node:assert/strict";
import {
  answerComparison, manualIndexFromScore, manualScoreFromIndex, rewindComparison, startComparison,
} from "../src/lib/rating-comparison.ts";

const allReferences = [2, 3, 4, 5, 6, 7, 8, 9, 10];

test("searches upward in a few comparisons and finds 6–7", () => {
  let state = startComparison(allReferences);
  assert.equal(state.currentReference, 5);
  state = answerComparison(state, "better");
  assert.equal(state.currentReference, 8);
  state = answerComparison(state, "worse");
  assert.equal(state.currentReference, 6);
  state = answerComparison(state, "better");
  assert.equal(state.currentReference, 7);
  state = answerComparison(state, "worse");
  assert.deepEqual([state.result?.lowerReference, state.result?.upperReference], [6, 7]);
  assert.deepEqual([state.result?.minTenths, state.result?.maxTenths], [61, 69]);
});

test("searches downward from 5", () => {
  let state = startComparison(allReferences);
  state = answerComparison(state, "worse");
  assert.equal(state.currentReference, 3);
  state = answerComparison(state, "better");
  assert.equal(state.currentReference, 4);
  state = answerComparison(state, "worse");
  assert.deepEqual([state.result?.lowerReference, state.result?.upperReference], [3, 4]);
});

test("about the same proposes the reference's whole-number score", () => {
  const state = answerComparison(startComparison(allReferences), "same");
  assert.equal(state.result?.kind, "equal");
  assert.equal(state.result?.suggestedTenths, 50);
});

test("missing reference selects another available midpoint", () => {
  const state = answerComparison(startComparison([2, 3, 5, 6, 7, 9, 10]), "better");
  assert.equal(state.currentReference, 7);
  assert.equal(startComparison([2, 4, 6, 8]).currentReference, 4);
});

test("fewer than two references offers manual fallback", () => {
  assert.equal(startComparison([]).fallback, true);
  assert.equal(startComparison([5]).currentReference, null);
  assert.equal(startComparison([5]).fallback, true);
});

test("manual scale preserves special scores 0 and 1", () => {
  assert.equal(manualScoreFromIndex(0), 0);
  assert.equal(manualScoreFromIndex(1), 1);
  assert.equal(manualScoreFromIndex(2), 2);
  assert.equal(manualScoreFromIndex(82), 10);
  assert.equal(manualIndexFromScore(6.7), 49);
});

test("back restores the previous comparison, including from fine tuning", () => {
  const first = startComparison(allReferences);
  const second = answerComparison(first, "better");
  const third = answerComparison(second, "same");
  assert.equal(rewindComparison(third).currentReference, second.currentReference);
  assert.deepEqual(rewindComparison(third).history, second.history);
  assert.equal(rewindComparison(second).currentReference, first.currentReference);
});
