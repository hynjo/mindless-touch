import { createRandom, hashSeed } from "./geometry.js";

export async function loadCatSprite(url) {
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", reject, { once: true });
    image.src = url;
  });

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0);
  const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const { data } = imageData;
  let minX = sourceCanvas.width;
  let minY = sourceCanvas.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < sourceCanvas.height; y += 1) {
    for (let x = 0; x < sourceCanvas.width; x += 1) {
      const index = (y * sourceCanvas.width + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const isChromaGreen = green > 150 && green > red * 1.35 && green > blue * 1.35;
      data[index + 3] = isChromaGreen ? 0 : 255;
      if (!isChromaGreen) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  sourceContext.putImageData(imageData, 0, 0);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(sourceCanvas, minX, minY, width, height, 0, 0, width, height);
  const croppedData = context.getImageData(0, 0, width, height).data;
  const alpha = new Uint8Array(width * height);
  let opaquePixels = 0;

  for (let index = 0; index < alpha.length; index += 1) {
    alpha[index] = croppedData[index * 4 + 3];
    if (alpha[index] > 127) opaquePixels += 1;
  }

  return { canvas, width, height, alpha, coverage: opaquePixels / alpha.length };
}

export function generateCatTarget(seed, sprite, options, viewportAspect) {
  const { minArea, maxArea, margin = 0.04 } = options;
  const random = createRandom(hashSeed(seed));
  const targetArea = minArea + random() * (maxArea - minArea);
  const boxArea = targetArea / sprite.coverage;
  const spriteAspect = sprite.width / sprite.height;
  let height = Math.sqrt((boxArea * viewportAspect) / spriteAspect);
  let width = (spriteAspect / viewportAspect) * height;
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

export function pointInCat(point, target, sprite) {
  const localX = (point.x - target.x) / target.width;
  const localY = (point.y - target.y) / target.height;
  if (localX < 0 || localX > 1 || localY < 0 || localY > 1) return false;
  const x = Math.min(sprite.width - 1, Math.floor(localX * sprite.width));
  const y = Math.min(sprite.height - 1, Math.floor(localY * sprite.height));
  return sprite.alpha[y * sprite.width + x] > 127;
}
