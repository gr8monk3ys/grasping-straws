/*
 * The two printed editions. An edition is a deck with its own box and its
 * own range of card ids; the print pipeline and the box generator read this
 * file and nothing else to know what they are making.
 *
 * Paper works on the piece in front of you and is the deck the site deals.
 * Night works on the person making it. Ids never overlap, so a number
 * printed on a card names exactly one card; Night starts at 101 to leave
 * Paper room to grow a tier without renumbering anything.
 */
import { NIGHT, PAPER } from "./palette.ts";
import type { Palette } from "./palette.ts";

export type EditionKey = "paper" | "night";

export type Edition = {
  key: EditionKey;
  name: string; // as printed: "Paper edition"
  file: string; // card file, relative to the repo root
  ids: readonly [first: number, last: number];
  palette: Palette; // the card stock and what is printed on it
  // Pale type on dark stock loses weight on press as ink spreads into the
  // letters, so a reversed face is set a little heavier to land the same.
  reversed: boolean;
  subtitle: readonly [string, string]; // the title card's two italic lines
  blurb: string; // the box base: what this deck is, in one sentence
  instructions: readonly string[];
  box: {
    lid: string;
    lidMark: string;
    lidInk: string;
    lidLabel: string;
    base: string;
    baseInk: string;
    baseLabel: string;
  };
};

export const EDITIONS: Record<EditionKey, Edition> = {
  paper: {
    key: "paper",
    name: "Paper edition",
    file: "public/cards.json",
    ids: [1, 52],
    palette: PAPER,
    reversed: false,
    subtitle: ["an original deck of", "lateral-thinking prompts"],
    blurb: "Fifty-two prompts for the piece in front of you, for when it has stopped moving.",
    instructions: [
      "Stuck? Shuffle. Draw one card. Read it once.",
      "Apply it to the thing in front of you, however literally you can bear. The prompt that seems wrong is usually the one doing the work.",
      "Deal through the deck before reshuffling — no card twice in a cycle.",
    ],
    box: {
      lid: PAPER.accent,
      lidMark: PAPER.ground,
      lidInk: PAPER.ground,
      lidLabel: "#b9d3c5", // paper ink thinned over forest ink: the wall label
      base: PAPER.ground,
      baseInk: PAPER.ink,
      baseLabel: PAPER.muted,
    },
  },
  night: {
    key: "night",
    name: "Night edition",
    file: "src/deck/night.json",
    ids: [101, 152],
    palette: NIGHT,
    reversed: true,
    subtitle: ["fifty-two questions for", "whoever is making it"],
    blurb: "Fifty-two questions for the person making it, for when the piece is not the problem.",
    instructions: [
      "This deck is not about the work. It is about whoever is making it.",
      "Draw one card, alone. Answer it before you touch anything. If the answer comes quickly, it is the rehearsed one; ask again.",
      "Not a deck to draw from in company.",
    ],
    box: {
      lid: NIGHT.ground,
      lidMark: NIGHT.accent,
      lidInk: NIGHT.ink,
      lidLabel: NIGHT.muted,
      base: NIGHT.card,
      baseInk: NIGHT.ink,
      baseLabel: NIGHT.muted,
    },
  },
};

export function edition(key: string | undefined): Edition {
  const found = EDITIONS[(key ?? "paper") as EditionKey];
  if (!found) {
    throw new Error(`unknown edition "${key}": expected one of ${Object.keys(EDITIONS).join(", ")}`);
  }
  return found;
}
