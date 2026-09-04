# CLAUDE.md

This file contains only durable repository conventions. It is **not** a project-status or backlog document.

## Start here

1. Read `MASTER_PLAN.md` for current priorities, canonical project state, blockers, repository census, and exact next action.
2. Read `AGENTS.md` for production-verification invariants.
3. Read `DEPLOYMENT.md` before changing build/deployment behavior.
4. Use `site/catalog.json` as the single route/deployment classification source.
5. Use `clinical/content-registry.json` as the clinical-review lifecycle source.

Do not reconstruct current state from this file or from old PR descriptions when newer repository state exists.

## Durable engineering rules

- Delete before refactoring; simplify before optimizing; measure before adding infrastructure.
- Prefer the smallest relevant test set. Expand testing only when the changed risk or a reproduced failure warrants it.
- Do not create another route/module manifest beside `site/catalog.json` without a demonstrated need.
- Keep specialized products specialized. Extract shared code only when multiple real consumers make the abstraction simpler than duplication.
- Never trade away clinical accuracy, privacy, accessibility, provenance, production isolation, or exact-SHA verification for speed.

## Production boundary

- Cloudflare Pages publishes generated `dist/`, not the repository root.
- Only `PRODUCTION` catalog entries belong in the public artifact.
- `PREVIEW`, `INTERNAL`, `SOURCE_ONLY`, and `ARCHIVED` material stays out of the public deployment.
- The current hospital source is `cardio-hospital-3d/`; its generated public route is `/hospital/`.
- Legacy `/phs/` is archived/reference and `/cardiohospital/` is internal/reference.
- The site remains direct-link/noindex until Steve explicitly changes that policy.
- `noindex` is not authentication; non-public material is protected by deployment exclusion.

## Clinical and privacy rules

- Never invent clinical review dates, reviewers, sign-off, evidence, or provenance.
- Passing tests and commit dates are not clinical review.
- Never put PHI, family tokens, secrets, or private credentials in public source, logs, issues, or browser artifacts.
- Experimental clinical tools must not silently become diagnostic probability engines without validated evidence and governance.

## Test-design rules worth preserving

- Never derive a quiz expected answer from the same DOM being tested.
- For asynchronous images, wait for the expected `currentSrc`, `complete`, and nonzero `naturalWidth`.
- For irregular SVG geometry, resolve a real painted hit-test point rather than assuming the bounding-box center.
- Do not force-click transparent overlays that a real user could not hit.
- Prefer one realistic mobile/touch smoke over broad browser matrices during focused iteration unless the change specifically affects another browser/runtime.

## Session handoff

Do not maintain a separate `next:` field here. Before ending substantive work, update `MASTER_PLAN.md` so the first incomplete item is the exact resume point.
