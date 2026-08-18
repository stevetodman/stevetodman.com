# Steven OS v0 — Shadow Mode

Steven OS is a model-agnostic control plane for project memory, execution, verification, and human decision gates.

## Governing separation

- **Models reason.** Models are replaceable workers selected by capability and measured performance.
- **Tools act.** GitHub, deployment platforms, databases, browsers, Drive, Gmail, Calendar, Blender, and other systems remain outside model implementations.
- **Workflows coordinate.** Durable state transitions, retries, approvals, and dependencies are explicit.
- **Evaluations judge.** An agent claiming success is not evidence of success; deterministic tests or independently defined evaluators decide gates.
- **Postgres remembers.** Durable state lives in structured storage, not in chat history.
- **Steven decides.** Clinical judgment, high-consequence publication, money thresholds, irreversible actions, and strategic choices escalate to Steven.

## Current state

A dedicated Supabase project named `steven-os` is provisioned in `us-east-1`. The live database uses the private `steven_os` schema in `schema.sql`; `anon` and `authenticated` have no table privileges in that schema. Supabase security advisors currently report zero security lints.

The first canonical live project is Cardio Hospital / PR #19. Its record was seeded from current GitHub PR and workflow state rather than from chat memory. The database separately records:

- the PR source and exact head SHA,
- normalized work-item state,
- GitHub Actions evidence,
- the native Unreal evidence boundary,
- execution-owned next work,
- and Steven-only decision gates.

The checked-in `state/projects.json` remains a shadow fixture for the static dashboard and regression tests; it is not the canonical database.

## v0 primitives

1. Structured canonical project/work-item state with evidence boundaries.
2. Provenance sources and immutable observed events.
3. A policy engine that separates execution work from Steven-only decisions.
4. A provider/model router whose task contract is capability-based rather than provider-name-based.
5. Model-run telemetry tables for quality, cost, latency, revisions, and acceptance.
6. A GitHub normalizer that converts provider-specific PR/workflow payloads into provider-neutral control-plane facts.

## Security boundary

- PHI is forbidden in v0.
- `index.html` is `noindex` and is not linked from the public homepage.
- Canonical tables live in a non-exposed private Postgres schema.
- Future browser access must go through authenticated server endpoints; do not expose `steven_os` directly through the Data API.
- No provider API keys, GitHub tokens, service-role keys, email contents, or calendar data belong in the repository.

## Next implementation step

Add a narrowly authenticated server-side API for reads/writes against the private schema, then run the GitHub normalizer from an event-driven ingest worker instead of manual connector ingestion. After that, replace the static dashboard fixture with database-backed reads and add provider adapters/evaluation telemetry.
