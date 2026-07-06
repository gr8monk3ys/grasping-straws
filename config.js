/*
 * Grasping Straws? — site configuration.
 *
 * DECK_NAME is the display name used in designed contexts (masthead, card
 * back, announcements). The "?" is part of the mark — don't remove it here.
 * The static <title> tags in index.html / about.html mirror this value.
 *
 * PHYSICAL_DECK_URL: leave empty ("") until the physical deck exists; the
 * site then shows a quiet "coming soon" state. Once there is a product page
 * (e.g. MakePlayingCards / The Game Crafter), put its URL here and every
 * physical-deck link on the site starts pointing at it.
 *
 * DECK_VERSION: keeps the site deck and the physical deck in lockstep.
 * Bump it whenever a card-editing pass lands in cards.json; it shows
 * discreetly on the About page and should match the printed box.
 */
window.GS = Object.freeze({
  DECK_NAME: "Grasping Straws?",
  PHYSICAL_DECK_URL: "",
  DECK_VERSION: "1"
});

// Wire the config into the page: fill name slots, upgrade physical-deck links.
document.addEventListener("DOMContentLoaded", () => {
  for (const el of document.querySelectorAll("[data-deck-name]")) {
    el.textContent = window.GS.DECK_NAME;
  }
  for (const el of document.querySelectorAll("[data-deck-version]")) {
    el.textContent = "Deck v" + window.GS.DECK_VERSION;
  }
  const url = window.GS.PHYSICAL_DECK_URL;
  for (const el of document.querySelectorAll("[data-physical-link]")) {
    if (url) {
      el.href = url;
    } else if (el.hasAttribute("data-physical-fallback")) {
      // On the About page the link itself is the destination — without a
      // product URL it degrades into plain "coming soon" text.
      const span = document.createElement("span");
      span.textContent = el.getAttribute("data-physical-fallback");
      el.replaceWith(span);
    }
  }
});
