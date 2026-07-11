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
    assert.equal(first.hitWidth, second.hitWidth);
    assert.equal(first.hitHeight, second.hitHeight);
  assert.equal(first.targetArea, second.targetArea);
  assert.notDeepEqual({ x: first.x, y: first.y }, { x: second.x, y: second.y });
});

test("hit area remains physically circular for the viewport aspect ratio", () => {
  const viewportAspect = 0.5;
  const target = generateCatTarget(
    "circle",
    { minArea: 0.04, maxArea: 0.09 },
    viewportAspect,
  );
  assert.ok(Math.abs(target.hitWidth * viewportAspect - target.hitHeight) < 1e-12);
});

test("cat targets stay inside the normalized playfield", () => {
  for (let index = 0; index < 500; index += 1) {
    const target = generateCatTarget(
      `cat-${index}`,
      { minArea: 0.01, maxArea: 0.18 },
      0.5,
    );
    assert.ok(target.hitX >= 0.1 && target.hitY >= 0.1);
    assert.ok(target.hitX + target.hitWidth <= 0.9);
    assert.ok(target.hitY + target.hitHeight <= 0.9);
  }
});

test("point-in-cat uses a circular hit area", () => {
  const target = { hitX: 0.2, hitY: 0.2, hitWidth: 0.6, hitHeight: 0.6 };
  assert.equal(pointInCat({ x: 0.5, y: 0.5 }, target), true);
  assert.equal(pointInCat({ x: 0.22, y: 0.22 }, target), false);
  assert.equal(pointInCat({ x: 0.1, y: 0.1 }, target), false);
});
