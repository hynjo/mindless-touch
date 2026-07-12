import { SoundEngine } from "./audio.js";
import { generateCatTarget, pointInCat } from "./cat-target.js";

const canvas = document.querySelector("#playfield");
const context = canvas.getContext("2d");
const app = document.querySelector("#app");
const status = document.querySelector("#status");
const params = new URLSearchParams(window.location.search);
const debugValue = params.get("debug");
const debug = params.has("debug") && debugValue !== "0" && debugValue !== "false";
const introEnabled = params.get("intro") !== "0";
const MAX_MOUSE_MOVEMENT = 10;
const MAX_TOUCH_MOVEMENT = 24;
const NEXT_ROUND_DELAY = 200;
const EYE_CLOSE_DELAY = 250;
const NUDGE_DELAY = 3000;
const NUDGE_DURATION = 1100;
const NUDGE_EDGE_PADDING = 32;
const DEFAULT_LEVEL = 5;
const MIN_LEVEL = 1;
const MAX_LEVEL = 10;
const requestedLevel = Number.parseInt(params.get("level"), 10);
const level = Number.isNaN(requestedLevel)
  ? DEFAULT_LEVEL
  : Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, requestedLevel));
const maxArea = 0.18 * 0.8 ** (level - 1);
const difficulty = { minArea: maxArea * 0.5, maxArea };

const debugPanel = debug ? document.createElement("output") : null;
if (debugPanel) {
  debugPanel.className = "debug-panel";
  app.append(debugPanel);

  window.addEventListener("error", (event) => {
    debugPanel.textContent = `Initialization error:\n${event.message}`;
  });

  window.addEventListener("unhandledrejection", (event) => {
    const message =
      event.reason instanceof Error
        ? event.reason.message
        : String(event.reason);
    debugPanel.textContent = `Unhandled rejection:\n${message}`;
  });
}

const fallbackSeed = `${Date.now()}-${Math.random()}`;
const generatedSeed = globalThis.crypto?.randomUUID?.() ?? fallbackSeed;
const baseSeed = params.get("seed") ?? generatedSeed;
const sound = new SoundEngine({
  revealUrl: `${import.meta.env.BASE_URL}assets/reveal.wav`,
  wrongUrl: `${import.meta.env.BASE_URL}assets/wrong.wav`,
  foundUrl: `${import.meta.env.BASE_URL}assets/found.wav`,
  correctUrl: `${import.meta.env.BASE_URL}assets/correct.wav`,
});
app.querySelectorAll(".cat-eyes").forEach((element) => element.remove());
const catEyes = document.createElement("div");
catEyes.className = "cat-eyes";
catEyes.innerHTML = '<span class="cat-eye"></span><span class="cat-eye"></span>';
app.append(catEyes);

const PAW_MARKUP = `
  <span class="paw-glyph">
    <span class="intro-paw-pad"></span>
    <span class="intro-paw-toe intro-paw-toe-1"></span>
    <span class="intro-paw-toe intro-paw-toe-2"></span>
    <span class="intro-paw-toe intro-paw-toe-3"></span>
    <span class="intro-paw-toe intro-paw-toe-4"></span>
  </span>
`;
const tapFeedbackLayer = document.createElement("div");
tapFeedbackLayer.className = "tap-feedback-layer";
tapFeedbackLayer.setAttribute("aria-hidden", "true");
app.append(tapFeedbackLayer);
const nudgePaw = document.createElement("span");
nudgePaw.className = "paw-touch nudge-paw is-success";
nudgePaw.innerHTML = PAW_MARKUP;
tapFeedbackLayer.append(nudgePaw);
const desktopPointer = window.matchMedia("(hover: hover) and (pointer: fine)");

const intro = document.createElement("div");
intro.className = "intro";
intro.setAttribute("aria-hidden", "true");
intro.innerHTML = `
  <svg class="intro-speaker" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M10 25h11l14-11v36L21 39H10z"></path>
    <path class="intro-sound-wave" d="M43 23c5 5 5 13 0 18"></path>
    <path class="intro-sound-wave intro-sound-wave-outer" d="M50 16c9 9 9 23 0 32"></path>
  </svg>
  <span class="paw-touch intro-touch is-success">${PAW_MARKUP}</span>
  <span class="intro-cat-position">
    <span class="cat-eyes intro-demo-eyes">
      <span class="cat-eye"></span><span class="cat-eye"></span>
    </span>
  </span>
`;
app.append(intro);

const introTouch = intro.querySelector(".intro-touch");
const introDemoEyes = intro.querySelector(".intro-demo-eyes");

