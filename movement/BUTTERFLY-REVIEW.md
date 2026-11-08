# Butterfly: grounded forward fold

The legacy draft floated both sit-bones 203 mm and separated heel/forefoot
sole-pair patches by approximately 766/949 mm. Hip flexion measured 148.5
degrees. Its support profile only required sitting contact, so the missing
sole-to-sole relation was not a declared failure.

The correction starts from Bound Angle's validated lower-body geometry and
authors a separate lumbar/thoracic forward fold and arm placement. Both palms
rest on the floor, both sit-bones remain grounded, and opposing sole patches
remain together. Knees stay raised; knee-floor contact is not required. The
serialized hand mount offset accommodates the rigid forearm geometry.

`butterfly-forward-fold-v1` checks sit-bones, sole-pair and palms together,
with trunk direction, spinal flexion, outward knees and bent knees. Existing
collision and joint-envelope limits remain unchanged.

Regression tests reject the legacy pose, lifted pelvis, separated/reversed foot,
reversed palm, absent forward fold and excessive hip flexion. Shared contract
tests cover repeated application and JSON restoration with hand offsets. A
Butterfly -> Bound Angle -> Butterfly check verifies independent upper-body
definitions and shared contact invariants. Full-catalog tests retain clearance
and body-collision coverage. These are mannequin checks, not force simulation
or exhaustive transition/visual certification.
