import test from "node:test";
import assert from "node:assert/strict";
import { generateFailureThreshold } from "../src/failure-threshold.js";

test("failure thresholds are reproducible for the same seed", () => {
  assert.equal(
    generateFailureThreshold("round-1"),
    generateFailureThreshold("round-1"),
  );
});

test("failure thresholds stay between four and seven attempts", () => {
  for (let index = 0; index < 100; index += 1) {
    const threshold = generateFailureThreshold(`round-${index}`);
    assert.ok(threshold >= 4 && threshold <= 7);
  }
});
