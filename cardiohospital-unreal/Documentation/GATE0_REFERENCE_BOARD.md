# Gate 0 — Exam-room reference board and license ledger

Status: **open for clinical-layout and visual review**. This board is not approved.

No production architecture, lighting, or additional hero props are authorized until the decision checklist at the end of this file is signed.

Related files:

- Authoritative scope: `AAA_EXAM_ROOM_BENCHMARK_SPEC.md`
- Measured circulation: `GATE0_CIRCULATION_REVIEW.md`
- Provisional greybox: `../SourceAssets/ExamRoom/Gate1/`

## What this board is

A single coherent reference package for one pediatric cardiology outpatient exam room. It records required photographic slots, material targets, license status, and explicit non-goals. It does not invent photographs and does not claim a specific institution.

Fill empty provenance rows with de-identified stills you own or license. Until those cells are filled, the corresponding production material stays unapproved.

## Product lock (restated)

| Decision | Value |
| --- | --- |
| Immersive runtime | Unreal Engine 5.8 |
| Conventional UI | Existing web stack |
| Source DCC | Blender (metres) |
| Unreal units | Centimetres |
| Scope | One exam room + doorway waiting vignette |
| Visual target | Restrained clinical realism, not cinematic |
| Branding | No manufacturer marks, no institutional identity |

## Photographic slots

Each slot needs at least one still. Prefer your own clinic photographs with no faces, no charts, no badges, no logos. Wide shots first; details second.

| ID | Slot | Why it matters | Owner photo | License | Decision |
| --- | --- | --- | --- | --- | --- |
| R01 | Full room, doorway establishing | Proportions, daylight, furniture count | _empty_ | | pending |
| R02 | Patient-side three-quarter | Table scale, wall system, ceiling grid | _empty_ | | pending |
| R03 | Provider workstation | Casework depth, monitor height, cabling | _empty_ | | pending |
| R04 | Ceiling looking up | 2x2/2x4 grid, troffers, HVAC, sprinkler, speaker | _empty_ | | pending |
| R05 | Floor + base + wall protection | LVT seam, cove base, chair-rail height | _empty_ | | pending |
| R06 | Door leaf + frame + hardware | Closer, lever, kick plate, glazing, seals | _empty_ | | pending |
| R07 | Window + sill + shade | Daylight direction, glass color, exterior | _empty_ | | pending |
| R08 | Outlet / data / switch heights | Typical 18 in / 48 in clinical plates | _empty_ | | pending |
| R09 | Pediatric accent only | One restrained color, not a themed room | _empty_ | | pending |
| R10 | Night / lights-only | LED CCT vs daylight mix | _empty_ | | pending |

Do not scrape manufacturer marketing pages into the repo. If a catalog image is required, record the URL, license, and a “do not ship” flag in the ledger below.

## Dimension and clearance targets

These are review targets, not a claim about a named hospital. They come from common US outpatient practice plus ADA/FGI-style clearances. Confirm or replace them on the checklist.

| Item | Target | Current greybox v2 | Notes |
| --- | --- | --- | --- |
| Interior clear | ~16 ft × 13 ft (4.88 × 3.96 m) preferred if all six floor stations stay | 4.27 × 3.96 m retained | v1 was too busy; v2 keeps the footprint and changes placement |
| Ceiling | 9 ft (2.74 m) | 2.74 m | 2x2 ft / 0.61 m grid |
| Door clear | 36 × 84 in (0.91 × 2.13 m) | 0.91 × 2.13 m, outswing | Keep outswing; inswing would fail |
| Working aisle at table | 36 in (0.91 m) on provider side | 0.91 m south of table | Patient-right if head is east |
| Staff pass | ≥ 30 in (0.76 m) | 1.06 m west of table | |
| Turning space | 60 in (1.52 m) diameter somewhere | south-center | |
| Exam table | ~72 × 28 × 37 in | 1.82 × 0.72 × 0.94 m | Matches PR #22 asset, not approved art |
| Parent chair | Corner, not in door leaf | SE corner | |
| ECG | Wall or parked cart, not a second island | East wall at table head | |
| Blood pressure | Wall aneroid or table cuff, not a floor island | East-wall keep-clear | Dedicated floor station is atypical |

