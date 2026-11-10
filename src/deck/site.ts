/*
 * The two tables the site deals from, one per edition. The pages read this
 * file to know where an edition lives online: its draw page, the file its
 * cards are fetched from, and the key its saved state is kept under.
 *
 * Only the pages import this. The draw script must not: it would carry both
 * decks to every visitor. It is told which table it is at by the page (see
 * DrawTable.astro), and the Node tests read the card files directly.
 */
import paperEntries from "../../public/cards.json";
import nightEntries from "./night.json";
import { liveCards, type Card } from "./cards.ts";
import { EDITIONS, type Edition, type EditionKey } from "./editions.ts";

export type Table = {
  edition: Edition;
  home: string; // the page that deals this deck
  cardsUrl: string; // what the draw script fetches there
  storageKey: string; // where a visitor's bag, discard and shelf are saved
  cards: Card[]; // the cards dealt: every entry that is not a draft
  about: string; // one sentence for a share page: what the card is one of
  blurb: string; // what this deck is, in one sentence, on /deck/
};

export const TABLES: Record<EditionKey, Table> = {
  paper: {
    edition: EDITIONS.paper,
    home: "/",
    cardsUrl: "/cards.json",
    // Never change this: it is the key every existing visitor's deck is
    // saved under, from before there was a second edition.
    storageKey: "grasping-straws.v1",
    cards: liveCards(paperEntries),
    about: "original prompts for breaking a creative deadlock.",
    blurb: EDITIONS.paper.blurb,
  },
  night: {
    edition: EDITIONS.night,
    home: "/night/",
    // Served by src/pages/night/cards.json.ts. The deck's own file stays
    // under src/, so it has one address online and it is this one.
    cardsUrl: "/night/cards.json",
    storageKey: "grasping-straws.night.v1",
    cards: liveCards(nightEntries),
    about: "prompts from the Night edition, for the person making the work.",
    // Not the box's sentence: that one calls every card a question, and
    // about half of them are orders.
    blurb: "Fifty-two prompts for the person making it, for when the piece is not the problem.",
  },
};

export const ALL_TABLES: readonly Table[] = Object.values(TABLES);

/* Which table a card belongs to. Ids never overlap between editions. */
export function tableOf(id: number): Table {
  const table = ALL_TABLES.find((t) => id >= t.edition.ids[0] && id <= t.edition.ids[1]);
  if (!table) throw new Error(`card ${id} belongs to no edition`);
  return table;
}
