# Eight Angle — support and reference audit

Audit date: 2026-11-14. Diagnosis only; the catalog pose has not been changed.

Reference: [Pocket Yoga Eight Angle](https://www.pocketyoga.com/pose/EightAngle), using the current pose dictionary retrieved for the full library audit.

The reference establishes both palms as the floor base, elbows bent approximately 90 degrees, both legs lifted and extended to one side, hooked feet, and the upper arm held between the thighs. The torso approaches parallel to the mat.

## Current model

| Check | Measurement after shared application | Finding |
|---|---:|---|
| Left palm patches | 172.3–192.4 mm above contact plane | Not supporting |
| Right palm patches | 210.5–230.0 mm above contact plane | Not supporting |
| Left forefoot | At the floor contact plane | Model rests on a foot instead of having both feet airborne |
| Right foot minimum clearance | 98.3 mm above floor | Different support state from left foot |
| Left hip flexion / axial rotation | 138.0 / −88.1 degrees | Outside current model envelopes |
| Right hip flexion / axial rotation | 144.0 / −79.3 degrees | Outside current model envelopes |
| Leg-to-arm relation | Bounding volumes are near | No precise arm-clamp validator; proximity does not prove supporting contact |
| Hooked feet | Not covered by current contract | Requires an explicit relationship check |

`support-profiles.js` already requires `palms`, so the audit correctly fails this pose. The placement path has no Eight Angle contract or palm fitting strategy; its generic floor settling aligns the lowest part, currently the left forefoot. It does not solve both hands to the floor while preserving the reference shape.

## Why a hand-only adjustment is insufficient

A temporary diagnostic applied `placePalmsOnFloor(..., {constrainAnkles:true})` to a separate rig. Both full palm planes reached the floor, but the result still kept a foot down and produced:

- A 16.5 mm overlap between the leg capsule proxies.
- A left-knee off-hinge direction of −26.8 degrees.
- Hip flexion up to 154.9 degrees, plus the existing excessive axial rotation.

That diagnostic was discarded. No such pose was saved or installed.

## Required repair

Reauthor the full pose around simultaneous grounded palms and airborne legs. Solve the hip orientation, leg-to-upper-arm clamp and hooked ankle arrangement together, with the knees remaining on their hinge axes and the existing ROM and collision tolerances preserved. Add a versioned contract for these relationships, validate both sides, retain it through save/load, and verify browser views. A generic floor translation or hand-fit pass is not a complete Eight Angle repair.
