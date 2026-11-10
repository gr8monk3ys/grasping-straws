/*
 * Grasping Straws? — site configuration. The single source of truth for
 * these values; the build bakes them into every page.
 *
 * DECK_NAME is the display name used in designed contexts (masthead, card
 * back, <title> tags, OG titles). The "?" is part of the mark — don't
 * remove it here.
 *
 * PHYSICAL_DECK_URL: leave empty ("") until the physical deck exists. The
 * About page then says "coming soon", the masthead carries no deck link at
 * all, and the /play/ and /deck/ footers point at that About section. Once
 * there is a product page (e.g. MakePlayingCards / The Game Crafter), put
 * its URL here: the masthead gains "Get the deck" and every physical-deck
 * link on the site points at it after the next deploy.
 *
 * DECK_VERSION: keeps the site deck and the physical deck in lockstep.
 * It stays at 1 until a deck has been printed. After that, bump it
 * whenever card text changes (docs/printing.md, section 5); it shows
 * discreetly on the About page and should match the printed box.
 */
export const DECK_NAME = "Grasping Straws?";
export const PHYSICAL_DECK_URL = "";
export const DECK_VERSION = "1";
