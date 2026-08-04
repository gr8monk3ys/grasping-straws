/*
 * Manual light/dark override.
 *
 * The data-theme attribute is set synchronously by a tiny inline script in
 * the document head (see Base.astro) so a stored choice is applied before
 * first paint. This module only handles the control itself, which can wait
 * for the bundle.
 *
 * Without a stored choice nothing is set, and the stylesheet's
 * prefers-color-scheme block stays in charge — so the OS setting keeps
 * working, including live changes.
 */

const KEY = "grasping-straws.theme";
const root = document.documentElement;
const btn = document.getElementById("theme") as HTMLButtonElement | null;
const word = document.getElementById("theme-word");
const media = window.matchMedia("(prefers-color-scheme: dark)");

function current(): "light" | "dark" {
  const set = root.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return media.matches ? "dark" : "light";
}

function paint(): void {
  const now = current();
  if (word) word.textContent = now === "dark" ? "Dark" : "Light";
  btn?.setAttribute("aria-label", `Switch to ${now === "dark" ? "light" : "dark"} theme`);
  btn?.setAttribute("aria-pressed", String(now === "dark"));
  // The two media-scoped theme-color metas in the head cannot express an
  // override, so a single resolved one replaces them once JS is running.
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = now === "dark" ? "#171310" : "#f5efe3";
}

btn?.addEventListener("click", () => {
  const next = current() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode — the choice just won't outlive the page */
  }
  paint();
});

// Only follow the OS while the visitor has not made a choice of their own.
media.addEventListener("change", () => {
  if (!root.dataset.theme) paint();
});

paint();
