/*
 * Grasping Straws? — site configuration. The single source of truth for
 * these values; the build bakes them into every page.
 *
 * DECK_NAME is the display name used in designed contexts (masthead, card
 * back, <title> tags, OG titles). The "?" is part of the mark — don't
 * remove it here.
 *
 * PHYSICAL_DECK_URL is derived from STORE below: empty until an edition is
 * on sale. While it is empty the About page says "coming soon" and the
 * /play/ and /deck/ footers point at that About section. Once an edition has
 * a listing those links point at /get/. The masthead links to /get/ either
 * way.
 *
 * DECK_VERSION: keeps the site deck and the physical deck in lockstep.
 * It stays at 1 until a deck has been printed. After that, bump it
 * whenever card text changes (docs/printing.md, section 5); it shows
 * discreetly on the About page and should match the printed box.
 */
export const DECK_NAME = "Grasping Straws?";
/*
 * STORE: where each edition is sold, and for how much. Both stay empty until
 * the edition is listed. The store takes the order, prints it and ships it
 * (MakePlayingCards Marketplace does all three), so the site only links to
 * the listing: no payment code and no third-party request here.
 *   url    the listing's address, e.g. "https://www.makeplayingcards.com/…"
 *   price  as it should read on the page, e.g. "$38". Shown only when set.
 * Setting either edition's url turns the page's "Not on sale yet" into a buy link.
 */
export const STORE = {
  paper: { url: "", price: "" },
  night: { url: "", price: "" },
};

// Where every "get the deck" link on the site points: the page that sells
// both editions, once at least one is on sale. Empty until then.
export const PHYSICAL_DECK_URL = STORE.paper.url || STORE.night.url ? "/get/" : "";
export const DECK_VERSION = "1";