let phase = introEnabled ? "intro" : "idle";
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
  recoveryPending: false,
  error: null,
};
let lastAudioAction = "waiting for first tap";
let lastInputAction = "none";
let lastTouchAt = 0;
let nudgeTimer = null;
let introRun = 0;
const introTimers = new Set();

function scheduleIntro(callback, delay) {
  const timer = window.setTimeout(() => {
    introTimers.delete(timer);
    callback();
  }, delay);
  introTimers.add(timer);
  return timer;
}

function clearIntroTimers() {
  introRun += 1;
  introTimers.forEach((timer) => window.clearTimeout(timer));
  introTimers.clear();
}

function showIntroTap(x, y, successful = false) {
  introTouch.style.left = `${x}%`;
  introTouch.style.top = `${y}%`;
  introTouch.classList.toggle("is-success", successful);
  introTouch.classList.remove("is-tapping");
  void introTouch.offsetWidth;
  introTouch.classList.add("is-tapping");
}

function showTapFeedback(point, successful, completion) {
  const paw = document.createElement("span");
  paw.className = "paw-touch game-paw is-tapping";
  paw.classList.toggle("is-success", successful);
  paw.classList.toggle("is-completion", completion);
  paw.style.left = `${point.x * 100}%`;
  paw.style.top = `${point.y * 100}%`;
  paw.innerHTML = PAW_MARKUP;
  tapFeedbackLayer.append(paw);
  if (!completion)
    paw.addEventListener("animationend", () => paw.remove(), { once: true });
  window.setTimeout(() => paw.remove(), completion ? 1000 : 600);
}

function cancelNudge() {
  if (nudgeTimer !== null) window.clearTimeout(nudgeTimer);
  nudgeTimer = null;
  nudgePaw.classList.remove("is-nudging");
}

function scheduleNudge() {
  cancelNudge();
  if (desktopPointer.matches) return;
  if (phase !== "playing" && phase !== "found" && phase !== "revealed") return;

  nudgeTimer = window.setTimeout(() => {
    if (phase !== "playing" && phase !== "found" && phase !== "revealed") return;
    nudgeTimer = null;
    void nudgePaw.offsetWidth;
    nudgePaw.classList.add("is-nudging");
    nudgeTimer = window.setTimeout(() => {
      nudgePaw.classList.remove("is-nudging");
      nudgeTimer = null;
      scheduleNudge();
    }, NUDGE_DURATION);
  }, NUDGE_DELAY);
}

function followDesktopPointer(x, y) {
  if (!desktopPointer.matches) return;
  const clampedX = Math.min(
    window.innerWidth - NUDGE_EDGE_PADDING,
    Math.max(NUDGE_EDGE_PADDING, x),
  );
  const clampedY = Math.min(
    window.innerHeight - NUDGE_EDGE_PADDING,
    Math.max(NUDGE_EDGE_PADDING, y),
  );
  nudgePaw.style.left = `${clampedX}px`;
  nudgePaw.style.top = `${clampedY}px`;
  nudgePaw.classList.add("is-pointer-following");
}

function resetIntro() {
  clearIntroTimers();
  phase = "intro";
  intro.hidden = false;
  intro.classList.remove("is-demo");
  introTouch.classList.remove("is-tapping");
  introTouch.classList.add("is-success");
  introTouch.removeAttribute("style");
  introDemoEyes.classList.remove("is-visible", "is-revealing", "is-celebrating");
  app.setAttribute("aria-label", "Tap anywhere to start the sound demonstration");
  status.textContent = "Tap anywhere to start the sound demonstration.";
  lastAudioAction = "waiting for intro tap";
  updateDebugPanel();
}

function finishIntro(run) {
  if (phase !== "demo" || run !== introRun) return;
  clearIntroTimers();
  intro.hidden = true;
  introDemoEyes.classList.remove("is-visible", "is-revealing", "is-celebrating");
  beginRound();
}

function startIntroDemo() {
  if (phase !== "intro") return;

  clearIntroTimers();
  const run = introRun;
  phase = "demo";
  intro.classList.add("is-demo");
  app.setAttribute("aria-label", "Sound and touch demonstration in progress");
  status.textContent = "Sound and touch demonstration in progress.";
  lastAudioAction = "intro problem";
  updateDebugPanel();
  sound.playProblem();

  scheduleIntro(() => {
    if (run !== introRun) return;
    showIntroTap(26, 66);
    lastAudioAction = "intro wrong";
    updateDebugPanel();
    sound.playWrong();
  }, 600);

  scheduleIntro(() => {
    if (run !== introRun) return;
    showIntroTap(74, 68);
    lastAudioAction = "intro wrong";
    updateDebugPanel();
    sound.playWrong();
  }, 1200);

  scheduleIntro(() => {
    if (run !== introRun) return;
    showIntroTap(62, 42, true);
    lastAudioAction = "intro target tap";
    updateDebugPanel();
    scheduleIntro(() => introTouch.classList.remove("is-tapping"), 220);
    scheduleIntro(() => {
      if (run !== introRun) return;
      introDemoEyes.classList.add("is-visible", "is-revealing");
      lastAudioAction = "intro found";
      updateDebugPanel();
      sound.playFound();
      scheduleIntro(() => introDemoEyes.classList.remove("is-revealing"), 220);
    }, 280);
    scheduleIntro(() => {
      if (run !== introRun) return;
      introDemoEyes.classList.add("is-celebrating");
    }, 600);
    scheduleIntro(() => finishIntro(run), 1100);
  }, 1800);
}

