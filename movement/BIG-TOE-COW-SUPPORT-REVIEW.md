# Big Toe → Cow support-loss audit

The previously added neutral-wrist route is rejected. It avoids wrist limits but
fails contact continuity. At roughly halfway through Release hands → Prepare palm
landing, floor settling raises the root about 179 mm. The palms are 248 mm above
their contact target, forefeet 31 mm and knees 347 mm. No required support group
is maintained. The subsequent palm-landing helper abruptly recovers contact; this
does not repair the unsupported preceding path.

The first complete loss of the inspected palm/sole/knee patches occurs about
8.3% into that segment. Collision clearance alone had allowed it. Measurements are
reproducible with `node movement/scripts/audit-big-toe-cow-supports.mjs`; the JSON
records per-frame pre-settle gaps, root lift and post-settle surface diagnostics.

## Changes

- Removed automatic route insertion and its editor action. Historical helper kept
  only to reproduce the rejected route in regression fixtures.
- Playback now checks unscheduled transitions with explicit support intent. Common
  requirements persist; a support transfer must retain one complete endpoint set
  until the other is established. Endpoints require their own supports.
- Missing support intent is explicitly unassessed, not certified. Existing explicit
  contact schedules retain their existing validator. Legacy neutral route cards
  receive their intended sole / palm-and-knee requirements for this check.
- A failure restores the previous accepted pose and time. Finger contact cannot
  substitute for a required palm patch. No gravity or pressure model is implied.

## Remaining work

This is a conservative contact gate, not a new valid floor-entry path. It may stop
transfers that require an authored intermediate support set. Big Toe → Cow needs
such a path, with flat-palm establishment before leg-support transfer. Balance,
load distribution and the user's separate Downward Dog observation are not yet
fully validated. No browser visual review was available in this run.
