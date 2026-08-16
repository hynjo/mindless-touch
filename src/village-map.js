const canvas = document.querySelector(".village-map__canvas");
const context = canvas.getContext("2d");
const villageMap = document.querySelector(".village-map");
const milestones = [...document.querySelectorAll(".milestone")];
const activeMilestone = document.querySelector(".milestone--active");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const nextMilestone = document.querySelector('[data-stage="2"]');
const mapParams = new URLSearchParams(window.location.search);
const debugValue = mapParams.get("debug");
const debugEnabled =
  mapParams.has("debug") && debugValue !== "0" && debugValue !== "false";
const debugHistory = new Set(
  debugEnabled
    ? (mapParams.get("history") ?? "")
        .split(",")
        .map((stage) => stage.trim().toLowerCase())
        .filter(Boolean)
    : [],
);

const DESIGN_WIDTH = 100;
const DESIGN_HEIGHT = 150;
const CONTROL_POINTS = [
  { x: -12, y: 12 },
  { x: 42, y: 12 },
  { x: 82, y: 14 },
  { x: 92, y: 29 },
  { x: 78, y: 44 },
  { x: 22, y: 44 },
  { x: 8, y: 60 },
  { x: 23, y: 76 },
  { x: 80, y: 76 },
  { x: 92, y: 93 },
  { x: 77, y: 108 },
  { x: 22, y: 108 },
  { x: 8, y: 124 },
  { x: 23, y: 140 },
  { x: 112, y: 140 },
];

let viewport = { width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 };
let animationFrame = null;
let isLeavingMap = false;
let departure = null;
let arrival = null;

function consumeMapArrival() {
  try {
    if (sessionStorage.getItem("village-map-arrival") !== "pending") return false;
    sessionStorage.removeItem("village-map-arrival");
    return true;
  } catch {
    return false;
  }
}

function completeVillageJourney() {
  nextMilestone.classList.remove("milestone--arriving");
  nextMilestone.classList.add("milestone--unlocked");
  nextMilestone.removeAttribute("aria-disabled");
  activeMilestone.classList.add("milestone--finished");
  activeMilestone.setAttribute("aria-label", "Where is meow — finished");
}

function applyDebugHistory() {
  if (debugHistory.has("1") || debugHistory.has("intro"))
    completeVillageJourney();
}

function finishDeparture() {
  if (!departure || departure.finished) return;
  departure.finished = true;
  if (departure.introHandoff)
    sessionStorage.setItem("village-paw-transition", "pending");
  window.location.assign(departure.destination);
}

function cameraAt(time) {
  if (arrival && !reducedMotion.matches) {
    const progress = Math.min(1, (time - arrival.startedAt) / arrival.duration);
    const eased = progress * progress * (3 - 2 * progress);
    if (progress === 1 && !arrival.finished) {
      arrival.finished = true;
      requestAnimationFrame(() => {
        villageMap.querySelector(".map-arrival")?.remove();
        document.body.classList.remove("is-entering-map");
        completeVillageJourney();
        arrival = null;
      });
    }
    return {
      originX: arrival.pawX,
      originY: arrival.pawY,
      scale: 6 - eased * 5,
      shiftX: arrival.shiftX * (1 - eased),
      shiftY: arrival.shiftY * (1 - eased),
    };
  }

  if (!departure || reducedMotion.matches) {
    return { scale: 1, shiftX: 0, shiftY: 0 };
  }

  const progress = Math.min(1, (time - departure.startedAt) / departure.duration);
  const eased = progress * progress * (3 - 2 * progress);
  if (progress === 1) requestAnimationFrame(finishDeparture);
  return {
    originX: departure.pawX,
    originY: departure.pawY,
    scale: 1 + eased * 5,
    shiftX: departure.shiftX * eased,
    shiftY: departure.shiftY * eased,
  };
}

