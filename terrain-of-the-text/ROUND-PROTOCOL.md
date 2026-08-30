# Round Protocol

Every round uses the same lightweight sequence.

## Before work

Read:

1. `PROJECT-RULES.md`
2. `SPEC.md`
3. `REJECTED-CLAIMS.md`
4. `evidence/CONTESTED-CLAIMS.md`
5. `DECISIONS.md`
6. `CURRENT.md`
7. latest round audit

Create a branch named `round/NN-short-description` from the last approved atlas state.

## During work

- stay inside the stated scope
- source every map-changing factual change
- add only materially contested claims to the contested ledger
- add newly disproven popular claims to `REJECTED-CLAIMS.md`
- document decisions only when they constrain future work

## Before merge

Create `audits/ROUND-N-AUDIT.md` with two sections.

### A. Historical/geographic audit

Check:

- coordinates and candidate locations
- route geometry and route confidence
- terrain/elevation claims
- place-name period appropriateness
- textual/geographic distinctions
- whether interpretation is mislabeled as fact
- rejected claims reintroduced?
- certainty inflated?

### B. Software/regression audit

Check affected surfaces only:

- scope diff against prior approved state
- mobile at 375 px
- keyboard/focus
- reduced motion
- print behavior
- labels/markers/routes unexpectedly changed
- performance and offline fallback when relevant

## Merge rule

If either audit section fails, do not merge.

When both pass, merge into the permanent repo's `main` and optionally add a milestone tag. Tags are the only snapshot mechanism.
