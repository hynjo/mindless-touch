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
const MIN_FOUND_INTERVAL = 40;
const MAX_FOUND_INTERVAL = 450;
const DEFAULT_LEVEL = 5;
const MIN_LEVEL = 1;
const MAX_LEVEL = 10;
const requestedLevel = Number.parseInt(params.get("level"), 10);
const level = Number.isNaN(requestedLevel)
  ? DEFAULT_LEVEL
  : Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, requestedLevel));
const maxArea = 0.18 * (0.8 ** (level - 1));
const difficulty = { minArea: maxArea * 0.5, maxArea };

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
let foundAt = null;
let foundTimer = null;
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
    `Level: ${level}`,
    `Target area: ${blob ? `${(blob.targetArea * 100).toFixed(1)}%` : "n/a"}`,
    `Found chain: ${phase === "found" ? "active" : "inactive"}`,
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
  const isRevealed = phase === "revealing" || phase === "revealed" || phase === "transitioning";
  if (!blob || (!isRevealed && !debug)) return;

  traceBlob();
  context.fillStyle = isRevealed ? "#d7ff45" : "rgba(215, 255, 69, 0.2)";
  context.fill();

  if (isRevealed) {
    misses.forEach((point) => drawPoint(point, 3, "rgba(255, 255, 255, 0.55)"));
    drawPoint(correctTap, 7, "#111111", "#ffffff");
  }
}

function clearFoundChain() {
  if (foundTimer !== null) window.clearTimeout(foundTimer);
  foundTimer = null;
  foundAt = null;
}

function startFoundChain() {
  clearFoundChain();
  foundAt = performance.now();
  const foundRound = round;
  foundTimer = window.setTimeout(() => {
    if (phase !== "found" || round !== foundRound) return;
    foundAt = null;
    foundTimer = null;
    phase = "playing";
    app.setAttribute("aria-label", "Find the hidden shape");
    status.textContent = "Find the hidden shape.";
    updateDebugPanel();
  }, MAX_FOUND_INTERVAL);
}

function beginRound() {
  round += 1;
  blob = generateBlob(`${baseSeed}:${round}`, difficulty);
  misses = [];
  correctTap = null;
  clearFoundChain();
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

  if (startedPhase === "found") {
    if (phase !== "found" || round !== startedRound) return;

    const interval = performance.now() - foundAt;

    if (interval < MIN_FOUND_INTERVAL
      || interval > MAX_FOUND_INTERVAL
      || !pointInPolygon(point, blob.points)) {
      clearFoundChain();
      phase = "playing";
      misses.push(point);
      lastAudioAction = "playWrong";
      updateDebugPanel();
      sound.playWrong();
      return;
    }

    clearFoundChain();
    correctTap = point;
    phase = "revealing";
    app.setAttribute("aria-label", "Shape revealed. Wait for the sound to finish");
    status.textContent = "Shape revealed. Wait for the sound to finish.";
    lastAudioAction = "playReveal";
    draw();
    updateDebugPanel();
    sound.playReveal(() => {
      if (phase !== "revealing" || round !== startedRound) return;
      phase = "revealed";
      app.setAttribute("aria-label", "Tap anywhere to complete the round");
      status.textContent = "Tap anywhere to complete the round.";
      updateDebugPanel();
    });
    return;
  }

  if (startedPhase === "revealed") {
    if (phase !== "revealed" || round !== startedRound) return;

    phase = "transitioning";
    app.setAttribute("aria-label", "Correct. The next round will start after the sound");
    status.textContent = "Correct. The next round will start after the sound.";
    lastAudioAction = "playCorrect";
    updateDebugPanel();
    sound.playCorrect(() => {
      if (phase === "transitioning" && round === startedRound) beginRound();
    });
    return;
  }

  if (phase !== "playing" || round !== startedRound) return;

  if (pointInPolygon(point, blob.points)) {
    correctTap = point;
    phase = "found";
    startFoundChain();
    app.setAttribute("aria-label", "Target found. Tap the same area again quickly");
    status.textContent = "Target found. Tap the same area again quickly.";
    lastAudioAction = "playFound";
    updateDebugPanel();
    sound.playFound();
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
