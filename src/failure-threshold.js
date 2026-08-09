import { createRandom, hashSeed } from "./geometry.js";

export function generateFailureThreshold(
  seed,
  minimum = 4,
  maximum = 7,
  excluded = null,
) {
  const random = createRandom(hashSeed(seed));
  const choices = [];
  for (let value = minimum; value <= maximum; value += 1) {
    if (value !== excluded) choices.push(value);
  }
  if (choices.length === 0) return minimum;
  return choices[Math.floor(random() * choices.length)];
}
