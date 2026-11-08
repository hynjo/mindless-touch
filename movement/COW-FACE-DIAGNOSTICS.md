# Cow Face diagnostic measurements

Generated 2026-09-23T12:44:49.085Z. Run `node movement/scripts/diagnose-cow-face.mjs`. Optional `COW_DIAGNOSTIC_ITERATIONS` controls trials per search. No runtime data or constraints are changed.

## Controlled ablations

Same starting pose, budgets and random seeds for each mode. Task error is the combined target residual in mm; compare only within a family. Guarded error is the best candidate passing current floor/support/ROM/self guards, not a full pose pass.

| Family | Omitted penalty | Seed | Task error mm | Best guarded mm | Final guards pass | ROM issues | Contacts | Floor clearance mm |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| legs 160 | all | 17 | 146.36 | 146.36 | false | 0 | 1 | 0.37 |
| legs 160 | all | 73 | 144.03 | 183.88 | false | 0 | 1 | 0.81 |
| legs 160 | omit-rom | 17 | 127.01 | 252.37 | false | 5 | 0 | -0.68 |
| legs 160 | omit-rom | 73 | 115.17 | 252.37 | false | 2 | 1 | 2.02 |
| legs 160 | omit-collision | 17 | 109.37 | 197.56 | false | 0 | 2 | 2.27 |
| legs 160 | omit-collision | 73 | 99.83 | 252.37 | false | 0 | 2 | 0.06 |
| legs 160 | omit-floor | 17 | 94.98 | 252.37 | false | 0 | 1 | -133.18 |
| legs 160 | omit-floor | 73 | 81.7 | 252.37 | false | 0 | 1 | -122.41 |
| legs 160 | omit-seat | 17 | 106.6 | 252.37 | false | 0 | 1 | 2.07 |
| legs 160 | omit-seat | 73 | 108.26 | 252.37 | false | 0 | 1 | 8.04 |
| arms  | all | 17 | 1.87 | 1.87 | true | 0 | 0 | 1.77 |
| arms  | all | 73 | 3.25 | 3.25 | true | 0 | 0 | 2.01 |
| arms  | omit-rom | 17 | 0.39 | 128.08 | false | 2 | 0 | 2.73 |
| arms  | omit-rom | 73 | 0.92 | 59.99 | false | 1 | 0 | 1.97 |
| arms  | omit-collision | 17 | 1.72 | 314.9 | false | 0 | 1 | 2.31 |
| arms  | omit-collision | 73 | 2.14 | 5.35 | false | 0 | 1 | 0.71 |
| arms  | omit-floor | 17 | 1.87 | 1.87 | true | 0 | 0 | 1.77 |
| arms  | omit-floor | 73 | 3.25 | 3.25 | true | 0 | 0 | 2.01 |
| arms  | omit-seat | 17 | 0.14 | 262.36 | false | 0 | 0 | 29.79 |
| arms  | omit-seat | 73 | 2.96 | 301.26 | false | 0 | 0 | 41.12 |
| legs 100 | all | 17 | 137.7 | 137.7 | false | 0 | 1 | 0.48 |
| legs 100 | all | 73 | 140.13 | 141.86 | false | 0 | 1 | 0.04 |
| legs 220 | all | 17 | 176.18 | 176.18 | false | 0 | 0 | -0.26 |
| legs 220 | all | 73 | 170.36 | 170.36 | false | 0 | 1 | -0.29 |
| legs -160 | all | 17 | 154.22 | 156.31 | false | 0 | 0 | -1.7 |
| legs -160 | all | 73 | 143.25 | 144.21 | false | 0 | 1 | -0.11 |

## Limits

- Deterministic local search, not proof of feasibility or impossibility. Two seeds share the authored initialization.
- Targets are diagnostic choices: 160 mm vertical knee separation and one fixed behind-back fingertip target.
- Ablations omit one penalty, never change editor rules. All candidates are measured again with original guards.
- Task score is a residual, not certification of a stacked knee support or interlocked grip.
- Shoulder elevation is reference-only in the current ROM audit; coupled shoulder/scapula limits are missing.
- Cross-hand audit is supplemental and not included in the search penalty. Hand/core and palm/palm collision gaps remain.
- No transitions, force balance, pressure, soft tissue or visual browser verification.

The JSON includes baseline/legacy measurements, per-side reach, exact candidate angles, failing joints, collision pairs, lowest meshes, and supplemental inter-hand checks.
