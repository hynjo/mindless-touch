# Static hand-grip candidate solver

## September 30: stricter acceptance

The original two successes below are **historical proximity candidates**. Neither
passes the new 0.5 mm capsule surface-contact tolerance. Reproduce their audit
with `node movement/scripts/audit-grip-retention.mjs`; raw results are in
`grip-retention-audit.json`. Their stored snapshots remain negative regression
fixtures rather than being overwritten by the updated search.

Solver success now requires two distinct curled distal fingers on each hand
within 0.5 mm, no external overlap, and five local pull probes blocked by the
original contacting finger pairs. The probes pull the hand mounts apart along
the wrist-to-wrist axis and four nearby directions (slope ±0.2), sampling 0.1 mm
increments up to 1 mm. More than 0.01 mm penetration marks a blocked probe.
Core or unrelated finger collisions cannot count as retention. All temporary
translations are restored. The new search targets 0.1 mm gaps instead of 1 mm.

These are capsule contact and local rigid-translation tests, not exact skin
contact, force closure, friction simulation, rotational escape testing or valid
arm motion. Even a passing result remains `certified:false`. Updated solver runs
write `hand-grip-retention-results.json`, leaving the old results intact.

The updated 20,000-proposal runs for seeds 17 and 73 both fail the tight-contact
gate; neither qualifies for pull-probe acceptance. This is a bounded local-search
failure, not evidence that a valid grip is impossible. The input poses are restored
and the catalog is unchanged. Further contact projection/search work is required
before any new static bind can be offered to users.

## Original proximity solver results (superseded)

`solveHandGrip(rig, {iterations: 20000, seed: 17, supportRequirements: ['sit-bones'], apply: true})`
searches shoulder orientation, elbow flexion, wrist orientation and non-thumb finger
flexion. Root, spine, legs, bone lengths and hand-mount offsets remain fixed.
The rig must supply collision meshes, hands, dimensions and the joint map.

The deterministic search minimizes distal finger gaps, palm opposition, finger
curl and guard violations. Cost reduction alone is never success: support, ROM,
wrist limits, floor clearance, internal/body collision and all external hand proxy
checks must pass, as must the separate hooked-contact candidate criteria.
Failure (including exceptions) restores the input pose. `apply:false` returns a
candidate without changing the input. The returned pose is an in-memory
`capturePose` snapshot; it is not the versioned sequence export format.

Reproduce both original reach seeds with:

```
node movement/scripts/solve-cow-face-hands.mjs
```

| Seed | Proposals to candidate | Result |
|---|---:|---|
| 17 | 19330 | All implemented guards pass |
| 73 | 7248 | All implemented guards pass |

Both hands have curled middle and ring fingers, opposing palms and at least two
independent fingers within the existing 5 mm geometric contact tolerance. Full
snapshots and contact gaps are saved in `hand-grip-solver-results.json`. Regression
tests independently replay those snapshots and recheck their guards.

## Limits and integration

This is an offline/static solver API, not a button in the editor or a per-frame
solver. A 20,000-proposal synchronous run can take seconds; move it to a worker
before adding an interactive control. It is a local search, not a reachability
proof. Success means a **geometric candidate**, not guaranteed interlocking,
force closure or anatomical shoulder feasibility. Gaps up to 5 mm are allowed by
the current contact contract; exact surface locking needs a subsequent projection
and retention test. Conservative hand/core proxies remain hard rejection gates.
Hand/limb coverage and transition sweeps are still incomplete.

The catalog remains Cow Face (Preparation): stacking knees and verifying entry,
release and visual appearance are separate work. No new UI copy or global limits
were introduced.
