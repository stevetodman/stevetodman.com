# Louisiana Grade 5 science and social studies coverage contract

**Reviewed:** 2026-09-03  
**Product routes:** `/study/matter-lab.html`, `/study/world-lab.html`  
**Audience:** Luke and Samantha; short independent practice on iPhone and Chromebook.

This contract is the content ceiling and coverage checklist for the two Grade 5 learning engines. It is not a substitute for classroom instruction. Current-unit practice is weighted first, while the full-year banks remain available for cumulative retrieval and maintenance.

## Science Lab governance

For Science Lab work, this coverage contract defines **what must remain taught**, while the Science Lab documents define **how the product should evolve and where the next agent should resume**:

1. `SCIENCE_LAB_HANDOFF.md` - mutable current checkpoint and exact next action.
2. `SCIENCE_LAB_MASTER_PLAN.md` - stable approved educational architecture, invariants, milestone sequence, and acceptance gates.
3. This file - Louisiana Grade 5 coverage requirements that must not regress during the redesign.

A future Science Lab agent should read those three files in that order before making broad changes. Do not use `QUALITY_HANDOFF.md` as the Science Lab handoff; that document belongs to the Word Expedition project.

## Product requirements

- One learner selection followed by one recommended action.
- Standard practice remains short and low-friction; missed skills receive instruction and alternate-form recovery, while future phenomenon/task sets may use a different number of steps when the scientific reasoning objective requires it.
- Separate Luke/Samantha evidence and device-local active-round recovery. Cloud synchronization is a future enhancement, not a launch dependency.
- Skill strength must distinguish independent evidence from guided correction and require evidence on more than one date for mastery; the approved Science Lab roadmap further requires delayed retrieval and transfer evidence before `Secure` mastery.
- Sessions mix factual retrieval with models, tables, graphs, sequences, maps, sources, claims, evidence, cause/effect, and comparison; the mature Science Lab should also support phenomenon/task sets, model construction, graph construction, and concise constructed scientific reasoning.
- The current classroom unit is the default, never the only available content.
- Every question/task carries a unit, micro-skill, standard, explanation, and source-family identifier; future schema versions should also carry relevant science/engineering-practice, crosscutting-concept, representation, transfer, and misconception metadata.
- No reward or animation may change grading, difficulty, question count, mastery, or curriculum priority.

## Science coverage

Louisiana's Grade 5 science expectations use three-dimensional assessment: disciplinary ideas, science and engineering practices, and crosscutting concepts are assessed together in phenomenon-based item and task sets. The engine must therefore test reasoning from evidence rather than isolated vocabulary.

| Bundle | Performance expectations | Required evidence families |
|---|---|---|
| Earth and sky | 5-PS2-1, 5-ESS1-1, 5-ESS1-2 | Gravity argument; relative-distance brightness; shadow/day/night/seasonal-star graph patterns |
| Matter | 5-PS1-1 through 5-PS1-4 | Particle models; mass tables/graphs; property-based identification; fair mixing investigations and evidence of new substances |
| Ecosystems | 5-LS1-1, 5-LS2-1, 5-PS3-1 | Plant-mass evidence; matter-cycle models; food-energy models tracing energy back to the sun |
| Earth systems | 5-ESS2-1, 5-ESS2-2, 5-ESS3-1 | Sphere-interaction models; salt/freshwater distribution graphs; combining information about community resource protection |
| Engineering | 3-5-ETS1-1 through 3-5-ETS1-3 | Criteria/constraints; compare solutions; controlled fair tests, failure points, and revision |

## Social studies coverage

Bayou Bridges Grade 5 contains six official units. Standards 5.1-5.8 are recurring historical-thinking practices and must appear across all units; standards 5.9-5.14 define the content sequence.

| Unit | Content standards | Required content and reasoning |
|---|---|---|
| 1. The Medieval World | 5.9, 5.10 | European/SW Asia/North Africa geography; monasteries; Charlemagne; feudalism/manorialism; Magna Carta; Crusades; Black Death; Hundred Years' War; origins/spread of Islam and Islamic scholarship |
| 2. West African Kingdoms | 5.11 | Atlantic, Niger, Djenne, Sahara, Gulf of Guinea, Timbuktu; Ghana/Mali/Songhai; trans-Saharan trade in salt, gold, and enslaved people; Sundiata, Mansa Musa, Sunni Ali, Askia Muhammad; trade/religion performance-task reasoning |
| 3. Civilizations in North America | 5.13a-c | American geography; Northeast, Southeast, Plains, Southwest, and West Coast culture regions; environment, housing, food, government, trade, language, and cultural diversity |
| 4. Inca and Aztec Empires | 5.13d-j | Geography and agriculture; Tenochtitlan, chinampas, aqueducts and temples; Moctezuma II; Inca roads, terraces, suspension bridges, quipu, and imperial organization |
| 5. Renaissance and Reformation | 5.12 | Italian geography/trade cities; Florence/Medici; humanism, patronage, Leonardo, Michelangelo, Shakespeare; printing; Luther/indulgences/95 Theses; geocentric/heliocentric models; Copernicus and Galileo |
| 6. Age of Contact | 5.14 | Religious/political/economic motives; named explorers and sponsors; navigation tools; conquest of Aztec/Inca; Columbian Exchange; mission/encomienda systems; transition to African slavery and the transatlantic slave trade |

### Recurring social-studies practices

- 5.1 chronology, change, and continuity
- 5.2 primary/secondary source analysis, claims/evidence, and corroboration
- 5.3 historical connections
- 5.4 comparison
- 5.5 claims, evidence, causation, and counterclaims
- 5.6 geographic representations
- 5.7 geography's influence on civilizations
- 5.8 origins and diffusion of major world religions

## Canonical sources

- Louisiana Department of Education, *K-12 Science Planning* and Grade 5 implementation guides: https://doe.louisiana.gov/educators/instructional-support/planning-resources/k-12-science-resources
- Louisiana Department of Education, *LEAP Science Grade 5 Released Materials* (November 2025): https://doe.louisiana.gov/docs/default-source/assessment-guidance/leap-science-grade-5_released-materials_final.pdf
- Louisiana Department of Education, *Bayou Bridges*: https://doe.louisiana.gov/educators/instructional-support/bayou-bridges
- Louisiana Department of Education/Core Knowledge, Bayou Bridges Grade 5 teacher guides for Units 1-6, including their chapter assessments, primary-source activities, and performance-task rubrics.

## Acceptance checks

- Automated coverage tests fail if any listed science performance expectation, social-studies unit, recurring practice, or required item representation disappears.
- Every keyed answer is unique; every selected-response item has an instructional explanation and a valid aligned skill; future task types must have equally explicit scoring/rubric definitions.
- Current-unit sessions do not silently introduce future-unit content. Intentional cumulative retrieval, previously taught concept bridges, or learner-selected full-year review must be explicit in the scheduler/task design.
- Reload restores the exact active item/task step and feedback/recovery state without duplicating evidence.
- Layout has no horizontal overflow and all controls are at least 44 CSS pixels at 390 px and Chromebook widths.
- Science Lab changes must also satisfy the current milestone acceptance gate in `SCIENCE_LAB_MASTER_PLAN.md` and the exact resume instructions in `SCIENCE_LAB_HANDOFF.md`.
