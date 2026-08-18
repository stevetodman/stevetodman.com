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

const projectStates = new Set(["active", "paused", "blocked", "complete", "parked"]);
const ownerClasses = new Set(["steven", "execution", "external"]);
const evidenceStates = new Set(["pass", "fail", "blocked", "unknown", "informational"]);

function text(value: unknown, field: string, max = 1000): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be a non-empty string`);
  if (value.length > max) throw new Error(`${field} exceeds ${max} characters`);
  return value;
}

function optionalText(value: unknown, field: string, max = 4000): string | null {
  if (value === undefined || value === null || value === "") return null;
  return text(value, field, max);
}

function object(value: unknown, field: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object`);
  return value as Record<string, unknown>;
}

function array(value: unknown, field: string): unknown[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  return value;
}

function iso(value: unknown, field: string): string {
  const raw = text(value, field, 100);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.valueOf())) throw new Error(`${field} must be ISO-like date/time`);
  return parsed.toISOString();
}

export default {
  fetch: withSupabase({ auth: "secret" }, async (req) => {
    if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });

    try {
      const body = object(await req.json(), "body");
      const project = object(body.project, "project");
      const source = object(body.source, "source");
      const workItem = object(body.workItem, "workItem");
      const event = object(body.event, "event");
      const evidence = [
        ...array(body.ciEvidence, "ciEvidence"),
        ...array(body.boundaryEvidence, "boundaryEvidence"),
        ...array(body.evidence, "evidence"),
      ];

      const projectId = text(project.id, "project.id", 120);
      const projectState = text(project.status ?? "active", "project.status", 30);
      if (!projectStates.has(projectState)) throw new Error("project.status is invalid");

      const sourceSystem = text(source.sourceSystem, "source.sourceSystem", 80);
      const sourceExternalId = text(source.externalId, "source.externalId", 200);
      const sourceSha = text(source.sourceSha, "source.sourceSha", 200);
      const sourceObservedAt = source.observedAt ? iso(source.observedAt, "source.observedAt") : new Date().toISOString();

      const workOwner = text(workItem.ownerClass ?? "execution", "workItem.ownerClass", 30);
      if (!ownerClasses.has(workOwner)) throw new Error("workItem.ownerClass is invalid");

      const result = await sql.begin(async (tx) => {
        await tx`
          insert into steven_os.projects
            (id, name, objective, status, priority, risk_level, repository_full_name, production_url, metadata, updated_at)
          values (
            ${projectId},
            ${text(project.name, "project.name", 300)},
            ${text(project.objective, "project.objective", 5000)},
            ${projectState},
            ${Number.isInteger(project.priority) ? project.priority : 100},
            ${text(project.riskLevel ?? "medium", "project.riskLevel", 30)},
            ${optionalText(project.repositoryFullName, "project.repositoryFullName", 300)},
            ${optionalText(project.productionUrl, "project.productionUrl", 1000)},
            ${tx.json(object(project.metadata, "project.metadata"))},
            now()
          )
          on conflict (id) do update set
            name=excluded.name,
            objective=excluded.objective,
            status=excluded.status,
            priority=excluded.priority,
            risk_level=excluded.risk_level,
            repository_full_name=excluded.repository_full_name,
            production_url=excluded.production_url,
            metadata=excluded.metadata,
            updated_at=now()
        `;

        const [sourceRow] = await tx`
          insert into steven_os.sources
            (source_system, external_id, source_url, source_sha, observed_at, metadata)
          values (
            ${sourceSystem},
            ${sourceExternalId},
            ${optionalText(source.sourceUrl, "source.sourceUrl", 2000)},
            ${sourceSha},
            ${sourceObservedAt},
            ${tx.json(object(source.metadata, "source.metadata"))}
          )
          on conflict (source_system, external_id, source_sha) do update set
            source_url=excluded.source_url,
            observed_at=excluded.observed_at,
            metadata=excluded.metadata
          returning id
        `;

        const [workRow] = await tx`
          insert into steven_os.work_items
            (project_id, external_system, external_id, kind, title, state, owner_class, acceptance_criteria, evidence, metadata, updated_at)
          values (
            ${projectId},
            ${text(workItem.externalSystem ?? sourceSystem, "workItem.externalSystem", 80)},
            ${text(workItem.externalId, "workItem.externalId", 200)},
            ${text(workItem.kind, "workItem.kind", 80)},
            ${text(workItem.title, "workItem.title", 500)},
            ${text(workItem.state, "workItem.state", 80)},
            ${workOwner},
            ${tx.json(array(workItem.acceptanceCriteria, "workItem.acceptanceCriteria"))},
            '[]'::jsonb,
            ${tx.json(object(workItem.metadata, "workItem.metadata"))},
            now()
          )
          on conflict (external_system, external_id) do update set
            project_id=excluded.project_id,
            kind=excluded.kind,
            title=excluded.title,
            state=excluded.state,
            owner_class=excluded.owner_class,
            acceptance_criteria=excluded.acceptance_criteria,
            metadata=excluded.metadata,
            updated_at=now()
          returning id
        `;

        const sourceId = sourceRow.id;
        const workItemId = workRow.id;
        await tx`delete from steven_os.evidence where source_id=${sourceId} and work_item_id=${workItemId}`;

        let evidenceCount = 0;
        for (const raw of evidence) {
          const item = object(raw, "evidence[]");
          const status = text(item.status, "evidence[].status", 30);
          if (!evidenceStates.has(status)) throw new Error(`invalid evidence status: ${status}`);
          await tx`
            insert into steven_os.evidence
              (project_id, work_item_id, source_id, claim, status, evidence_type, observed_at, metadata)
            values (
              ${projectId}, ${workItemId}, ${sourceId},
              ${text(item.claim, "evidence[].claim", 8000)},
              ${status},
              ${text(item.evidenceType, "evidence[].evidenceType", 120)},
              now(),
              ${tx.json(object(item.metadata, "evidence[].metadata"))}
            )
          `;
          evidenceCount += 1;
        }

        if (Object.keys(event).length) {
          await tx`
            insert into steven_os.events
              (project_id, source_id, event_type, external_event_id, occurred_at, observed_at, payload)
            values (
              ${projectId}, ${sourceId},
              ${text(event.eventType, "event.eventType", 120)},
              ${text(event.externalEventId, "event.externalEventId", 300)},
              ${iso(event.occurredAt, "event.occurredAt")},
              ${event.observedAt ? iso(event.observedAt, "event.observedAt") : new Date().toISOString()},
              ${tx.json(object(event.payload, "event.payload"))}
            )
            on conflict (source_id, external_event_id) do update set
              observed_at=excluded.observed_at,
              payload=excluded.payload
          `;
        }

        return { projectId, sourceId, workItemId, evidenceCount };
      });

      return Response.json({ ok: true, ...result }, { status: 200 });
    } catch (error) {
      console.error("steven-os-ingest", error);
      const message = error instanceof Error ? error.message : "unknown_error";
      return Response.json({ ok: false, error: message }, { status: 400 });
    }
  }),
};
