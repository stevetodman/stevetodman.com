import { withSupabase } from "npm:@supabase/server";
import postgres from "npm:postgres@3.4.7";

const connectionString = Deno.env.get("SUPABASE_DB_URL");
if (!connectionString) throw new Error("SUPABASE_DB_URL is unavailable");

const sql = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

export default {
  fetch: withSupabase({ auth: "secret" }, async (req) => {
    if (req.method !== "POST") {
      return Response.json({ error: "method_not_allowed" }, { status: 405 });
    }

    try {
      const body = await req.json();
      const id = typeof body.id === "string" ? body.id : "";
      const action = body.action === "reject" ? "reject" : "approve";
      const notes = typeof body.notes === "string" ? body.notes : "";

      if (!id) {
        return Response.json({ error: "id_required" }, { status: 400 });
      }

      const state = action === "approve" ? "decided" : "superseded";
      const recommendation = {
        decided_by: "Steven",
        action,
        notes: notes || (action === "approve" ? "Approved by Steven" : "Rejected by Steven"),
        resolved_at: new Date().toISOString(),
      };

      const rows = await sql`
        update steven_os.decisions
        set
          state = ${state},
          decided_at = now(),
          recommendation = coalesce(recommendation, '{}'::jsonb) || ${sql.json(recommendation)}
        where id = ${id}::uuid and state = 'open'
        returning id, title, state, decided_at
      `;

      if (!rows.length) {
        return Response.json({ error: "not_found_or_already_resolved" }, { status: 404 });
      }

      return Response.json({ ok: true, decision: rows[0] });
    } catch (error) {
      console.error("steven-os-resolve", error);
      return Response.json({ error: "resolve_failed" }, { status: 500 });
    }
  }),
};
