import test from "node:test";
import assert from "node:assert/strict";
import { generateCatTarget, pointInCat } from "../src/cat-target.js";

test("the same seed generates the same cat target", () => {
  const options = { minArea: 0.04, maxArea: 0.09 };
  assert.deepEqual(
    generateCatTarget("cat", options, 0.5),
    generateCatTarget("cat", options, 0.5),
  );
});

test("different seeds change position without changing target size", () => {
  const options = { minArea: 0.04, maxArea: 0.09 };
  const first = generateCatTarget("first", options, 0.5);
  const second = generateCatTarget("second", options, 0.5);

  assert.equal(first.width, second.width);
  assert.equal(first.height, second.height);
  assert.equal(first.targetArea, second.targetArea);
  assert.notDeepEqual({ x: first.x, y: first.y }, { x: second.x, y: second.y });
});

test("cat targets stay inside the normalized playfield", () => {
  for (let index = 0; index < 500; index += 1) {
    const target = generateCatTarget(
      `cat-${index}`,
      { minArea: 0.01, maxArea: 0.18 },
      0.5,
    );
    assert.ok(target.x >= 0.1 && target.y >= 0.1);
    assert.ok(target.x + target.width <= 0.9);
    assert.ok(target.y + target.height <= 0.9);
  }
});

test("point-in-cat uses the eye target bounds", () => {
  const target = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
  assert.equal(pointInCat({ x: 0.6, y: 0.4 }, target), true);
  assert.equal(pointInCat({ x: 0.4, y: 0.4 }, target), true);
  assert.equal(pointInCat({ x: 0.1, y: 0.1 }, target), false);
});
