# Support contract review — 2026-09-14

This is an implementation plan, not a completed repair or anatomical certification. Baseline: `pose-validity-audit.json`, generated 2026-09-14T16:06:58.714Z. Counts below were parsed from its 167 results, not inferred from the summary alone.

## Baseline and repair batches

| Existing catalog category | Poses | Support findings | Editor ROM findings |
| --- | ---: | ---: | ---: |
| Standing | 39 | 20 | 18 |
| Seated | 43 | 38 | 24 |
| Reclining | 13 | 5 | 5 |
| Prone | 14 | 10 | 2 |
| Floor support | 26 | 20 | 9 |
| Balances & inversions | 32 | 32 | 7 |
| Total | 167 | 125 | 65 |

Support and ROM sets overlap. There are 0 detected body collisions, 143 poses with either kind of finding, and 24 scoped passes. Category totals are not solver-family totals: `SideLunge` is Seated, `WarriorIKneeling` is Standing, and `Lunge`/`Lizard` are Floor support. Group repairs by intended contacts rather than the display category.

Recommended batches: (1) standing plus lunges; (2) remaining single-leg/hand-assisted standing variants; (3) knees, shins, hands and forearms; (4) seated, reclining and prone; (5) arm balances and inversions. Run a full audit after each batch without claiming its other categories are repaired.

## First batch: exact pose keys and contracts

Names below are `pose.source` suffixes, not UI labels or sequence IDs. Side names must be resolved from the authored pose and mirrored explicitly. `front`/`rear` are proposed semantic roles, not currently accepted requirement strings.

| Priority / keys | Intended hold contract | Baseline / work |
| --- | --- | --- |
| P0 `LungeCrescent` | Front sole; rear toe/forefoot patch; rear heel allowed off floor | Current `soles` default is wrong for this variant. Sole gaps 388.24/44.47 mm also show geometry needs repair after contract correction. |
| P0 `WarriorI`, `WarriorII`, `WarriorIIForwardArmForward` | Both sole pads; retain stance width, facing and front-knee bend | Largest sole gaps 415.24, 634.10, 634.10 mm. Reauthor pelvis/leg targets; a vertical settle alone cannot recover these stances. |
| P0 `TriangleForward`, `TriangleRevolved` | Both soles; straight-leg stance; Revolved also lower hand on floor for the no-prop variant | Largest sole gaps 1285.26/136.30 mm. Preserve lateral hinge vs twist distinction. Forward's low hand contact needs variant review before making it mandatory. |
| P0 `Goddess` | Both soles with outward foot/knee alignment and bent knees | Both sole gaps 44.05 mm. Candidate for simultaneous pelvis, leg and ankle correction. |
| P0 `Lunge` | Both palms; front sole; rear toe/forefoot patch | Front sole currently fails (minimum sole gap 74.91 mm); also hip/knee ROM findings. Keep the user's flat-palm variant. |
| P0 `Lizard` | Both palms OR both forearms; front sole outside same-side arm; rear forefoot/toes | Current toe requirement fails; front hip/ankle findings remain. Freeze selected arm-support alternative per hold instead of silently switching it to make the test pass. |
| P0 `WarriorIKneeling` | Front sole; opposite/rear knee; rear foot top | Current knee fails and foot-top requirement is missing. Do not satisfy the knee and sole on the same leg. |
| P1 `SideLunge` | Bent-leg sole; opposite straight-leg heel; straight-leg forefoot intentionally raised | Both existing requirements fail. Distinct legs must satisfy each role. Hand support remains optional for the authored prayer variant. |
| P1 `CrookedMonkey`, `Gate` | Authored support hand where applicable; bent-side knee; opposite sole | Both need geometry repair; Gate also has hip abduction finding. CrookedMonkey's lifted rear foot must not be forced flat. |
| P1 `ForwardBendBigToe`, `Gorilla`, `WideLeggedForwardBendI`, `WideLeggedForwardBendII`, `WideLeggedForwardBendIII`, `WideLeggedForwardBendIV` | Both soles; separately authored hand-to-foot/floor/bind relationship | All six fail soles and have ROM findings. Resolve named hand placement before adding palm-floor requirements; bindings are body-to-body contacts, not floor anchors. |

Do not forget standing cases outside the first batch: `HalfMoon`, `HalfMoonRevolved`, `SplitsStanding` fail their hand requirement; `ShivaSquat`, `StandingForwardBendHalfLotus`, `StandingForwardBendFootBehindHead` fail their supporting sole. These six plus the first-batch standing entries account for all 20 Standing support failures. Existing passing standing poses are regression controls, not evidence that alignment and binds are complete.

## Contract problems and evidence quality

