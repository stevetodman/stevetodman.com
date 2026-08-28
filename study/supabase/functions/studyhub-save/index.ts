// StudyHub cloud save.
//
// The kids' quiz pages talk to this function; they never hold a Supabase key
// of any kind. The function connects with the service role, so it is the only
// thing standing between the public internet and the database — it therefore
// touches nothing outside the `studyhub` schema.
//
// Auth is a random per-family token generated on the child's device. Only its
// SHA-256 lands in the database, so a leaked dump does not hand over anyone's
// save. The token is the credential: whoever holds it can read and write that
// family's progress, which is why the page keeps it in the URL *fragment*
// (never the query string) when sharing to a second device.
//
// Conflicts are MERGED, never resolved by last-writer-wins. Two children on
// two devices, both offline, both syncing later, is the normal case here and
// there is no adult present to arbitrate. All of this state is monotonic
// (mastered states, counters, bests), so a union merge is always correct and
// can never destroy progress. `revision` exists only to detect a concurrent
// write and retry the merge, not to reject one side.

import postgres from "npm:postgres@3.4.7";

const connectionString = Deno.env.get("SUPABASE_DB_URL");
if (!connectionString) throw new Error("SUPABASE_DB_URL is unavailable");

const sql = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

const MAX_BODY_BYTES = 256 * 1024; // a whole family's progress is a few KB
const TOKEN_MIN = 20;
const TOKEN_MAX = 200;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode("studyhub-v1:" + token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ── merge ──
   Mirrors mergeProfiles() in study/us-states.html. Kept deliberately simple
   and total: unknown keys are carried through untouched so a future study tool
   can store its own state under a profile without this function needing to
   understand it. */

type Stat = { streak?: number; correct?: number; wrong?: number; mastered?: boolean };

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);

function mergeStats(a: unknown, b: unknown): Record<string, Stat> {
  const out: Record<string, Stat> = {};
  const A = isObj(a) ? a : {};
  const B = isObj(b) ? b : {};
  for (const code of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const sa = (isObj(A[code]) ? A[code] : {}) as Stat;
    const sb = (isObj(B[code]) ? B[code] : {}) as Stat;
    out[code] = {
      streak: Math.max(num(sa.streak), num(sb.streak)),
      correct: Math.max(num(sa.correct), num(sb.correct)),
      wrong: Math.max(num(sa.wrong), num(sb.wrong)),
      mastered: !!(sa.mastered || sb.mastered),
    };
  }
  return out;
}

function mergeGame(a: unknown, b: unknown): Record<string, unknown> {
  const A = isObj(a) ? a : {};
  const B = isObj(b) ? b : {};
  const rewards: Record<string, { xp: number; coins: number }> = {};
  const rewardIds = [...new Set([
    ...Object.keys(isObj(A.rewards) ? A.rewards : {}),
    ...Object.keys(isObj(B.rewards) ? B.rewards : {}),
  ])].filter((id) => id.length < 100 && !["__proto__", "constructor", "prototype"].includes(id));
  for (const id of rewardIds) {
    const ar = isObj(isObj(A.rewards) ? A.rewards[id] : null) ? A.rewards[id] as Record<string, unknown> : {};
    const br = isObj(isObj(B.rewards) ? B.rewards[id] : null) ? B.rewards[id] as Record<string, unknown> : {};
    rewards[id] = {
      xp: Math.max(0, Math.min(id === "_legacy" ? Number.MAX_SAFE_INTEGER : 1000, Math.max(num(ar.xp), num(br.xp)))),
      coins: Math.max(0, Math.min(id === "_legacy" ? Number.MAX_SAFE_INTEGER : 1000, Math.max(num(ar.coins), num(br.coins)))),
    };
  }

  const purchases: Record<string, string> = {};
  const purchaseA = isObj(A.purchases) ? A.purchases : {};
  const purchaseB = isObj(B.purchases) ? B.purchases : {};
  for (const id of [...new Set([...Object.keys(purchaseA), ...Object.keys(purchaseB)])].filter((key) => key.length < 80).slice(-80)) {
    const av = typeof purchaseA[id] === "string" ? purchaseA[id] as string : "owned";
    const bv = typeof purchaseB[id] === "string" ? purchaseB[id] as string : "owned";
    purchases[id] = av > bv ? av : bv;
  }

  const equippedA = isObj(A.equipped) ? A.equipped : {};
  const equippedB = isObj(B.equipped) ? B.equipped : {};
  return {
    version: 1,
    rewards,
    sessionsCompleted: Math.max(num(A.sessionsCompleted), num(B.sessionsCompleted), rewardIds.filter((id) => id !== "_legacy").length),
    bossDefeatedAt: typeof A.bossDefeatedAt === "string" ? A.bossDefeatedAt : (typeof B.bossDefeatedAt === "string" ? B.bossDefeatedAt : null),
    purchases,
    equipped: {
      weapon: typeof equippedB.weapon === "string" ? equippedB.weapon : equippedA.weapon ?? "starter-sword",
      armor: typeof equippedB.armor === "string" ? equippedB.armor : equippedA.armor ?? "starter-cloak",
    },
  };
}

