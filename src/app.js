import { SoundEngine } from "./audio.js";
import { generateBlob, pointInPolygon } from "./geometry.js";

const canvas = document.querySelector("#playfield");
const context = canvas.getContext("2d");
const app = document.querySelector("#app");
const status = document.querySelector("#status");
const params = new URLSearchParams(window.location.search);
const debug = params.get("debug") === "1";
const MAX_MOUSE_MOVEMENT = 10;
const MAX_TOUCH_MOVEMENT = 24;

const debugPanel = debug ? document.createElement("output") : null;
if (debugPanel) {
  debugPanel.className = "debug-panel";
  app.append(debugPanel);

  window.addEventListener("error", (event) => {
    debugPanel.textContent = `Initialization error:\n${event.message}`;
  });

  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
    debugPanel.textContent = `Unhandled rejection:\n${message}`;
  });
}

const fallbackSeed = `${Date.now()}-${Math.random()}`;
const generatedSeed = globalThis.crypto?.randomUUID?.() ?? fallbackSeed;
const baseSeed = params.get("seed") ?? generatedSeed;
const sound = new SoundEngine();

let phase = "idle";
let round = 0;
let blob = null;
let misses = [];
let correctTap = null;
let mouseStart = null;
const touchStarts = new Map();
let audioDebug = {
  state: "not-created",
  sampleRate: null,
  playbackLatency: null,
  error: null,
};
let lastAudioAction = "waiting for first tap";
let lastInputAction = "none";
let lastTouchAt = 0;

function updateDebugPanel() {
  if (!debugPanel) return;

  debugPanel.textContent = [
    `AudioContext: ${audioDebug.state}`,
    `Sample rate: ${audioDebug.sampleRate ?? "n/a"}`,
    `Playback latency: ${audioDebug.playbackLatency ?? "n/a"} ms`,
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

function handleTap(point, startedPhase = phase, startedRound = round) {
  sound.unlock();

  if (startedPhase === "idle") {
    if (phase === "idle") beginRound();
    return;
  }

  if (startedPhase === "revealed") {
    if (phase === "revealed" && round === startedRound) beginRound();
    return;
  }

  if (phase !== "playing" || round !== startedRound) return;

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

function normalizePoint(x, y) {
  return {
    x: Math.min(1, Math.max(0, x / window.innerWidth)),
    y: Math.min(1, Math.max(0, y / window.innerHeight)),
  };
}

function finishTap(start, x, y, inputType, maxMovement) {
  const distance = Math.hypot(x - start.x, y - start.y);
  if (distance > maxMovement) return;
  lastInputAction = inputType;
  updateDebugPanel();
  handleTap(normalizePoint(x, y), start.phase, start.round);
}

canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  lastTouchAt = performance.now();

  for (const touch of event.changedTouches) {
    touchStarts.set(touch.identifier, {
      x: touch.clientX,
      y: touch.clientY,
      phase,
      round,
    });
  }

  lastInputAction = `touchstart (${event.changedTouches.length})`;
  updateDebugPanel();
}, { passive: false });

canvas.addEventListener("touchend", (event) => {
  event.preventDefault();
  lastTouchAt = performance.now();

  for (const touch of event.changedTouches) {
    const start = touchStarts.get(touch.identifier);
    touchStarts.delete(touch.identifier);
    if (!start) continue;
    finishTap(start, touch.clientX, touch.clientY, "touchend", MAX_TOUCH_MOVEMENT);
  }
}, { passive: false });

canvas.addEventListener("touchcancel", (event) => {
  for (const touch of event.changedTouches) touchStarts.delete(touch.identifier);
});

canvas.addEventListener("mousedown", (event) => {
  if (event.button !== 0 || mouseStart || performance.now() - lastTouchAt < 800) return;
  mouseStart = { x: event.clientX, y: event.clientY, phase, round };
  lastInputAction = "mousedown";
  updateDebugPanel();
});

canvas.addEventListener("mouseup", (event) => {
  if (!mouseStart) return;
  const start = mouseStart;
  mouseStart = null;
  finishTap(start, event.clientX, event.clientY, "mouseup", MAX_MOUSE_MOVEMENT);
});

canvas.addEventListener("mouseleave", () => {
  mouseStart = null;
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
