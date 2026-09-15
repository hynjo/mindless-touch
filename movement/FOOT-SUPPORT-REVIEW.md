# Supporting feet audit — 2026-09-14

## Cause and validation rule

Forward Fold's palms were grounded, but both heels remained 74.95 mm above the floor. The palm placement solver sent unreachable ankle targets to leg IK; IK clamped to the leg length. The final floor settle only translated the lowest body surface to the floor, so a contacting palm hid the detached feet.

A pose now carries explicit `supportRequirements` through capture and JSON save/load. Named catalog variants retain their support profile when added to a sequence. The editor reports missing supports while paused. This is separate from nonpenetration: a pose is not support-valid merely because its lowest surface is above the floor. Unknown legacy files remain loadable without invented support requirements.

Whole-sole support checks heel and forefoot pads, plus sole orientation, within the existing 5 mm tolerance. The arch is excluded. One-leg poses use an `any-sole` requirement, while plank, upward dog and downward dog have toe, top-of-foot and forefoot requirements respectively. Transitions are not required to retain every hold's anchors during takeoff.

## Changes and findings

- Palm placement lowers the pelvis when a supporting ankle is vertically unreachable. It also moves the palm target within arm reach if flat-palm placement would overextend the wrist.
- Forward Fold now supports both palms and both soles. Heel/forefoot error is at most 0.03 mm relative to the 0.7 mm floor skin, rather than the former approximately 75 mm gap.
- Sun Salutation's standing foot arches, Plant Hands/Step Together foot orientation, Step Back/Forward front leg, and Upward/Downward Dog feet were corrected. Ashtanga inherits these opening cards.
- All 82 hold/card poses in Sun Salutation, Ashtanga Short Practice and Neck Stretching pass their specified support checks. Full Sun/Ashtanga timeline tests retain floor clearance, body collision and wrist checks.
- All 167 catalog entries were re-audited. Conservative corrections were accepted for 23 additional entries requiring sole support. The repair script rejects candidates that introduce collisions, increase joint-limit findings, or lose a previously passing support.
- The catalog still has **125 poses with support findings**, **65 with joint-range findings**, and **0 detected self-collisions**. These sets overlap. The other failed repairs were not published: grounding their feet would require further authored changes or violated other constraints. This is not a claim that all draft catalog poses are fixed.

## Reproduction and artifacts

- `node movement/scripts/repair-foot-support.mjs`: deterministic conservative catalog foot repairs, with accepted/rejected results in `foot-support-repair-report.json`.
- `node movement/scripts/audit-pose-validity.mjs`: all catalog findings in `pose-validity-audit.json` and the searchable `pose-validity-audit.html` report.
- `node movement/scripts/audit-example-supports.mjs`: 82 example card checks in `example-support-audit.json`.
- `npm test`: regression tests include required soles on Forward Fold, all example hold supports, repaired catalog soles, nonpenetration, playback and support metadata round trips.

Existing downloaded sequences are not silently rewritten. Reload an example or add the revised catalog pose to obtain its corrected geometry. These checks concern the mannequin's geometric contacts and existing editor joint envelopes, not gravity, balance, tissue deformation or clinical motion limits.
