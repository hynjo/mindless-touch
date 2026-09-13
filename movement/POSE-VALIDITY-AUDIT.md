# Pose support and joint-range audit

Generated: 2026-09-13T02:38:55.313Z

167 static poses: 146 with missing/misaligned support proxies, 65 requiring joint-range review, 0 with detected body overlap. 155 have at least one finding; 12 pass the implemented checks. **No pose is certified against the entire human range of motion or load-bearing balance.**

## Method and limits

- ROM checks use the existing mannequin/editor envelopes. Exceeding them requests review; it does not establish that a human pose is impossible. CDC ROM means are not universal hard limits.
- Pelvis root orientation is excluded from joint limits. Shoulder elevation is recorded, but scapula/clavicle motion, coupled shoulder limits, forearm pronation/supination limits and flexion-dependent knee rotation need a richer rig.
- Finger and toe hinges, foot arches, neck, spine, elbows, knees, wrists, hips and ankles are inspected. Spine segments aggregate multiple vertebrae; tendon lengths, ligament tension, soft tissue, individual flexibility and coupled joint limits are absent.
- Floor tests compare the named variant with geometric support proxies at 5 mm tolerance. Palms and forearms require multiple contact patches. Foot soles require heel and forefoot pads; the arch is excluded. Sit bones, patellae, shoulder blades and chin are not separate meshes.
- Body-on-body supports, hand-to-foot binds, friction, muscle forces, mass distribution and center-of-pressure balance are not solved. No props are modeled. A scoped pass is not full support, balance or anatomical certification.
- This audit covers all 167 static library poses after editor floor corrections, not arbitrary saved sequences or every transition. Source alternatives and the user-selected hand support variants are called out in the support profiles.

