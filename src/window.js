const status = document.querySelector("#window-status");
const finalPaw = document.querySelector(".paw-step--last");
const windowFrame = document.querySelector(".window-frame");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function toggleWindow() {
  if (windowFrame.getAttribute("aria-disabled") === "true") return;
  const opened = windowFrame.classList.toggle("is-open");
  if (opened) document.documentElement.classList.add("has-opened-window");
  windowFrame.setAttribute("aria-pressed", String(opened));
  windowFrame.setAttribute(
    "aria-label",
    opened ? "Open double glass window" : "Closed double glass window",
  );
  status.textContent = opened ? "The window opened." : "The window closed.";
}

windowFrame.addEventListener("click", toggleWindow);
windowFrame.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  toggleWindow();
});

if (reducedMotion.matches) {
  document.documentElement.classList.add("has-arrived-at-window");
  windowFrame.setAttribute("aria-disabled", "false");
  windowFrame.setAttribute("aria-pressed", "false");
  status.textContent = "The cat has arrived at the window.";
} else {
  finalPaw.addEventListener(
    "animationend",
    () => {
      document.documentElement.classList.add("has-arrived-at-window");
    },
    { once: true },
  );
  const finishWindowReveal = (event) => {
    if (event.target !== windowFrame || event.animationName !== "window-reveal")
      return;
    windowFrame.removeEventListener("animationend", finishWindowReveal);
    windowFrame.setAttribute("aria-disabled", "false");
    windowFrame.setAttribute("aria-pressed", "false");
    status.textContent = "The cat has arrived at the window.";
  };
  windowFrame.addEventListener("animationend", finishWindowReveal);
}
