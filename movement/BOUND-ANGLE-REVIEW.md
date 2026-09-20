# Bound Angle: support and contact review

## Outcome

The catalog pose now satisfies seated support and closed sole-to-sole contact. Pelvis gap is **0 mm**; paired heel/forefoot gaps are **1.43/1.37 mm**, within the 5 mm contact skin. Opposing normal alignment is 1.0; complete-foot separating-plane overrun is 0 mm. Current ROM, wrist and limb-contact checks pass after gallery selection, save and reload.

Knees stay raised rather than being forced onto the floor. The gallery labels the variant `Soles together · Raised knees · No hand grip`. Its general Draft status remains because hand gripping, balance and full anatomical fidelity are not certified.

## Root cause and correction

The previous hip axial metric used reference-Y swing/twist, which is not the femoral axial angle after combined flexion and abduction. This was a coordinate-definition mismatch, not an Euler wrapping bug. For example, composing flexion 120°, abduction 50° and axial rotation 55° produced a 132.85° old proxy.

The corrected decomposition uses flexion → abduction → axial rotation, mapped to this rig's X → Z → Y axes. The reporting order follows the [ISB hip JCS recommendation](https://media.isbweb.org/standards/hip.pdf). This source supports the coordinate convention, not the numerical editor bounds or individual flexibility. Bounds remain unchanged: flexion −45…130°, abduction ±70°, axial rotation ±60°.

The pose also needed new geometry: modestly raised knees and a common rotation of the paired feet. Changing the metric alone did not validate the earlier flat-knee candidate. The separate Ashtanga open-foot preparation was adjusted from axial ±66.07° to ±59.06°, preserving its own seat/foot-edge supports.

## Regression coverage

- Catalog Bound Angle requires seat + sole-pair; explicit open-foot examples keep their separate requirements.
- Paired heel/forefoot ellipsoids must face inward, with at most 5 mm separation/tangential mismatch and less than 1 mm penetration.
- A conservative complete-foot separating plane checks toes too. This is not universal triangle-mesh collision detection.
- Tests reject separation, wrong direction, overlap, heel-only contact, tangential offsets and crossing toes, including scaled feet.
- The corrected catalog pose survives capture/restore; perturbing one hip breaks the pair and fails validation.
- Independent axis-angle fixtures verify compound hip rotation, excessive axial rotation, mirrors, quaternion-sign/Euler-storage invariance and retained flexion/abduction limits.
- The sole-pair requirement persists in sequence JSON and contact schedules.

## Verification and scope

Full suite: **105 tests passed**. Production build passed with the existing bundle-size warning. Browser gallery → download → reload preserves all measured supports and range checks. All **82 example holds** retain their required supports.

The refreshed catalog audit reports **115 support findings, 70 joint-range reviews and 0 existing body-collision findings**. The changed coordinate convention exposes additional range issues in other drafts; they remain visible in the report. This correction does not claim to repair all 167 poses.

A sub-agent independently reviewed the missing geometric freedoms, added five hip regression tests and corrected the separate Ashtanga preparation. The primary agent corrected the shared measurement, catalog geometry, integration regression and browser verification.