Code-confirmed defects:

- `any-sole` plus `any-heel` can both succeed on the same foot, so SideLunge can pass without its extended-leg heel. The same independent existential checks cannot enforce opposite sides for `any-sole` plus `any-knee` or `any-toe`.
- `any-foot-edge` has no edge-orientation check: its sample is just the lowest point of any foot mesh. It can classify ordinary sole contact as edge support. This affects later side-support repairs.
- `head` uses the lowest head mesh surface without forehead/crown/chin identity. `seat` similarly uses a pelvis-volume proxy. Do not constrain these as precise anatomical landmarks yet.
- `actualContactRegions` includes regions by minimum gap alone; it does not require correct orientation or exclude negative penetration. Treat it as diagnostic proximity, not accepted support evidence.
- `inspectSupports` checks the maximum patch gap against the negative limit; a multi-patch region can have one penetrated patch and another acceptable patch. All-region nonpenetration must remain a separate mandatory final check, and patch-level lower bounds should be explicit in the future contract.

Reference-supported corrections, based on existing cached `/tmp/pocket-poses-current.json` descriptions:

- [Crescent Lunge](https://www.pocketyoga.com/pose/LungeCrescent) places support behind on toes, not a mandatory whole rear sole.
- [Kneeling Warrior I](https://www.pocketyoga.com/pose/WarriorIKneeling) includes rear knee and top of rear foot; the current contract omits the latter.
- [Side Lunge](https://www.pocketyoga.com/pose/SideLunge) lifts the straight leg's toes while its heel stays down. Same-side independent alternatives are insufficient.
- [Revolved Triangle](https://www.pocketyoga.com/pose/TriangleRevolved) offers a lower-hand floor or block contact. A no-prop authored variant needs the floor contact, or an explicitly named modified variant.

These public pages were opened during this review but returned only their JavaScript shell. The descriptions above were read from the pre-existing local source cache; they are not a fresh independently verified download. Preserve provenance/date when formalizing contracts.

Needs visual/reference confirmation, not an automatic rules change:

- `TriangleForward` reference says the low hand reaches toward the earth; do not infer mandatory palm contact from that sentence.
- `WideLeggedForwardBendI` involves low hands/head, but floor contact and the exact hand patch should be checked against the selected illustration. II/III/IV use different arm arrangements.
- Do not infer Gorilla hand placement from a familiar pose name: the cached source describes a big-toe hold. Resolve that source/variant ambiguity before modeling hands beneath soles.
- Reference descriptions often allow different depths or supports; optional contacts must not be converted into mandatory anchors just to match one picture.

## Implementation and acceptance gates

1. Introduce a versioned hold contract with side/role-specific required contacts, explicit alternatives, allowed release regions, and optional contacts. Resolve alternatives before solving. Keep legacy `supportRequirements` readable; do not silently invent or rewrite anchors in user downloads.
2. Reauthor target stance and support roles first; then solve pelvis/spine/limb changes together under floor nonpenetration, body collision and editor joint envelopes. Retain the intended pose through weighted target deviations and explicit stance constraints. Report failure instead of publishing a distorted candidate.
3. For every accepted repair, validate the *final* rig after all runtime floor/hand/body correction passes. Required patch gaps must stay within the existing 5 mm contact tolerance and applicable lower penetration bound; soles need heel and forefoot pads plus orientation, not arch flattening. Wrist/palm and all-body clearance checks remain independent.
4. Require no new collision or joint-range findings. Existing ROM findings cannot be hidden: resolve or document them before a pose receives a reviewed status. A support-only pass is not an overall pose pass.
5. Run old/new side-by-side front, side and perspective review of each repaired key, including left/right mirrored variants. Verify stance, planted side, hand relationship and pose recognizability. Keep measured before/after errors and rejected candidates in the audit artifact.
6. Preserve all 82 existing example-card support passes and their playback checks. Add transition checks for new/revised example paths with explicit release/plant timing; static anchors must not be enforced while a foot is intentionally moving. Static catalog repair alone cannot establish arbitrary-transition validity.
7. Re-run the entire 167-pose audit and publish deltas by category and key. A first-batch success means its enumerated contracts and reviewed geometry pass, not that all 125 baseline findings disappeared.

Forbidden shortcuts: widening ROM/tolerances to make the audit green; globally lifting the body after fixing an anchor without rechecking other anchors; changing both soles to `any-sole` for convenience; using the same limb to satisfy opposite-role contacts; switching an authored palm pose to fingertips/forearms silently; grounding intentionally lifted feet; accepting a prep/modified posture under the full-pose label; rewriting saved user sequences; claiming balance, gravity, friction or human safety from geometric contact tests.
