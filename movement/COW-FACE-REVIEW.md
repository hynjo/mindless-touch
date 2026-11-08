# Cow Face: explicit unbound preparation

## October 18 adjustment

The preparation's wrists were 339.9 mm apart. The updated arm arrangement brings
them to 281.9 mm, with both hand axes pointing toward the opposite hand behind the
back (direction dot products 0.934 and 0.833). The upper elbow remains above its
shoulder and the lower elbow below. The authored pelvis, spine, legs, bone lengths
and hand mounts are unchanged. Both sit-bone supports, measured joint ranges,
wrist limits, floor clearance, and body/internal/external-hand collision checks
pass. This is still an unbound preparation with unstacked knees.

The arm angles use an 80% quaternion interpolation toward the historical seed-73
arm candidate, while retaining open fingers. The historical candidate is not
promoted to a verified grip. The resulting static catalog pose is independently
checked; this adjustment does not certify an entry animation or shoulder anatomy.

Regression checks now reject wrists more than 300 mm apart and hands pointing
away from one another. These are editorial criteria for this mannequin variant,
not general human joint limits. Tests retain the former arm arrangement as a
negative example and verify cross-hand/core clearance and serialized restoration.
Browser visual assessment is now complete; see the findings below. Passing the
current preparation contract is not evidence that its lower-body shape is a
satisfactory Cow Face preparation.

## Browser findings, October 18

Inspected the actual `/movement/poses/knee-pile-bind` page in Chrome at 1440 ×
1100 from the front, side and back. No runtime exception was recorded. The back
view confirms the opposing arm reaches and remaining hand gap. The front and
side views reveal the unresolved defect: both knees rise in front of the torso
and the feet spread forward/outward rather than forming the intended seated
folded-leg arrangement. This is authored geometry, not a camera or CSS defect.

The existing contract checks knee flexion, grounded sit-bones and arm placement,
but does not constrain knee height/order or foot placement. Consequently, its
passing result overstated visual fidelity. The arm-only adjustment above did
not fix this lower-body problem.

`scripts/review-cow-face-legs.mjs` now provides a deterministic, offline candidate
search with fixed bone lengths. It checks leg ranges, body collisions, floor
clearance, folded knees, sit-bone support, wrist limits and external hand
collisions. A candidate must also place both ankles behind their corresponding
knees and within 200 mm forward of the pelvis. These are candidate-search
criteria, not new universal anatomy limits. An earlier version accepted an
asymmetric squat on physical checks alone; that false acceptance is now rejected.

The final run (seed 739, 10 restarts × 2,500 proposals) found no accepted result.
Its best weighted candidate still put the ankles 381 and 274 mm forward of the
pelvis and had 0.068 mm of thigh overlap. Earlier, more tightly stacked candidates
also exceeded the current hip axial envelope. This does not establish that a
valid pose is impossible: the search fixes the pelvis and uses simplified rigid
limbs, and its objective can settle in local minima. No candidate was promoted
to the catalog, and no collision or range tolerance was loosened.

The remaining correction needs a pose-specific leg target/solver that jointly
handles knee order, foot placement and seated support, followed by the same
three browser views. Its form contract should reject the current raised-knee
arrangement as a negative fixture once a valid replacement is available. Actual
hand binding remains a separate, unverified requirement. **The visual lower-body
defect remains unresolved; this browser review is not a completed pose fix.**

The former KneePileBind draft floated both sit-bones about 310 mm, placed knees
163 mm apart at the same height, and separated wrists by 622 mm. The lower
hand reached in front of the torso. Clearance alone did not certify the pose.

## Implemented scope

The stable `/movement/poses/knee-pile-bind` route now opens **Cow Face
(Preparation)**. It remains a draft and explicitly states **Unstacked knees ·
Hands apart**. Both sit-bone proxies are within the unchanged 5 mm tolerance,
both knees are folded, the trunk is upright, and one arm reaches from above
while the other reaches from below behind the back. The authored model passes
the existing floor, body collision and measured joint-range checks.

This is not a completed Cow Face bind. Attempts to combine stacked folded knees,
grounded pelvis and hand connection did not produce a verified solution in
this work. Some wrist orientations that made fingertips meet exceeded the
wrist envelope. This is a limitation of the tested candidates, not proof of
anatomical impossibility or proof that the rig cannot represent the full pose.
No collision/range thresholds or bone lengths were relaxed.

## Regression boundary

`cow-face-preparation-v1` validates this limited preparation. Tests require its
draft/preparation labeling and unchanged URL, reject the original floating
pose, frontward hands, lifted pelvis, unfolded knees and lost upright posture.
Shared tests cover repeated application and serialized restoration. The full
catalog checks floor clearance and body collisions.

Completing the bind needs a separate contract: side-specific stacked-knee
geometry, a real inter-hand contact/grip model (not just wrist proximity),
finger/palm collision checks across both hands, and shoulder coupling review.
The present self-collision model covers internal fingers but is not a general
cross-hand grip certification system. This preparation must not be relabeled
as a full bind simply because those missing checks are absent.
