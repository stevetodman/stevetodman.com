# Steven OS v0 — Shadow Mode

Steven OS is a model-agnostic control plane for project memory, execution, verification, and human decision gates.

## Governing separation

- **Models reason.** Models are replaceable workers selected by capability and measured performance.
- **Tools act.** GitHub, deployment platforms, databases, browsers, Drive, Gmail, Calendar, Blender, and other systems remain outside model implementations.
- **Workflows coordinate.** Durable state transitions, retries, approvals, and dependencies are explicit.
- **Evaluations judge.** An agent claiming success is not evidence of success; deterministic tests or independently defined evaluators decide gates.
- **Postgres remembers.** Durable state lives in structured storage, not in chat history.
- **Steven decides.** Clinical judgment, high-consequence publication, money thresholds, irreversible actions, and strategic choices escalate to Steven.

## v0 vertical slice

This directory intentionally does not make live provider calls and does not require secrets. It proves three primitives:

1. A canonical structured project record with evidence boundaries.
2. A policy engine that separates execution work from Steven-only decisions.
3. A provider/model router whose task contract is capability-based rather than provider-name-based.

The initial real project snapshot is Cardio Hospital / PR #19. The dashboard distinguishes successful portable CI from the still-unverified native Unreal gates.

## Security boundary

- PHI is forbidden in v0.
- `index.html` is `noindex` and is not linked from the public homepage.
- `schema.sql` uses a private `steven_os` Postgres schema and revokes browser roles. Future browser access should go through authenticated server endpoints rather than exposing the control-plane tables directly.
- No provider API keys, GitHub tokens, service-role keys, email contents, or calendar data belong in the repository.

## Next implementation step

Provision a dedicated Supabase project, apply `schema.sql`, add authenticated server endpoints, then replace the checked-in shadow snapshot with ingest jobs that read GitHub/deployment state and persist normalized events. After the control plane is reliable, add provider adapters and model evaluation telemetry.
