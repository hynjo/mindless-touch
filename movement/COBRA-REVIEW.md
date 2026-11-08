# Cobra support review

The former `CobraFull` draft passed clearance and joint-envelope checks while
its front-core proxy floated about 296 mm, palm patches 75–116 mm, and foot-top
proxies 263 mm above the floor. It had neither a pose contract nor a palm repair
strategy. Whole-body floor settling cannot satisfy multiple support anchors.

## Repair

- `cobra-grounded-v1` requires front-core, both palms and both foot tops, plus
  chest elevation, lumbar/thoracic extension, rearward legs and bent elbows.
- The authored correction grounds these regions together. A 25 mm local hand
  mount adjustment accommodates the rigid forearm capsule; bone lengths and
  collision tolerances are unchanged. This offset is serialized with the pose.
- Reviewed poses derive repair selection from their resolved support profile.
  Legacy drafts keep their existing strategy pending individual review.
- Already-valid supports skip IK. This prevents a demonstrated Crow regression
  when introducing profile-driven palm repair. Post-repair validation still
  rejects support, form, joint-range and collision failures transactionally.

## Regression coverage

`node --test movement/tests/pose-contracts.test.js` checks the original draft's
failure, raised pelvis, reversed palm, wrong ankle orientation, lost backbend,
repeated application, and JSON-restored support/form/range checks. The shared
round-trip fixture now includes hand mount offsets instead of silently dropping
them. The all-library suite checks floor and body clearance, including related
prone poses; existing example playback tests exercise the shared application path.

The tests use the same application function as shared pose URLs and the library.
They are not browser screenshot tests or exhaustive transition certification.
Front-core and foot-top contacts remain geometric proxies, not force, friction,
soft-tissue or full anatomical models. Generic draft poses still need review.
