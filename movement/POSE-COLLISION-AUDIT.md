# Pose collision audit

Generated: 2026-09-12T14:10:55.005Z

## Scope

Limb capsules versus nonadjacent limbs; forearms/shins versus expanded torso, waist and pelvis ellipsoids. Within each hand: nonadjacent finger capsules and finger/palm volumes; shared hinges and palm attachment zones are excluded. Between-hand contact, toes, feet and head self-contact are not covered. Surface clearance includes all physical parts. Body contact below 1 mm is omitted from this audit.

Static poses use the editor's floor/pole correction. Transition samples are taken every 50 ms **before** the new body-collision playback guard; these are potential contacts that the guard should stop. This does not enumerate every possible transition between the 167 poses. Ellipsoid checks are conservative approximations, so flags require visual review.

## Library

167 poses: **0 flagged**, 167 without detected overlaps; 0 surface-clearance failures. “Without detected overlaps” is not a full anatomical certification.

| Pose | Overlapping parts | Maximum depth (mm) |
| --- | --- | ---: |

## Wrist limits

0 library poses exceed the editor wrist direction limits. These require separate arm/hand alignment review; they are not silently corrected.



## Clear in the checked scope

Archer's, Banana, Big Toe, Bird of Paradise, Boat, Bound Angle, Bow, Bridge, Butterfly, Camel, Cat, Caterpillar, Chair, Child's, Chin Stand, Cobra, Corpse, Cow, Cow Face, Crane, Crescent Lunge, Crescent Lunge on the Knee, Crescent Moon, Crooked Monkey, Crow, Deaf Man's, Dolphin, Downward-Facing Dog, Eagle, Easy, Eight Angle, Eight Point, Elbow Balance, Elephant Trunk, Embryo, Embryo in Womb, Extended Puppy, Extended Side Angle, Extended Standing Hand to Big Toe, Extended Supine Hand to Big Toe, Fire Log, Firefly I, Firefly II, Firefly III, Fish, Floating Stick, Flying Lizard, Flying Man, Flying Pigeon, Forearm Balance, Frog, Front Splits, Garland, Gate, Goddess, Gorilla, Grasshopper, Half Bow, Half Moon, Half Pigeon, Handstand, Happy Baby, Head to Knee I, Head to Knee II, Head to Knee III, Hero, Heron, Himalayan Duck, Horse, Humble Flamingo, Inverted Staff, Little Thunderbolt, Lizard, Locust I, Locust II, Locust III, Lord of the Fishes, Lotus, Low Push-up, Lunge, Moon Bird, Mountain, Noose, One Leg Behind the Head I, One Leg Behind the Head II, Peacock, Pendant, Pigeon, Plank, Plow, Pyramid, Rabbit, Reverse Corpse, Revolved Bird of Paradise, Revolved Flying Man, Revolved Half Moon, Revolved Seated Hand to Big Toe, Revolved Standing Hand to Big Toe, Revolved Triangle, Rock the Baby, Rooster, Sage Bharadvaja's Twist, Sage Gheranda's, Sage Marichi's I, Sage Marichi's II, Sage Marichi's III, Sage Marichi's IV, Sage Visvamitra's, Scale, Scorpion, Seated Forward Bend I, Seated Forward Bend II, Seated Forward Bend III, Seated Forward Bend IV, Seated Gate, Seated Half Bound Lotus Forward Bend, Seated Three Limbed Forward Bend, Shiva Squat, Shoelace, Shoulder Pressing, Shoulder Stand with Lotus Legs, Side Lunge, Side Plank, Sleeping Yogi, Snake, Sphinx, Staff, Standing Bow, Standing Foot to Head, Standing Forward Bend, Standing Half Bound Lotus Forward Bend, Standing Hand to Big Toe, Standing Leg Behind the Head, Standing Leg Behind the Head Forward Bend, Standing Splits, Star, Supine Angle, Supine Foot to Head, Supine Hand to Big Toe, Supine Spinal Twist, Supine Straddle, Supported Headstand, Supported Shoulder Stand, Tabletop, Thunderbolt, Tiger, Toe Stand, Tortoise, Tree, Triangle, Tripod Headstand, Two Legs Behind the Head I, Two Legs Behind the Head II, Upward Plank, Upward-Facing Dog, Warrior I, Warrior II, Warrior III, Waterfall, Wheel, Wide Legged Forward Bend I, Wide Legged Forward Bend II, Wide Legged Forward Bend III, Wide Legged Forward Bend IV, Wide Splits, Wild Thing, Wind Removing.

## Sun Salutation

16 cards, 0 flagged cards. 1047 transition/hold samples; 0 surface failures; 0 samples exceed wrist limits.

| Transition | Parts | Time interval (s) | Maximum depth (mm) |
| --- | --- | --- | ---: |

## Pole Flow

8 cards, 0 flagged cards. 600 transition/hold samples; 0 surface failures; 0 samples exceed wrist limits.

| Transition | Parts | Time interval (s) | Maximum depth (mm) |
| --- | --- | --- | ---: |

## Reproduce

Run `node movement/scripts/audit-collisions.mjs`. This regenerates this report and `collision-audit.json`. The report is diagnostic and does not silently rewrite saved sequences.
