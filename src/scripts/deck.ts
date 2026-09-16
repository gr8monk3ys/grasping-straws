/*
 * Grasping Straws? — the deck, as the client-side pages see it.
 *
 * /cards.json is the single source of truth for the card set: this fetch,
 * the /c/<id>/ pages, /deck/, the validator and the print files all read
 * the same file. The daily card fetches through here so its failure copy
 * and its guards can't drift from anything else that loads the deck.
 *
 * The draw screen (app.ts) deliberately does NOT use this: it needs the
 * deck before first paint alongside its own saved-bag restore, and folding
 * that into a shared helper would buy nothing but coupling.
 */
export type Card = { id: number; text: string; suit?: string; draft?: boolean };

/*
 * Resolves to the playable deck, or null if it could not be fetched or
 * parsed. Drafts are reserved ids with no text — they exist so the printed
 * deck reaches a tier, and a caller that rendered one would show an empty
 * card. On null the caller shows FAILURE_TEXT in its own card face: the
 * pages lay their faces out differently, so the message is shared but the
 * rendering is not.
 */
export async function loadDeck(): Promise<Card[] | null> {
  try {
    const res = await fetch("/cards.json");
    if (!res.ok) return null;
    const parsed = (await res.json()) as Card[];
    if (!Array.isArray(parsed)) return null;
    const deck = parsed.filter((c) => !c.draft);
    return deck.length > 0 ? deck : null;
  } catch {
    return null;
  }
}

export const FAILURE_TEXT = "The deck failed to load. Refresh to try again.";
