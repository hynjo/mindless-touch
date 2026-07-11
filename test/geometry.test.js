import test from "node:test";
import assert from "node:assert/strict";
import { generateBlob, pointInPolygon, polygonArea } from "../src/geometry.js";

test("the same seed generates the same blob", () => {
  assert.deepEqual(generateBlob("repeatable"), generateBlob("repeatable"));
});

test("generated blobs stay inside the normalized playfield", () => {
  for (let index = 0; index < 500; index += 1) {
    const blob = generateBlob(`bounds-${index}`);
    for (const point of blob.points) {
      assert.ok(point.x >= 0 && point.x <= 1, `x out of bounds for seed ${index}`);
      assert.ok(point.y >= 0 && point.y <= 1, `y out of bounds for seed ${index}`);
    }
  }
});

test("generated blob areas remain within the configured range", () => {
  for (let index = 0; index < 500; index += 1) {
    const area = polygonArea(generateBlob(`area-${index}`).points);
    assert.ok(area >= 0.08 - Number.EPSILON);
    assert.ok(area <= 0.2 + Number.EPSILON);
  }
});

test("point-in-polygon detects inside and outside points", () => {
  const square = [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.75, y: 0.75 },
    { x: 0.25, y: 0.75 },
  ];

  assert.equal(pointInPolygon({ x: 0.5, y: 0.5 }, square), true);
  assert.equal(pointInPolygon({ x: 0.1, y: 0.1 }, square), false);
});