## Material palette (targets only)

A generic PBR set is not approved because it is technically PBR. Each production material needs a filled provenance row and an Unreal instance name.

| Material | Albedo (linear, approx.) | Roughness | Metal | Texel | Provenance | License |
| --- | --- | --- | --- | --- | --- | --- |
| Painted drywall, warm clinical white | 0.72–0.82 | 0.55–0.70 | 0 | 1–2 mm | _empty_ | pending |
| Wall-protection polymer, mid grey-green | 0.28–0.38 | 0.40–0.55 | 0 | 1 mm | _empty_ | pending |
| Resilient cove base | 0.08–0.14 | 0.45–0.60 | 0 | 1 mm | _empty_ | pending |
| Medical LVT / sheet vinyl | 0.22–0.34 | 0.35–0.55 | 0 | 2–4 mm | _empty_ | pending |
| Acoustic ceiling tile | 0.70–0.80 | 0.80–0.90 | 0 | 2 mm | _empty_ | pending |
| Powder-coated metal | 0.55–0.75 | 0.35–0.50 | 0 | 0.5 mm | PR #22 `PowderCoat_WarmWhite` provisional | project-owned, not room-approved |
| Brushed stainless | 0.45–0.60 | 0.25–0.40 | 1 | 0.5 mm | PR #22 `BrushedSteel` provisional | project-owned, not room-approved |
| Molded ABS, graphite | 0.08–0.14 | 0.40–0.55 | 0 | 0.5 mm | PR #22 `ABS_Graphite` provisional | project-owned, not room-approved |
| Medical vinyl, restrained teal | 0.10–0.18 | 0.45–0.60 | 0 | 1 mm | PR #22 `MedicalVinyl_Teal` provisional | project-owned, not room-approved |
| Stippled rubber | 0.04–0.08 | 0.55–0.70 | 0 | 1 mm | PR #22 `Rubber_Black` provisional | project-owned, not room-approved |
| Anti-glare display glass | 0.02–0.05 | 0.08–0.18 | 0 | n/a | PR #22 glass set provisional | project-owned, not room-approved |
| Cabinet laminate / solid surface | TBD from R03 | TBD | 0 | 1–2 mm | _empty_ | pending |

PR #22 lives on `agent/aaa-exam-table-asset` and must be reassessed inside this room at Gate 3. Do not merge it as room-approved art.

## Lighting targets

| Item | Target | Decision |
| --- | --- | --- |
| Troffer CCT | 3500–4000 K, not 5600 K game daylight | pending |
| Daylight | North window, controlled, no blown exterior | pending |
| Exposure | One locked Unreal exposure for all three cameras | pending |
| Grade | Neutral clinical, no teal/orange | pending |
| Benchmark stills | 2560 × 1440 from the three locked cameras | pending |

## License ledger

| Asset / still | Source | License | May ship in game | May appear in review stills | Owner |
| --- | --- | --- | --- | --- | --- |
| Gate 1 greybox geometry | This repo | project-owned | review only | yes | |
| PR #22 exam table / ECG / shared maps | `agent/aaa-exam-table-asset` | project-owned original | not yet | yes, as provisional | |
| Clinic photographs (R01–R10) | _not supplied_ | | | | |
| FGI / ADA / IES figures | published standards | copyrighted; cite, do not copy plates | no | no | |

## Explicit non-goals

- No second room, corridor network, or hospital campus.
- No themed pediatric mural wall, cartoon floor, or toy-chest dressing.
- No PHI, badges, named institutions, or vendor logos.
- No new standalone props while this board is unsigned.

## Decision checklist (sign in a PR comment)

- [ ] Room footprint 4.27 × 3.96 m is accepted, or a larger shell is requested.
- [ ] Layout v2 placement is accepted, or marked-up changes are attached.
- [ ] Blood pressure stays a wall/table device, not a sixth floor island.
- [ ] Head-of-table is east (window), provider on the south side.
- [ ] Door remains a 36 in outswing.
- [ ] At least R01–R05 stills are attached or explicitly deferred.
- [ ] PR #22 materials stay provisional until Gate 3.
- [ ] Gate 2 architecture may start after the items above are decided.