function leaveMap(event, milestone, destinationY, introHandoff = false) {
  if (
    isLeavingMap ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  if (milestone === nextMilestone && !milestone.classList.contains("milestone--unlocked")) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  isLeavingMap = true;
  const destination = milestone.href;
  const bounds = milestone.getBoundingClientRect();
  const pawX = bounds.left + bounds.width / 2;
  const pawY = bounds.top + bounds.height / 2;
  const destinationPawX = window.innerWidth / 2;
  const destinationPawY = window.innerHeight * destinationY;
  const transition = document.createElement("div");

  transition.className = "map-transition";
  transition.setAttribute("aria-hidden", "true");
  departure = {
    destination,
    duration: 1100,
    finished: false,
    introHandoff,
    pawX,
    pawY,
    shiftX: destinationPawX - pawX,
    shiftY: destinationPawY - pawY,
    startedAt: performance.now(),
  };
  milestone.classList.add("milestone--departing");
  villageMap.classList.add("is-zooming");
  villageMap.append(transition);
  document.body.classList.add("is-leaving-map");

  if (reducedMotion.matches) {
    transition.addEventListener("animationend", finishDeparture, { once: true });
  } else if (animationFrame === null) {
    draw(performance.now());
  }
}

function catmullRom(a, b, c, d, amount) {
  const amount2 = amount * amount;
  const amount3 = amount2 * amount;
  return {
    x:
      0.5 *
      (2 * b.x +
        (-a.x + c.x) * amount +
        (2 * a.x - 5 * b.x + 4 * c.x - d.x) * amount2 +
        (-a.x + 3 * b.x - 3 * c.x + d.x) * amount3),
    y:
      0.5 *
      (2 * b.y +
        (-a.y + c.y) * amount +
        (2 * a.y - 5 * b.y + 4 * c.y - d.y) * amount2 +
        (-a.y + 3 * b.y - 3 * c.y + d.y) * amount3),
  };
}

function sampleTrail() {
  const samples = [];
  const stepsPerSegment = 22;

  for (let index = 0; index < CONTROL_POINTS.length - 1; index += 1) {
    const a = CONTROL_POINTS[Math.max(0, index - 1)];
    const b = CONTROL_POINTS[index];
    const c = CONTROL_POINTS[index + 1];
    const d = CONTROL_POINTS[Math.min(CONTROL_POINTS.length - 1, index + 2)];
    for (let step = 0; step < stepsPerSegment; step += 1) {
      samples.push(catmullRom(a, b, c, d, step / stepsPerSegment));
    }
  }
  samples.push(CONTROL_POINTS.at(-1));
  return samples;
}

const trailSamples = sampleTrail();

function trailWidth(index, inset = 0) {
  const broadShape = 8.4 + Math.sin(index * 0.041 + 0.8) * 1.15;
  const smallVariation = Math.sin(index * 0.173) * 0.7;
  return Math.max(4.8, broadShape + smallVariation - inset);
}

function makeRibbon(inset = 0) {
  const left = [];
  const right = [];

  trailSamples.forEach((point, index) => {
    const previous = trailSamples[Math.max(0, index - 1)];
    const next = trailSamples[Math.min(trailSamples.length - 1, index + 1)];
    const tangentX = next.x - previous.x;
    const tangentY = next.y - previous.y;
    const length = Math.hypot(tangentX, tangentY) || 1;
    const normalX = -tangentY / length;
    const normalY = tangentX / length;
    const width = trailWidth(index, inset);
    left.push({ x: point.x + normalX * width, y: point.y + normalY * width });
    right.push({ x: point.x - normalX * width, y: point.y - normalY * width });
  });

  return { left, right };
}

const earthRibbon = makeRibbon(0);

function traceRibbon(ribbon) {
  context.beginPath();
  context.moveTo(ribbon.left[0].x, ribbon.left[0].y);
  ribbon.left.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  [...ribbon.right]
    .reverse()
    .forEach((point) => context.lineTo(point.x, point.y));
  context.closePath();
}

function fadeTrailTerminal(point) {
  const fade = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, 30);
  fade.addColorStop(0, "rgba(0, 0, 0, 1)");
  fade.addColorStop(0.48, "rgba(0, 0, 0, 0.72)");
  fade.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = fade;
  context.fillRect(point.x - 30, point.y - 30, 60, 60);
}

