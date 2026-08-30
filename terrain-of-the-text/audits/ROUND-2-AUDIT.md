# Round 2 Audit — John 4 Calibration Episode

**Status: PASS**

## A. Historical/geographic audit

- [x] The rejected claim that Jews normally avoided Samaria was not reintroduced.
- [x] Josephus is used narrowly: customary Galilean festival travel through Samaria and fast travel via the Samaritan road are supported; no universal travel rule is inferred.
- [x] The route is explicitly a **schematic corridor**, not Jesus' exact track.
- [x] No Jerusalem departure point is asserted; John gives only Judea.
- [x] No Nazareth destination is asserted; the north end is a generic Galilee corridor reference.
- [x] Representative route-control points are not rendered as episode stops.
- [x] Dorsey's road-network study is used for central-corridor/topographic context, not as proof of an exact first-century itinerary.
- [x] ʿAskar and Tell Balata/Shechem are both retained as serious Sychar candidates with no probability weights.
- [x] Jacob's Well is separate from Sychar and labeled probable/traditional rather than archaeologically proven.
- [x] Mount Gerizim is shown as secure and its relevance to John 4:20 is supported by Samaritan/archaeological scholarship.
- [x] The `had to` reading is explicitly labeled interpretive rather than geographic proof.
- [x] No elevation profile is shown because the departure point and exact track are unknown.
- [x] Regional relief texture is labeled contextual and not local topographic evidence.

## B. Software/regression audit

- [x] Round 2 remained isolated on `round/02-john4-calibration` during development.
- [x] One self-contained HTML runtime; no external runtime requests.
- [x] No `localStorage` or `sessionStorage`.
- [x] JavaScript syntax passes `node --check`.
- [x] Chromium/Playwright QA completed at 375×812 and 1440×900 with no page errors.
- [x] No horizontal overflow at 375 px.
- [x] Route-context and Sychar-detail controls both work and expose correct `aria-pressed` state.
- [x] Stop buttons pan to south/context, local, and north/context views without inventing additional stops.
- [x] Keyboard pan and reset work.
- [x] Marker screen size remains stable from context to local zoom.
- [x] Early build bug generating `well` as a JavaScript comma expression was caught and fixed in the generator before commit.
- [x] Early local-view label clipping/collision was caught and fixed by wider framing plus separate label offsets.
- [x] Secure/probable/contested confidence is encoded with non-color channels: solid, double-ring, and hollow-dashed markers.
- [x] Point focus updates the explanatory map note.
- [x] `prefers-reduced-motion` retained.
- [x] Print media smoke-tested; header is suppressed and the episode becomes a two-column handout layout.

## Calibration test

**Does geography materially change the reading? PASS.**

The episode corrects a common but weak map-note claim: the teaching point is not that Jesus used a road Jews ordinarily refused to use. Instead, the map makes three stronger observations visible:

1. the Samaritan corridor was a real, used travel corridor;
2. John's `had to` cannot be proven from geography alone; and
3. the local setting at Jacob's Well, beneath Mount Gerizim, is the sharper geographic fact, while Sychar itself remains unresolved.

## Decision

**PASS.** Round 2 is suitable to establish the design/epistemic language for later episodes.
