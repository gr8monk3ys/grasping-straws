/*
 * Grasping Straws? — the theme control.
 *
 * Three states, cycling system → light → dark. "System" is the absence of
 * a stored preference, not a third stored value, so a visitor who never
 * touches the button keeps following their OS for the life of the site.
 *
 * The attribute is set before first paint by the inline script in
 * Base.astro — this module only owns the click, the label, and keeping
 * the browser-chrome colour honest. Which icon shows is decided in CSS
 * from the same attribute, so the button cannot disagree with the page.
 */
const STORAGE_KEY = "grasping-straws.theme";

type Theme = "system" | "light" | "dark";

const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

// The two grounds, from --ground in global.css. Duplicated here because
// <meta name="theme-color"> cannot read a custom property; if the palette
// moves, these move with it.
const GROUND: Record<"light" | "dark", string> = { light: "#b4bdbb", dark: "#0d1514" };

const btn = document.getElementById("theme-toggle") as HTMLButtonElement | null;

function current(): Theme {
  const set = document.documentElement.dataset.theme;
  return set === "light" || set === "dark" ? set : "system";
}

function resolved(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: Theme): void {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;

  // One meta, rewritten — the media-query pair in the markup only knows
  // about the system preference and would contradict a manual override.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", GROUND[resolved(theme)]);

  if (btn) {
    btn.setAttribute(
      "aria-label",
      theme === "system"
        ? "Theme: match system. Switch to light."
        : `Theme: ${theme}. Switch to ${NEXT[theme] === "system" ? "match system" : NEXT[theme]}.`,
    );
  }
}

apply(current());

// Following the system means following it as it changes — a visitor who
// never chose gets the sunset switch without reloading.
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (current() === "system") apply("system");
});

btn?.addEventListener("click", () => {
  const next = NEXT[current()];
  try {
    if (next === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable (private mode) — the choice just won't persist */
  }
  apply(next);
});
