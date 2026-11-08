# Contact projection results

Reproduce with `node movement/scripts/project-cow-face-hands.mjs`.

The correction fixes two cross-hand distal capsule pairs (left middle/right ring,
left ring/right middle), selecting their closest distal segments once at entry.
Finite-difference gradients adjust all selected gap residuals together toward
0.1 mm. Backtracking rejects guard violations. Finger flexion is adjusted first,
then wrists, then arm joints if needed. Existing curled fingers remain curled;
root, spine, legs, bone lengths and hand offsets do not change.

| Historical seed | Initial selected gaps (mm) | Corrected gaps (mm) | Tight contact | Local retention |
|---|---|---|---|---|
| 17 | 1.576 / 0.994 | 0.083 / 0.105 | Pass | Fail: all 5 pulls free |
| 73 | 0.681 / 1.006 | 0.174 / 0.100 | Pass | Fail: all 5 pulls free |

Corrected diagnostic snapshots pass the existing support, range and collision
checks but are **not accepted grips**. On either failure the input pose is restored,
including when `apply:true`. Candidate snapshots are returned for offline review.
The main grip solver attempts this correction at the end of a guarded search;
only a result passing retention may be applied.

These measurements distinguish gap error from contact arrangement: reducing the
surface distance alone does not make these fingers interlock. The next step is to
change the contact arrangement and include pull resistance in target selection.
This implementation uses capsule gaps and numerical derivatives, not exact skin
mesh contact points/normals. It does not yet search alternate pair assignments or
certify rotational escape, force closure, shoulder anatomy or transitions.

Raw measurements and snapshots: `hand-contact-projection-results.json`.
