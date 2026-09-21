/*
 * The flip's timing, declared once. The stylesheet's --flip-ms and the
 * verifier's settle time are derived from these numbers (a test holds the
 * stylesheet to it), so a change here cannot silently desynchronise them.
 */

// 520ms put the words on screen at 553ms against a 560ms budget — inside the
// limit, but sluggish on a tool built for rapid tapping, and with no headroom
// on slower hardware.
export const FLIP_MS = 460;
export const RIFFLE_MS = 700; // keep in step with the riffle keyframes
export const WORD_MS = 160;
// 15 put the nominal worst case at 509ms against the 560ms budget, but the
// measured worst ran 546-561ms — frame overhead ate the margin. 13 buys back
// 22ms on a 12-word card; the cascade still reads as a cascade.
export const WORD_STAGGER_MS = 13;
// Shaving that beat again is a losing race against frame overhead — each
// pass buys ~20ms and dulls every card, and CI has measured overhead as high
// as 76ms. Cap the TOTAL run instead: up to 9 words keep the full beat,
// longer cards share the same envelope.
export const STAGGER_ENVELOPE_MS = 104; // 8 gaps at the full 13ms beat
// The words must be readable this long after the tap, on the longest card.
export const READABLE_BUDGET_MS = 560;
// The words start landing partway through the turn, once the incoming face
// has swung past edge-on.
export const WORDS_START = 0.4;

// The delay between one word landing and the next.
export function staggerGap(wordCount: number): number {
  return wordCount > 1 ? Math.min(WORD_STAGGER_MS, STAGGER_ENVELOPE_MS / (wordCount - 1)) : 0;
}

// When the last word of an n-word card has landed, nominally, from the tap.
export function wordsReadyAt(wordCount: number): number {
  return FLIP_MS * WORDS_START + staggerGap(wordCount) * Math.max(0, wordCount - 1) + WORD_MS;
}
