# Caterpillar: seated palm-supported variant

The legacy pose cleared collisions and grounded both palms, but its sit-bone
proxies floated 425 mm and heels 225 mm. Both hips flexed 143 degrees, beyond
the editor's 130-degree envelope. A diagnostic test asserted this known failure
against the current catalog; it now explicitly uses the legacy pose fixture.

The correction keeps both sit-bones, palms and heels grounded together. Hip
flexion is approximately 91 degrees; lumbar and thoracic flexion share the
forward fold. The knees retain about 9 degrees of bend for rigid-mesh clearance.
The hands use the existing serialized mount offset and the arms clear the thighs.
No collision or joint-range tolerance was relaxed.

`caterpillar-palms-v1` requires the three support regions and checks forward
trunk/leg placement, rounded spine and nearly extended knees. Regression cases
reject the legacy floating pose, lifted seat/heel, reversed palm, lost fold and
excess knee bend. Shared contract tests cover repeated application and JSON
restoration including hand offsets; the catalog test retains its exact palm
plane and rendered-vertex floor-clearance checks.

This validates the requested palm-supported mannequin variant, not every
Caterpillar variation or force/balance behavior. No browser screenshot review
or exhaustive transition coverage is implied.
