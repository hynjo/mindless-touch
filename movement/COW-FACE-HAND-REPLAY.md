# Saved Cow Face hand witnesses

Reproduce: `node movement/scripts/replay-cow-face-hands.mjs`. Raw gaps are metres. Replay restores saved angles without IK. Reach uses a 5 mm per-tip tolerance. Opposed contact requires normals dot < -0.8, a surface gap ≤5 mm and no external proxy overlap. Hook candidates additionally require two distinct curled fingers in distal contact on each hand. This is a geometric candidate, not certified retention or anatomical feasibility. Conservative overlaps are unresolved blockers, not proven rendered penetration.

| Family | Mode | Seed | Old guards | Tip reach | Opposed contact | Hook candidate | External overlaps |
|---|---|---:|---|---|---|---|---:|
| legs 160 | all | 17 | true | false | false | false | 0 |
| legs 160 | all | 73 | true | false | false | false | 0 |
| legs 160 | omit-rom | 17 | true | false | false | false | 0 |
| legs 160 | omit-rom | 73 | true | false | false | false | 0 |
| legs 160 | omit-collision | 17 | true | false | false | false | 0 |
| legs 160 | omit-collision | 73 | true | false | false | false | 0 |
| legs 160 | omit-floor | 17 | true | false | false | false | 0 |
| legs 160 | omit-floor | 73 | true | false | false | false | 0 |
| legs 160 | omit-seat | 17 | true | false | false | false | 0 |
| legs 160 | omit-seat | 73 | true | false | false | false | 0 |
| arms  | all | 17 | true | true | false | false | 1 |
| arms  | all | 73 | true | true | false | false | 1 |
| arms  | omit-rom | 17 | true | false | false | false | 0 |
| arms  | omit-rom | 73 | true | false | false | false | 0 |
| arms  | omit-collision | 17 | true | false | false | false | 0 |
| arms  | omit-collision | 73 | true | true | false | false | 1 |
| arms  | omit-floor | 17 | true | true | false | false | 1 |
| arms  | omit-floor | 73 | true | true | false | false | 1 |
| arms  | omit-seat | 17 | true | false | false | false | 0 |
| arms  | omit-seat | 73 | true | false | false | false | 0 |
| legs 100 | all | 17 | true | false | false | false | 0 |
| legs 100 | all | 73 | true | false | false | false | 0 |
| legs 220 | all | 17 | true | false | false | false | 0 |
| legs 220 | all | 73 | true | false | false | false | 0 |
| legs -160 | all | 17 | true | false | false | false | 0 |
| legs -160 | all | 73 | true | false | false | false | 0 |

## Interpretation

{"witnesses":26,"oldGuardsPass":26,"reach":5,"opposedContact":0,"hookCandidates":0}

The two all-guard arm seeds reach their fingertip targets but neither establishes opposed contact or a hook. Seed 17 has 0.824 mm opposing middle-finger capsule overlap. Seed 73 has 0.817 mm middle-finger separation, but a new conservative thumb/torso overlap of 2.137 mm needs narrow-phase review. Both have zero curled fingers. Their palm-normal dots are 0.098 and -0.494, outside the opposed-contact threshold. Keep these as reach seeds, not completed binds. The catalog remains Cow Face (Preparation).

Next solver work must optimize palm orientation and articulated finger contact while preserving support, ROM and collision guards. The hook criterion currently screens static geometric candidates only; it does not prove interlocking retention, contact forces, shoulder feasibility or transition safety.
