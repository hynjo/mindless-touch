# Crow: support geometry correction

The original catalog draft had palms 91–109 mm above the floor, knees resting on the floor and toes only 2.58 mm clear. It passed the existing range and collision checks, but could not represent a hand-supported Crow.

The corrected pose places both palms within 0.11 mm of the support plane. Both knee regions meet the upper sides of the upper arms with a 3.92 mm contact skin (below the 5 mm acceptance threshold); elbows bend approximately 90°. All leg/foot meshes clear the floor by at least 84.18 mm. Current joint-envelope, wrist and self-collision checks pass, including a zero-penetration limb check. The first candidate's 0.99 mm shin/arm overlap was removed by slightly increasing leg abduction, not relaxing collision thresholds.

## Missing rules now covered

Crow requires `palms`, `crow-knees-on-arms` and `legs-airborne`.

- Knee-region support uses the distal thigh / proximal shin capsule ends against the same-side upper arm. Both sides must have a surface gap between −1 and 5 mm, an upward contact normal of at least 0.5, and bent elbows between 60° and 110°.
- Legs-airborne checks every mesh below both hips, including feet and toes, for more than 10 mm floor clearance. Clearance is not listed as an actual contact region.
- Tests reject the old draft, one-sided separation, underside contact, straight elbows, penetration and grounded legs. The new requirements survive sequence JSON serialization; the geometry survives capture/restore and actual browser gallery → download → reload.

These are contact geometry checks, not a simulation of muscle forces, friction or mass distribution. The rig has no patella/soft-tissue landmark; knee contact is a capsule proxy. Draft status remains. This work corrects the static Crow pose, not arbitrary transitions into arm balances.

## Reference

The named variant follows [Pocket Yoga Crow](https://www.pocketyoga.com/pose/Crow): bent arms, knee support near the elbows, both feet lifted. The description was reviewed from the cached Pocket Yoga pose catalog. [Yoga Journal's Crow variations](https://www.yogajournal.com/practice/5-ways-to-practice-crow-pose?scope=anon) also describe knees supported on bent upper arms. No reference artwork or descriptions are copied into the app.

## Validation

All **111 tests pass**, including six Crow regressions. Production build passes with the existing bundle-size warning. Actual browser selection, download and reload retain the three required conditions with no range or existing collision findings. The refreshed 167-pose catalog audit reports 114 support findings, 70 joint-range reviews and 0 existing body-collision findings; Crow is now a scoped pass. Unrelated draft findings remain visible.
