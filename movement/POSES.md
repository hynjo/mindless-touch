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
