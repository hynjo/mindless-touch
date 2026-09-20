# Pose contracts

`apply-pose.js` is the shared application path for the editor, library thumbnails,
catalog collision regression and pose audit. Authored angles are degrees; saved
angles are radians. Saved poses restore exactly, without applying corrective IK.

The reviewed set covers Standing Forward Bend (hands free), Bound Angle (raised
knees), Crow (bent arms), Archer (forward leaning), Tabletop, Cat, Cow, Plank,
Low Push-up, Downward-Facing Dog and Corpse. Contract IDs survive sequence
capture and JSON round trips. Unknown IDs fail file validation. Legacy files
without IDs remain compatible but do not acquire a verified identity from a name.
Ashtanga shapes that override the catalog geometry do not inherit its contract.

Mandatory supports are combined with optional additional support requirements;
clearing an editable requirements array cannot remove the contract requirements.
Automatic placement checks supports, editor ranges, form, floor clearance, body
contacts and wrist limits together. It preserves each previously passing contact,
including passing alternative branches, and restores authored geometry and the
floor safe-state cache on failure. Support projection also checks pose form.

Playback preflight checks contracted holds, even without a contact schedule.
Grip/clearance relations are not interpreted as floor anchors that must remain
attached during a release transition. Existing transition collision checks remain.

Archer's upright identity requires a world-space trunk direction independently of
toe-to-ear distance. The current forward-leaning variant intentionally does not
pass that identity. These are editorial mannequin checks, not complete anatomical
or balance certification. Full shoulder mechanics, force balance and all intermediate
transition identities are not covered. Untargeted catalog drafts remain unverified.

Quadruped placement uses the actual shin-capsule knee radius, keeps wrists at a
stable ground anchor during Cat–Cow playback, and keeps the articulated feet clear
without exceeding the ankle envelope. Plank-family placement prevents numerical
elbow hyperextension; authored Plank and Low Push-up ankles no longer compensate
past their range. Corpse requires simultaneous pelvis, back, back-of-head and heel
contact.

Seated catalog poses use a bilateral `sit-bones` requirement: two approximate
ischial landmarks on the rigid pelvis must independently touch the floor and the
pelvis underside must face down. This remains distinct from the broad `seat`
pelvis contact used by supine poses and legacy or explicit sequence variants.
Bound Angle and Archer use the bilateral requirement in their versioned contracts.

Regression coverage: shared application, exact saved-pose restore, mandatory
requirements, unknown IDs, upright-vs-modified distinction, failed correction
rollback, hold preflight, and existing grip/contact/range suites. Run `npm test`
and `npm run build`. The pose audit uses the shared application path.
