# Deaf Man's — reference comparison

Initial audit: 2026-11-14. Grounded preparation repaired and verified: 2026-11-15. The measurements below preserve the original diagnosis.

## Implemented repair

The catalog now uses **Deaf Man's (Preparation)** with independently authored spine, limb and foot rotations. It no longer inherits the bent-elbow shoulder-stand template. The existing `/movement/poses/deaf-man` URL remains valid.

| Required region | Current gap above the contact plane |
|---|---:|
| Back of head | 0.00 mm |
| Upper back | 1.43 mm |
| Both upper arms | 0.78 mm |
| Both forearms, including both ends | 0.01–0.04 mm |
| Both knee regions | 0.00 mm |
| Both dorsal foot regions | 0.39 mm |

All these contacts pass the existing 5 mm contact tolerance. The versioned preparation contract requires both sides independently, upper-arm contact within 5 mm, an elevated folded pelvis, rounded spine, mostly extended arms, and feet beyond the head. No editor ROM envelope or collision tolerance was loosened. The measured pose has no body, arm/head, external-hand or joint-limit violations.

The knees still do not reach the ears and the hands remain apart. This fit does **not** establish that the complete reference pose is impossible; it establishes a grounded preparation within the present rig and checks. The library name and modification explicitly identify this variant. The audit continues to expose the missing full-reference relationships, rather than treating wrist proximity as an interlaced grip.

Regression coverage includes original and mirrored poses, the former broken draft, either arm or the head lifting off the floor, immutable required supports, and JSON save/load. Browser side and perspective views render without exceptions. Arbitrary entry/exit transitions remain outside this static repair.

Reference: [Pocket Yoga Deaf Man's](https://www.pocketyoga.com/pose/DeafMan), its [original illustration](https://pocketyoga.com/assets/images/full/DeafMan.png), and the current pose dictionary retrieved for the complete library audit.

The original is a deep supine fold: knees beside the ears, lower legs and feet resting beyond the head, arms extended along the floor with hands clasped, and the head/neck and shoulder region remaining low. The model instead resembles an unfinished bent-leg shoulder stand: hips raised, feet still high, shoulders floating and elbows bent upward.

## Measurements after the editor's placement pipeline

| Feature | Model | Difference from reference |
|---|---:|---|
| Knee center to approximate same-side ear | 435.5 mm on both sides | Knees do not descend beside the ears |
| Lowest toe surface above contact plane | 888.4 mm on both sides | Feet remain airborne |
| Upper-back proxy above contact plane | 267.2 mm | Upper-back support is absent |
| Upper-arm proxy above contact plane | 345.5 mm | Arms do not extend on the ground |
| Forearm contact patches above contact plane | 540.6–569.5 mm | Both forearms float |
| Wrist-center separation | 440.0 mm | Hands do not clasp |
| Conservative hand-surface separation | at least 295.7 mm | This is a missing bind, not a finger-curl detail |
| Elbow flexion | 120 degrees | Reference arms are extended |
| Hip flexion | 135 degrees | Exceeds the current 130-degree model envelope by 5 degrees |

The head proxy touches the floor, while the required back and toe supports fail. This is not a balance calculation, but it exposes why floor nonpenetration alone accepted a visibly wrong inverted posture.

## Causes

- `pose-shapes.js` derives Deaf Man from the shoulder-stand template with pelvis −175 degrees, thoracic bend 20 degrees, hip flexion 135 degrees, knee bend 100 degrees and elbow flexion 120 degrees. Those independent angles do not establish the intended floor contacts or knee/ear relationship.
- `pose-corrections.json` only adjusts the shoulders for clearance. It does not reconstruct the fold.
- Generic floor settling translates the whole rig until its lowest mesh reaches the floor. It cannot bring raised shoulders and feet down independently once the head is already there.
- `support-profiles.js` requires `back` and `toes`, but neither is satisfied. It does not check knee/ear proximity, arm extension, or the hand clasp.
- There is no versioned Deaf Man form contract. Collision and joint checks alone cannot identify this pose.

## Repair approach

1. Establish the head/neck and upper-back/shoulder base with nonpenetrating contact. Resolve the actual foot contact patch from the illustration; do not silently require a flat whole sole for a pointed-foot variant.
2. Solve spine, pelvis, hips and knees together so the knees approach their respective ears and the lower legs reach the floor. Preserve existing joint limits and report an explicit modified variant if the rigid proportions cannot reproduce the reference.
3. Extend both arms along the floor and solve the clasp using finger-surface and hand-clearance evidence. Wrist proximity alone must not certify interlacing.
4. Add a versioned contract for the contact base, bilateral knee/ear relation, bent knees, extended arms, and clasp; test deliberately raised feet, detached hands and the former draft.
5. Validate application, save/load, browser views and entry/exit transitions separately. A corrected static pose does not establish a supported route from Plow.

The complete [pose-library audit](POSE-LIBRARY-AUDIT.md) includes this pose and its mirrored diagnostic. The interactive report is at `http://localhost:5173/movement/pose-library-audit.html#DeafMan`.
