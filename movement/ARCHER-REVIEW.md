# Archer's: toe grips and support correction

The old draft had a 127.58 mm seat gap, left hip flexion 136.15° against the existing 130° editor bound, open hands detached from both feet, and a grounded foot on the intended lifted side.

The new authored pose establishes two index/middle-finger hooks around the corresponding big toes. The contact patches have approximately 1 mm fingertip clearance. Toe articulation separates the held big toes from adjacent toes. The seat gap is 1.33 mm and supporting heel gap is 2 mm, within the existing 5 mm support skin. The lifted foot clears the floor by 78.35 mm; its big toe lies about 95.65 mm from the approximate ear landmark. Current joint, wrist and limb collision checks pass, including a zero-penetration limb check.

## Reference fidelity

This remains a **forward-leaning variation**, with a softened supporting knee of 5.98°. Its upper body folds farther forward than the upright [Pocket Yoga Archer reference](https://www.pocketyoga.com/pose/Archer). The label and cue explicitly identify the variation, and Draft status remains. Static grip and support correction must not be read as complete reference fidelity. An upright version still needs further rig/proportion or pose work; joint limits were not widened to manufacture a pass.

The reference calls for both big toes to be held, one leg extended with its back supported, and the opposite foot drawn toward the ear. A flat supporting **sole** is not a requirement; the previous review's flat-sole statement was incorrect.

## Validation added

- `both-toe-grips`: each index/middle finger must have multiple toe-contact segments, a contacting distal segment and sufficient hinge curl. An open hand or detached hook fails. This is a geometric hook, not a force/friction simulation or automatic grip attachment.
- Hand/foot checks include toe capsules, ellipsoidal foot pads, finger capsules/knuckles and palm envelopes. Nails are decorative and excluded. Palm checks use oriented boxes; overlaps of world-aligned bounding boxes alone do not count as contact. Penetration tolerance is 0.5 mm. This check runs for poses declaring toe grips, not as a universal runtime collision response for every pose.
- `archer-leg-support`: supporting heel and leg remain grounded, the supporting knee stays within the explicitly modified 10° softness limit, and the opposite foot stays lifted toward an approximate ear landmark.
- The authoring loader used to replace all stored finger rotations with the open preset. It now preserves authored finger angles, while its existing per-joint reset still opens unspecified fingers. Catalog audits follow the same behavior.
- Regressions cover the old failure, both hooks, hand opening/detachment, overlap, mirrored sides, rigid-transform invariance, restoration and sequence JSON persistence.

Actual browser gallery selection → download → reload preserves the finger curls and all declared supports. Arbitrary transitions, muscle forces, balance and full anatomical certification remain outside this static pose correction.

Final validation: all **118 tests pass**, including seven Archer regressions; production build passes with the existing bundle-size warning. The refreshed catalog audit reports 113 support findings, 69 range reviews and zero existing body-collision findings. Archer now passes the declared geometric checks for its labeled variation; the other draft findings remain visible.
