import { createRandom, hashSeed } from "./geometry.js";

const EYES_ASPECT_RATIO = 2.4;

export function generateCatTarget(seed, options, viewportAspect) {
  const { minArea, maxArea, margin = 0.1 } = options;
  const random = createRandom(hashSeed(seed));
  const targetArea = (minArea + maxArea) / 2;
  let height = Math.sqrt((targetArea * viewportAspect) / EYES_ASPECT_RATIO);
  let width = (EYES_ASPECT_RATIO / viewportAspect) * height;
  const maxDimension = 1 - margin * 2;
  const fitScale = Math.min(1, maxDimension / width, maxDimension / height);
  width *= fitScale;
  height *= fitScale;

  return {
    x: margin + random() * (1 - margin * 2 - width),
    y: margin + random() * (1 - margin * 2 - height),
    width,
    height,
    targetArea: targetArea * fitScale * fitScale,
  };
}

export function pointInCat(point, target) {
  return point.x >= target.x
    && point.x <= target.x + target.width
    && point.y >= target.y
    && point.y <= target.y + target.height;
}
