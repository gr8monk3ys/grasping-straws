# The shelf is a bookmark, not a removal

Setting a card aside keeps it in the cycle: it is still dealt in its turn, the bag and discard counts do not change, and the reshuffle does not exclude it. The alternative, taking shelved cards out of play, was rejected because the reshuffle would then have to exclude them (an all-shelved deck could not reshuffle at all), the persisted shape would need a second notion of "gone", and "how many are left" would stop meaning one thing on the table. The shelf is therefore stored as a list of ids alongside the bag and discard, never as a change to either.
