// The box dieline as numbers: it has to describe a box that can be folded,
// and one that agrees with what the printer says it sells.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE, BOX, CUT, LID, PAGE, SPLIT_X } from "../scripts/box-spec.js";

const near = (a, b, tol = 0.06) => Math.abs(a - b) <= tol;

test("the lid is the size MakePlayingCards lists, and the base its height", () => {
  assert.ok(near(BOX.lid.l, 129.9), `lid length ${BOX.lid.l}`);
  assert.ok(near(BOX.lid.w, 79.1), `lid width ${BOX.lid.w}`);
  assert.ok(near(BOX.base.h, 30.3), `base height ${BOX.base.h}`);
});

test("the base fits inside the lid, and the lid is shallower than the base", () => {
  assert.ok(BOX.base.w < BOX.lid.w && BOX.base.l < BOX.lid.l);
  assert.ok(BOX.lid.h < BOX.base.h);
});

test("a tarot card and a 54-card stack fit in the base", () => {
  assert.ok(BOX.base.w - 2 * 1.6 > 69.85, "card width");
  assert.ok(BOX.base.l - 2 * 1.6 > 120.65, "card length");
  assert.ok(BOX.base.h > 19, "stack height");
});

test("each net's walls hang off its centre panel with the same depth all round", () => {
  for (const [name, net] of Object.entries({ LID, BASE })) {
    const depth = [
      net.top.y1 - net.top.y0,
      net.bottom.y1 - net.bottom.y0,
      net.left.x1 - net.left.x0,
      net.right.x1 - net.right.x0,
    ];
    assert.ok(depth.every((d) => near(d, depth[0], 0.02)), `${name} wall depths ${depth}`);
    assert.equal(net.top.x0, net.cover.x0, name);
    assert.equal(net.top.x1, net.cover.x1, name);
    assert.equal(net.bottom.x0, net.cover.x0, name);
    assert.ok(net.left.x1 < net.cover.x0 && net.right.x0 > net.cover.x1, name);
  }
});

test("the lid net is left of the split, the base net right of it, both on the page", () => {
  const xs = (pts) => pts.map(([x]) => x);
  assert.ok(Math.max(...xs(CUT.lid)) < SPLIT_X);
  assert.ok(Math.min(...xs(CUT.base)) > SPLIT_X);
  for (const [x, y] of [...CUT.lid, ...CUT.base]) {
    assert.ok(x >= 0 && x <= PAGE.w && y >= 0 && y <= PAGE.h);
  }
});

test("every fold lies inside its net's cut line", () => {
  for (const [net, cut] of [[LID, CUT.lid], [BASE, CUT.base]]) {
    const xs = cut.map(([x]) => x), ys = cut.map(([, y]) => y);
    for (const r of Object.values(net)) {
      assert.ok(r.x0 > Math.min(...xs) && r.x1 < Math.max(...xs));
      assert.ok(r.y0 > Math.min(...ys) && r.y1 < Math.max(...ys));
    }
  }
});
