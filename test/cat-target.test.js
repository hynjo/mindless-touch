import test from "node:test";
import assert from "node:assert/strict";
import { generateCatTarget, pointInCat } from "../src/cat-target.js";

const sprite = {
  width: 2,
  height: 2,
  coverage: 0.5,
  alpha: new Uint8Array([0, 255, 255, 0]),
};

test("the same seed generates the same cat target", () => {
  const options = { minArea: 0.04, maxArea: 0.09 };
  assert.deepEqual(
    generateCatTarget("cat", sprite, options, 0.5),
    generateCatTarget("cat", sprite, options, 0.5),
  );
});

test("cat targets stay inside the normalized playfield", () => {
  for (let index = 0; index < 500; index += 1) {
    const target = generateCatTarget(
      `cat-${index}`,
      sprite,
      { minArea: 0.01, maxArea: 0.18 },
      0.5,
    );
    assert.ok(target.x >= 0 && target.y >= 0);
    assert.ok(target.x + target.width <= 1);
    assert.ok(target.y + target.height <= 1);
  }
});

test("point-in-cat uses the sprite alpha mask", () => {
  const target = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
  assert.equal(pointInCat({ x: 0.6, y: 0.4 }, target, sprite), true);
  assert.equal(pointInCat({ x: 0.4, y: 0.4 }, target, sprite), false);
  assert.equal(pointInCat({ x: 0.1, y: 0.1 }, target, sprite), false);
});