function mergeProfile(a: unknown, b: unknown): Record<string, unknown> {
  const A = isObj(a) ? a : {};
  const B = isObj(b) ? b : {};
  // Carry unknown keys through: newer clients may store more than this
  // function knows about, and dropping it would silently lose data.
  const out: Record<string, unknown> = { ...A, ...B };

  const stateStats = mergeStats(A.stateStats, B.stateStats);
  out.stateStats = stateStats;

  const orderA = Array.isArray(A.masteredOrder) ? A.masteredOrder : [];
  const orderB = Array.isArray(B.masteredOrder) ? B.masteredOrder : [];
  const seen = new Set<string>();
  const order: string[] = [];
  for (const code of [...orderA, ...orderB]) {
    if (typeof code === "string" && stateStats[code]?.mastered && !seen.has(code)) {
      seen.add(code);
      order.push(code);
    }
  }
  // A state mastered on one device but absent from both order lists still
  // belongs on the map.
  for (const [code, st] of Object.entries(stateStats)) {
    if (st.mastered && !seen.has(code)) { seen.add(code); order.push(code); }
  }
  out.masteredOrder = order;

  // Weekly counters only combine within the same week; a stale week is zero.
  const wkA = typeof A.weekKey === "string" ? A.weekKey : "";
  const wkB = typeof B.weekKey === "string" ? B.weekKey : "";
  const newest = wkA > wkB ? wkA : wkB;
  out.weekKey = newest;
  out.weekMastered = Math.max(
    wkA === newest ? num(A.weekMastered) : 0,
    wkB === newest ? num(B.weekMastered) : 0,
  );

  out.bossesDefeated = Math.max(num(A.bossesDefeated), num(B.bossesDefeated));
  out.bestStreak = Math.max(num(A.bestStreak), num(B.bestStreak));
  out.avatar = A.avatar ?? B.avatar ?? null;
  if (isObj(A.game) || isObj(B.game)) out.game = mergeGame(A.game, B.game);

  // Best round: compare only like-for-like round lengths.
  const brA = isObj(A.bestRound) ? A.bestRound : null;
  const brB = isObj(B.bestRound) ? B.bestRound : null;
  if (brA && brB) {
    out.bestRound = num(brA.total) === num(brB.total)
      ? (num(brA.score) >= num(brB.score) ? brA : brB)
      : (num(brA.total) >= num(brB.total) ? brA : brB);
  } else {
    out.bestRound = brA ?? brB ?? null;
  }

  // An in-progress round is device-local and is never synced.
  delete out.round;
  // The rolling accuracy window is device-local too: merging two devices'
  // recent answers would misrepresent how the child is currently doing.
  delete out.recent;

  return out;
}

function mergeFamilies(a: unknown, b: unknown): Record<string, unknown> {
  const A = isObj(a) ? a : {};
  const B = isObj(b) ? b : {};
  const out: Record<string, unknown> = {};
  for (const name of new Set([...Object.keys(A), ...Object.keys(B)])) {
    out[name] = mergeProfile(A[name], B[name]);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (token.length < TOKEN_MIN || token.length > TOKEN_MAX) {
    return json({ error: "bad_token" }, 400);
  }
  const tokenHash = await hashToken(token);
  const action = body.action === "push" ? "push" : "pull";

  try {
    if (action === "pull") {
      const rows = await sql`
        select data, revision from studyhub.saves where token_hash = ${tokenHash}
      `;
      if (!rows.length) return json({ found: false, data: {}, revision: 0 });
      return json({ found: true, data: rows[0].data, revision: Number(rows[0].revision) });
    }

    // push: merge the incoming state into whatever is already stored.
    const incoming = isObj(body.data) ? body.data : {};

    const merged = await sql.begin(async (tx) => {
      // Serialise read-merge-write per family. SELECT ... FOR UPDATE alone is
      // not enough: on the very first push there is no row to lock, so two
      // devices could both fall through to INSERT and one would hit the
      // unique constraint. A transaction-scoped advisory lock on the token
      // covers the not-yet-existing row too, and is released on commit.
      await tx`select pg_advisory_xact_lock(hashtextextended(${tokenHash}, 0))`;

      const existing = await tx`
        select data, revision from studyhub.saves
        where token_hash = ${tokenHash}
        for update
      `;
      const current = existing.length ? existing[0].data : {};
      const next = mergeFamilies(current, incoming);

      if (existing.length) {
        const updated = await tx`
          update studyhub.saves
          set data = ${sql.json(next)}, revision = revision + 1, updated_at = now()
          where token_hash = ${tokenHash}
          returning data, revision
        `;
        return updated[0];
      }
      const inserted = await tx`
        insert into studyhub.saves (token_hash, data, revision)
        values (${tokenHash}, ${sql.json(next)}, 1)
        returning data, revision
      `;
      return inserted[0];
    });

    return json({ ok: true, data: merged.data, revision: Number(merged.revision) });
  } catch (err) {
    console.error("studyhub-save failed", err);
    return json({ error: "server_error" }, 500);
  }
});
