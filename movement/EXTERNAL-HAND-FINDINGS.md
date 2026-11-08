# External hand diagnostics: stage 1

Update: Butterfly now uses a deeper forward fold and symmetric, separated palms
ahead of the feet. Re-running the 171-pose static audit reports zero external hand
overlaps. The findings below describe the pre-correction baseline. Regression
coverage checks the forward reach, symmetry, supports and both collision APIs.

The catalog audit applies all 171 yoga poses through the shared `applyPose` path.
170 have no external hand proxy overlap. Butterfly has five new findings despite
zero legacy contacts: opposing proximal thumb capsules overlap by 18 mm, and
four thumb/opposite-palm box tests report 9 mm proxy overlap.

The capsule result is a collision in the rig's capsule model. Palm boxes enclose
rounded geometry, so their negative margins are candidates rather than confirmed
rendered intersections. Core ellipsoid tests are also conservative. Far positive
values are separation bounds, not precise clearance measurements.

`createSelfConstraints(...).externalContacts()` is an explicit, lazy diagnostic
API. It retains every negative margin by default, including submillimetre overlap,
and attaches geometry/approximation metadata. Existing `contacts()`, editing and
playback acceptance remain unchanged. No UI copy was added.

## Rollout gates

1. Correct Butterfly hand separation while preserving its palm and seated support
   contract. Require zero new opposing-finger overlaps and review palm proxies.
2. Replay saved Cow Face candidate witnesses through this API; fingertip reach
   alone remains insufficient evidence of a grasp.
3. Before enabling runtime rejection, add swept-transition coverage for opposing
   hands, including hand-mount offset motion. Static catalog results do not prove
   transitions safe. Validate frame-time cost and rollback behavior.
4. Use narrow-phase confirmation for conservative negatives before treating them
   as hard blockers. Keep intended surface contact distinct from penetration.

This stage does not implement grip solving, stacked knees, anatomical shoulder
constraints, hand/limb collision or visual review. It supplies the missing external
hand measurements needed before those later changes.

See [full catalog table](EXTERNAL-HAND-AUDIT.md) and
[all measured overlapping pairs](external-hand-audit.json).
