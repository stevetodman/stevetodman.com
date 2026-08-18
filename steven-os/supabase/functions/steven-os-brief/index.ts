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
    if (req.method !== "GET" && req.method !== "POST") {
      return Response.json({ error: "method_not_allowed" }, { status: 405 });
    }

    try {
      const projects = await sql`
        select id, name, objective, status, priority, risk_level,
               repository_full_name, production_url, updated_at,
               open_work_items, passing_evidence, failing_evidence,
               blocked_evidence, open_decisions
        from steven_os.project_brief
        order by priority asc, name asc
      `;

      const decisions = await sql`
        select id, project_id, project_name, priority, title, question,
               recommendation, alternatives, consequence, created_at
        from steven_os.decision_queue
        order by priority asc, created_at asc
      `;

      const execution = await sql`
        select id, project_id, project_name, priority, kind, title, state,
               acceptance_criteria, metadata, updated_at,
               blocked_evidence, failing_evidence
        from steven_os.execution_queue
        order by priority asc, updated_at asc
      `;

      return Response.json({
        generatedAt: new Date().toISOString(),
        mode: "server-secret",
        projects,
        decisions,
        execution,
      });
    } catch (error) {
      console.error("steven-os-brief", error);
      return Response.json({ error: "brief_generation_failed" }, { status: 500 });
    }
  }),
};
