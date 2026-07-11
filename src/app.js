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

const debugPanel = debug ? document.createElement("output") : null;
if (debugPanel) {
  debugPanel.className = "debug-panel";
  app.append(debugPanel);
}

let phase = "idle";
let round = 0;
let blob = null;
let misses = [];
let correctTap = null;
let inputStart = null;
let audioDebug = { state: "not-created", sampleRate: null, error: null };
let lastAudioAction = "waiting for first tap";
let lastInputAction = "none";

function updateDebugPanel() {
  if (!debugPanel) return;

  debugPanel.textContent = [
    `AudioContext: ${audioDebug.state}`,
    `Sample rate: ${audioDebug.sampleRate ?? "n/a"}`,
    `Game phase: ${phase}`,
    `Last input: ${lastInputAction}`,
    `Last action: ${lastAudioAction}`,
    `Error: ${audioDebug.error ?? "none"}`,
  ].join("\n");
}

sound.onStateChange((details) => {
  audioDebug = details;
  updateDebugPanel();
});

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
  lastAudioAction = "playProblem";
  updateDebugPanel();
  sound.playProblem();
}

function handleTap(point) {
  sound.unlock();

  if (phase === "idle") {
    beginRound();
    return;
  }

  if (phase === "revealed") {
    beginRound();
    return;
  }

  if (pointInPolygon(point, blob.points)) {
    correctTap = point;
    phase = "revealed";
    app.setAttribute("aria-label", "Correct. Tap again to start the next round");
    status.textContent = `Correct. You found it in ${misses.length + 1} taps.`;
    lastAudioAction = "playCorrect";
    updateDebugPanel();
    sound.playCorrect();
    draw();
    return;
  }

  misses.push(point);
  lastAudioAction = "playWrong";
  updateDebugPanel();
  sound.playWrong();
  draw();
}

function finishTap(x, y, inputType) {
  if (!inputStart) return;
  const distance = Math.hypot(x - inputStart.x, y - inputStart.y);
  inputStart = null;
  if (distance > MAX_TAP_MOVEMENT) return;

  lastInputAction = inputType;
  updateDebugPanel();
  handleTap({
    x: Math.min(1, Math.max(0, x / window.innerWidth)),
    y: Math.min(1, Math.max(0, y / window.innerHeight)),
  });
}

if ("ontouchstart" in window) {
  canvas.addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (event.touches.length !== 1 || inputStart) return;
    const touch = event.touches[0];
    inputStart = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
    lastInputAction = "touchstart";
    updateDebugPanel();
  }, { passive: false });

  canvas.addEventListener("touchend", (event) => {
    event.preventDefault();
    if (!inputStart) return;
    const touch = Array.from(event.changedTouches)
      .find((changedTouch) => changedTouch.identifier === inputStart.id);
    if (!touch) return;
    finishTap(touch.clientX, touch.clientY, "touchend");
  }, { passive: false });

  canvas.addEventListener("touchcancel", () => { inputStart = null; });
} else {
  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || inputStart) return;
    inputStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    lastInputAction = "pointerdown";
    updateDebugPanel();
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!inputStart || inputStart.id !== event.pointerId) return;
    finishTap(event.clientX, event.clientY, "pointerup");
  });

  canvas.addEventListener("pointercancel", () => { inputStart = null; });
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
