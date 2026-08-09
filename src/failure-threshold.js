import { createRandom, hashSeed } from "./geometry.js";

export function generateFailureThreshold(seed, minimum = 4, maximum = 7) {
  const random = createRandom(hashSeed(seed));
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}
