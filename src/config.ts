/*
 * Grasping Straws? — site configuration. The single source of truth for
 * these values; the build bakes them into every page.
 *
 * DECK_NAME is the display name used in designed contexts (masthead, card
 * back, <title> tags, OG titles). The "?" is part of the mark — don't
 * remove it here.
 *
 * PHYSICAL_DECK_URL: leave empty ("") until the physical deck exists; the
 * site then shows a quiet "coming soon" state and the chrome link points
 * at the About page. Once there is a product page (e.g. MakePlayingCards /
 * The Game Crafter), put its URL here and every physical-deck link on the
 * site points at it after the next deploy.
 *
 * DECK_VERSION: keeps the site deck and the physical deck in lockstep.
 * Bump it whenever a card-editing pass lands in public/cards.json; it
 * shows discreetly on the About page and should match the printed box.
 */
export const DECK_NAME = "Grasping Straws?";
export const PHYSICAL_DECK_URL = "";
export const DECK_VERSION = "1";