function updateDebugPanel() {
  if (!debugPanel) return;

  debugPanel.textContent = [
    `AudioContext: ${audioDebug.state}`,
    `Sample rate: ${audioDebug.sampleRate ?? "n/a"}`,
    `Playback latency: ${audioDebug.playbackLatency ?? "n/a"} ms`,
    `Foreground recovery: ${audioDebug.recoveryPending ? "pending" : "ready"}`,
    `Level: ${level}`,
    `Target area: ${blob ? `${(blob.targetArea * 100).toFixed(1)}%` : "n/a"}`,
    `Found chain: ${phase === "found" ? "active" : "inactive"}`,
    `Game phase: ${phase}`,
    `Eyes visible: ${catEyes.classList.contains("is-visible") ? "yes" : "no"}`,
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
  const isRevealed =
    phase === "revealing" || phase === "revealed" || phase === "transitioning";
  const isVisible = Boolean(blob) && (isRevealed || debug);
  catEyes.classList.toggle("is-visible", isVisible);
  catEyes.classList.toggle("is-debug", isVisible && !isRevealed);
  catEyes.classList.toggle("is-revealing", isVisible && phase === "revealing");

  if (!blob) return;
  catEyes.style.left = `${blob.x * window.innerWidth}px`;
  catEyes.style.top = `${blob.y * window.innerHeight}px`;
  catEyes.style.width = `${blob.width * window.innerWidth}px`;
  catEyes.style.height = `${blob.height * window.innerHeight}px`;

  if (debug) {
    context.save();
    context.setLineDash([6, 4]);
    context.lineWidth = 1;
    context.strokeStyle = "rgba(255, 255, 255, 0.65)";
    context.beginPath();
    context.ellipse(
      (blob.hitX + blob.hitWidth / 2) * window.innerWidth,
      (blob.hitY + blob.hitHeight / 2) * window.innerHeight,
      (blob.hitWidth * window.innerWidth) / 2,
      (blob.hitHeight * window.innerHeight) / 2,
      0,
      0,
      Math.PI * 2,
    );
    context.stroke();
    context.restore();
  }

  if (isRevealed && debug) {
    misses.forEach((point) => drawPoint(point, 3, "rgba(255, 255, 255, 0.55)"));
    drawPoint(correctTap, 7, "#000000", "#ffffff");
  }
}

function beginRound() {
  catEyes.classList.remove("is-celebrating");
  round += 1;
  blob = generateCatTarget(
    `${baseSeed}:${round}`,
    difficulty,
    window.innerWidth / window.innerHeight,
  );
  misses = [];
  correctTap = null;
  phase = "playing";
  app.setAttribute("aria-label", "Find the hidden shape");
  status.textContent = "A new round has started.";
  draw();
  lastAudioAction = "playProblem";
  updateDebugPanel();
  sound.playProblem();
  scheduleNudge();
}

function handleTap(point, startedPhase = phase, startedRound = round) {
  sound.unlock();

  if (startedPhase === "intro") {
    if (phase === "intro") startIntroDemo();
    return;
  }

  if (phase === "demo" || startedPhase === "demo") return;

  if (startedPhase === "idle") {
    if (phase === "idle") beginRound();
    return;
  }

  if (startedPhase === "found") {
    if (phase !== "found" || round !== startedRound) return;

    if (!pointInCat(point, blob)) {
      phase = "playing";
      misses.push(point);
      app.setAttribute("aria-label", "Missed. Find the hidden shape again");
      status.textContent = "Missed. Find the hidden shape again.";
      lastAudioAction = "playWrong";
      updateDebugPanel();
      sound.playWrong();
      return;
    }

    correctTap = point;
    phase = "revealing";
    app.setAttribute(
      "aria-label",
      "Shape revealed. Wait for the sound to finish",
    );
    status.textContent = "Shape revealed. Wait for the sound to finish.";
    lastAudioAction = "playReveal";
    draw();
    updateDebugPanel();
    sound.playReveal(() => {
      if (phase !== "revealing" || round !== startedRound) return;
      phase = "revealed";
      app.setAttribute("aria-label", "Tap anywhere to complete the round");
      status.textContent = "Tap anywhere to complete the round.";
      draw();
      updateDebugPanel();
      scheduleNudge();
    });
    return;
  }

  if (startedPhase === "revealed") {
    if (phase !== "revealed" || round !== startedRound) return;

    phase = "transitioning";
    app.setAttribute(
      "aria-label",
      "Correct. The next round will start after the sound",
    );
    status.textContent = "Correct. The next round will start after the sound.";
    lastAudioAction = "playCorrect";
    catEyes.classList.remove("is-celebrating");
    window.setTimeout(() => {
      if (phase !== "transitioning" || round !== startedRound) return;
      void catEyes.offsetWidth;
      catEyes.classList.add("is-celebrating");
    }, EYE_CLOSE_DELAY);
    updateDebugPanel();
    sound.playCorrect(() => {
      if (phase !== "transitioning" || round !== startedRound) return;

      window.setTimeout(() => {
        if (phase === "transitioning" && round === startedRound) beginRound();
      }, NEXT_ROUND_DELAY);
    });
    return;
  }

  if (phase !== "playing" || round !== startedRound) return;

  if (pointInCat(point, blob)) {
    correctTap = point;
    phase = "found";
    app.setAttribute(
      "aria-label",
      "Target found. Find the same hidden area again",
    );
    status.textContent = "Target found. Find the same hidden area again.";
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
  const point = normalizePoint(x, y);
  const targetWasHit = Boolean(blob) && pointInCat(point, blob);
  const successful =
    ((start.phase === "playing" || start.phase === "found") && targetWasHit)
    || start.phase === "revealed";
  if (start.phase !== "intro" && start.phase !== "demo")
    showTapFeedback(point, successful, start.phase === "revealed");
  lastInputAction = inputType;
  updateDebugPanel();
  handleTap(point, start.phase, start.round);
  scheduleNudge();
}

canvas.addEventListener(
  "touchstart",
  (event) => {
    event.preventDefault();
    cancelNudge();
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
  },
  { passive: false },
);

canvas.addEventListener(
  "touchend",
  (event) => {
    event.preventDefault();
    lastTouchAt = performance.now();

    for (const touch of event.changedTouches) {
      const start = touchStarts.get(touch.identifier);
      touchStarts.delete(touch.identifier);
      if (!start) continue;
      finishTap(
        start,
        touch.clientX,
        touch.clientY,
        "touchend",
        MAX_TOUCH_MOVEMENT,
      );
    }
  },
  { passive: false },
);

canvas.addEventListener("touchcancel", (event) => {
  for (const touch of event.changedTouches)
    touchStarts.delete(touch.identifier);
  scheduleNudge();
});

canvas.addEventListener("mousedown", (event) => {
  if (event.button !== 0 || mouseStart || performance.now() - lastTouchAt < 800)
    return;
  cancelNudge();
  mouseStart = { x: event.clientX, y: event.clientY, phase, round };
  lastInputAction = "mousedown";
  updateDebugPanel();
});

window.addEventListener("mousemove", (event) => {
  followDesktopPointer(event.clientX, event.clientY);
});

desktopPointer.addEventListener("change", () => {
  nudgePaw.classList.remove("is-pointer-following");
  nudgePaw.removeAttribute("style");
  scheduleNudge();
});

canvas.addEventListener("mouseup", (event) => {
  if (!mouseStart) return;
  const start = mouseStart;
  mouseStart = null;
  finishTap(start, event.clientX, event.clientY, "mouseup", MAX_MOUSE_MOVEMENT);
});

canvas.addEventListener("mouseleave", () => {
  mouseStart = null;
  scheduleNudge();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;

  touchStarts.clear();
  mouseStart = null;

  if (phase === "demo") {
    resetIntro();
  } else if (phase === "revealing") {
    phase = "found";
    app.setAttribute(
      "aria-label",
      "Audio was interrupted. Find the same hidden area again",
    );
    status.textContent = "Audio was interrupted. Find the same hidden area again.";
    lastAudioAction = "reveal interrupted";
    draw();
    updateDebugPanel();
  } else if (phase === "transitioning") {
    phase = "revealed";
    catEyes.classList.remove("is-celebrating");
    app.setAttribute(
      "aria-label",
      "Audio was interrupted. Tap anywhere to complete the round again",
    );
    status.textContent = "Audio was interrupted. Tap anywhere to complete the round again.";
    lastAudioAction = "correct interrupted";
    draw();
    updateDebugPanel();
  }
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
if (introEnabled) resetIntro();
else intro.hidden = true;
