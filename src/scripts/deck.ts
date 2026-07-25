/*
 * Grasping Straws? — the deck, as both pages see it.
 *
 * /cards.json is the single source of truth for the card set: this fetch,
 * the /c/<id>/ pages, the suit row, the validator and the print files all
 * read the same file. The draw screen and the daily card share the fetch
 * and the failure copy from here so the two can't drift apart.
 */
export type Card = { id: number; text: string; suit?: string };

/*
 * Resolves to the deck, or null if it could not be fetched or parsed. On
 * null the caller shows FAILURE_TEXT in its own card face — the two pages
 * lay their faces out differently, so the message is shared but the
 * rendering is not.
 */
export async function loadDeck(): Promise<Card[] | null> {
  try {
    const res = await fetch("/cards.json");
    if (!res.ok) return null;
    const deck = (await res.json()) as Card[];
    return Array.isArray(deck) && deck.length > 0 ? deck : null;
  } catch {
    return null;
  }
}

export const FAILURE_TEXT = "The deck failed to load. Refresh to try again.";
