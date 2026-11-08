# Cow Face: interpretation of controlled diagnostics

See [measurements](COW-FACE-DIAGNOSTICS.md), [raw candidates](cow-face-diagnostics.json)
and [reproduction script](scripts/diagnose-cow-face.mjs).

## Scope

26 deterministic searches, each with 1,600 proposals. Core ablations use two
random seeds, the same starting preparation and identical budgets. Only the
objective penalties change; runtime constraints and catalog poses do not.
The best candidate satisfying existing guards is saved separately from the
lowest-cost candidate. All 26 saved guarded snapshots were independently
replayed with the original support, ROM, wrist, floor and self-collision checks.
Some snapshots are merely the unchanged starting pose; this is not 26 successes
at the target. Exact reach/contact targets are hypotheses, not anatomical truth.

## Findings

1. **Arm length is not the demonstrated bottleneck.** Proposed wrist targets
   are 287 and 417 mm from their shoulders, inside the two-bone range of
   30–550 mm. Two searches preserving all current guards achieve combined
   middle-fingertip target residuals of 1.87 and 3.25 mm. Earlier failures with
   prescribed wrist orientations did not prove an extended shoulder rig was
   necessary. Shoulder coupling still is not validated by the current ROM audit.

2. **Fingertip reach is not a grip.** The successful reach candidates curl zero
   finger joints. Supplemental cross-hand measurements find a minimum gap of
   -0.82 mm for seed 17 and +0.82 mm for seed 73, each at the middle fingertips.
   The negative value is small overlap, not exact nonpenetrating contact. It
   is below the supplemental 1 mm reporting threshold but must not be described
   as a clean bind. Palm opposition and finger hooking are not reach objectives.

3. **There is a collision-coverage gap.** The main self-collision model covers
   limb capsules, selected limb/core pairs and fingers within each hand. It does
   not provide general opposite-hand finger/palm, palm/palm or hand/core checks.
   The new offline cross-hand probe covers opposite finger capsules and palm
   boxes only; it does not silently certify the remaining omitted pairs.

4. **Leg placement is constrained by several competing contacts.** The nominal
   160 mm knee-separation target leaves 144–146 mm combined task residual with
   all penalties. Omitting body collision lowers this to 100–109 mm, accompanied
   by actual thigh/thigh capsule overlap up to 56.5 mm and thigh/shin overlap
   around 19.1 mm. Omitting the floor penalty lowers it to 82–95 mm but puts
   foot/toe geometry 122–133 mm under the floor. These are invalid candidates,
   not reasons to disable the guards. Floor proxy versus rendered-vertex
   differences in the constrained candidates are submillimetric; evidence does
   not currently support blaming a large floor bounding-volume error.

5. **Target geometry matters.** With fixed level hips, equal femur lengths and
   exactly vertically aligned knee centers:
   `4*h*x + (yR-yL)*(yR+yL-2*yHip) = 0`.
   For 110 mm half hip width, 250 mm average knee height and 160 mm separation,
   the common knee position must be about 122 mm off the centerline. A centered
   stack above the hips is geometrically incompatible with this fixed setup.
   The current task objective allows lateral motion, but earlier centered point
   targets were unnecessarily restrictive. Contact patches and pelvic placement
   should define the target, not forced coincident centers.

6. **This remains a local search.** Changing knee separation to 100 or 220 mm,
   and swapping which knee is upper, still leaves substantial residuals. Both
   seeds begin from the same preparation. Pelvis tilt, spine, finger articulation,
   shoulder-girdle motion and bone proportions are not search variables. The
   experiment does not prove that the full pose is impossible in the existing rig.

## Recommended implementation order

1. Add opposite-hand and hand/core collision coverage with independent geometric
   fixtures. Retain the current pose until complete contact checks pass.
2. Separate fingertip reach, opposed hand contact and hooked grip into distinct
   criteria. Use the saved guarded arm candidates as seeds, not final poses.
3. Replace fixed knee-center targets with a side-specific surface-contact model
   and a reachability precheck. Include limited pelvis orientation while keeping
   both sit-bones in contact; use multiple geometric initializations and hard
   candidate acceptance rather than a weighted score alone.
4. Record active collision pairs and raw joint values on failed solves. Only
   change collision geometry or add shoulder-girdle degrees of freedom when a
   specific, independently checked obstruction calls for it. Do not globally
   relax ROM or shrink capsules to make this one pose pass.
5. Then validate the combined pose, grip release/entry, mirrored sides and JSON
   restoration. A successful static fingertip witness does not cover transitions.