function drawTrail() {
  const ambient = context.createRadialGradient(76, 132, 2, 76, 132, 75);
  ambient.addColorStop(0, "rgba(72, 73, 35, 0.18)");
  ambient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = ambient;
  context.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

  traceRibbon(earthRibbon);
  const earth = context.createLinearGradient(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
  earth.addColorStop(0, "#191810");
  earth.addColorStop(0.52, "#29261a");
  earth.addColorStop(1, "#17170f");
  context.fillStyle = earth;
  context.fill();

  context.save();
  context.globalCompositeOperation = "destination-out";
  fadeTrailTerminal(CONTROL_POINTS[0]);
  fadeTrailTerminal(CONTROL_POINTS.at(-1));
  context.restore();
}

function drawAtmosphere(time) {
  const dustCount = 38;
  for (let index = 0; index < dustCount; index += 1) {
    const progress = (index / dustCount + time * 0.000008) % 1;
    const sampleIndex = Math.floor(progress * (trailSamples.length - 1));
    const point = trailSamples[sampleIndex];
    const terminalFade = Math.min(1, progress / 0.07, (1 - progress) / 0.07);
    const shimmer =
      (0.18 + (Math.sin(time * 0.0015 + index * 2.3) + 1) * 0.13) *
      terminalFade;
    context.beginPath();
    context.arc(point.x, point.y, index % 4 === 0 ? 0.26 : 0.14, 0, Math.PI * 2);
    context.fillStyle = `rgba(255, 248, 150, ${shimmer})`;
    context.fill();
  }

  const fireflies = [
    [23, 29],
    [70, 31],
    [48, 59],
    [20, 92],
    [76, 94],
    [46, 124],
  ];
  fireflies.forEach(([x, y], index) => {
    const glow = 0.18 + (Math.sin(time * 0.0018 + index * 1.7) + 1) * 0.22;
    context.beginPath();
    context.arc(x, y, 0.35 + glow * 0.25, 0, Math.PI * 2);
    context.fillStyle = `rgba(255, 248, 168, ${glow})`;
    context.shadowColor = "rgba(255, 248, 168, 0.65)";
    context.shadowBlur = 2.5;
    context.fill();
    context.shadowBlur = 0;
  });
}

function draw(time = 0) {
  const ratio = Math.min(window.devicePixelRatio || 1, 3);
  const camera = cameraAt(time);
  const cameraOffsetX = camera.originX !== undefined
    ? camera.originX + (viewport.offsetX - camera.originX) * camera.scale + camera.shiftX
    : viewport.offsetX;
  const cameraOffsetY = camera.originY !== undefined
    ? camera.originY + (viewport.offsetY - camera.originY) * camera.scale + camera.shiftY
    : viewport.offsetY;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(
    ratio * viewport.scale * camera.scale,
    0,
    0,
    ratio * viewport.scale * camera.scale,
    ratio * cameraOffsetX,
    ratio * cameraOffsetY,
  );
  drawTrail();
  drawAtmosphere(time);
  positionMilestones(camera, cameraOffsetX, cameraOffsetY);

  if (!reducedMotion.matches) animationFrame = requestAnimationFrame(draw);
}

function positionMilestones(camera = { scale: 1 }, offsetX = viewport.offsetX, offsetY = viewport.offsetY) {
  const baseSize = Math.min(60, Math.max(44, window.innerWidth * 0.1));
  milestones.forEach((milestone) => {
    const x = Number(milestone.dataset.mapX);
    const y = Number(milestone.dataset.mapY);
    milestone.style.left = `${offsetX + x * viewport.scale * camera.scale}px`;
    milestone.style.top = `${offsetY + y * viewport.scale * camera.scale}px`;
    milestone.style.width = `${baseSize * camera.scale}px`;
  });
}

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 3);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT) * 0.96;
  viewport = {
    width,
    height,
    scale,
    offsetX: (width - DESIGN_WIDTH * scale) / 2,
    offsetY: (height - DESIGN_HEIGHT * scale) / 2,
  };
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  if (arrival === null && document.documentElement.classList.contains("is-arriving-at-map")) {
    const x = Number(nextMilestone.dataset.mapX);
    const y = Number(nextMilestone.dataset.mapY);
    const pawX = viewport.offsetX + x * viewport.scale;
    const pawY = viewport.offsetY + y * viewport.scale;
    arrival = {
      duration: 1100,
      finished: false,
      pawX,
      pawY,
      shiftX: width / 2 - pawX,
      shiftY: height * 0.32 - pawY,
      startedAt: performance.now(),
    };
    const transition = document.createElement("div");
    transition.className = "map-arrival";
    transition.setAttribute("aria-hidden", "true");
    villageMap.append(transition);
    document.body.classList.add("is-entering-map");
    nextMilestone.classList.add("milestone--arriving");
    if (reducedMotion.matches) {
      transition.addEventListener(
        "animationend",
        () => {
          transition.remove();
          document.body.classList.remove("is-entering-map");
          completeVillageJourney();
          arrival = null;
        },
        { once: true },
      );
    }
  }
  positionMilestones();
  if (animationFrame === null) draw(performance.now());
  document.documentElement.classList.remove("is-arriving-at-map");
}

function updateMotionPreference() {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  draw(performance.now());
}

function restoreMapFromHistory(event) {
  if (!event.persisted && !isLeavingMap) return;

  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  departure = null;
  arrival = null;
  isLeavingMap = false;
  document.body.classList.remove("is-leaving-map", "is-entering-map");
  villageMap.classList.remove("is-zooming");
  milestones.forEach((milestone) => milestone.classList.remove("milestone--departing"));
  villageMap
    .querySelectorAll(".map-transition, .map-arrival")
    .forEach((element) => element.remove());
  nextMilestone.classList.remove("milestone--arriving");
  positionMilestones();
  draw(performance.now());
}

window.addEventListener("resize", resize);
window.addEventListener("pageshow", restoreMapFromHistory);
reducedMotion.addEventListener("change", updateMotionPreference);
activeMilestone.addEventListener("click", (event) =>
  leaveMap(event, activeMilestone, 0.68, true),
);
nextMilestone.addEventListener("click", (event) =>
  leaveMap(event, nextMilestone, 0.5),
);
if (!consumeMapArrival()) document.documentElement.classList.remove("is-arriving-at-map");
applyDebugHistory();
resize();
