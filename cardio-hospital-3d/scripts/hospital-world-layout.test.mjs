import test from "node:test";
import assert from "node:assert/strict";
import { locationForWorldPosition } from "../src/lib/hospital-world-layout.ts";

test("world location zones distinguish both clinic rooms, corridor, and workroom", () => {
  assert.equal(locationForWorldPosition(-5.35, -3), "clinic-room-1");
  assert.equal(locationForWorldPosition(5.35, -3), "clinic-room-3");
  assert.equal(locationForWorldPosition(0, -3), "clinic-corridor");
  assert.equal(locationForWorldPosition(0, 8), "workroom");
  assert.equal(locationForWorldPosition(-9, -3), null);
});

test("clinic doorway transition resolves symmetrically between corridor and room zones", () => {
  assert.equal(locationForWorldPosition(-2.1, -3), "clinic-corridor");
  assert.equal(locationForWorldPosition(-2.3, -3), "clinic-room-1");
  assert.equal(locationForWorldPosition(2.1, -3), "clinic-corridor");
  assert.equal(locationForWorldPosition(2.3, -3), "clinic-room-3");
});
