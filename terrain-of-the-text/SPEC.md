# Build Spec v1.1 — Terrain of the Text

**Purpose:** personal use and informal Bible study

**Deliverable:** one self-contained `index.html` for the atlas runtime; development documentation remains separate in the repository.

## Thesis

Most biblical maps illustrate. This atlas should explain.

Every included episode must answer: **why does it matter that this happened here?** If the geography does not materially illuminate the text, the episode does not belong.

A second thesis is binding: **honest uncertainty is a teaching asset.** Contested places, routes, dates, and interpretations must remain visibly contested.

## Runtime constraints

- Single HTML runtime file; inline CSS and JS.
- No backend, login, analytics, or tracking.
- No `localStorage` or `sessionStorage`; transient state stays in memory, shareable state may use the URL hash.
- Mobile-first; fully usable at 375 px.
- Keyboard usable; visible focus; reduced-motion respected.
- Uncertainty must never depend on color alone.
- Every episode must print cleanly as a one-page study handout where practical.
- Core episode data, route geometry, and fallback geographic context must remain usable without a network connection. Online terrain tiles may enhance but must not be required for comprehension.

## Evidence model

Do not use a single universal confidence field for everything.

A record may independently describe:

- `place_confidence`: secure | probable | contested | unknown
- `route_confidence`: secure | probable | reconstructed | contested | unknown
- `date_confidence`: approximate | broad | contested | unknown
- `claim_status`: sourced | contested | rejected
- `interpretive_status`: text | historical-context | plausible-inference | debated-interpretation

### Place

A secure/probable place may have a representative coordinate with provenance.

A contested place stores each serious candidate separately, with its own coordinate, evidence summary, and sources. Do not assign artificial numerical weights unless a source itself provides a defensible quantitative basis.

An unknown place is represented as a region/search area rather than an arbitrary point.

### Route

Routes are geographic reconstructions, not decorative polylines. Every significant segment should record provenance and route confidence. Straight-line segments are acceptable only when explicitly schematic.

Travel time and distance should be ranges or clearly labeled estimates whenever terrain, route choice, pace, or ancient road reconstruction introduces material uncertainty.

## Episode content

Each episode includes:

- title and passage
- approximate date when useful
- mapped stops/regions
- route reconstruction when relevant
- `geography_note` of roughly 60–120 words
- physical context such as terrain/elevation only when it changes the reading
- three geography-specific discussion questions
- sources for care-changing/interpretively important historical assertions

The note must distinguish geographic fact from interpretive proposal.

## John 4 calibration correction

The atlas must **not** teach that Jewish travelers normally avoided Samaria as though this were an established travel rule. Josephus records Galileans using the Samaritan route on pilgrimage journeys, while Jewish-Samaritan hostility is also well attested. Therefore John 4:4 (`he had to pass through Samaria`) should not be explained by asserting that the route itself was abnormal.

The map may show that the Samaritan route was geographically direct and that alternatives existed. The note may explain the hostile social context. Any claim that John's `had to` carries theological or narrative necessity must be labeled as interpretation rather than geography proved by the map.

## Initial episode set

### Ministry of Jesus
1. Woman at the Well — John 4
2. Good Samaritan — Luke 10:25–37
3. Caesarea Philippi — Matt 16:13–20
4. Nazareth Sermon — Luke 4:16–30
5. Gerasene/Gadarene episode — Mark 5 and parallels
6. Entry toward Jerusalem — Matt 21 and parallels

### Early Church
7. Pentecost diaspora geography — Acts 2:5–11
8. Philip and the Ethiopian — Acts 8:26–40
9. Paul's First Journey — Acts 13–14
10. Macedonian Call — Acts 16:6–10
11. Voyage and Shipwreck — Acts 27

### Old Testament
12. Exodus route traditions — Exodus 13–19
13. David flees Saul — 1 Sam 21–27
14. Elijah to Horeb — 1 Kings 19

This list is provisional: an episode may be cut if its geography does not genuinely add interpretive value.

## Interface

### Browse
Episode cards grouped by era.

### Episode
Map + geography note + stops + physical context + uncertainty + discussion questions + print.

### Timeline
A secondary navigation mode; it must not complicate the core episode experience.

### Route playback
Optional signature interaction after the geographic foundation is proven. It must never distort route certainty. Reduced-motion converts animation to discrete state changes.

## Uncertainty UI

- secure: solid
- probable: solid with subtle uncertainty cue
- contested: hollow/dashed plus explicit text and all serious candidates
- unknown: region/search area plus explicit `unknown`
- contested route: dashed or otherwise visibly non-solid

Do not hard-code a fixed number of Exodus reconstructions. The architecture supports however many serious named reconstructions the evidence review retains.

## Visual direction

Terrain first. Avoid both parchment-themed devotional styling and generic analytics-dashboard styling.

The map should visually prioritize relief, water, routes, and historically relevant labels. Modern political borders are off by default.

The elevation profile is the primary expressive graphic where terrain is central to the episode.

## Source hierarchy

Prefer primary and specialist geographic/archaeological sources where possible. Useful datasets may include Pleiades, OpenBible geodata as a discovery/cross-reference layer, DARE or successor/reference road datasets, WHG datasets with license checked per source, and appropriate elevation datasets.

A dataset aggregator is not automatically the final authority for a disputed identification.

Licensing is tracked per dataset; do not assume every constituent dataset shares the same license.

## Build order

### Round 0 — foundation
Spec, rules, evidence approach, source inventory, contested/rejected claim memory. No map UI work.

### Round 1 — geographic skeleton
Coastline, water, terrain/relief strategy, historically appropriate labels, and a small set of verified places. Accuracy before aesthetics.

### Round 2 — calibration episode
Build **one complete episode only**. Default candidate: John 4, unless Round 0 evidence review shows another episode is a better calibration case.

Round 2 establishes the design language.

### Later rounds
One episode per round. Every round is compared with the last approved state and receives one `ROUND-N-AUDIT.md` containing both historical/geographic and software/regression review.

## Definition of done for every approved round

- no unsupported certainty introduced
- changed geographic facts are sourced
- contested/rejected-claim files checked
- scope respected
- previous approved behavior preserved unless change is explicitly justified
- mobile/accessibility/print behavior checked when affected
- audit completed before merge

## Failure mode to avoid

A competent, attractive map that merely duplicates a study Bible endpaper is failure. The atlas succeeds only when the physical and historical geography causes a reader to notice something important in the passage while remaining honest about what is known, reconstructed, and debated.
