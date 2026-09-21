# Grasping Straws?

A deck of original lateral-thinking prompts, dealt one card at a time on the site and printed as a physical deck. The site is a sample of the object; the physical deck is the instrument.

## Language

### The deck

**Card**:
One written prompt with a stable id. The id is the same number on the printed card and in its share page.
_Avoid_: prompt, strategy, entry

**Draft**:
A card slot reserved by id so the printed deck reaches one of the printer's fixed tiers, with the text still unwritten. Never dealt, never published.
_Avoid_: placeholder, reserved card, empty card

**Deck**:
Every card the site deals: the entries of cards.json that are not drafts.
_Avoid_: pack, set

### The cycle

**Cycle**:
One pass through the deck: every card is dealt exactly once, then the deck reshuffles.
_Avoid_: round, run, session

**Bag**:
The cards not yet dealt this cycle.
_Avoid_: remaining, stack, pile (the stack is how the bag is drawn on the table)

**Deal**:
Take the top card of the bag and turn it face up. The only action that shrinks the bag.
_Avoid_: draw (the visitor's gesture; what it does to the deck is a deal), pick

**Discard**:
The cards dealt this cycle, in the order they were dealt. Swept back into the bag when the cycle restarts.
_Avoid_: drawn pile, history

**Reshuffle**:
The start of a new cycle: the discard returns to the bag in a fresh order whose first card differs from the card face up.
_Avoid_: reset, refill

**Face-up card**:
The one card showing on the table. Dealing changes it, and so does turning up a card from a pile or a share link.
_Avoid_: current card, last card, selected card

**Turn up**:
Make a card the face-up card without dealing it: from a pile, or by following a share link. The bag and the discard are unchanged.
_Avoid_: reveal, select, open

### The shelf

**Shelf**:
The cards the visitor has set aside to keep. A bookmark: a shelved card stays in the cycle and the counts are untouched.
_Avoid_: favourites, saved, kept pile (the table's label reads "kept"; the concept is the shelf)

**Set aside**:
Put the face-up card on the shelf, or take it back off.
_Avoid_: keep, save, star, bookmark (the shelf *is* a bookmark; the action is "set aside")

**Pile**:
The discard or the shelf, as something on the table that can be picked up and looked through.
_Avoid_: list, spread (the spread is the pile as laid out once picked up)

### Sharing

**Share page**:
The static page at /c/‹id›/ that shows one card face up and carries its text in the title, so a shared link previews the card.
_Avoid_: permalink, card page, deep link (a deep link is /#‹id› on the draw screen; it turns the card up in place)
