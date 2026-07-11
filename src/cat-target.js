import { createRandom, hashSeed } from "./geometry.js";

const EYES_ASPECT_RATIO = 2.4;
const HIT_DIAMETER_FACTOR = 1.3;

export function generateCatTarget(seed, options, viewportAspect) {
  const { minArea, maxArea, margin = 0.1 } = options;
  const random = createRandom(hashSeed(seed));
  const targetArea = (minArea + maxArea) / 2;
  let height = Math.sqrt((targetArea * viewportAspect) / EYES_ASPECT_RATIO);
  let width = (EYES_ASPECT_RATIO / viewportAspect) * height;
  let hitWidth = width * HIT_DIAMETER_FACTOR;
  let hitHeight = hitWidth * viewportAspect;
  const maxDimension = 1 - margin * 2;
  const fitScale = Math.min(
    1,
    maxDimension / hitWidth,
    maxDimension / hitHeight,
  );
  width *= fitScale;
  height *= fitScale;
  hitWidth *= fitScale;
  hitHeight *= fitScale;
  const hitX = margin + random() * (1 - margin * 2 - hitWidth);
  const hitY = margin + random() * (1 - margin * 2 - hitHeight);

  return {
    x: hitX + (hitWidth - width) / 2,
    y: hitY + height * 0.8,
    width,
    height,
    hitX,
    hitY,
    hitWidth,
    hitHeight,
    targetArea: (hitWidth * hitHeight * Math.PI) / 4,
  };
}

export function pointInCat(point, target) {
  const radiusX = target.hitWidth / 2;
  const radiusY = target.hitHeight / 2;
  const distanceX = (point.x - (target.hitX + radiusX)) / radiusX;
  const distanceY = (point.y - (target.hitY + radiusY)) / radiusY;
  return distanceX * distanceX + distanceY * distanceY <= 1;
}
