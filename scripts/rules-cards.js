/*
 * The games, condensed to card length — the printed rules cards.
 *
 * The full prose versions live in src/pages/play.astro; these are the same
 * games cut down to fit a tarot card. Two texts of the same rules is a
 * deliberate duplication (a card cannot hold a paragraph), so it is guarded
 * rather than eliminated: scripts/validate-rules.js fails the build if the
 * set of games here stops matching the set on the page. Renaming a game,
 * adding a sixth, or dropping one means editing both — the printed deck is
 * the copy nobody re-reads, so CI has to be the one that notices.
 *
 * Consumed by scripts/print-and-play.js (renders them into the free PDF)
 * and scripts/validate-rules.js (checks them against the page).
 *
 * NOT part of the manufactured deck: MakePlayingCards prints tarot decks in
 * fixed tiers and the deck already sits exactly on 54 faces (52 prompts +
 * title + instructions). Five more would be 59, which is not a tier — see
 * docs/printing.md.
 */
export const RULES_CARDS = [
  {
    title: "Ten Minutes",
    players: "solo",
    body:
      "Draw one card. Obey it — literally, not approximately — for ten minutes. " +
      "No second draw. Keep the result or throw it away, but look at it first.",
  },
  {
    title: "Three Straws",
    players: "solo",
    body:
      "Deal three cards face down. Turn them in order: what is actually wrong; " +
      "how to work on it; when to stop. Write the third one down.",
  },
  {
    title: "First & Last",
    players: "solo · one session",
    body:
      "Draw before you begin and work under the card. When you believe you're " +
      "done, draw exactly one more and let it edit the ending.",
  },
  {
    title: "Blind Jury",
    players: "3 or more",
    body:
      "One card for everyone, read aloud. No one says how they read it. Twenty " +
      "minutes of work, then show the results side by side. Steal the best direction.",
  },
  {
    title: "Exquisite Relay",
    players: "2 · over days or weeks",
    body:
      "One piece, passed back and forth. Each pass begins with a secret draw. " +
      "When the piece is finished, reveal the cards in order and title it with one.",
  },
];
