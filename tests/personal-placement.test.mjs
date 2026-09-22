import test from "node:test";
import assert from "node:assert/strict";
import { answerPersonalPlacement, rewindPersonalPlacement, startPersonalPlacement } from "../src/lib/personal-placement.ts";

const between = { kind: "between", lowerReference: 6, upperReference: 7, minTenths: 61, maxTenths: 69, suggestedTenths: 65 };
const current = { mediaType: "movie", tmdbId: 100 };
const anchor = (score, id = String(score), updatedAt = "2026-09-20") => ({
  titleId: id, mediaType: "movie", tmdbId: Number(id.replace(/\D/g, "")) || 1,
  title: `Film ${id}`, posterPath: null, score, updatedAt,
});
const start = (ratings, result = between) => startPersonalPlacement(ratings, result, current);

test("A: narrows between personal anchors and suggests 6.7", () => {
  let state = start([6.6, 6.8].map((score) => anchor(score)));
  assert.equal(state.currentAnchor?.scoreTenths, 66);
  state = answerPersonalPlacement(state, "better");
  assert.equal(state.currentAnchor?.scoreTenths, 68);
  state = answerPersonalPlacement(state, "worse");
  assert.equal(state.suggestedTenths, 67);
  assert.equal(state.finished, true);
});

test("B and C: below or above all anchors stays within reference bounds", () => {
  const ratings = [6.2, 6.4, 6.6, 6.8].map((score) => anchor(score));
  let low = start(ratings);
  low = answerPersonalPlacement(low, "worse");
  low = answerPersonalPlacement(low, "worse");
  assert.equal(low.suggestedTenths, 61);
  let high = start(ratings);
  high = answerPersonalPlacement(high, "better");
  high = answerPersonalPlacement(high, "better");
  assert.ok(high.suggestedTenths >= 67 && high.suggestedTenths <= 69);
});

test("D: same immediately chooses the anchor rating", () => {
  const state = answerPersonalPlacement(start([anchor(6.4)]), "same");
  assert.equal(state.suggestedTenths, 64);
  assert.equal(state.finished, true);
});

test("E: duplicate scores count once and newest title is representative", () => {
  const state = start([anchor(6.5, "a", "2026-09-18"), anchor(6.5, "b", "2026-09-21"), anchor(6.5, "c", "2026-09-19"), anchor(6.8)]);
  assert.deepEqual(state.anchors.map((item) => item.scoreTenths), [65, 68]);
  assert.equal(state.anchors[0].titleId, "b");
});

test("F, G, H: zero, one, and two anchors", () => {
  assert.equal(start([]).finished, true);
  const one = answerPersonalPlacement(start([anchor(6.4)]), "better");
  assert.equal(one.finished, true);
  assert.ok(one.suggestedTenths > 64);
  let two = start([anchor(6.2), anchor(6.8)]);
  two = answerPersonalPlacement(two, "better");
  two = answerPersonalPlacement(two, "worse");
  assert.equal(two.suggestedTenths, 65);
});

test("I: rate again excludes same TMDb identity and stored title ID", () => {
  const byTmdb = { ...anchor(6.6, "self"), tmdbId: 100 };
  const byTitleId = { ...anchor(6.7, "stored"), tmdbId: 999 };
  const state = startPersonalPlacement([byTmdb, byTitleId, anchor(6.4)], between, { ...current, titleId: "stored" });
  assert.deepEqual(state.anchors.map((item) => item.scoreTenths), [64]);
});

test("J and O: back reconstructs previous pair and its decision", () => {
  let state = start([anchor(6.2), anchor(6.4), anchor(6.6), anchor(6.8)]);
  const first = state.currentAnchor?.scoreTenths;
  state = answerPersonalPlacement(state, "better");
  const second = state.currentAnchor?.scoreTenths;
  state = answerPersonalPlacement(state, "worse");
  const rewound = rewindPersonalPlacement(state);
  assert.equal(rewound.currentAnchor?.scoreTenths, second);
  assert.deepEqual(rewound.history, [{ scoreTenths: first, answer: "better" }]);
  assert.equal(rewindPersonalPlacement(rewound).currentAnchor?.scoreTenths, first);
});

test("K and L: hard bounds, wider missing-reference range, and adjacent tenths", () => {
  const adjacentRange = { ...between, minTenths: 61, maxTenths: 70 };
  let state = start([anchor(6.8), anchor(6.9)], adjacentRange);
  state = answerPersonalPlacement(state, "better");
  assert.equal(state.currentAnchor?.scoreTenths, 69);
  state = answerPersonalPlacement(state, "worse");
  assert.equal(state.finished, true);
  assert.equal(state.suggestedTenths, 69);
  const wide = { ...between, minTenths: 51, maxTenths: 79 };
  assert.deepEqual(start([anchor(5.4), anchor(7.2), anchor(8.0)], wide).anchors.map((item) => item.scoreTenths), [54, 72]);
});

test("M: at most two decisions with many ratings", () => {
  let state = start(Array.from({ length: 9 }, (_, index) => anchor(6.1 + index / 10)));
  for (let i = 0; i < 5 && !state.finished; i++) state = answerPersonalPlacement(state, "better");
  assert.equal(state.finished, true);
  assert.ok(state.history.length <= 2);
});

test("N: equal reference keeps its exact score as default", () => {
  const equal = { ...between, kind: "equal", minTenths: 41, maxTenths: 59, suggestedTenths: 50 };
  const state = start([anchor(5.2)], equal);
  assert.equal(state.suggestedTenths, 50);
  // Whether to begin optional personal tuning is a UI decision.
});
