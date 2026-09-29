import test from "node:test";
import assert from "node:assert/strict";
import { initialGameState, transition, REQUIRED_HITS } from "../src/game/gatekeeper/state.ts";

test("idle cannot complete before starting", () => {
  assert.strictEqual(transition(initialGameState, "activate"), initialGameState);
  assert.strictEqual(transition(initialGameState, "miss"), initialGameState);
});

test("three activations succeed, and terminal success ignores further input", () => {
  let state = transition(initialGameState, "start");
  for (let i = 1; i <= REQUIRED_HITS; i++) {
    state = transition(state, "activate");
    assert.equal(state.hits, i);
    assert.equal(state.status, i === REQUIRED_HITS ? "success" : "playing");
  }
  assert.strictEqual(transition(state, "activate"), state);
  assert.strictEqual(transition(state, "miss"), state);
  assert.strictEqual(transition(state, "start"), state);
});

test("a miss fails the attempt and retry resets progress", () => {
  let state = transition(initialGameState, "start");
  state = transition(state, "activate");
  state = transition(state, "miss");
  assert.deepEqual(state, { status: "failure", hits: 1 });
  assert.strictEqual(transition(state, "activate"), state);
  assert.deepEqual(transition(state, "start"), { status: "playing", hits: 0 });
});
