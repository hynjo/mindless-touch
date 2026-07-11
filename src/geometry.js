const TAU = Math.PI * 2;

export function hashSeed(value) {
  let hash = 2166136261;
  const text = String(value);

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function polygonArea(points) {
  let sum = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    sum += current.x * next.y - next.x * current.y;
  }

  return Math.abs(sum) / 2;
}

export function pointInPolygon(point, polygon) {
  let inside = false;

  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
    const a = polygon[current];
    const b = polygon[previous];
    const crosses = a.y > point.y !== b.y > point.y
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;

    if (crosses) inside = !inside;
  }

  return inside;
}

function boundsOf(points) {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
}

export function generateBlob(seed, options = {}) {
  const {
    minArea = 0.08,
    maxArea = 0.2,
    minVertices = 6,
    maxVertices = 12,
    margin = 0.04,
  } = options;
  const random = createRandom(hashSeed(seed));
  const vertexCount = minVertices + Math.floor(random() * (maxVertices - minVertices + 1));
  const targetArea = minArea + random() * (maxArea - minArea);
  const angleStep = TAU / vertexCount;
  const originPoints = [];

  for (let index = 0; index < vertexCount; index += 1) {
    const angle = index * angleStep + (random() - 0.5) * angleStep * 0.55;
    const radius = 0.68 + random() * 0.32;
    originPoints.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }

  const scale = Math.sqrt(targetArea / polygonArea(originPoints));
  const scaled = originPoints.map((point) => ({ x: point.x * scale, y: point.y * scale }));
  const bounds = boundsOf(scaled);
  const centerX = margin - bounds.minX + random() * Math.max(0, 1 - margin * 2 - (bounds.maxX - bounds.minX));
  const centerY = margin - bounds.minY + random() * Math.max(0, 1 - margin * 2 - (bounds.maxY - bounds.minY));
  const points = scaled.map((point) => ({ x: point.x + centerX, y: point.y + centerY }));

  return { points, targetArea, seed: String(seed) };
}
