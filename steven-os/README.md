# Steven OS v0 — Shadow Mode

Steven OS is an experimental, model-agnostic control-plane concept for project memory, execution, verification, and human decision gates.

It is **not** the canonical source of current repository or hospital project state. Root `MASTER_PLAN.md` is the repository handoff source; `cardio-hospital-3d/AGENTS.md` owns hospital-local operating constraints.

## Governing separation

- **Models reason.** Models are replaceable workers selected by capability and measured performance.
- **Tools act.** GitHub, deployment platforms, databases, browsers, Drive, Gmail, Calendar, and other systems remain outside model implementations.
- **Workflows coordinate.** Durable state transitions, retries, approvals, and dependencies should be explicit when automation is justified.
- **Evaluations judge.** An agent claiming success is not evidence of success; deterministic checks or independently defined evaluators decide gates.
- **Structured storage may remember.** Persistent state should not depend on chat history alone.
- **Steven decides.** Clinical judgment, high-consequence publication, irreversible actions, and strategic choices remain human gates.

## Current scope

The original Cardio Hospital / PR #19 / Unreal ingestion pilot has been retired. Its scheduled GitHub ingest workflow, pilot config, and ingest worker were removed after the canonical hospital moved to `cardio-hospital-3d/` and `/hospital/`.

The remaining Steven OS files are retained as an experimental/reference implementation. They must not compete with repository-native state or trigger periodic project-state synchronization by default.

## v0 primitives retained for reference

1. Structured project/work-item state with evidence boundaries.
2. Provenance sources and immutable observed events.
3. A policy-engine concept separating execution work from human-only decisions.
4. Provider/model routing by capability rather than provider name.
5. Model-run telemetry concepts for quality, cost, latency, revisions, and acceptance.
6. Provider-neutral normalization concepts for external project data.

## Security boundary

- PHI is forbidden.
- `index.html` remains `noindex` and is not intended as a public homepage product.
- No provider API keys, GitHub tokens, service-role keys, email contents, calendar data, or other secrets belong in the repository.
- Do not expose private database schemas directly to browser clients.

## Re-entry criterion

Do not restart Steven OS automation merely because a control plane is architecturally interesting. Resume only if a concrete recurring coordination problem cannot be solved more simply by repository state, existing tools, and focused workflows.
