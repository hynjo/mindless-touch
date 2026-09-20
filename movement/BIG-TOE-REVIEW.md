# Catalog Big Toe: grounded reach correction

The gallery `Big Toe` (`ForwardBendBigToe`) is separate from the Ashtanga example's `Forward Fold — Bent Knees`. This correction updates the gallery draft while preserving its straight knees.

## Before and after

- Previously, the lowest fingers started about 86 mm below the floor. The floor placement raised the entire body, leaving both sole support patches about 167–174 mm above the support plane. Hip flexion also exceeded the current editor envelope by 15°.
- The corrected pose is authored with grounded feet, an adjusted trunk bend and inward-reaching arms. Both heel/forefoot pads pass the existing 5 mm tolerance (about 0–0.03 mm residual), and all measured joint/wrist and existing self-contact checks pass. Floor placement no longer needs to lift the entire pose.
- The index and middle finger capsule surfaces are about 33–35 mm from the same-side big-toe capsule surfaces. The fingers are open: this is a toe-reaching preparation, **not a toe lock**. The gallery explicitly displays `Toe-reaching preparation · No toe grip`, and the saved cue retains this qualification. The draft flag stays set.
- The Ashtanga preparation remains a distinct bent-knee pose; it is not replaced by this catalog geometry.

## Review findings and scope

A single sub-agent reviewed validation coverage read-only while the primary agent authored and tested the pose. The review identified that the Standing fallback only requires soles; there is no toe-grip contract. General self-contact checks cover limb capsules and internal finger collisions, but not every hand/foot pair. `palms` placement also opens the hands and must not be used to establish a toe grip.

Accordingly, this correction retains `floorSupport: ground`, does not relax any tolerance or range, and adds pose-specific assertions for actual index/middle-to-big-toe proximity. Disjoint individual hand/foot mesh bounds independently prove clearance for the corrected hold. These assertions do not represent a universal runtime hand/foot collision solver or a finger-wrapping constraint.

## Verification

- Full suite: **91 tests pass**. Production build passes with the existing bundle-size warning; all **82** example holds retain declared support.
- The corrected catalog pose and its reflection pass the runtime placement and capture/restore regression with all supports, measured joint ranges, wrists, body contacts and floor clearance checked together.
- A dedicated test checks straight knees, negligible root correction, the explicit no-grip label, actual finger-segment proximity and hand/foot clearance.
- Actual browser gallery selection, sequence capture, download and reload preserve support/ROM/body/wrist checks. The rendered pose was inspected after reload.
- Updated whole-catalog audit: **116** support findings, **62** joint-range reviews, **0** body-collision findings, **33** scoped passes out of 167. These are geometry/editor checks, not anatomical certification.

Actual toe gripping still requires finger placement that wraps the toe, cross-part collision checks, and preservation of authored finger rotations through the load pipeline. It is not claimed by this change. Arbitrary transitions into this catalog pose remain separate from the hold and persistence checks.
