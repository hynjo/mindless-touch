# Fixed-foot Big Toe floor-entry planner

`solveFloorEntry(rig)` is a bounded, deterministic offline planner for the first
stage of Big Toe → Cow. It returns a path but restores the caller's pose. Its
output now feeds `solveKneelingTransfer`, which completes the route and is offered
through the supported-route candidate flow after full-path validation.

The planner tests ordered body-height, hand-position, pelvis and chest candidates.
It clears the hands outward before lowering the pelvis. Analytic leg IK preserves
both ankle positions and world orientations; arm IK preserves elbow hinge motion.
There is no random search, bone scaling, whole-body floor settle or hand-offset
translation. Every accepted sample requires sole support, floor clearance, joint
ranges, wrist limits and current internal/body/external-hand collision checks.

Result: candidate 12 succeeds with root height 0.75 m, palm target width ±0.32 m,
forward position 0.35 m, pelvis 90° and chest 65°. The 241 snapshots include the
input and 240 solved samples. Three intermediate samples per edge plus the next
endpoint are independently checked, including swept self-collision commit. Foot
position drift must remain under 0.5 mm. Final palms and soles must all pass.
A coarser 60-sample candidate exposed between-frame floor-clearance loss; it was
not accepted by widening tolerance. Default resolution is now 240, and every
candidate must pass the same between-frame verification before success.

Reproduce: `node movement/scripts/solve-big-toe-floor-entry.mjs`.
The result file stores failure measurements, winning parameters and final pose;
the full path is returned by the API and is reproducible by the script.

Limits: planar sagittal leg targets; existing simplified shoulder envelope and
incomplete collision coverage; sampled (not continuous mathematical) verification;
no COM, friction or force simulation, and no browser visual assessment. A steep
chest fold can pass the current model and still need visual/anatomical review.
The continuation retains palm support while stepping the feet back one at a time,
then acquiring knee support before untucking the feet. See
`SUPPORTED-ROUTE-REVIEW.md` for integration, persistence and remaining limits.
