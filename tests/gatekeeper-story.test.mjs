import test from "node:test";
import assert from "node:assert/strict";
import { firstGatekeeperStep, gatekeeperStory, isCorrectGatekeeperAnswer } from "../src/lib/gatekeeper-story.ts";

function follow(start, optionIds = []) {
  let id = start;
  const seen = new Set();
  const choices = [...optionIds];
  while (id !== "question") {
    assert.ok(!seen.has(id), `story loops at ${id}`);
    seen.add(id);
    const step = gatekeeperStory[id];
    assert.ok(step, `missing story beat ${id}`);
    if (step.kind === "line") {
      id = step.next;
    } else if (step.kind === "choice") {
      const selectedId = choices.shift();
      const option = step.options.find((candidate) => candidate.id === selectedId);
      assert.ok(option, `missing selected option for ${id}`);
      assert.ok(option.next, `selected option ${option.id} has no destination`);
      id = option.next;
    } else {
      assert.fail(`unexpected answer beat ${id}`);
    }
  }
  assert.deepEqual(choices, []);
  return seen;
}

test("all authored story destinations exist", () => {
  for (const [id, step] of Object.entries(gatekeeperStory)) {
    if (step.kind === "line") assert.ok(gatekeeperStory[step.next], `${id} -> ${step.next}`);
    if (step.kind === "choice") {
      for (const option of step.options) {
        if (option.next) assert.ok(gatekeeperStory[option.next], `${id}/${option.id} -> ${option.next}`);
      }
    }
  }
});

test("both opening choices remain visible, but 0B skips its unwritten reply", () => {
  const opening = gatekeeperStory["opening-choice"];
  assert.equal(opening.kind, "choice");
  assert.deepEqual(opening.options.map(({ id }) => id), ["0A", "0B"]);
  assert.equal(opening.options[1].next, "chapter-two-1");
  assert.ok(follow(firstGatekeeperStep, ["0B", "2C", "3A"]).has("chapter-two-1"));
});

test("each authored branch can reach the final question", () => {
  assert.ok(follow(firstGatekeeperStep, ["0A", "1A", "2C", "3A"]).has("kill-a-reply"));
  assert.ok(follow(firstGatekeeperStep, ["0A", "1B", "2C", "3B"]).has("weeb-reply"));
  assert.ok(follow(firstGatekeeperStep, ["0A", "1C", "1CA", "2C", "3A"]).has("kill-c-choice"));
  assert.ok(follow(firstGatekeeperStep, ["0A", "1C", "1CB", "2C", "3A"]).has("kill-c-choice"));
});

test("final answer accepts harmless casing and spacing variants only", () => {
  assert.equal(isCorrectGatekeeperAnswer(" Emma   Stone "), true);
  assert.equal(isCorrectGatekeeperAnswer("EMMA STONE"), true);
  assert.equal(isCorrectGatekeeperAnswer("Emma"), false);
  assert.equal(isCorrectGatekeeperAnswer("La La Land"), false);
});
