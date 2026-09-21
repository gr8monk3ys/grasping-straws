/*
 * What a card is. The one declaration shared by the Astro pages, the draw
 * screen, the validator, the verifier and the print pipeline, so the rule
 * "a draft is not a card" is written here and nowhere else.
 *
 * public/cards.json holds two kinds of entry: written cards, and draft slots
 * reserved so the printed deck reaches one of the printer's fixed tiers.
 * Drafts carry no text and must never be dealt, built into a share page,
 * listed in the sitemap or counted in the tally.
 */

export type Card = { id: number; text: string; suit?: string };

// A reserved slot: an id claimed for the printed deck with the text still
// to write. The note is the brief for whoever writes it.
export type Draft = { id: number; draft: true; suit?: string; note?: string };

export type Entry = Card | Draft;

// Every key cards.json may carry. The validator warns on anything else.
export const CARD_KEYS = ["id", "text", "suit", "draft", "note"] as const;

export function isDraft(entry: unknown): entry is Draft {
  return typeof entry === "object" && entry !== null && (entry as { draft?: unknown }).draft === true;
}

// The cards the site deals and publishes: everything that is not a draft.
export function liveCards(entries: readonly unknown[]): Card[] {
  return entries.filter((e): e is Card => !isDraft(e)) as Card[];
}

export function draftSlots(entries: readonly unknown[]): Draft[] {
  return entries.filter(isDraft);
}
