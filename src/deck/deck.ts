/*
 * The deck: one cycle of the bag, the discard and the shelf, and the rule
 * that the next card dealt never repeats the one face up.
 *
 * No DOM and no storage in here. The caller hands in whatever it loaded and
 * writes back whatever serialize() returns; that is what makes the cycle
 * testable in Node in milliseconds, and it is why the saved shape has one
 * owner.
 *
 * The bag is every id not yet dealt this cycle, top of the pile at the end.
 * The discard (`order`) is the sequence dealt this cycle, oldest first. The
 * shelf (`aside`) is a bookmark, not a removal: a shelved card stays in the
 * cycle and the counts are untouched (see docs/adr/0001).
 */

import type { Card } from "./cards";

export type DeckState = {
  bag: number[];
  order: number[];
  aside: number[];
  last: number | null;
};

export type Counts = { left: number; drawn: number; aside: number; total: number };

// A source of integers in [0, n). Injected so the cycle is testable with a
// seeded generator; production uses the platform's CSPRNG.
export type Rng = (n: number) => number;

export function cryptoRng(n: number): number {
  const c = globalThis.crypto;
  if (c && c.getRandomValues) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    do {
      c.getRandomValues(buf);
    } while (buf[0]! >= limit);
    return buf[0]! % n;
  }
  return Math.floor(Math.random() * n);
}

// How much of a pile is left, read as visible card edges. Front-loaded: the
// first few discards should visibly register, while the difference between
// 30 and 40 drawn does not need its own layer. A linear mapping would make
// the first ten draws look inert.
export const PILE_STEPS = [1, 3, 6, 12, 24, 40];

export function layersFor(n: number): number {
  return PILE_STEPS.filter((step) => n >= step).length;
}

// The main stack's thickness, in visible edges, for a bag this full.
export function edgesFor(left: number, total: number): 1 | 2 | 3 {
  const ratio = total === 0 ? 0 : left / total;
  return ratio > 0.6 ? 3 : ratio > 0.3 ? 2 : 1;
}

export class Deck {
  readonly cards: readonly Card[];
  private byId: Map<number, Card>;
  private bag: number[] = [];
  private _order: number[] = [];
  private _aside: number[] = [];
  private _last: number | null = null;
  private rng: Rng;

  constructor(cards: readonly Card[], rng: Rng) {
    this.cards = cards;
    this.byId = new Map(cards.map((c) => [c.id, c]));
    this.rng = rng;
  }

  card(id: number): Card | undefined {
    return this.byId.get(id);
  }

  has(id: unknown): id is number {
    return typeof id === "number" && this.byId.has(id);
  }

  get last(): number | null {
    return this._last;
  }

  // Ids dealt this cycle, oldest first.
  get order(): readonly number[] {
    return this._order;
  }

  // Ids on the shelf, in the order they were kept.
  get aside(): readonly number[] {
    return this._aside;
  }

  counts(): Counts {
    return {
      left: this.bag.length,
      drawn: this._order.length,
      aside: this._aside.length,
      total: this.cards.length,
    };
  }

  edges(): 1 | 2 | 3 {
    return edgesFor(this.bag.length, this.cards.length);
  }

  // Deal the next card. When the bag is empty the cycle restarts: the discard
  // is swept back in and reshuffled so the first card of the new bag never
  // repeats the one face up.
  draw(): { card: Card; reshuffled: boolean } | null {
    if (this.cards.length === 0) return null;
    const reshuffled = this.bag.length === 0;
    if (reshuffled) this.refill();
    const id = this.bag.pop()!;
    this._last = id;
    this._order.push(id);
    return { card: this.byId.get(id)!, reshuffled };
  }

  // Turn a card that is already out of the bag face up (a deep link, or a
  // pick from a pile). Nothing is dealt: the bag and the discard are
  // unchanged. The bag is re-topped so the next deal still differs.
  turnUp(id: unknown): Card | null {
    if (!this.has(id)) return null;
    this._last = id;
    this.keepTopFresh();
    return this.byId.get(id)!;
  }

  isAside(id: number | null): boolean {
    return id !== null && this._aside.includes(id);
  }

  // Bookmark or release the face-up card. Returns the new state, or null
  // when nothing is face up.
  toggleAside(): "kept" | "released" | null {
    const id = this._last;
    if (id === null || !this.byId.has(id)) return null;
    const at = this._aside.indexOf(id);
    if (at >= 0) {
      this._aside.splice(at, 1);
      return "released";
    }
    this._aside.push(id);
    return "kept";
  }

  serialize(): DeckState {
    return {
      bag: this.bag.slice(),
      order: this._order.slice(),
      aside: this._aside.slice(),
      last: this._last,
    };
  }

  private shuffled(ids: number[]): number[] {
    const a = ids.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.rng(i + 1);
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  }

  private keepTopFresh(): void {
    const top = this.bag.length - 1;
    if (this.bag.length > 1 && this.bag[top] === this._last) {
      const j = this.rng(this.bag.length - 1);
      [this.bag[top], this.bag[j]] = [this.bag[j]!, this.bag[top]!];
    }
  }

  private refill(): void {
    this.bag = this.shuffled(this.cards.map((c) => c.id));
    this._order = [];
    this.keepTopFresh();
  }

  // Restore a cycle from whatever was saved. Ids that no longer exist in the
  // deck simply vanish from every list; new cards join at the next reshuffle.
  // A shape saved before the discard was recorded (v1: bag and last only)
  // has its discard rebuilt: the SET of dealt cards is deck minus bag, and
  // the one position v1 did record — the card face up — goes last.
  restore(stored: unknown): void {
    const s = (typeof stored === "object" && stored !== null ? stored : {}) as Record<string, unknown>;
    if (!Array.isArray(s.bag)) {
      this.refill();
      return;
    }
    const live = (id: unknown): id is number => this.has(id);
    this.bag = s.bag.filter(live);
    this._last = live(s.last) ? s.last : null;
    this._aside = Array.isArray(s.aside) ? [...new Set(s.aside.filter(live))] : [];
    if (Array.isArray(s.order)) {
      this._order = [...new Set(s.order.filter(live))];
    } else {
      const inBag = new Set(this.bag);
      const last = this._last;
      this._order = this.cards.map((c) => c.id).filter((id) => !inBag.has(id) && id !== last);
      if (last !== null) this._order.push(last);
    }
    if (this.bag.length === 0) this.refill();
  }
}

export function openDeck(cards: readonly Card[], stored: unknown, rng: Rng = cryptoRng): Deck {
  const deck = new Deck(cards, rng);
  deck.restore(stored);
  return deck;
}
