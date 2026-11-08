# Supported-route review MVP

A body/wrist or support failure starts a background-worker search automatically.
The sequence is not changed. A separate panel retains the original pair, failure
reason and progress, with cancel, retry and downloadable JSON diagnostics.
Results for changed sequences or pending pose edits cannot be applied.

The deterministic planner tries at most six single-intermediate catalog routes
in a fixed order. Both edges must pass 265 sampled frames, current support intent,
floor clearance, joint ranges, internal/body/external-hand collision and swept
self-collision checks. The existing landing helpers are included. Explicit contact
schedules are not rewritten by this MVP. This is not a general graph planner,
force simulation or certification of anatomically natural motion.

A complete candidate displays its pose order for review. Apply inserts editable
cards; Undo restores the original. No sequence is automatically replaced. Failed
or partial searches do not expose Apply. Replaying an unchanged failure does not
repeat the search; Retry is explicit.

For Big Toe ↔ Cow, a contact-transfer primitive now follows unsuccessful catalog
bridges. It plants the palms, steps each foot back independently, lowers onto the
knees, untucks the feet, and relocates each palm/knee before reaching the exact
target. The reverse direction traverses the same verified geometry backwards.
This is a bounded primitive for this pair and rig, not a solution for every pose.

The candidate includes 13 motion phases instead of hundreds of sequence cards.
Apply attaches the motion to the outgoing card and sets its transition duration
to 15.6 seconds; speed controls still affect its timeline. The original cards and
their names remain. A chosen catalog midpoint may still be marked blocked while
this separate contact-transfer candidate succeeds. The candidate list shows the
transfer phases, and Apply is enabled only after the entire path passes.

Every phase has explicit minimum supports (for example, both palms plus the
opposite sole during a foot step). Palms, soles and forefeet are distinct surfaces.
No floor-settle correction or relaxed joint limits are used. All 241 frames per
phase and quarter-frame blends must pass support, range, floor, body/hand and
swept-collision checks. The serialized float32 representation is replayed and
validated too. Reverse traversal is checked independently.

`transitionMotion` persists the path in the sequence file, using bounded,
little-endian float32 tracks in base64. Unchanged joint tracks are omitted; one
current route uses about 0.93 MB. Import and export share a 16 MB limit so multiple
transfers can be saved without producing files the editor refuses to reload.
Existing files without motion still work.
Playback compares both endpoints against the current cards, so editing the target
or reordering cards cannot silently reuse an obsolete path. Editing the outgoing
pose drops its cached motion. Invalid data and disconnected phases are rejected.

Playback visits skipped quarter-samples, including phase boundaries, before
showing the next frame. A fast clock jump cannot replace the curved route with a
straight quaternion blend. This is computationally expensive: high speeds can be
CPU-limited. It does not model center of mass, force capacity, friction, or all
anatomical constraints; passing the geometry checks is not a balance guarantee.

Reproduce the knee-transfer stages with
`node movement/scripts/probe-knee-transfer.mjs`. Regression coverage includes both
directions, caller-state restoration, planted-palm drift, malformed motion data,
save/load, large playback jumps and invalid endpoints.

UI interaction has not been exercised in a browser in this environment. Worker
bundling and planner regression tests are checked by the build and test suite.

## Selectable suggestions

The panel ranks up to 12 catalog poses by endpoint support overlap, average major
joint quaternion distance and root-height distance. Authored degrees and stored
radians are normalized before comparison. Ranking is a heuristic, never a claim
of route validity. Endpoints are excluded and ties use stable pose IDs.

The top three are initially selected for automatic search. Users can choose up to
six cards and run Try selected routes; the worker tests exactly those IDs in rank
order, each as an independent one-pose bridge. Card labels retain Not tested,
Blocked or Passed both transitions status. The search stops at the first passing
route, leaving later choices untested. Changing selection cancels work and hides
Apply until a new complete route is validated. Selected IDs are in the failure
report. Thumbnail generation uses the existing pose preview renderer.

Ranking now gives partial affinity to soles/forefeet/toes/heels and penalizes
large world-space torso-facing detours from both endpoints. This affects candidate
ranking only; actual contact validation still uses distinct surface requirements.
Downward-Facing Dog ranks second for the current Big Toe → Cow catalog pair.

Search all poses filters the complete ranked catalog (excluding the endpoints),
with punctuation-insensitive word matching. The first 12 matching poses plus
already-selected cards are visible. Selection persists across filters, and the
worker receives all selected IDs, including candidates outside the original 12.
