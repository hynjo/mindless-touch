# Ashtanga example: reference fidelity review

Reference: [MyYogaTeacher Primary Series guide](https://myyogateacher.com/articles/ashtanga-yoga-primary-series-guide), including its standing, seated and finishing illustrations. These images were inspected, not bundled into the app.

## Findings and changes

The previous example reused draft library rotations. Its test checked floor clearance and selected self-collision pairs, but did not require the expected support surfaces to touch the floor. Rotating the pelvis consequently lifted legs without failing that test. The test also omitted the app's palm-placement and landing corrections.

| Pose / section | Previous discrepancy | Current result and remaining difference |
| --- | --- | --- |
| Triangle | Pelvis rotation carried the legs sideways; one sole was about 1,285 mm above the floor. Only one side was present. | Both soles grounded, straight knees, horizontal torso and upper arm vertical; both sides included. The lower arm reaches forward of the shin to clear the mannequin's thick limb volumes. It does not reproduce the toe hold. |
| Revolved Triangle | Both soles detached; torso twist and lower arm did not establish the illustrated opposing arm line. | Both soles grounded, opposing vertical arms, chest twist, both sides. Shallower depth; lower hand remains lifted. |
| Warrior I / II | Front sole about 415 / 634 mm above the floor. One side only. | Front shin vertical, rear knee straight, both soles grounded. Both sides included. Front knee bends 57 degrees; this is a shallow lunge, not the illustration's deeper stance. Warrior II retains a simplified pelvic orientation. |
| Big Toe | Soles about 174 mm above the floor; hip flexion exceeded the measured editor envelope. | Grounded feet and reduced hip flexion. Named Big Toe Preparation because the fingers do not bind the toes. |
| Staff | Pelvis and heels lacked support; hands were also detached. | Pelvis and heels supported, knees softly bent. Named Staff — Arms Forward; palm support is deliberately not claimed. |
| Seated Forward Bend | Pelvis floated and hip flexion measured 155 degrees. | Pelvis and heels supported; bend shared across pelvis, waist and chest. Bent knees and shallower fold are named modifications. No foot grip. |
| Boat / Bound Angle | Reversed relative order. Bound Angle had no seat support. | Boat precedes Bound Angle. Seat support restored. Bound Angle Preparation remains an open-knee preparation with separated feet, not the illustrated sole-to-sole fold. |
| Bridge | Heels and upper back detached. | Both soles, upper back and back of head supported. Low Bridge is visibly lower than the reference. |
| Fish | Pelvis and heels detached. | Pelvis, head and heels supported. Fish Preparation has a low chest opening and slight knee bend; it is not the full illustrated backbend. |
| Lotus finish | The draft did not establish seat support or a convincing lotus leg arrangement. | Explicitly replaced by Closing Seat — Open Legs. Full Lotus has not been validated or reproduced. |
| Corpse | Heels and back of head detached. | Pelvis, upper back, back of head and heels supported; slight knee bend accommodates mannequin proportions. |

## Sequence scope

The example is now 45 cards, approximately 3 minutes 52 seconds at 1x. The duration is animation-preview timing, not a prescribed breathing pace. Both sides of the selected standing poses are included. Upright and seated reset cards separate changes in stance to keep arms clear of legs.

It remains an abbreviated study: one Sun Salutation A, selected standing/seated poses and a modified finish. It omits Sun Salutation B, repeated vinyasas, many poses, inversions and binds. The reference recommends support where appropriate; inversions do not universally require a wall. Their omission here is a scope choice, not a physical necessity.

## Verification and limits

- Static tests require the relevant sole, heel, seat, back or head surfaces to be within the existing 5 mm contact tolerance and meet orientation criteria. Staff with arms forward is checked for seat and heels, not palms.
- Revised holds are checked against the measured joint envelope and existing self-collision pairs before establishing a collision baseline.
- Triangle/Warrior tests check world-space arm directions, torso inclination, stance width, front-shin alignment, rear-knee extension and the named side.
- The whole timeline is sampled with the app's open-hand, palm-support and landing adjustments. Browser playback also completes at 10x.
- Rendered thumbnails were visually compared with the reference charts. Collision checks do not constitute full anatomical validation: gravity, balance, continuous support anchoring during transitions, soft tissue, every head/hand contact and scapular motion remain unmodeled.

These changes apply to the Ashtanga example through `ashtanga-shapes.js`; the shared draft pose library and previously saved JSON files are not silently rewritten. Reload the example to obtain the new cards.