Support profiles independently summarize [Pocket Yoga's variants](https://www.pocketyoga.com/poses.json), checked on 2026-09-12. [CDC ROM context](https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html) and its [measurement protocol](https://stacks.cdc.gov/view/cdc/153156/cdc_153156_DS1.pdf) explain why population means are not universal model limits.

## All poses

| Pose | Support findings | Joint-range review | Result |
| --- | --- | --- | --- |
| [Archer's](https://www.pocketyoga.com/pose/Archer) | seat | leftHip projected flexion: 136.15° [-45…130°] | Review findings |
| [Banana](https://www.pocketyoga.com/pose/Banana) | None detected | None detected | Scoped pass; full review remains |
| [Big Toe](https://www.pocketyoga.com/pose/ForwardBendBigToe) | soles | leftHip projected flexion: 145° [-45…130°]; rightHip projected flexion: 145° [-45…130°] | Review findings |
| [Bird of Paradise](https://www.pocketyoga.com/pose/ChairTwistBindUp) | any-sole | None detected | Review findings |
| [Boat](https://www.pocketyoga.com/pose/BoatFull) | None detected | None detected | Scoped pass; full review remains |
| [Bound Angle](https://www.pocketyoga.com/pose/BoundAngle) | seat | None detected | Review findings |
| [Bow](https://www.pocketyoga.com/pose/Bow) | None detected | None detected | Scoped pass; full review remains |
| [Bridge](https://www.pocketyoga.com/pose/Bridge) | heels, back | None detected | Review findings |
| [Butterfly](https://www.pocketyoga.com/pose/Butterfly) | seat | leftHip projected flexion: 148.53° [-45…130°]; rightHip projected flexion: 148.53° [-45…130°] | Review findings |
| [Camel](https://www.pocketyoga.com/pose/Camel) | None detected | leftAnkle point/flex: 53.4° [-40…50°]; rightAnkle point/flex: 53.4° [-40…50°] | Review findings |
| [Cat](https://www.pocketyoga.com/pose/Cat) | palms, knees | None detected | Review findings |
| [Caterpillar](https://www.pocketyoga.com/pose/Caterpillar) | seat | leftHip projected flexion: 143° [-45…130°]; rightHip projected flexion: 143° [-45…130°] | Review findings |
| [Chair](https://www.pocketyoga.com/pose/Chair) | soles | None detected | Review findings |
| [Child's](https://www.pocketyoga.com/pose/ChildTraditional) | shins, head | None detected | Review findings |
| [Chin Stand](https://www.pocketyoga.com/pose/ChinStand) | front-chest, palms | None detected | Review findings |
| [Cobra](https://www.pocketyoga.com/pose/CobraFull) | front-core, palms, foot-tops | None detected | Review findings |
| [Corpse](https://www.pocketyoga.com/pose/Corpse) | back-head, heels | None detected | Review findings |
| [Cow](https://www.pocketyoga.com/pose/Dog) | palms, knees | None detected | Review findings |
| [Cow Face](https://www.pocketyoga.com/pose/KneePileBind) | seat | None detected | Review findings |
| [Crane](https://www.pocketyoga.com/pose/Crane) | palms | None detected | Review findings |
| [Crescent Lunge](https://www.pocketyoga.com/pose/LungeCrescent) | soles | None detected | Review findings |
| [Crescent Lunge on the Knee](https://www.pocketyoga.com/pose/WarriorIKneeling) | any-sole, any-knee | None detected | Review findings |
| [Crescent Moon](https://www.pocketyoga.com/pose/CrescentMoon) | soles | None detected | Review findings |
| [Crooked Monkey](https://www.pocketyoga.com/pose/CrookedMonkey) | any-palm, any-knee, any-sole | None detected | Review findings |
| [Crow](https://www.pocketyoga.com/pose/Crow) | palms | None detected | Review findings |
| [Deaf Man's](https://www.pocketyoga.com/pose/DeafMan) | back, toes | leftHip projected flexion: 135° [-45…130°]; rightHip projected flexion: 135° [-45…130°] | Review findings |
| [Dolphin](https://www.pocketyoga.com/pose/Dolphin) | None detected | None detected | Scoped pass; full review remains |
| [Downward-Facing Dog](https://www.pocketyoga.com/pose/DownwardDog) | forefeet | leftElbow hinge flexion: -3.1° [0…150°]; rightElbow hinge flexion: -3.1° [0…150°] | Review findings |
| [Eagle](https://www.pocketyoga.com/pose/Eagle) | any-sole | None detected | Review findings |
| [Easy](https://www.pocketyoga.com/pose/Easy) | seat | None detected | Review findings |
| [Eight Angle](https://www.pocketyoga.com/pose/EightAngle) | palms | leftHip projected flexion: 137.96° [-45…130°]; leftHip axial twist proxy: -82.1° [-60…60°]; rightHip projected flexion: 144.01° [-45…130°] | Review findings |
| [Eight Point](https://www.pocketyoga.com/pose/EightPoint) | palms, knees, front-chest, toes, head | None detected | Review findings |
| [Elbow Balance](https://www.pocketyoga.com/pose/RelaxedStance) | elbows | None detected | Review findings |
| [Elephant Trunk](https://www.pocketyoga.com/pose/ElephantTrunk) | palms | leftHip projected flexion: 169.23° [-45…130°] | Review findings |
| [Embryo](https://www.pocketyoga.com/pose/Embryo) | back | leftHip projected flexion: 154.5° [-45…130°]; rightHip projected flexion: 154.5° [-45…130°] | Review findings |
| [Embryo in Womb](https://www.pocketyoga.com/pose/EmbryoWomb) | None detected | leftHip projected flexion: 149.5° [-45…130°]; rightHip projected flexion: 149.5° [-45…130°] | Review findings |
| [Extended Puppy](https://www.pocketyoga.com/pose/PuppyExtended) | shins, palms, head-or-chest | None detected | Review findings |
| [Extended Side Angle](https://www.pocketyoga.com/pose/WarriorIIForwardArmForward) | soles | None detected | Review findings |
| [Extended Standing Hand to Big Toe](https://www.pocketyoga.com/pose/StandingHandToToeExtended) | any-sole | leftHip axial twist proxy: -76.18° [-60…60°] | Review findings |
| [Extended Supine Hand to Big Toe](https://www.pocketyoga.com/pose/SupineHandToToeExtended) | None detected | None detected | Scoped pass; full review remains |
| [Fire Log](https://www.pocketyoga.com/pose/FireLog) | seat | None detected | Review findings |
| [Firefly I](https://www.pocketyoga.com/pose/Firefly) | palms | None detected | Review findings |
| [Firefly II](https://www.pocketyoga.com/pose/TortoiseBind) | soles | leftHip projected flexion: 145° [-45…130°]; leftHip axial twist proxy: 70.22° [-60…60°]; rightHip projected flexion: 145° [-45…130°]; rightHip axial twist proxy: -70.22° [-60…60°] | Review findings |
| [Firefly III](https://www.pocketyoga.com/pose/TortoiseBindII) | soles | leftHip projected flexion: 155° [-45…130°]; rightHip projected flexion: 155° [-45…130°] | Review findings |
| [Fish](https://www.pocketyoga.com/pose/FishPreparation) | seat | None detected | Review findings |
| [Floating Stick](https://www.pocketyoga.com/pose/FloatingStick) | palms | None detected | Review findings |
| [Flying Lizard](https://www.pocketyoga.com/pose/FlyingLizard) | palms | None detected | Review findings |
| [Flying Man](https://www.pocketyoga.com/pose/LungeHandsOnMatFlying) | palms | None detected | Review findings |
| [Flying Pigeon](https://www.pocketyoga.com/pose/PigeonFlying) | palms | None detected | Review findings |
| [Forearm Balance](https://www.pocketyoga.com/pose/FeatheredPeacock) | forearms, palms | None detected | Review findings |
| [Frog](https://www.pocketyoga.com/pose/FrogTraditional) | front-core | None detected | Review findings |
| [Front Splits](https://www.pocketyoga.com/pose/SplitsFront) | seat | rightHip projected flexion: -90° [-45…130°] | Review findings |
| [Garland](https://www.pocketyoga.com/pose/GarlandSideways) | None detected | None detected | Scoped pass; full review remains |
| [Gate](https://www.pocketyoga.com/pose/Gate) | any-knee, any-sole | rightHip projected abduction/adduction: -80° [-70…70°] | Review findings |
| [Goddess](https://www.pocketyoga.com/pose/Goddess) | soles | None detected | Review findings |
| [Gorilla](https://www.pocketyoga.com/pose/Gorilla) | soles | leftHip projected flexion: 145° [-45…130°]; rightHip projected flexion: 145° [-45…130°] | Review findings |
| [Grasshopper](https://www.pocketyoga.com/pose/Grasshopper) | palms | None detected | Review findings |
| [Half Bow](https://www.pocketyoga.com/pose/ProneBowHalf) | front-core | None detected | Review findings |
| [Half Moon](https://www.pocketyoga.com/pose/HalfMoon) | any-sole, any-hand | rightHip projected flexion: -143.11° [-45…130°] | Review findings |
| [Half Pigeon](https://www.pocketyoga.com/pose/PigeonHalf) | knees, any-foot-top | rightHip projected flexion: -80° [-45…130°] | Review findings |
| [Handstand](https://www.pocketyoga.com/pose/Handstand) | palms | None detected | Review findings |
| [Happy Baby](https://www.pocketyoga.com/pose/BlissfulBaby) | None detected | leftHip projected flexion: 144.3° [-45…130°]; rightHip projected flexion: 144.3° [-45…130°] | Review findings |
| [Head to Knee I](https://www.pocketyoga.com/pose/HeadToKnee) | seat | leftHip projected flexion: 155° [-45…130°]; rightHip projected flexion: 167.21° [-45…130°] | Review findings |
| [Head to Knee II](https://www.pocketyoga.com/pose/HeadToKneeII) | any-heel, any-back-leg | leftHip projected flexion: 155° [-45…130°]; rightHip projected flexion: 164.84° [-45…130°] | Review findings |
| [Head to Knee III](https://www.pocketyoga.com/pose/HeadToKneeIII) | seat, any-forefoot | leftHip projected flexion: 155° [-45…130°]; rightHip projected flexion: 170.94° [-45…130°] | Review findings |
| [Hero](https://www.pocketyoga.com/pose/Hero) | seat, shins | None detected | Review findings |
| [Heron](https://www.pocketyoga.com/pose/Heron) | seat | leftHip projected flexion: 140° [-45…130°] | Review findings |
| [Himalayan Duck](https://www.pocketyoga.com/pose/Duck) | forearms, palms | None detected | Review findings |
| [Horse](https://www.pocketyoga.com/pose/Horse) | any-knee, any-sole | None detected | Review findings |
| [Humble Flamingo](https://www.pocketyoga.com/pose/FlamingoHumble) | fingertips | leftHip projected flexion: 145° [-45…130°] | Review findings |
| [Inverted Staff](https://www.pocketyoga.com/pose/StaffInverted) | forearms, soles | None detected | Review findings |
| [Little Thunderbolt](https://www.pocketyoga.com/pose/LittleThunderbolt) | forearms, shins | None detected | Review findings |
| [Lizard](https://www.pocketyoga.com/pose/Lizard) | any-sole, any-toe | leftHip projected flexion: 160.11° [-45…130°]; leftHip projected abduction/adduction: 75.5° [-70…70°]; leftHip axial twist proxy: -149.96° [-60…60°]; leftAnkle side tilt: 60.48° [-25…25°] | Review findings |
| [Locust I](https://www.pocketyoga.com/pose/Locust) | None detected | None detected | Scoped pass; full review remains |
| [Locust II](https://www.pocketyoga.com/pose/LocustII) | front-core | None detected | Review findings |
| [Locust III](https://www.pocketyoga.com/pose/LocustIII) | None detected | None detected | Scoped pass; full review remains |
| [Lord of the Fishes](https://www.pocketyoga.com/pose/LordOfTheFishes) | seat | None detected | Review findings |
| [Lotus](https://www.pocketyoga.com/pose/LotusFull) | seat | None detected | Review findings |
| [Low Push-up](https://www.pocketyoga.com/pose/FourLimbedStaff) | None detected | leftAnkle point/flex: -70.32° [-40…50°]; rightAnkle point/flex: -70.32° [-40…50°] | Review findings |
| [Lunge](https://www.pocketyoga.com/pose/Lunge) | any-sole | leftHip projected flexion: 161.06° [-45…130°]; leftKnee off-hinge direction: 6.78° [-5…5°]; rightKnee hinge flexion: -2.47° [0…150°] | Review findings |
| [Moon Bird](https://www.pocketyoga.com/pose/FootBehindHeadElevated) | palms | leftHip projected flexion: 169.23° [-45…130°]; rightHip projected flexion: 135° [-45…130°] | Review findings |
| [Mountain](https://www.pocketyoga.com/pose/MountainArmsSide) | soles | None detected | Review findings |
| [Noose](https://www.pocketyoga.com/pose/SeatedOnHeelsTwistBound) | None detected | None detected | Scoped pass; full review remains |
| [One Leg Behind the Head I](https://www.pocketyoga.com/pose/FootBehindHead) | seat | leftHip projected flexion: -167.37° [-45…130°]; leftHip axial twist proxy: -170.53° [-60…60°] | Review findings |
| [One Leg Behind the Head II](https://www.pocketyoga.com/pose/FootBehindHeadForward) | seat | leftHip projected flexion: -157.6° [-45…130°]; leftHip axial twist proxy: -132.81° [-60…60°]; rightHip projected flexion: 155° [-45…130°] | Review findings |
| [Peacock](https://www.pocketyoga.com/pose/Peacock) | palms | None detected | Review findings |
| [Pendant](https://www.pocketyoga.com/pose/Pendant) | palms | None detected | Review findings |
| [Pigeon](https://www.pocketyoga.com/pose/Pigeon) | forearms, shins | None detected | Review findings |
| [Plank](https://www.pocketyoga.com/pose/Plank) | None detected | leftAnkle point/flex: -57.56° [-40…50°]; rightAnkle point/flex: -57.56° [-40…50°] | Review findings |
| [Plow](https://www.pocketyoga.com/pose/Plow) | back, toes | None detected | Review findings |
| [Pyramid](https://www.pocketyoga.com/pose/PyramidPrayer) | soles | None detected | Review findings |
| [Rabbit](https://www.pocketyoga.com/pose/Rabbit) | knees | leftHip projected flexion: 138° [-45…130°]; rightHip projected flexion: 138° [-45…130°] | Review findings |
| [Reverse Corpse](https://www.pocketyoga.com/pose/CorpseFrontArmsForward) | front-core, front-chest | None detected | Review findings |
| [Revolved Bird of Paradise](https://www.pocketyoga.com/pose/BirdOfParadiseRevolved) | any-sole | leftHip axial twist proxy: -76.18° [-60…60°] | Review findings |
| [Revolved Flying Man](https://www.pocketyoga.com/pose/FlyingManRevolved) | palms | None detected | Review findings |
| [Revolved Half Moon](https://www.pocketyoga.com/pose/HalfMoonRevolved) | any-sole, any-hand | None detected | Review findings |
| [Revolved Seated Hand to Big Toe](https://www.pocketyoga.com/pose/SeatedHandToToeRevolved) | seat | leftHip projected flexion: 145.79° [-45…130°] | Review findings |
| [Revolved Standing Hand to Big Toe](https://www.pocketyoga.com/pose/StandingHandToToeRevolved) | any-sole | None detected | Review findings |
| [Revolved Triangle](https://www.pocketyoga.com/pose/TriangleRevolved) | soles | None detected | Review findings |
| [Rock the Baby](https://www.pocketyoga.com/pose/Cradle) | seat | None detected | Review findings |
| [Rooster](https://www.pocketyoga.com/pose/Rooster) | palms | None detected | Review findings |
| [Sage Bharadvaja's Twist](https://www.pocketyoga.com/pose/Bharadvaja) | seat, any-palm | None detected | Review findings |
| [Sage Gheranda's](https://www.pocketyoga.com/pose/GherandaI) | None detected | rightHip projected flexion: -60° [-45…130°] | Review findings |
| [Sage Marichi's I](https://www.pocketyoga.com/pose/MarichiITraditional) | seat | leftHip projected flexion: 155° [-45…130°]; rightHip projected flexion: 155° [-45…130°] | Review findings |
| [Sage Marichi's II](https://www.pocketyoga.com/pose/MarichiIITraditional) | seat | leftHip projected flexion: 140° [-45…130°] | Review findings |
| [Sage Marichi's III](https://www.pocketyoga.com/pose/MarichiIIITraditional) | seat | None detected | Review findings |
| [Sage Marichi's IV](https://www.pocketyoga.com/pose/MarichiIVTraditional) | seat | None detected | Review findings |
| [Sage Visvamitra's](https://www.pocketyoga.com/pose/VisvamitraFull) | any-palm | None detected | Review findings |
| [Scale](https://www.pocketyoga.com/pose/LotusElevated) | palms | None detected | Review findings |
| [Scorpion](https://www.pocketyoga.com/pose/Scorpion) | forearms, palms | None detected | Review findings |
| [Seated Forward Bend I](https://www.pocketyoga.com/pose/SeatedForwardBend) | seat | leftHip projected flexion: 155° [-45…130°]; rightHip projected flexion: 155° [-45…130°] | Review findings |
| [Seated Forward Bend II](https://www.pocketyoga.com/pose/SeatedForwardBendII) | seat | leftHip projected flexion: 155° [-45…130°]; rightHip projected flexion: 155° [-45…130°] | Review findings |
| [Seated Forward Bend III](https://www.pocketyoga.com/pose/SeatedForwardBendIII) | seat | leftHip projected flexion: 155° [-45…130°]; rightHip projected flexion: 155° [-45…130°] | Review findings |
| [Seated Forward Bend IV](https://www.pocketyoga.com/pose/SeatedForwardBendIV) | seat | leftHip projected flexion: 151.3° [-45…130°]; rightHip projected flexion: 151.3° [-45…130°] | Review findings |
| [Seated Gate](https://www.pocketyoga.com/pose/SeatedGate) | seat | None detected | Review findings |
| [Seated Half Bound Lotus Forward Bend](https://www.pocketyoga.com/pose/SeatedForwardBendHalfLotus) | seat | leftHip projected flexion: 155° [-45…130°] | Review findings |
| [Seated Three Limbed Forward Bend](https://www.pocketyoga.com/pose/SeatedForwardBendThreeLimbs) | seat | leftHip projected flexion: 155° [-45…130°] | Review findings |
| [Shiva Squat](https://www.pocketyoga.com/pose/ShivaSquat) | any-sole | None detected | Review findings |
| [Shoelace](https://www.pocketyoga.com/pose/KneePile) | seat | None detected | Review findings |
| [Shoulder Pressing](https://www.pocketyoga.com/pose/ScaleForward) | palms | leftHip projected flexion: 149.53° [-45…130°]; leftHip axial twist proxy: 68.1° [-60…60°]; rightHip projected flexion: 149.53° [-45…130°]; rightHip axial twist proxy: -68.1° [-60…60°] | Review findings |
| [Shoulder Stand with Lotus Legs](https://www.pocketyoga.com/pose/ShoulderstandLotus) | back | None detected | Review findings |
| [Side Lunge](https://www.pocketyoga.com/pose/SideLunge) | any-sole, any-heel | rightHip projected abduction/adduction: -75° [-70…70°] | Review findings |
| [Side Plank](https://www.pocketyoga.com/pose/PlankSide) | any-palm, any-foot-edge | None detected | Review findings |
| [Sleeping Yogi](https://www.pocketyoga.com/pose/YogicSleep) | seat, back | leftHip projected flexion: 173.53° [-45…130°]; leftHip axial twist proxy: 84.7° [-60…60°]; rightHip projected flexion: 173.53° [-45…130°]; rightHip axial twist proxy: -84.7° [-60…60°] | Review findings |
| [Snake](https://www.pocketyoga.com/pose/Snake) | front-core | None detected | Review findings |
| [Sphinx](https://www.pocketyoga.com/pose/Sphinx) | palms, front-core | None detected | Review findings |
| [Staff](https://www.pocketyoga.com/pose/Staff) | seat, palms, heels | None detected | Review findings |
| [Standing Bow](https://www.pocketyoga.com/pose/LordOfTheDance) | any-sole | rightHip projected flexion: -55° [-45…130°] | Review findings |
| [Standing Foot to Head](https://www.pocketyoga.com/pose/TrivikramaI) | any-sole | leftHip projected flexion: 160.3° [-45…130°] | Review findings |
| [Standing Forward Bend](https://www.pocketyoga.com/pose/ForwardBend) | soles | leftHip projected flexion: 155.87° [-45…130°]; rightHip projected flexion: 155.87° [-45…130°] | Review findings |
| [Standing Half Bound Lotus Forward Bend](https://www.pocketyoga.com/pose/StandingForwardBendHalfLotus) | any-sole | leftHip projected flexion: 145° [-45…130°] | Review findings |
| [Standing Hand to Big Toe](https://www.pocketyoga.com/pose/StandingHandToToeFull) | any-sole | None detected | Review findings |
| [Standing Leg Behind the Head](https://www.pocketyoga.com/pose/StandingFootBehindHead) | any-sole | leftHip projected flexion: -167.37° [-45…130°]; leftHip axial twist proxy: -170.53° [-60…60°] | Review findings |
| [Standing Leg Behind the Head Forward Bend](https://www.pocketyoga.com/pose/StandingForwardBendFootBehindHead) | any-sole | leftHip projected flexion: -153.77° [-45…130°]; leftHip axial twist proxy: -129° [-60…60°]; rightHip projected flexion: 145° [-45…130°] | Review findings |
| [Standing Splits](https://www.pocketyoga.com/pose/SplitsStanding) | any-sole, any-hand | rightHip projected flexion: -80° [-45…130°] | Review findings |
| [Star](https://www.pocketyoga.com/pose/Star) | soles | None detected | Review findings |
| [Supine Angle](https://www.pocketyoga.com/pose/SupineAngle) | back, toes | None detected | Review findings |
| [Supine Foot to Head](https://www.pocketyoga.com/pose/SupineTrivikrama) | None detected | leftHip projected flexion: 160.3° [-45…130°] | Review findings |
| [Supine Hand to Big Toe](https://www.pocketyoga.com/pose/SupineHandToToeFull) | None detected | None detected | Scoped pass; full review remains |
| [Supine Spinal Twist](https://www.pocketyoga.com/pose/SupineSpinalTwist) | seat, back | waist local y: 45° [-40…40°] | Review findings |
| [Supine Straddle](https://www.pocketyoga.com/pose/SupineStraddle) | None detected | leftHip axial twist proxy: 65° [-60…60°]; rightHip axial twist proxy: -65° [-60…60°] | Review findings |
| [Supported Headstand](https://www.pocketyoga.com/pose/HeadstandSupported) | forearms | None detected | Review findings |
| [Supported Shoulder Stand](https://www.pocketyoga.com/pose/ShoulderstandSupported) | back | None detected | Review findings |
| [Tabletop](https://www.pocketyoga.com/pose/BoxNeutral) | palms, knees | None detected | Review findings |
| [Thunderbolt](https://www.pocketyoga.com/pose/Thunderbolt) | shins, foot-tops | None detected | Review findings |
| [Tiger](https://www.pocketyoga.com/pose/Tiger) | palms, any-knee | None detected | Review findings |
| [Toe Stand](https://www.pocketyoga.com/pose/ToeStand) | any-forefoot | None detected | Review findings |
| [Tortoise](https://www.pocketyoga.com/pose/SupineTortoise) | seat | leftHip projected flexion: 145° [-45…130°]; leftHip axial twist proxy: 105.44° [-60…60°]; rightHip projected flexion: 145° [-45…130°]; rightHip axial twist proxy: -105.44° [-60…60°] | Review findings |
| [Tree](https://www.pocketyoga.com/pose/TreePrayer) | any-sole | None detected | Review findings |
| [Triangle](https://www.pocketyoga.com/pose/TriangleForward) | soles | None detected | Review findings |
| [Tripod Headstand](https://www.pocketyoga.com/pose/HeadstandTripod) | palms, head | None detected | Review findings |
| [Two Legs Behind the Head I](https://www.pocketyoga.com/pose/FootBehindHeadTwoLegged) | None detected | leftHip projected flexion: -167.05° [-45…130°]; leftHip axial twist proxy: -171.64° [-60…60°]; rightHip projected flexion: -167.05° [-45…130°]; rightHip axial twist proxy: 171.64° [-60…60°] | Review findings |
| [Two Legs Behind the Head II](https://www.pocketyoga.com/pose/FootBehindHeadTwoLeggedElevated) | palms | leftHip projected flexion: 163.73° [-45…130°]; rightHip projected flexion: 163.73° [-45…130°] | Review findings |
| [Upward Plank](https://www.pocketyoga.com/pose/PlankUpward) | palms, soles | None detected | Review findings |
| [Upward-Facing Dog](https://www.pocketyoga.com/pose/UpwardDog) | foot-tops | None detected | Review findings |
| [Warrior I](https://www.pocketyoga.com/pose/WarriorI) | soles | None detected | Review findings |
| [Warrior II](https://www.pocketyoga.com/pose/WarriorII) | soles | None detected | Review findings |
| [Warrior III](https://www.pocketyoga.com/pose/WarriorIII) | any-sole | None detected | Review findings |
| [Waterfall](https://www.pocketyoga.com/pose/CorpseDoubleLegRaise) | None detected | None detected | Scoped pass; full review remains |
| [Wheel](https://www.pocketyoga.com/pose/Wheel) | palms, soles | None detected | Review findings |
| [Wide Legged Forward Bend I](https://www.pocketyoga.com/pose/WideLeggedForwardBendI) | soles | leftHip projected flexion: 145° [-45…130°]; leftHip axial twist proxy: 98.2° [-60…60°]; rightHip projected flexion: 145° [-45…130°]; rightHip axial twist proxy: -98.2° [-60…60°] | Review findings |
| [Wide Legged Forward Bend II](https://www.pocketyoga.com/pose/WideLeggedForwardBendII) | soles | leftHip projected flexion: 145° [-45…130°]; leftHip axial twist proxy: 98.2° [-60…60°]; rightHip projected flexion: 145° [-45…130°]; rightHip axial twist proxy: -98.2° [-60…60°] | Review findings |
| [Wide Legged Forward Bend III](https://www.pocketyoga.com/pose/WideLeggedForwardBendIII) | soles | leftHip projected flexion: 145° [-45…130°]; leftHip axial twist proxy: 98.2° [-60…60°]; rightHip projected flexion: 145° [-45…130°]; rightHip axial twist proxy: -98.2° [-60…60°] | Review findings |
| [Wide Legged Forward Bend IV](https://www.pocketyoga.com/pose/WideLeggedForwardBendIV) | soles | leftHip projected flexion: 145° [-45…130°]; leftHip axial twist proxy: 98.2° [-60…60°]; rightHip projected flexion: 145° [-45…130°]; rightHip axial twist proxy: -98.2° [-60…60°] | Review findings |
| [Wide Splits](https://www.pocketyoga.com/pose/SplitsWide) | palms | leftHip projected abduction/adduction: 90° [-70…70°]; rightHip projected abduction/adduction: -90° [-70…70°] | Review findings |
| [Wild Thing](https://www.pocketyoga.com/pose/WildThing) | any-palm | None detected | Review findings |
| [Wind Removing](https://www.pocketyoga.com/pose/Turtle) | None detected | None detected | Scoped pass; full review remains |

## Repair priorities

Shared foot contact geometry; multiple-anchor support solving; mismatched named poses; calibrated joint constraints and per-pose retesting. Floor clearance and constant anchor positions alone do not establish correct load-bearing support.

## Reproduce

Run `node movement/scripts/audit-pose-validity.mjs`. The JSON contains every measured joint and support patch. The HTML report provides search and filters. This audit never rewrites poses or saved sequences.
