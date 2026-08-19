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

## Org-wide GitHub registry

The live dashboard reads every `steven_os.projects` row. Active `stevetodman/*` repositories are discovered by `scripts/ingest-github-org.mjs` and upserted through the existing secret ingest function. Dependabot PRs and idle drafts are stored only as filter facts; they do not enter the execution queue. Archived repos are skipped.

```sh
node steven-os/scripts/ingest-github-org.mjs --dry-run
node steven-os/scripts/ingest-github-org.mjs
```

The Cardio Hospital specialist runner (`ingest-github-pr.mjs`) remains for package/walkthrough boundaries. It is no longer the only ingest path.

## Daily loop

Local morning run (org sync + brief):

```sh
node steven-os/scripts/run-morning.mjs
node steven-os/scripts/run-morning.mjs --skip-sync
node steven-os/scripts/brief.mjs
node steven-os/scripts/register-project.mjs --list
node steven-os/scripts/resolve-decision.mjs --list
```

The GitHub Action `steven-os-morning.yml` snapshots the live brief only. It does not hold a service-role key and does not sync private repos. Full org sync stays on this Mac via `gh`.

Decisions use the existing secret resolve API, not direct table access:

```sh
node steven-os/scripts/create-decision.mjs --project=cardio-hospital --title="..." --question="..."
node steven-os/scripts/resolve-decision.mjs <id> --approve
```

## Next implementation step

Deploy the resolve-function `create` action if it is not already live. Do not widen the OIDC gateway to every repository until a GitHub App identity exists.
