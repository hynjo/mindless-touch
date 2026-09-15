# Pose library

The library covers the 167 entries marked `primary` in Pocket Yoga's public pose dictionary, inspected on 2026-09-10. Its primary classification includes some numbered poses and named variations. Secondary and tertiary entries are excluded.

`pose-catalog.json` contains only identifying names, categories and difficulty levels from that dictionary. Every library card links to its corresponding source page. Source illustrations and descriptions are not bundled.

`poses.js` retains the initial 12 poses and joins the catalog with 155 independently authored joint configurations in `pose-shapes.js`. Each added configuration is marked **Draft**. These are editable mannequin approximations, not anatomically verified reproductions. Complicated binds, exact hand/foot contacts and load-bearing balance still need further refinement. Collision clearance does not certify anatomical accuracy.

Thumbnails are rendered locally, one at a time, for the visible 24-item page and cached for the current session. Search/category/difficulty changes and closing the dialog cancel pending thumbnail work. Loading the library does not replace the sequence. Selecting a card appends it with a fresh ID and applies its pose.

Validation covers catalog completeness, distinct source links/IDs, rendered geometry staying above the floor, existing Cat–Cow support anchors, browser search/filter/pagination, and sequence save/load. Further visual refinements should update the individual definitions rather than inserting a generic fallback pose.

## Clearance corrections

`pose-corrections.json` contains per-pose angle offsets applied over the original authored definitions. The 47 flagged poses were corrected, along with smaller sub-millimetre overlaps found by the stricter regression test. These are static, deterministic configurations, not an automatic pose rewrite on load. Existing saved sequences retain their stored rotations. Lunge is checked after palm-support IK. Lizard uses a separately grounded configuration with a forward-bending trailing knee; it bypasses generic palm-support IK, which could reverse that leg. Its regression checks also cover hip twist, knee direction, ankle angle and palm height.

The regression test checks every library pose against the floor and nonadjacent body collision volumes, with a 0.1 micrometre numerical tolerance. The diagnostic report uses a 1 mm reporting threshold. The pole example uses outward elbow hints, a consistent grip radius and raised open-hand approach/release positions so its whole transition path clears the body and pole. Its regression test also sweeps body collision constraints between frames.

Run `node movement/scripts/audit-collisions.mjs` to regenerate `POSE-COLLISION-AUDIT.md` and `collision-audit.json`. The report documents the exact collision scope and the sampled example transitions. It does not test all possible pairs of library poses.

## Internal hand contact

The editor checks nonadjacent finger segments within each hand against each other and against a conservative palm volume. Connected knuckles and the finger-root attachment region are excluded. Nails are visual details inside the finger collision envelope. This does not add collision between the left and right hands or between hands and other body regions.

Direct edits and playback use swept checks. Hand presets apply joints individually and stop at contact, so `Fist` may stop short of its authored target. Imported overlapping hand shapes remain diagnosable and playback is blocked until repaired; loading does not silently rewrite the file.

## Ground support presets

Camel and Dolphin have explicit grounded configurations in `supported-poses.json`. Camel aligns both shin contact surfaces horizontally and uses `knees-shins` support metadata. Dolphin aligns the forearms and palm planes with the floor and uses `forearms` support. Since the mannequin forearm radius is larger than the palm thickness, Dolphin includes a small local hand mounting offset. This is included in pose snapshots, swept surface checks, interpolation and sequence serialization; old files default to zero offsets.

Regression checks sample multiple points along the shin/forearm contact surfaces and across each Dolphin palm. They check support in addition to penetration. These authored presets do not constitute a general balance simulation or guarantee that arbitrary edited poses retain all support anchors.

## Wrist direction limits

The swept body guard also limits hand direction relative to its forearm: bend to ±80° and side tilt to ±35°, using the rig's existing limits. These are editor safeguards, not clinical limits or a complete anatomical model. Direction vectors avoid Euler wrap jumps and separate longitudinal palm/back roll from bending. Pole grips orient the forearm as well as the hand; the lower grip no longer folds the hand backward.

Caterpillar retains flat palms with approximately 70° wrist extension; regression tests check that the striped dorsal face points upward, both palm edges touch the floor, and the wrist has margin below its limit. Imported out-of-range poses are preserved and flagged, can be edited toward the valid range, and cannot start playback until repaired. Other draft poses may need alignment review; the collision audit now reports wrist violations separately from overlaps.

## Full library support/range review

Run `node movement/scripts/audit-pose-validity.mjs` for the separate support and joint-range audit. `POSE-VALIDITY-AUDIT.md`, `pose-validity-audit.html`, and `pose-validity-audit.json` contain all 167 rows, expected support profiles, measured gaps and local joint measurements. The report is diagnostic and does not alter authored poses. In particular, the existing Cat–Cow test verifies anchor constancy, while the expanded audit finds that subsequent floor settling raises those anchors; these are different guarantees.

The current editor ranges are not clinical human limits. Whole-body root orientation is excluded, and shoulder/forearm coupling, internal body-on-body support and force/balance validation remain explicitly unverified. Minimum floor-support checks do not certify complete pose fidelity.

## Neck Stretching example

`neck-example.js` adds a 135-second, 21-card standing sequence under Example. It adapts rotation, side-bend and hand-assisted upper-trapezius movements from [Shape and Strength](https://shapeandstrength.com/neck-pain-exercises/) into one shortened round, with neutral cards between directions. For each assisted tilt, the hand on the tilting side crosses over the crown and rests by the opposite ear. Separate lift, reach, release and lower cards keep the arm path clear and the interpolated wrist direction inside the editor envelope. It does not reproduce the complete daily routine. Chin retraction and independent scapular movement are omitted because the current rig does not model them.

`ashtanga-example.js` adds an editable 45-card short study with independently adjusted shapes in `ashtanga-shapes.js`. Both sides of selected standing poses are included, Boat precedes Bound Angle, and reset cards keep transitions clear. Support, joint-envelope and world-space alignment tests supplement collision checks. This remains a shortened adaptation with explicit preparation poses, not the complete Primary Series. See [the reference fidelity review](ASHTANGA-REVIEW.md) for comparisons, remaining differences and validation scope.

The authored neck angles are ±35° yaw and ±20° tilt, not prescribed human limits. The static 8° foot-arch setting aligns this mannequin's heel and forefoot pads. Tests sample the full timeline for sole support, unchanged body joints, direction labels, range checks and swept collisions. The preset uses the existing sequence format, so card editing and JSON save/load require no migration.
