# Authored transition contacts

`sole-pair` is a geometric contact between feet, not a ground anchor. It may be
declared in a schedule and is checked for the closed sole-to-sole relation.

`contact-schedule.js` defines optional contact intent for a single outgoing
transition. It does not alter existing playback or infer contacts from a pose.
Absence of metadata normalizes and samples to `undefined`.
The integration preserves schedules through storage, loading and card updates.
Before playback, both hold endpoints are measured and compared with declared
requirements; adjacent schedules must agree on their shared hold. During playback,
a missing fully attached contact stops playback and restores the previous valid
frame. This is a validation gate, not a contact-driven motion solver. It does not
move the body to fulfill the schedule or lock a foot's world-space position.

An optional sequence step field `contactSchedule` can contain:

```json
{
  "version": 1,
  "anchors": [
    {"anchor": "right-sole", "start": true, "end": true},
    {"anchor": "left-sole", "start": true, "end": true,
     "release": [0.1, 0.25], "landing": [0.75, 0.9]}
  ]
}
```

`start` and `end` explicitly declare contact required in the outgoing and incoming
holds. A maintained anchor has both true with no timing intervals. Moving an
anchor that contacts at both ends requires both release and landing. A departing
anchor requires release; an arriving anchor requires landing. Both false means
no required contact throughout. Intermediate-only contacts need additional pose
cards; this version deliberately does not infer them.

Times are **linear transition progress** from 0 to 1, independent of playback
speed. Do not pass the existing timeline's eased `mix` as time. Release and landing
must have nonzero duration and cannot overlap. Endpoint values are exact: outgoing
hold/transition start preserves `start`; transition end/incoming hold preserves
`end`. A consumer must also validate these authored endpoint anchors against the
actual poses; this module cannot infer which side satisfies an `any-sole` rule.
`validateContactScheduleEndpoints(schedule, {startAnchors, endAnchors})` checks
exact set equality against explicitly declared concrete hold-anchor lists. It
rejects both omitted and extra requirements. These are declarations of intent;
neither this helper nor the start/end booleans verify geometry success. For two
adjacent schedules, their shared hold declarations must agree before execution.

`normalizeContactSchedule` and `validateContactSchedule` return detached data or
throw on malformed input. Known concrete names are exported as `CONTACT_ANCHORS`.
Unknown fields are rejected so misspelled timing cannot silently become a fixed
contact. `sampleContactSchedule` returns each anchor's phase (`attached`,
`releasing`, `free`, `landing`), weight, and `required` flag. Weight transitions
linearly; only weight 1 means full required contact. It also returns
`requiredAnchors` and `unsupported` (no authored full-contact anchor at this time).
`unsupported` is a visible scheduling diagnostic, not a calculation of balance,
forces, actual geometry, or all possible incidental contact. Partial weights do
not prove physical support and must not hide an airborne interval.

This module stores no world-space target. A future solver must capture or author
surface targets separately, retain them during attached phases, allow movement
after release, and check the landing target. The schedule alone neither locks a
foot in place nor proves a pose collision-free. No automatic schedule is injected
into legacy sequences.
