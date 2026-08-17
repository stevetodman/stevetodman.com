# Mac first session — do this, in this order

The M4 Max is the release machine (ADR-0002). This managed Windows PC
cannot compile Unreal. The Mac already has a walkable packaged ward.
This branch has the nine-case clinical core, disclosure, and scoring
the Mac branch does not.

**Do not start from a blank graybox.** Merge first.

## Branch map (read once)

| Branch / PR | What it actually is |
| --- | --- |
| `claude/github-work-yesterday-62xjvk` (PR #20) | **Your Mac world.** Packaged `.app`, blockout ward, Patel MetaHuman, E-key HCM loop, shell scripts. `walkthroughPassed` is still false. |
| `agent/launch-set-msk-htn` (PR #24) | **Clinical core you just landed.** Nine graphs, differential-diagnosis scoring, `GetRevealedHistory`, HCM parent-step-out. No map on this branch. |
| `agent/unreal-migration-scaffold` (PR #19) | Shared base. Both PRs target this. |
| `agent/aaa-exam-room-benchmark-handoff` (PR #23) | Exam-room AAA spec + Gate 1 greybox. Isolated. **Do not Hunyuan the room.** Parked until cameras are locked. |
| `agent/aaa-exam-table-asset` (PR #22) | Table/materials. **Parked** until the shell is in locked cameras. |

Latest truthful packaged look on the Mac branch: coat is skinned and
follows idle; default outfit hidden; bare legs under the hem. That is
not a walkthrough pass.

## 20-minute setup

```bash
# 1. Node 24 on PATH (nvm). Preflight rejects Node 22.
#    xcrun metal --version must actually print a compiler, not just a path.

cd ~/path/to/stevetodman.com
git fetch origin
git checkout claude/github-work-yesterday-62xjvk
git pull --ff-only
git switch -c mac/integrate-launch-set
git merge origin/agent/launch-set-msk-htn
```

Expect conflicts in:

- `LegacyCore/src/lib/case-graphs.ts` / `cases-data.ts` / `clinical-content.json`
- `Tools/education-engine.mjs`, `Tools/clinical-data-contract.mjs`, `Tools/case-engine.mjs`
- `Source/CardioHospital/Private/CardioCaseRuntimeSubsystem.cpp` and
  `CardioEducationEvaluator.cpp` — keep Mac world files
  (`CardioBlockoutHUD.cpp`, `CardioBlockoutGameMode.cpp`,
  `CardioBlockoutNPC.cpp`) untouched; merge our GetRevealed* /
  SummaryFeedback APIs into the Mac runtime
- `SPEC_TRACEABILITY.md`, `LOCAL_HANDOFF.md`, `README.md`

**Keep Mac world/presentation. Keep #24 clinical truth, 9-case contract,
`GetRevealedHistory`, and eleven scoring dimensions.** Then:

```bash
cd cardiohospital-unreal
node --experimental-strip-types Tools/export-clinical-data.mjs
npm run test:unreal   # or: node --test Tests/*.test.mjs
# If package.json on the Mac branch already has test:unreal, use that.
./Scripts/run-first-build.sh
```

If preflight fails, read `userAction` / `itOrAdminRequired`. Do not
install software from the repo. Do not `sudo`. Do not clear quarantine
to "just launch it."

## After the merge compiles — 90 minutes

The ward, doors, Patel, Exam Room 3, Education Room ECG/echo station,
and next-case Room 1 **already exist**. Do not rebuild them.

1. Launch the **existing** packaged app or a fresh `./Scripts/run-first-build.sh`
   package. Confirm spawn aims at the team-room doorway, not a wall.
2. In `CardioBlockoutHUD.cpp`, wire the HUD to `GetRevealedHistory()`,
   `GetRevealedExam()`, `HasReviewedTest` / `GetRevealedEcg` /
   `GetRevealedEcho`, and debrief `SummaryFeedback`. Stop reading
   `GetActiveClinicalCase()` truth arrays for on-screen text. Ordering
   an echo must not show the echo summary.
3. Confirm `history.confidential-interview` before Marcus stimulant use
   and before Priya substance use. The graph now requires it.
4. Confirm diagnosis list is the authored `differentials` array. Debrief
   must show eleven dimensions including `differentialDiagnosis`.
5. Stop. Commit the merge. Do not open Blender. Do not buy another coat.
   Do not add a second MetaHuman.

## The rest of the day — walkthrough, honestly

```bash
./Scripts/package-macos.sh
# Launch the exact .app in that package's build-manifest.json
# Human WASD. Scripted BugItGo shots have already lied about spawn.
./Scripts/record-walkthrough-evidence.sh   # Failed is the expected first result
```

Known honest status before you sit down:

| Step | Mac branch last evidence |
| ---: | --- |
| 1–4 | Packaged app launches; ward renders; WASD works; team room reachable if spawn is the doorway |
| 5 | **Fail.** Patel High MetaHuman exists; coat is CC-BY skinned, not WI_ wardrobe; no packaged voice/face pass |
| 6–7 | Assignment and Exam Room 3 navigation exist in the blockout |
| 8 | No cube patient. Parent step-out exists. Marcus is not a character yet — do not add one until Patel's step 5 is honest |
| 9–17 | Graph-driven history/exam/order/diagnosis/debrief exist in HUD. Re-verify after the #24 merge |
| 18–19 | Identity-free save + vasovagal contrast in Room 1 exist. Re-verify |
| Perf | **No passing 2560×1440 capture.** Window must actually land at that size |

`walkthroughPassed` starts false and stays false until every step and
the FPS bar are real.

## Do not

- Hunyuan the exam room or the ward.
- Invent structured ECG/echo/lab results to clear the 41 authoring warnings.
- Expand the cast past Patel.
- Mark the walkthrough from PIE, Insights, or a screenshot.
- Carry any Windows FPS number forward.
- Merge PR #22/#23 art into the slice before cameras are locked.
- Click through Gatekeeper or `xattr -c` the bundle.

## If you only have 30 minutes

Merge #24 into the Mac branch, export JSON, run portable tests, commit
the conflict resolution. That is the highest-value thing the Mac can
do that this PC cannot finish.

## After this session

Push `mac/integrate-launch-set` and open a PR onto
`claude/github-work-yesterday-62xjvk` (or onto #19 if you prefer one
stack). Leave `walkthroughPassed=false` unless the packaged human run
actually passed.
