# Pull Request Triage — 2026-08-19

This file prevents old/stacked work from becoming an undifferentiated backlog. Re-check current PR state before acting; this is a decision aid, not a substitute for the PR itself.

## ABPM / BP

| PR | Recommendation | Reason |
|---|---|---|
| #1 — AAP-guided pediatric BP next-step workflow | **KEEP / rebase before any merge** | Clinically meaningful but touches the live BP calculator and still requires clinical/governance review. Rebase onto current calculator before reassessment. |
| #2 — pediatric ABPM report-summary test pathway | **CLOSED — superseded** | PR #3 is the hardened continuation. Closed 2026-08-19 with a pointer to #3. |
| #3 — hardened pediatric ABPM preview | **KEEP as PREVIEW only** | Stronger safety/release gates; still explicitly blocked on real-device/VoiceOver, host-header capture, specialist/governance review, and validated fixture comparison before any clinical promotion. |

## Cardio Hospital / Unreal stack

These PRs are intentionally not mass-closed here because several contain distinct evidence or assets that may still be needed. The stack should be consolidated around one active integration path after the workstation/human gates are resolved.

| PR | Relationship / recommendation |
|---|---|
| #19 — Unreal migration scaffold | **FOUNDATION / KEEP draft**. Main architectural base; do not call complete until native compile/automation/package/walkthrough/performance and clinical/branding gates are met. |
| #20 — macOS/Apple-silicon release rebaseline | **STACKED on #19 / KEEP** until its ADR/build changes are incorporated into the active integration branch. |
| #22 — exam-room P0 assets/materials | **STACKED asset work / KEEP draft**. Requires Unreal import/material/scene/performance validation. |
| #23 — AAA exam-room benchmark/greybox | **SEPARATE GATE / KEEP draft**. Requires clinical-layout/reference approval before production art advances. |
| #24 — nine-case clinical core | **STACKED on #19 / KEEP**. Portable clinical content; native Unreal/formal review still pending. |
| #27 — integrate launch-set core into Mac world | **CURRENT INTEGRATION CANDIDATE**. It already records an honest failed packaged walkthrough; next work should resolve the listed GameMode/human walkthrough/Patel/performance gates rather than opening another parallel integration PR. |

### Cardio Hospital cleanup rule

Before opening another Cardio Hospital integration branch:

1. start from #27 and determine whether it can absorb the required #19/#20/#24 state;
2. identify which portions of #22/#23 are independent assets/gates rather than code dependencies;
3. record native Mac walkthrough/performance evidence;
4. only then close superseded stacked PRs with explicit pointers to the integrating PR.

Do not flatten the stack by deleting evidence-bearing PRs before this mapping is done.

## Steven OS

| PR | Recommendation | Reason |
|---|---|---|
| #28 — register every active GitHub repo | **KEEP / reassess after platform-hardening merge** | Useful control-plane work, but Steven OS is now classified INTERNAL and should be behind Access or excluded from deployment. Rebase/retest after the classified `dist/` build lands. |

## Hygiene rule going forward

Every long-lived open PR should be one of:

- active integration path;
- deliberately blocked with a named external/human gate;
- retained evidence/asset branch with a named consumer;
- superseded and closed with a pointer to its replacement.

Avoid parallel PRs that solve the same production problem without an explicit stacking relationship.
