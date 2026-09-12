// Local XYZ degrees, independently authored for this mannequin's proportions.
// Complex binds and balances are explicitly marked as drafts in the library.
const pair=(joint,x,y=0,z=0)=>({['left'+joint]:[x,y,z],['right'+joint]:[x,-y,-z]});
const merge=(...parts)=>Object.assign({},...parts);
const armsUp=pair('Shoulder',-175);
const armsWide=pair('Shoulder',0,0,90);
const prayer=merge(pair('Shoulder',-35,0,-15),pair('Elbow',-115),pair('Wrist',0,0,20));
const bind=merge(pair('Shoulder',40,30,10),pair('Elbow',-100));
const seated=pair('Hip',-90);
const lotus=merge(pair('Hip',-85,-55,40),pair('Knee',135));
const easy=merge(pair('Hip',-80,-35,35),pair('Knee',115));
const hero=merge(pair('Hip',-10),pair('Knee',145),pair('Ankle',40));
const fold=merge({pelvis:145},pair('Hip',-145),pair('Shoulder',-145));
const seatedFold=merge(seated,{pelvis:65},pair('Hip',-155),pair('Shoulder',-90));
const prone={pelvis:90};
const supine={pelvis:-90};
const inverted={pelvis:180};
const kneeling=merge(pair('Knee',90),pair('Ankle',40));
const lunge={leftHip:-90,leftKnee:90,rightHip:25,rightKnee:0,torso:-5};
const lowLunge=merge(lunge,{rightKnee:90,rightAnkle:40});
const armBalance=merge({pelvis:75},pair('Shoulder',-35),pair('Elbow',-90),pair('Wrist',-60));
const shoulderStand=merge({pelvis:-175,torso:20},pair('Shoulder',35),pair('Elbow',-120));
const plow=merge(shoulderStand,pair('Hip',-100));
const halfLotus={rightHip:[-90,50,-40],rightKnee:140};
const behindHead={leftHip:[-150,-60,35],leftKnee:135};
const eagleArms={leftShoulder:[-75,0,-25],rightShoulder:[-75,0,25],leftElbow:-125,rightElbow:-115};
const legSide={leftHip:[-20,-80,85],leftShoulder:[-10,-70,100]};
const legForward={leftHip:-100,leftShoulder:-90};
const twist={torso:[0,55,0],neck:[0,25,0]};
const wideLegs=pair('Hip',0,-25,55);
const squat=merge(pair('Hip',-75,-35,35),pair('Knee',135),pair('Ankle',-35),prayer);
const crow=merge(armBalance,pair('Hip',-115,0,20),pair('Knee',145));
const lotusLift=merge(lotus,pair('Shoulder',5,0,12),pair('Wrist',-70));
const wheel=merge({pelvis:-45,waist:-30,torso:-35},pair('Hip',20),pair('Knee',100),pair('Shoulder',-155),pair('Elbow',-55),pair('Wrist',-70));
const bow=merge(prone,{waist:-15,torso:-15,neck:-25},pair('Hip',25),pair('Knee',110),pair('Shoulder',55));
const headstand=merge(inverted,pair('Shoulder',-150),pair('Elbow',-115));
export const poseShapes={
 Archer:merge(seated,{leftHip:[-125,-25,25],leftKnee:120,leftShoulder:-100,leftElbow:-100,rightShoulder:-80}),
 Banana:merge(supine,armsUp,{waist:[0,0,15],torso:[0,0,10]},pair('Hip',0,0,10)),
 Bharadvaja:merge(hero,halfLotus,twist,bind),
 BirdOfParadiseRevolved:merge(legSide,bind,{torso:[0,-50,0]}),
 BlissfulBaby:merge(supine,pair('Hip',-125,-30,35),pair('Knee',100),pair('Shoulder',-115,0,30),pair('Elbow',-75)),
 BoatFull:merge({pelvis:-30},pair('Hip',-100),pair('Shoulder',-70)),
 BoundAngle:merge(pair('Hip',-90,-60,45),pair('Knee',135),pair('Shoulder',-65),pair('Elbow',-60)),
 Bow:bow,
 Bridge:merge(supine,{waist:-10,torso:-15},pair('Hip',-30),pair('Knee',110),pair('Shoulder',10)),
 Butterfly:merge(pair('Hip',-95,-60,50),pair('Knee',130),{waist:25,torso:25},pair('Shoulder',-60)),
 Camel:merge(kneeling,{pelvis:-15,waist:-25,torso:-25,neck:-35},pair('Shoulder',45)),
 Caterpillar:merge(seatedFold,{waist:15,torso:15,neck:20},pair('Elbow',-20)),
 ChairTwistBindUp:merge(legSide,bind,{leftHip:[-35,-65,95]}),
 ChildTraditional:merge(hero,{pelvis:90},pair('Hip',-125),pair('Shoulder',-180)),
 ChinStand:merge({pelvis:140,waist:20,torso:25,neck:-50},pair('Shoulder',-65),pair('Elbow',-100)),
 CobraFull:merge(prone,{waist:-20,torso:-30,neck:-20},pair('Shoulder',-40),pair('Elbow',-35)),
 CorpseDoubleLegRaise:merge(supine,pair('Hip',-90)),
 CorpseFrontArmsForward:merge(prone,armsUp,{neck:[0,45,0]}),
 Cradle:merge(easy,{leftHip:[-110,-25,35],leftKnee:125},pair('Shoulder',-60),pair('Elbow',-100)),
 Crane:merge(crow,pair('Shoulder',-75),pair('Elbow',-5)),
 CrescentMoon:merge(armsUp,{waist:[0,0,15],torso:[0,0,15]}),
 CrookedMonkey:merge(lowLunge,{pelvis:40,torso:[0,40,0],leftHip:[-105,-25,20],rightKnee:130,leftShoulder:-60,rightShoulder:70}),
 Crow:crow,
 DeafMan:merge(plow,pair('Hip',-135),pair('Knee',100),pair('Shoulder',5)),
 Dolphin:merge({pelvis:125},pair('Hip',-80),pair('Shoulder',-130),pair('Elbow',-100)),
 Duck:merge(lotus,armBalance,{pelvis:110},pair('Elbow',-120)),
 Eagle:merge({leftHip:-25,leftKnee:45,rightHip:[-45,25,20],rightKnee:105},eagleArms),
 Easy:merge(easy,pair('Shoulder',-25),pair('Elbow',-50)),
 EightAngle:merge(armBalance,{leftHip:[-100,-75,50],rightHip:[-100,-75,45],torso:[0,0,-20]}),
 EightPoint:merge({pelvis:90,waist:-20,torso:20,neck:-30},pair('Hip',-45),pair('Knee',90),pair('Shoulder',-25),pair('Elbow',-100)),
 ElephantTrunk:merge(seated,behindHead,pair('Shoulder',10,0,15),{leftKnee:105}),
 Embryo:merge(shoulderStand,lotus,pair('Hip',-120,-55,40),pair('Shoulder',-80),pair('Elbow',-110)),
 EmbryoWomb:merge(lotus,{pelvis:-25},pair('Hip',-115,-55,40),pair('Shoulder',-60),pair('Elbow',-145)),
 FeatheredPeacock:merge(inverted,pair('Shoulder',-175),pair('Elbow',-90)),
 Firefly:merge({pelvis:15},pair('Hip',-110,-15,40),pair('Shoulder',15,0,15),pair('Wrist',-70)),
 FireLog:merge(pair('Hip',-90,-45,35),{leftKnee:100,rightKnee:115,leftShoulder:-20,rightShoulder:-20}),
 FishPreparation:merge(supine,{waist:-10,torso:-25,neck:-35},pair('Shoulder',20),pair('Elbow',-60)),
 FlamingoHumble:merge(fold,{rightHip:-110,rightKnee:125},pair('Shoulder',-70)),
 FloatingStick:merge(seated,{pelvis:15},pair('Shoulder',-10),pair('Wrist',-75)),
 FlyingLizard:merge(armBalance,{leftHip:[-115,-20,20],leftKnee:130,rightHip:10}),
 FlyingManRevolved:merge(armBalance,{leftHip:[-95,50,-40],rightHip:15,torso:[0,-25,0]}),
 FootBehindHead:merge(seated,behindHead,prayer),
 FootBehindHeadElevated:merge(seated,behindHead,{rightHip:-135},pair('Shoulder',10,0,15)),
 FootBehindHeadForward:merge(seatedFold,behindHead,{leftHip:[-170,-65,35]},pair('Shoulder',-80)),
 FootBehindHeadTwoLegged:merge(pair('Hip',-150,-65,40),pair('Knee',135),{pelvis:-15},prayer),
 FootBehindHeadTwoLeggedElevated:merge(pair('Hip',-150,-65,40),pair('Knee',135),pair('Shoulder',10,0,15)),
 ForwardBendBigToe:merge(fold,pair('Hip',-145,0,8),pair('Elbow',-25)),
 FrogTraditional:merge(prone,pair('Knee',145),pair('Shoulder',45),pair('Elbow',-90),{torso:-20,neck:-20}),
 GarlandSideways:squat,
 Gate:merge(kneeling,{rightHip:[0,0,-80],rightKnee:0,waist:[0,0,-20],torso:[0,0,-20],leftShoulder:[0,0,165],rightShoulder:[0,0,-35]}),
 GherandaI:merge(bow,{leftKnee:145,leftShoulder:-145,leftElbow:-120,rightHip:60,rightKnee:0}),
 Goddess:merge(pair('Hip',-40,-50,45),pair('Knee',90),pair('Shoulder',0,0,90),pair('Elbow',-90)),
 Gorilla:merge(fold,pair('Shoulder',-160),pair('Wrist',70)),
 Grasshopper:merge(armBalance,{torso:[0,60,0],leftHip:[-110,-25,35],leftKnee:120,rightHip:[-90,-65,45]}),
 HalfMoon:{pelvis:[0,0,-80],rightHip:[0,0,80],leftHip:[0,0,-5],leftShoulder:[0,0,170],rightShoulder:[0,0,-10],neck:[0,-45,0]},
 HalfMoonRevolved:{pelvis:85,leftHip:-85,rightHip:10,torso:[0,65,0],leftShoulder:-175,rightShoulder:-85,neck:[0,35,0]},
 Handstand:merge(inverted,armsUp),
 HeadstandSupported:headstand,
 HeadstandTripod:merge(inverted,pair('Shoulder',-95),pair('Elbow',-90)),
 HeadToKnee:merge(seatedFold,{rightHip:[-120,65,-50],rightKnee:140}),
 HeadToKneeII:merge(seatedFold,{rightHip:[-135,55,-35],rightKnee:150,pelvis:70}),
 HeadToKneeIII:merge(seatedFold,{rightHip:[-120,80,-55],rightKnee:150,rightAnkle:40}),
 Hero:merge(hero,pair('Shoulder',-15),pair('Elbow',-30)),
 Heron:merge(hero,{leftHip:-140,leftKnee:0},pair('Shoulder',-110),pair('Elbow',-30)),
 Horse:merge(halfLotus,{leftHip:[-80,-35,30],leftKnee:135},eagleArms),
 KneePile:merge(pair('Hip',-90,0,-15),pair('Knee',145),pair('Shoulder',-25)),
 KneePileBind:merge(pair('Hip',-90,0,-15),pair('Knee',145),{leftShoulder:-180,leftElbow:-145,rightShoulder:40,rightElbow:-110}),
 LittleThunderbolt:merge(kneeling,{pelvis:-30,waist:-30,torso:-40,neck:-35},pair('Shoulder',30)),
 // Grounded Lizard: front knee outside the hands, trailing knee on its flexion axis.
 Lizard:{"pelvis": [65, 0, 0], "waist": [0, 0, 0], "torso": [0, 0, 0], "neck": [0, 0, 0], "leftShoulder": [-45.17020294722551, 1.954642176654016, -4.69699353109168], "leftElbow": [-63.36985363682596, 2.010802777808041, -3.257140738840001], "leftWrist": [-46.357447860642885, -7.500717158475166, -2.6409624290399174], "leftHip": [145.19829701365555, 11.915857365966238, 81.68111043694365], "leftKnee": [74.77040064633799, 0, 0], "leftAnkle": [88.80104909732036, -28.15657199090387, 80.76025287455897], "rightShoulder": [-45.17020294722551, -1.954642176654016, 4.69699353109168], "rightElbow": [-63.36985363682596, -2.010802777808041, 3.257140738840001], "rightWrist": [-46.357447860642885, 7.500717158475166, 2.6409624290399174], "rightHip": [1.5891136897886784, 2.5161640700806784, -5.789826333089438], "rightKnee": [32.72200536237212, 0, 0], "rightAnkle": [20.665551448050913, 3.1508245144413727, 5.471207157695078]},
 Locust:merge(prone,{waist:-10,torso:-15,neck:-15},pair('Hip',20),pair('Shoulder',30)),
 LocustII:merge(prone,{waist:-10,torso:-25,neck:-20},pair('Hip',25),pair('Shoulder',-15),pair('Elbow',-70)),
 LocustIII:merge(prone,{waist:-10,torso:-15},pair('Hip',20),armsUp),
 LordOfTheDance:{pelvis:30,leftHip:-30,rightHip:55,rightKnee:110,leftShoulder:-130,rightShoulder:65,neck:-15},
 LordOfTheFishes:merge(seated,twist,{leftHip:[-105,20,-15],leftKnee:135,rightHip:[-90,30,-25],rightKnee:125,leftShoulder:20,rightShoulder:-50,rightElbow:-90}),
 LotusElevated:lotusLift,
 LotusFull:merge(lotus,pair('Shoulder',-25),pair('Elbow',-45)),
 Lunge:merge(lunge,{pelvis:65,leftHip:-135},pair('Shoulder',-70)),
 LungeCrescent:merge(lunge,armsUp),
 LungeHandsOnMatFlying:merge(armBalance,{leftHip:[-120,-25,20],rightHip:20}),
 MarichiIIITraditional:merge(seated,twist,{leftHip:-130,leftKnee:145,leftShoulder:20,rightShoulder:-45,rightElbow:-110}),
 MarichiIITraditional:merge(halfLotus,{leftHip:-140,leftKnee:150,pelvis:40},bind),
 MarichiITraditional:merge(seatedFold,{leftHip:-155,leftKnee:145},bind),
 MarichiIVTraditional:merge(halfLotus,twist,{leftHip:-130,leftKnee:145},bind),
 Peacock:merge(prone,pair('Shoulder',25),pair('Elbow',-90),pair('Wrist',70),{neck:-20}),
 Pendant:merge(easy,pair('Hip',-115,-30,25),pair('Shoulder',5),pair('Wrist',-70)),
 Pigeon:merge(kneeling,{pelvis:-45,waist:-35,torso:-40,neck:-30},pair('Shoulder',-160),pair('Elbow',-120)),
 PigeonFlying:merge(armBalance,{leftHip:[-110,-40,30],leftKnee:130,rightHip:20}),
 PigeonHalf:{leftHip:[-95,-45,25],leftKnee:130,rightHip:80,rightKnee:0,leftShoulder:5,rightShoulder:5},
 PlankSide:merge({pelvis:[0,0,-85]},pair('Hip',0),{rightShoulder:[0,0,-90],leftShoulder:[0,0,90]}),
 PlankUpward:merge({pelvis:-70},pair('Shoulder',60),pair('Wrist',-65)),
 Plow:plow,
 ProneBowHalf:merge(prone,{waist:-10,torso:-15,leftKnee:110,leftHip:20,leftShoulder:55,rightShoulder:-175,neck:-20}),
 PuppyExtended:merge({pelvis:90,waist:20,torso:15},pair('Hip',-90),pair('Knee',90),armsUp),
 PyramidPrayer:merge({pelvis:90,leftHip:-115,rightHip:-65,leftKnee:0,rightKnee:0},bind),
 Rabbit:merge(hero,{pelvis:120,waist:20,torso:25,neck:30},pair('Hip',-150),pair('Shoulder',30)),
 RelaxedStance:merge(inverted,{waist:-15,torso:-10},pair('Shoulder',-145),pair('Elbow',-140)),
 Rooster:merge(lotusLift,pair('Shoulder',-10,0,-15)),
 ScaleForward:merge({pelvis:50},pair('Hip',-130,-25,40),pair('Knee',120),pair('Shoulder',5,0,15)),
 Scorpion:merge(inverted,{waist:-25,torso:-20,neck:-30},pair('Hip',35),pair('Knee',120),pair('Shoulder',-150),pair('Elbow',-100)),
 SeatedForwardBend:seatedFold,
 SeatedForwardBendHalfLotus:merge(seatedFold,halfLotus,{rightShoulder:40,rightElbow:-90}),
 SeatedForwardBendII:merge(seatedFold,pair('Shoulder',-95,0,8),pair('Wrist',0,20)),
 SeatedForwardBendIII:merge(seatedFold,pair('Shoulder',-100),pair('Wrist',-45)),
 SeatedForwardBendIV:merge(seatedFold,pair('Shoulder',-100,0,-8),pair('Elbow',-15),pair('Wrist',0,0,20)),
 SeatedForwardBendThreeLimbs:merge(seatedFold,{rightHip:-65,rightKnee:150}),
 SeatedGate:merge({pelvis:[0,0,-35],waist:[0,0,-20]},pair('Hip',-90,0,55),{leftShoulder:[0,0,165],rightShoulder:[0,0,-60]}),
 SeatedHandToToeRevolved:merge(seated,twist,{leftHip:[-115,-30,50],leftShoulder:30,rightShoulder:[-95,45,-20]}),
 SeatedOnHeelsTwistBound:merge(squat,twist,bind),
 ShivaSquat:{pelvis:40,leftHip:-85,leftKnee:100,rightHip:[-70,20,10],rightKnee:140,leftShoulder:-100,rightShoulder:-100},
 ShoulderstandLotus:merge(shoulderStand,lotus),
 ShoulderstandSupported:shoulderStand,
 SideLunge:merge({pelvis:20,leftHip:[-80,-30,30],leftKnee:140,rightHip:[0,0,-75]},prayer),
 Snake:merge(prone,bind,{waist:-10,torso:-25,neck:-20}),
 Sphinx:merge(prone,{waist:-10,torso:-15,neck:-15},pair('Shoulder',-65),pair('Elbow',-90)),
 SplitsFront:{leftHip:-90,rightHip:90,leftShoulder:5,rightShoulder:5},
 SplitsStanding:{pelvis:100,leftHip:-100,rightHip:80,leftShoulder:-100,rightShoulder:-100},
 SplitsWide:merge(pair('Hip',0,0,90),pair('Shoulder',-20)),
 Staff:merge(seated,pair('Shoulder',5)),
 StaffInverted:merge(wheel,pair('Hip',-10),pair('Knee',5),pair('Shoulder',-150),pair('Elbow',-110)),
 StandingFootBehindHead:merge(behindHead,prayer),
 StandingForwardBendFootBehindHead:merge(fold,behindHead,{leftHip:[-175,-60,35]},pair('Shoulder',-140)),
 StandingForwardBendHalfLotus:merge(fold,halfLotus,{rightShoulder:45,rightElbow:-95}),
 StandingHandToToeExtended:legSide,
 StandingHandToToeFull:legForward,
 StandingHandToToeRevolved:merge(legForward,twist,{rightShoulder:[-90,45,-20],leftShoulder:20}),
 SupineAngle:merge(plow,pair('Hip',-100,0,45),pair('Shoulder',-120)),
 SupineHandToToeExtended:merge(supine,legSide,{leftHip:[-80,-30,60]}),
 SupineHandToToeFull:merge(supine,legForward),
 SupineSpinalTwist:merge(supine,armsWide,{waist:[0,45,0],leftHip:-90,rightHip:-90,leftKnee:90,rightKnee:90}),
 SupineStraddle:merge(supine,pair('Hip',-90,0,65),pair('Shoulder',-80,0,45)),
 SupineTortoise:merge(seatedFold,pair('Hip',-145,0,45),pair('Shoulder',0,0,95),{waist:15,torso:20}),
 SupineTrivikrama:merge(supine,{leftHip:-165,leftShoulder:-140,leftElbow:-45,rightShoulder:-90}),
 Thunderbolt:merge(hero,prayer),
 Tiger:merge({pelvis:90},pair('Hip',-90),pair('Knee',90),{rightHip:0,rightKnee:120,leftShoulder:-90,rightShoulder:60}),
 ToeStand:merge(halfLotus,{leftHip:-70,leftKnee:145,leftAnkle:35},prayer),
 TortoiseBind:merge(fold,pair('Hip',-145,0,25),bind),
 TortoiseBindII:merge(fold,pair('Hip',-155,0,10),pair('Shoulder',20),pair('Elbow',-110)),
 TreePrayer:merge({leftHip:[-20,-55,40],leftKnee:130},prayer),
 TriangleForward:merge(wideLegs,{pelvis:[0,0,-55],waist:[0,0,-10]},armsWide),
 TriangleRevolved:merge({pelvis:85,leftHip:-115,rightHip:-65,torso:[0,70,0],leftShoulder:-175,rightShoulder:-90,neck:[0,45,0]}),
 TrivikramaI:merge({leftHip:-165},pair('Shoulder',-150),pair('Elbow',-35)),
 Turtle:merge(supine,pair('Hip',-125),pair('Knee',140),pair('Shoulder',-80),pair('Elbow',-100)),
 VisvamitraFull:{pelvis:[0,0,-65],rightHip:[0,0,45],leftHip:[-90,-45,45],leftShoulder:[-90,-30,40],rightShoulder:[0,0,-90],torso:[0,30,0]},
 WarriorI:merge(lunge,armsUp,{rightHip:[20,30,-10]}),
 WarriorII:merge({leftHip:[-75,-60,35],leftKnee:90,rightHip:[0,0,-35],neck:[0,60,0]},armsWide),
 WarriorIIForwardArmForward:merge({leftHip:[-75,-60,35],leftKnee:90,rightHip:[0,0,-35],waist:[0,0,25],torso:[0,0,20],leftShoulder:[0,0,35],rightShoulder:[0,0,-165]}),
 WarriorIII:{pelvis:90,leftHip:-90,rightHip:0,leftShoulder:-180,rightShoulder:-180},
 WarriorIKneeling:merge(lowLunge,armsUp),
 Wheel:wheel,
 WideLeggedForwardBendI:merge(fold,pair('Hip',-145,0,40),pair('Shoulder',-140)),
 WideLeggedForwardBendII:merge(fold,pair('Hip',-145,0,40),pair('Shoulder',30),pair('Elbow',-90)),
 WideLeggedForwardBendIII:merge(fold,pair('Hip',-145,0,40),bind),
 WideLeggedForwardBendIV:merge(fold,pair('Hip',-145,0,40),pair('Shoulder',-135,0,35)),
 WildThing:merge(wheel,{pelvis:[-65,0,-30],leftShoulder:-170,rightShoulder:45,leftKnee:60,rightKnee:100}),
 YogicSleep:merge(supine,pair('Hip',-155,-60,35),pair('Knee',140),bind),
};
export function normalizeRotations(rotations){return Object.fromEntries(Object.entries(rotations).map(([id,value])=>[id,Array.isArray(value)?[...value]:[value,0,0]]));}
