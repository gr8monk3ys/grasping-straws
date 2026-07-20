/*
 * Grasping Straws? — the daily card. One deterministic card per calendar
 * day, the same for every visitor sharing a date: an FNV-1a hash of the
 * local YYYY-MM-DD picks from the deck sorted by id (stable against
 * reordering in cards.json). No backend, no state — the date is the seed.
 */

type Card = { id: number; text: string; suit?: string };

const markEl = document.getElementById("today-mark") as HTMLElement;
const textEl = document.getElementById("today-text") as HTMLElement;
const dateEl = document.getElementById("today-date") as HTMLElement;
const shareEl = document.getElementById("today-share") as HTMLAnchorElement;

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

async function init(): Promise<void> {
  let deck: Card[];
  try {
    const res = await fetch("/cards.json");
    deck = (await res.json()) as Card[];
  } catch {
    markEl.hidden = true;
    textEl.hidden = false;
    textEl.textContent = "The deck failed to load. Refresh to try again.";
    return;
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const key = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const sorted = deck.slice().sort((a, b) => a.id - b.id);
  const card = sorted[fnv1a(key) % sorted.length]!;

  markEl.hidden = true;
  textEl.hidden = false;
  textEl.textContent = card.text;
  dateEl.textContent = now.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  shareEl.href = "/c/" + card.id + "/";
}

init();
