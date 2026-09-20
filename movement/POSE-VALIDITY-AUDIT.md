# Pose support and joint-range audit

Generated: 2026-09-17T20:04:24.040Z

167 static poses: 112 with missing/misaligned support proxies, 65 requiring joint-range review, 0 with detected body overlap. 125 have at least one finding; 42 pass the implemented checks. **No pose is certified against the entire human range of motion or load-bearing balance.**

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
| [Archer's](https://www.pocketyoga.com/pose/Archer) | None detected | None detected | Scoped pass; full review remains |
| [Banana](https://www.pocketyoga.com/pose/Banana) | None detected | None detected | Scoped pass; full review remains |
| [Big Toe](https://www.pocketyoga.com/pose/ForwardBendBigToe) | None detected | None detected | Scoped pass; full review remains |
| [Bird of Paradise](https://www.pocketyoga.com/pose/ChairTwistBindUp) | None detected | leftHip axial rotation: -92.33° [-60…60°] | Review findings |
| [Boat](https://www.pocketyoga.com/pose/BoatFull) | sit-bones | None detected | Review findings |
| [Bound Angle](https://www.pocketyoga.com/pose/BoundAngle) | None detected | None detected | Scoped pass; full review remains |
| [Bow](https://www.pocketyoga.com/pose/Bow) | None detected | None detected | Scoped pass; full review remains |
| [Bridge](https://www.pocketyoga.com/pose/Bridge) | heels, back | None detected | Review findings |
| [Butterfly](https://www.pocketyoga.com/pose/Butterfly) | sit-bones | leftHip flexion: 148.53° [-45…130°]; rightHip flexion: 148.53° [-45…130°] | Review findings |
| [Camel](https://www.pocketyoga.com/pose/Camel) | None detected | leftAnkle point/flex: 53.4° [-40…50°]; rightAnkle point/flex: 53.4° [-40…50°] | Review findings |
| [Cat](https://www.pocketyoga.com/pose/Cat) | None detected | None detected | Scoped pass; full review remains |
| [Caterpillar](https://www.pocketyoga.com/pose/Caterpillar) | sit-bones | leftHip flexion: 143° [-45…130°]; rightHip flexion: 143° [-45…130°] | Review findings |
| [Chair](https://www.pocketyoga.com/pose/Chair) | None detected | None detected | Scoped pass; full review remains |
| [Child's](https://www.pocketyoga.com/pose/ChildTraditional) | shins, head | None detected | Review findings |
| [Chin Stand](https://www.pocketyoga.com/pose/ChinStand) | front-chest, palms | None detected | Review findings |
| [Cobra](https://www.pocketyoga.com/pose/CobraFull) | front-core, palms, foot-tops | None detected | Review findings |
| [Corpse](https://www.pocketyoga.com/pose/Corpse) | None detected | None detected | Scoped pass; full review remains |
| [Cow](https://www.pocketyoga.com/pose/Dog) | None detected | None detected | Scoped pass; full review remains |
| [Cow Face](https://www.pocketyoga.com/pose/KneePileBind) | sit-bones | None detected | Review findings |
| [Crane](https://www.pocketyoga.com/pose/Crane) | palms | None detected | Review findings |
| [Crescent Lunge](https://www.pocketyoga.com/pose/LungeCrescent) | None detected | None detected | Scoped pass; full review remains |
| [Crescent Lunge on the Knee](https://www.pocketyoga.com/pose/WarriorIKneeling) | None detected | None detected | Scoped pass; full review remains |
| [Crescent Moon](https://www.pocketyoga.com/pose/CrescentMoon) | None detected | None detected | Scoped pass; full review remains |
| [Crooked Monkey](https://www.pocketyoga.com/pose/CrookedMonkey) | any-palm, any-knee, any-sole | None detected | Review findings |
| [Crow](https://www.pocketyoga.com/pose/Crow) | None detected | None detected | Scoped pass; full review remains |
| [Deaf Man's](https://www.pocketyoga.com/pose/DeafMan) | back, toes | leftHip flexion: 135° [-45…130°]; rightHip flexion: 135° [-45…130°] | Review findings |
| [Dolphin](https://www.pocketyoga.com/pose/Dolphin) | None detected | None detected | Scoped pass; full review remains |
| [Downward-Facing Dog](https://www.pocketyoga.com/pose/DownwardDog) | None detected | None detected | Scoped pass; full review remains |
| [Eagle](https://www.pocketyoga.com/pose/Eagle) | None detected | None detected | Scoped pass; full review remains |
| [Easy](https://www.pocketyoga.com/pose/Easy) | sit-bones | None detected | Review findings |
| [Eight Angle](https://www.pocketyoga.com/pose/EightAngle) | palms | leftHip flexion: 137.96° [-45…130°]; leftHip axial rotation: -88.07° [-60…60°]; rightHip flexion: 144.01° [-45…130°]; rightHip axial rotation: -79.27° [-60…60°] | Review findings |
| [Eight Point](https://www.pocketyoga.com/pose/EightPoint) | palms, knees, front-chest, toes, head | None detected | Review findings |
| [Elbow Balance](https://www.pocketyoga.com/pose/RelaxedStance) | elbows | None detected | Review findings |
| [Elephant Trunk](https://www.pocketyoga.com/pose/ElephantTrunk) | palms | leftHip flexion: 169.23° [-45…130°]; leftHip axial rotation: -64.69° [-60…60°] | Review findings |
| [Embryo](https://www.pocketyoga.com/pose/Embryo) | back | leftHip flexion: 154.5° [-45…130°]; leftHip axial rotation: -61.79° [-60…60°]; rightHip flexion: 154.5° [-45…130°]; rightHip axial rotation: 61.79° [-60…60°] | Review findings |
| [Embryo in Womb](https://www.pocketyoga.com/pose/EmbryoWomb) | sit-bones | leftHip flexion: 149.5° [-45…130°]; leftHip axial rotation: -61.79° [-60…60°]; rightHip flexion: 149.5° [-45…130°]; rightHip axial rotation: 61.79° [-60…60°] | Review findings |
| [Extended Puppy](https://www.pocketyoga.com/pose/PuppyExtended) | shins, palms, head-or-chest | None detected | Review findings |
| [Extended Side Angle](https://www.pocketyoga.com/pose/WarriorIIForwardArmForward) | soles | leftHip axial rotation: -64.69° [-60…60°] | Review findings |
| [Extended Standing Hand to Big Toe](https://www.pocketyoga.com/pose/StandingHandToToeExtended) | None detected | leftHip axial rotation: -89.12° [-60…60°] | Review findings |
| [Extended Supine Hand to Big Toe](https://www.pocketyoga.com/pose/SupineHandToToeExtended) | None detected | None detected | Scoped pass; full review remains |
| [Fire Log](https://www.pocketyoga.com/pose/FireLog) | sit-bones | None detected | Review findings |
| [Firefly I](https://www.pocketyoga.com/pose/Firefly) | palms | None detected | Review findings |
| [Firefly II](https://www.pocketyoga.com/pose/TortoiseBind) | None detected | leftHip flexion: 145° [-45…130°]; rightHip flexion: 145° [-45…130°] | Review findings |
| [Firefly III](https://www.pocketyoga.com/pose/TortoiseBindII) | None detected | leftHip flexion: 155° [-45…130°]; rightHip flexion: 155° [-45…130°] | Review findings |
| [Fish](https://www.pocketyoga.com/pose/FishPreparation) | seat | None detected | Review findings |
| [Floating Stick](https://www.pocketyoga.com/pose/FloatingStick) | palms | None detected | Review findings |
| [Flying Lizard](https://www.pocketyoga.com/pose/FlyingLizard) | palms | None detected | Review findings |
| [Flying Man](https://www.pocketyoga.com/pose/LungeHandsOnMatFlying) | palms | None detected | Review findings |
| [Flying Pigeon](https://www.pocketyoga.com/pose/PigeonFlying) | palms | None detected | Review findings |
| [Forearm Balance](https://www.pocketyoga.com/pose/FeatheredPeacock) | forearms, palms | None detected | Review findings |
| [Frog](https://www.pocketyoga.com/pose/FrogTraditional) | front-core | None detected | Review findings |
| [Front Splits](https://www.pocketyoga.com/pose/SplitsFront) | sit-bones | rightHip flexion: -90° [-45…130°] | Review findings |
| [Garland](https://www.pocketyoga.com/pose/GarlandSideways) | None detected | None detected | Scoped pass; full review remains |
| [Gate](https://www.pocketyoga.com/pose/Gate) | any-knee, any-sole | rightHip abduction/adduction: -80° [-70…70°] | Review findings |
| [Goddess](https://www.pocketyoga.com/pose/Goddess) | soles | None detected | Review findings |
| [Gorilla](https://www.pocketyoga.com/pose/Gorilla) | soles | leftHip flexion: 145° [-45…130°]; rightHip flexion: 145° [-45…130°] | Review findings |
| [Grasshopper](https://www.pocketyoga.com/pose/Grasshopper) | palms | rightHip axial rotation: -71.75° [-60…60°] | Review findings |
| [Half Bow](https://www.pocketyoga.com/pose/ProneBowHalf) | front-core | None detected | Review findings |
| [Half Moon](https://www.pocketyoga.com/pose/HalfMoon) | any-hand | rightHip flexion: -143.11° [-45…130°]; rightHip axial rotation: 118.52° [-60…60°] | Review findings |
| [Half Pigeon](https://www.pocketyoga.com/pose/PigeonHalf) | knees, any-foot-top | rightHip flexion: -80° [-45…130°] | Review findings |
| [Handstand](https://www.pocketyoga.com/pose/Handstand) | palms | None detected | Review findings |
| [Happy Baby](https://www.pocketyoga.com/pose/BlissfulBaby) | None detected | leftHip flexion: 144.3° [-45…130°]; rightHip flexion: 144.3° [-45…130°] | Review findings |
| [Head to Knee I](https://www.pocketyoga.com/pose/HeadToKnee) | sit-bones | leftHip flexion: 155° [-45…130°]; rightHip flexion: 167.21° [-45…130°]; rightHip axial rotation: 73.31° [-60…60°] | Review findings |
| [Head to Knee II](https://www.pocketyoga.com/pose/HeadToKneeII) | any-heel, any-back-leg | leftHip flexion: 155° [-45…130°]; rightHip flexion: 164.84° [-45…130°] | Review findings |
| [Head to Knee III](https://www.pocketyoga.com/pose/HeadToKneeIII) | sit-bones, any-forefoot | leftHip flexion: 155° [-45…130°]; rightHip flexion: 170.94° [-45…130°]; rightHip axial rotation: 76.95° [-60…60°] | Review findings |
| [Hero](https://www.pocketyoga.com/pose/Hero) | sit-bones, shins | None detected | Review findings |
| [Heron](https://www.pocketyoga.com/pose/Heron) | sit-bones | leftHip flexion: 140° [-45…130°] | Review findings |
| [Himalayan Duck](https://www.pocketyoga.com/pose/Duck) | forearms, palms | leftHip axial rotation: -61.79° [-60…60°]; rightHip axial rotation: 61.79° [-60…60°] | Review findings |
| [Horse](https://www.pocketyoga.com/pose/Horse) | any-knee, any-sole | None detected | Review findings |
| [Humble Flamingo](https://www.pocketyoga.com/pose/FlamingoHumble) | fingertips | leftHip flexion: 145° [-45…130°] | Review findings |
| [Inverted Staff](https://www.pocketyoga.com/pose/StaffInverted) | forearms | None detected | Review findings |
| [Little Thunderbolt](https://www.pocketyoga.com/pose/LittleThunderbolt) | forearms, shins | None detected | Review findings |
| [Lizard](https://www.pocketyoga.com/pose/Lizard) | None detected | None detected | Scoped pass; full review remains |
| [Locust I](https://www.pocketyoga.com/pose/Locust) | None detected | None detected | Scoped pass; full review remains |
| [Locust II](https://www.pocketyoga.com/pose/LocustII) | front-core | None detected | Review findings |
| [Locust III](https://www.pocketyoga.com/pose/LocustIII) | None detected | None detected | Scoped pass; full review remains |
| [Lord of the Fishes](https://www.pocketyoga.com/pose/LordOfTheFishes) | sit-bones | None detected | Review findings |
| [Lotus](https://www.pocketyoga.com/pose/LotusFull) | sit-bones | leftHip axial rotation: -61.79° [-60…60°]; rightHip axial rotation: 61.79° [-60…60°] | Review findings |
| [Low Push-up](https://www.pocketyoga.com/pose/FourLimbedStaff) | None detected | None detected | Scoped pass; full review remains |
| [Lunge](https://www.pocketyoga.com/pose/Lunge) | None detected | None detected | Scoped pass; full review remains |
| [Moon Bird](https://www.pocketyoga.com/pose/FootBehindHeadElevated) | palms | leftHip flexion: 169.23° [-45…130°]; leftHip axial rotation: -64.69° [-60…60°]; rightHip flexion: 135° [-45…130°] | Review findings |
| [Mountain](https://www.pocketyoga.com/pose/MountainArmsSide) | None detected | None detected | Scoped pass; full review remains |
| [Noose](https://www.pocketyoga.com/pose/SeatedOnHeelsTwistBound) | None detected | None detected | Scoped pass; full review remains |
| [One Leg Behind the Head I](https://www.pocketyoga.com/pose/FootBehindHead) | sit-bones | leftHip flexion: -167.37° [-45…130°]; leftHip axial rotation: -64.69° [-60…60°] | Review findings |
| [One Leg Behind the Head II](https://www.pocketyoga.com/pose/FootBehindHeadForward) | sit-bones | leftHip flexion: -157.6° [-45…130°]; leftHip axial rotation: -69.09° [-60…60°]; rightHip flexion: 155° [-45…130°] | Review findings |
| [Peacock](https://www.pocketyoga.com/pose/Peacock) | palms | None detected | Review findings |
| [Pendant](https://www.pocketyoga.com/pose/Pendant) | palms | None detected | Review findings |
| [Pigeon](https://www.pocketyoga.com/pose/Pigeon) | forearms, shins | None detected | Review findings |
| [Plank](https://www.pocketyoga.com/pose/Plank) | None detected | None detected | Scoped pass; full review remains |
| [Plow](https://www.pocketyoga.com/pose/Plow) | back, toes | None detected | Review findings |
| [Pyramid](https://www.pocketyoga.com/pose/PyramidPrayer) | None detected | None detected | Scoped pass; full review remains |
| [Rabbit](https://www.pocketyoga.com/pose/Rabbit) | knees | leftHip flexion: 138° [-45…130°]; rightHip flexion: 138° [-45…130°] | Review findings |
| [Reverse Corpse](https://www.pocketyoga.com/pose/CorpseFrontArmsForward) | front-core, front-chest | None detected | Review findings |
| [Revolved Bird of Paradise](https://www.pocketyoga.com/pose/BirdOfParadiseRevolved) | None detected | leftHip axial rotation: -89.12° [-60…60°] | Review findings |
| [Revolved Flying Man](https://www.pocketyoga.com/pose/FlyingManRevolved) | palms | None detected | Review findings |
| [Revolved Half Moon](https://www.pocketyoga.com/pose/HalfMoonRevolved) | any-hand | None detected | Review findings |
| [Revolved Seated Hand to Big Toe](https://www.pocketyoga.com/pose/SeatedHandToToeRevolved) | sit-bones | leftHip flexion: 145.79° [-45…130°] | Review findings |
| [Revolved Standing Hand to Big Toe](https://www.pocketyoga.com/pose/StandingHandToToeRevolved) | None detected | None detected | Scoped pass; full review remains |
| [Revolved Triangle](https://www.pocketyoga.com/pose/TriangleRevolved) | None detected | None detected | Scoped pass; full review remains |
| [Rock the Baby](https://www.pocketyoga.com/pose/Cradle) | sit-bones | None detected | Review findings |
| [Rooster](https://www.pocketyoga.com/pose/Rooster) | palms | leftHip axial rotation: -61.79° [-60…60°] | Review findings |
| [Sage Bharadvaja's Twist](https://www.pocketyoga.com/pose/Bharadvaja) | sit-bones, any-palm | None detected | Review findings |
| [Sage Gheranda's](https://www.pocketyoga.com/pose/GherandaI) | None detected | rightHip flexion: -60° [-45…130°] | Review findings |
| [Sage Marichi's I](https://www.pocketyoga.com/pose/MarichiITraditional) | sit-bones | leftHip flexion: 155° [-45…130°]; rightHip flexion: 155° [-45…130°] | Review findings |
| [Sage Marichi's II](https://www.pocketyoga.com/pose/MarichiIITraditional) | sit-bones | leftHip flexion: 140° [-45…130°] | Review findings |
| [Sage Marichi's III](https://www.pocketyoga.com/pose/MarichiIIITraditional) | sit-bones | None detected | Review findings |
| [Sage Marichi's IV](https://www.pocketyoga.com/pose/MarichiIVTraditional) | sit-bones | None detected | Review findings |
| [Sage Visvamitra's](https://www.pocketyoga.com/pose/VisvamitraFull) | any-palm | None detected | Review findings |
| [Scale](https://www.pocketyoga.com/pose/LotusElevated) | palms | leftHip axial rotation: -61.79° [-60…60°]; rightHip axial rotation: 61.79° [-60…60°] | Review findings |
| [Scorpion](https://www.pocketyoga.com/pose/Scorpion) | forearms, palms | None detected | Review findings |
| [Seated Forward Bend I](https://www.pocketyoga.com/pose/SeatedForwardBend) | sit-bones | leftHip flexion: 155° [-45…130°]; rightHip flexion: 155° [-45…130°] | Review findings |
| [Seated Forward Bend II](https://www.pocketyoga.com/pose/SeatedForwardBendII) | sit-bones | leftHip flexion: 155° [-45…130°]; rightHip flexion: 155° [-45…130°] | Review findings |
| [Seated Forward Bend III](https://www.pocketyoga.com/pose/SeatedForwardBendIII) | sit-bones | leftHip flexion: 155° [-45…130°]; rightHip flexion: 155° [-45…130°] | Review findings |
| [Seated Forward Bend IV](https://www.pocketyoga.com/pose/SeatedForwardBendIV) | sit-bones | leftHip flexion: 151.3° [-45…130°]; rightHip flexion: 151.3° [-45…130°] | Review findings |
| [Seated Gate](https://www.pocketyoga.com/pose/SeatedGate) | sit-bones | None detected | Review findings |
| [Seated Half Bound Lotus Forward Bend](https://www.pocketyoga.com/pose/SeatedForwardBendHalfLotus) | sit-bones | leftHip flexion: 155° [-45…130°] | Review findings |
| [Seated Three Limbed Forward Bend](https://www.pocketyoga.com/pose/SeatedForwardBendThreeLimbs) | sit-bones | leftHip flexion: 155° [-45…130°] | Review findings |
| [Shiva Squat](https://www.pocketyoga.com/pose/ShivaSquat) | any-sole | None detected | Review findings |
| [Shoelace](https://www.pocketyoga.com/pose/KneePile) | sit-bones | None detected | Review findings |
| [Shoulder Pressing](https://www.pocketyoga.com/pose/ScaleForward) | palms | leftHip flexion: 149.53° [-45…130°]; rightHip flexion: 149.53° [-45…130°] | Review findings |
| [Shoulder Stand with Lotus Legs](https://www.pocketyoga.com/pose/ShoulderstandLotus) | back | leftHip axial rotation: -61.79° [-60…60°]; rightHip axial rotation: 61.79° [-60…60°] | Review findings |
| [Side Lunge](https://www.pocketyoga.com/pose/SideLunge) | opposite-sole-heel | rightHip abduction/adduction: -75° [-70…70°] | Review findings |
| [Side Plank](https://www.pocketyoga.com/pose/PlankSide) | any-palm, any-foot-edge | None detected | Review findings |
| [Sleeping Yogi](https://www.pocketyoga.com/pose/YogicSleep) | seat, back | leftHip flexion: 173.53° [-45…130°]; rightHip flexion: 173.53° [-45…130°] | Review findings |
| [Snake](https://www.pocketyoga.com/pose/Snake) | front-core | None detected | Review findings |
| [Sphinx](https://www.pocketyoga.com/pose/Sphinx) | palms, front-core | None detected | Review findings |
| [Staff](https://www.pocketyoga.com/pose/Staff) | sit-bones, palms, heels | None detected | Review findings |
| [Standing Bow](https://www.pocketyoga.com/pose/LordOfTheDance) | None detected | rightHip flexion: -55° [-45…130°] | Review findings |
| [Standing Foot to Head](https://www.pocketyoga.com/pose/TrivikramaI) | None detected | leftHip flexion: 160.3° [-45…130°] | Review findings |
| [Standing Forward Bend](https://www.pocketyoga.com/pose/ForwardBend) | None detected | None detected | Scoped pass; full review remains |
| [Standing Half Bound Lotus Forward Bend](https://www.pocketyoga.com/pose/StandingForwardBendHalfLotus) | any-sole | leftHip flexion: 145° [-45…130°] | Review findings |
| [Standing Hand to Big Toe](https://www.pocketyoga.com/pose/StandingHandToToeFull) | None detected | None detected | Scoped pass; full review remains |
| [Standing Leg Behind the Head](https://www.pocketyoga.com/pose/StandingFootBehindHead) | None detected | leftHip flexion: -167.37° [-45…130°]; leftHip axial rotation: -64.69° [-60…60°] | Review findings |
| [Standing Leg Behind the Head Forward Bend](https://www.pocketyoga.com/pose/StandingForwardBendFootBehindHead) | any-sole | leftHip flexion: -153.77° [-45…130°]; leftHip axial rotation: -64.69° [-60…60°]; rightHip flexion: 145° [-45…130°] | Review findings |
| [Standing Splits](https://www.pocketyoga.com/pose/SplitsStanding) | any-hand | rightHip flexion: -80° [-45…130°] | Review findings |
| [Star](https://www.pocketyoga.com/pose/Star) | None detected | None detected | Scoped pass; full review remains |
| [Supine Angle](https://www.pocketyoga.com/pose/SupineAngle) | back, toes | None detected | Review findings |
| [Supine Foot to Head](https://www.pocketyoga.com/pose/SupineTrivikrama) | None detected | leftHip flexion: 160.3° [-45…130°] | Review findings |
| [Supine Hand to Big Toe](https://www.pocketyoga.com/pose/SupineHandToToeFull) | None detected | None detected | Scoped pass; full review remains |
| [Supine Spinal Twist](https://www.pocketyoga.com/pose/SupineSpinalTwist) | seat, back | waist local y: 45° [-40…40°] | Review findings |
| [Supine Straddle](https://www.pocketyoga.com/pose/SupineStraddle) | None detected | None detected | Scoped pass; full review remains |
| [Supported Headstand](https://www.pocketyoga.com/pose/HeadstandSupported) | forearms | None detected | Review findings |
| [Supported Shoulder Stand](https://www.pocketyoga.com/pose/ShoulderstandSupported) | back | None detected | Review findings |
| [Tabletop](https://www.pocketyoga.com/pose/BoxNeutral) | None detected | None detected | Scoped pass; full review remains |
| [Thunderbolt](https://www.pocketyoga.com/pose/Thunderbolt) | shins, foot-tops | None detected | Review findings |
| [Tiger](https://www.pocketyoga.com/pose/Tiger) | palms, any-knee | None detected | Review findings |
| [Toe Stand](https://www.pocketyoga.com/pose/ToeStand) | any-forefoot | None detected | Review findings |
| [Tortoise](https://www.pocketyoga.com/pose/SupineTortoise) | seat | leftHip flexion: 145° [-45…130°]; rightHip flexion: 145° [-45…130°] | Review findings |
| [Tree](https://www.pocketyoga.com/pose/TreePrayer) | None detected | leftHip axial rotation: -61.79° [-60…60°] | Review findings |
| [Triangle](https://www.pocketyoga.com/pose/TriangleForward) | None detected | None detected | Scoped pass; full review remains |
| [Tripod Headstand](https://www.pocketyoga.com/pose/HeadstandTripod) | palms, head | None detected | Review findings |
| [Two Legs Behind the Head I](https://www.pocketyoga.com/pose/FootBehindHeadTwoLegged) | sit-bones | leftHip flexion: -167.05° [-45…130°]; leftHip axial rotation: -70.34° [-60…60°]; rightHip flexion: -167.05° [-45…130°]; rightHip axial rotation: 70.34° [-60…60°] | Review findings |
| [Two Legs Behind the Head II](https://www.pocketyoga.com/pose/FootBehindHeadTwoLeggedElevated) | palms | leftHip flexion: 163.73° [-45…130°]; leftHip axial rotation: -67.62° [-60…60°]; rightHip flexion: 163.73° [-45…130°]; rightHip axial rotation: 67.62° [-60…60°] | Review findings |
| [Upward Plank](https://www.pocketyoga.com/pose/PlankUpward) | palms, soles | None detected | Review findings |
| [Upward-Facing Dog](https://www.pocketyoga.com/pose/UpwardDog) | None detected | None detected | Scoped pass; full review remains |
| [Warrior I](https://www.pocketyoga.com/pose/WarriorI) | None detected | None detected | Scoped pass; full review remains |
| [Warrior II](https://www.pocketyoga.com/pose/WarriorII) | None detected | None detected | Scoped pass; full review remains |
| [Warrior III](https://www.pocketyoga.com/pose/WarriorIII) | None detected | None detected | Scoped pass; full review remains |
| [Waterfall](https://www.pocketyoga.com/pose/CorpseDoubleLegRaise) | None detected | None detected | Scoped pass; full review remains |
| [Wheel](https://www.pocketyoga.com/pose/Wheel) | palms, soles | None detected | Review findings |
| [Wide Legged Forward Bend I](https://www.pocketyoga.com/pose/WideLeggedForwardBendI) | soles | leftHip flexion: 145° [-45…130°]; rightHip flexion: 145° [-45…130°] | Review findings |
| [Wide Legged Forward Bend II](https://www.pocketyoga.com/pose/WideLeggedForwardBendII) | soles | leftHip flexion: 145° [-45…130°]; rightHip flexion: 145° [-45…130°] | Review findings |
| [Wide Legged Forward Bend III](https://www.pocketyoga.com/pose/WideLeggedForwardBendIII) | soles | leftHip flexion: 145° [-45…130°]; rightHip flexion: 145° [-45…130°] | Review findings |
| [Wide Legged Forward Bend IV](https://www.pocketyoga.com/pose/WideLeggedForwardBendIV) | soles | leftHip flexion: 145° [-45…130°]; rightHip flexion: 145° [-45…130°] | Review findings |
| [Wide Splits](https://www.pocketyoga.com/pose/SplitsWide) | palms | leftHip abduction/adduction: 90° [-70…70°]; rightHip abduction/adduction: -90° [-70…70°] | Review findings |
| [Wild Thing](https://www.pocketyoga.com/pose/WildThing) | any-palm | None detected | Review findings |
| [Wind Removing](https://www.pocketyoga.com/pose/Turtle) | None detected | None detected | Scoped pass; full review remains |

## Repair priorities

Shared foot contact geometry; multiple-anchor support solving; mismatched named poses; calibrated joint constraints and per-pose retesting. Floor clearance and constant anchor positions alone do not establish correct load-bearing support.

## Reproduce

Run `node movement/scripts/audit-pose-validity.mjs`. The JSON contains every measured joint and support patch. The HTML report provides search and filters. This audit never rewrites poses or saved sequences.
