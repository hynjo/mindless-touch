import { SoundEngine } from "./audio.js";
import { generateBlob, pointInPolygon } from "./geometry.js";

const canvas = document.querySelector("#playfield");
const context = canvas.getContext("2d");
const app = document.querySelector("#app");
const status = document.querySelector("#status");
const params = new URLSearchParams(window.location.search);
const debug = params.get("debug") === "1";
const baseSeed = params.get("seed") ?? crypto.randomUUID();
const sound = new SoundEngine();
const MAX_TAP_MOVEMENT = 10;

let phase = "idle";
let round = 0;
let blob = null;
let misses = [];
let correctTap = null;
let pointerStart = null;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 3);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}

function toPixels(point) {
  return { x: point.x * window.innerWidth, y: point.y * window.innerHeight };
}

function traceBlob() {
  const [first, ...rest] = blob.points.map(toPixels);
  context.beginPath();
  context.moveTo(first.x, first.y);
  rest.forEach((point) => context.lineTo(point.x, point.y));
  context.closePath();
}

function drawPoint(point, radius, fill, stroke = null) {
  const pixel = toPixels(point);
  context.beginPath();
  context.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.lineWidth = 2;
    context.strokeStyle = stroke;
    context.stroke();
  }
}

function draw() {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (!blob || (phase !== "revealed" && !debug)) return;

  traceBlob();
  context.fillStyle = phase === "revealed" ? "#d7ff45" : "rgba(215, 255, 69, 0.2)";
  context.fill();

  if (phase === "revealed") {
    misses.forEach((point) => drawPoint(point, 3, "rgba(255, 255, 255, 0.55)"));
    drawPoint(correctTap, 7, "#111111", "#ffffff");
  }
}

function beginRound() {
  round += 1;
  blob = generateBlob(`${baseSeed}:${round}`);
  misses = [];
  correctTap = null;
  phase = "playing";
  app.setAttribute("aria-label", "Find the hidden shape");
  status.textContent = "A new round has started.";
  draw();
  sound.playProblem();
}

async function handleTap(point) {
  if (phase === "idle") {
    phase = "unlocking";
    await sound.unlock();
    beginRound();
    return;
  }

  if (phase === "unlocking") return;

  if (phase === "revealed") {
    beginRound();
    return;
  }

  if (pointInPolygon(point, blob.points)) {
    correctTap = point;
    phase = "revealed";
    app.setAttribute("aria-label", "Correct. Tap again to start the next round");
    status.textContent = `Correct. You found it in ${misses.length + 1} taps.`;
    sound.playCorrect();
    draw();
    return;
  }

  misses.push(point);
  sound.playWrong();
  draw();
}

canvas.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || pointerStart) return;
  pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointerup", (event) => {
  if (!pointerStart || pointerStart.id !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (distance > MAX_TAP_MOVEMENT) return;

  void handleTap({
    x: Math.min(1, Math.max(0, event.clientX / window.innerWidth)),
    y: Math.min(1, Math.max(0, event.clientY / window.innerHeight)),
  });
});

canvas.addEventListener("pointercancel", () => { pointerStart = null; });
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
