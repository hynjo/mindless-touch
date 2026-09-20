# Support-constrained pose work

## Outcome and baseline

Make required floor contacts explicit, repair poses without losing another support or violating joint/body constraints, and describe contact release/landing separately from pose interpolation. A failed repair must leave the current pose unchanged.

The starting audit covers 167 catalog poses: 125 have support findings and 65 have editor joint-range findings; these sets overlap. The three Movement examples contain 82 cards whose required hold contacts pass. These measurements do not certify gravity, balance or human anatomy.

## Delegation

| Owner | Bounded deliverable | Files owned |
| --- | --- | --- |
| Support contract review agent | Group the remaining catalog findings; review standing/lunge contact requirements and define acceptance criteria | `SUPPORT-CONTRACT-REVIEW.md` |
| Support solver agent | Deterministic transactional projection for explicit sole supports; all required supports, floor clearance, ROM and body contacts are acceptance gates | `support-solver.js`, `tests/support-solver.test.js` |
| Contact transition agent | Optional versioned release/landing schedule, validation and linear-time sampling; no guessed schedules | `contact-schedule.js`, `tests/contact-schedule.test.js`, `CONTACT-SCHEDULE.md` |
| Primary agent | Integrate and review agent work, preserve save/load compatibility, expose a reviewable repair action, run application and regression checks | Plan, shared application/schema files and integration tests |

All three delegated deliverables have been integrated and reviewed.

## Phases and completion gates

1. **Review the contact contracts.** Separate required contact, optional contact and intentionally raised limbs. Review variants against the existing reference evidence. Do not lower tolerance to make a wrong posture pass. Do not silently relabel a draft as the exact reference pose.
2. **Implement standing/lunge repairs first.** Keep bone lengths unchanged and search for small changes to pelvis/supporting-leg posture. For a one-leg pose preserve the raised leg's local posture. Accept only when every required support, floor clearance, the measured joint envelope and collision checks pass together. Otherwise roll back and report the reason. Provide an explicit editor action rather than rewriting loaded files automatically.
3. **Represent transition contact phases.** Save/load an optional schedule describing maintained, released and landing contacts using linear transition time. No schedule means the existing behavior. The first integration validates scheduled contacts; world-space foot locking, traction and broader motion planning are separate work and must not be implied by a successful schedule parse.
4. **Review corrected poses and adjacent motion.** Cover solved, unchanged and unsatisfiable cases; left/right cases; rollback; persistence; and a browser repair/undo/save/replay check. Audit catalog results separately from example holds and interpolated movement. Publish accepted and rejected results with their scope.
5. **Expand by posture family after the first gate passes.** Kneeling/forearm support → seated/reclining → arm balances/inversions. These need different degrees of freedom and support proxies; a standing repair must not be applied indiscriminately. Preserve draft status and list unresolved poses until their geometry and reference alignment have been reviewed.

## First increment scope

- Contract review, a bounded standing support solver, a user-triggered fit action, and contact schedule validation/persistence are the first increment.
- Existing saved sequences remain loadable; absent requirements are not invented. Repairs only change the selected editable pose when accepted.
- The initial solver is not an automatic repair of all 125 drafts. Unsupported contact families and unsatisfiable poses return explicit failure; no earlier failures are reclassified as passes without retesting.
- The current increment does not implement world-space contact locking or automatically generate release/landing trajectories.

## Implemented and verified

- Corrected opposite-leg contact contracts for lunges, Side Lunge and kneeling Warrior; the catalog Revolved Triangle requires its lower hand. Explicit sequence variations retain their own requirements.
- Multi-patch support checks now reject penetration at any sampled patch, rather than checking only the highest patch.
- `Fit supports` performs a bounded repair of the selected pose. Acceptance requires all support, floor, measured joint-range, wrist and body-contact checks to pass. Existing passing contacts are retained; failures restore the pose, and accepted edits support Undo.
- Optional contact schedules survive sequence save/load. Hold endpoints, adjacent declarations and required contacts during playback are checked. These checks do not synthesize movement.
- Browser integration verified repair, unchanged failure, Undo, save/load metadata, preflight rejection and scheduled playback.
- Final regression run: 86 tests passed; production build passed with the existing bundle-size warning; whitespace checks passed.
- Projection audit: 44 standing/lunge candidates, 11 already valid, 1 accepted correction (Firefly II), 32 rejected with complete rollback. No candidate is automatically written into the catalog.
- Catalog audit remains 125 poses with support findings and 65 with joint-range findings out of 167; the 82 example holds pass their declared support checks. Hold checks do not establish that every interpolated frame passes.

## Remaining work

The next stage is authored geometry repair for standing and mixed-support poses, starting with Warrior, Triangle and lunges. The bounded solver cannot correct large stance errors, and mixed sole/toe/knee contracts need additional degrees of freedom before they can be projected. Review each authored correction against the reference and adjacent transitions, then proceed through the remaining posture families. World-space contact trajectories remain a separate implementation stage.

## Second increment assignments

Baseline `eff381b` is committed and pushed to `origin/main`.

| Owner | Pose family | Exclusive deliverables |
| --- | --- | --- |
| Support solver agent | Warrior I, II, III | `warrior-support-corrections.js`, corresponding tests, `WARRIOR-SUPPORT-REVIEW.md` |
| Support contract review agent | Triangle and Revolved Triangle | `triangle-support-corrections.js`, corresponding tests, `TRIANGLE-SUPPORT-REVIEW.md` |
| Contact transition agent | Lunge, Lizard, Crescent Lunge and kneeling Crescent Lunge | `lunge-support-corrections.js`, corresponding tests, `LUNGE-SUPPORT-REVIEW.md` |
| Primary agent | Integration and cross-family regression | Shared catalog application, audits, examples and final verification |

Each correction must retain its reference intent and pass all declared supports, floor clearance, measured ROM, wrist limits and body-contact checks after runtime placement. Agents export correction maps keyed by reference pose ID; only the primary agent changes the shared catalog. Failed candidates remain unresolved rather than changing acceptance thresholds. Ashtanga's explicitly authored preparation variants remain distinct from catalog reference poses.

### Second increment outcome

All three agents stopped at the usage limit before delivering correction files. The primary agent completed the bounded nine-pose review locally, using `standing-support-corrections.js` and `lunge-support-corrections.js` plus shared integration tests. Eight poses were changed; Warrior III stayed unchanged. See `SUPPORT-FAMILY-REVIEW.md` for per-pose results and remaining reference differences.

The full suite now has 89 passing tests. Catalog support findings fell from 125 to 117 and joint-envelope findings from 65 to 63; example hold support remains 82/82. Large-scale reference alignment, the other posture families and world-space transition contact planning remain open.

### Big Toe follow-up

The Ashtanga preparation was corrected separately and renamed `Forward Fold — Bent Knees`. The catalog `Big Toe` was then corrected as a straight-knee toe-reaching draft with an explicit no-grip label. One read-only sub-agent reviewed the missing grip/collision checks; the primary agent authored and verified the correction. See `BIG-TOE-REVIEW.md`. Current catalog totals are 116 support findings and 62 joint-envelope reviews; a genuine toe-lock constraint remains open.

### Bound Angle follow-up

Added and persisted the missing `sole-pair` requirement, including pad alignment and a conservative complete-foot separating-plane check. The follow-up corrected the hip coordinate convention without widening bounds and authored a raised-knee closed-sole variant. Seat and both sole patches now pass, including save/load. See `BOUND-ANGLE-REVIEW.md`. Full regression: 105 tests pass; 82 example holds retain their supports. Actual hand grip and full anatomical certification remain outside this correction.
