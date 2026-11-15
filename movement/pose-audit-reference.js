// Audit-only, independently summarized reference relationships. These screens
// never become runtime constraints and never rewrite a pose to make it pass.
const tasks={};
const add=(keys,kind,label,options={})=>{
 for(const key of keys.split(' '))(tasks[key]??=[]).push({kind,label,required:true,...options});
};
add('Archer Bow BlissfulBaby Camel FrogTraditional Gorilla WideLeggedForwardBendIV SeatedForwardBendII SeatedForwardBendIII','both-hands-feet','Both hands meet separate feet or ankles');
add('Bharadvaja ProneBowHalf CrookedMonkey LordOfTheDance StandingHandToToeExtended StandingHandToToeFull StandingHandToToeRevolved SupineHandToToeExtended SupineHandToToeFull SeatedHandToToeRevolved SeatedForwardBendHalfLotus StandingForwardBendHalfLotus GherandaI','hand-foot','A reaching hand meets the intended foot or ankle');
add('Heron TrivikramaI SupineTrivikrama SeatedGate','both-hands-one-foot','Both hands meet one lifted or extended foot');
add('SeatedForwardBendIV','hands-feet','The hands meet the feet and clasp a wrist');
add('SeatedForwardBendIV','hands-together','Hands meet for the wrist clasp');
add('Banana BirdOfParadiseRevolved ChairTwistBindUp DeafMan Eagle Embryo SeatedOnHeelsTwistBound MarichiITraditional MarichiIITraditional MarichiIIITraditional MarichiIVTraditional Snake TortoiseBind TortoiseBindII WideLeggedForwardBendIII','hands-together','Hands or wrists meet for the named bind');
add('KneePileBind','hands-together','Hands meet behind the back',{exempt:'The catalog explicitly presents an unbound, unstacked preparation.'});
add('BoundAngle Butterfly','soles-together','Soles meet');
add('Bridge BridgeLegUp','hands-together','Fingers interlace below the torso',{required:false,note:'The authored Bridge modification uses upper arms alongside the body. This optional reference variation is not treated as a failed bind.'});
add('BridgeSupported BridgeLegUpSupported','hands-pelvis','Both hands reach the lower back');
add('ShoulderstandSupported Plow','hands-pelvis','Hands may support the lower back',{required:false,note:'The reference allows an alternative arm position.'});
add('Pigeon','both-hands-feet','Hands may rest on the feet or hook the heels',{required:false});
add('LittleThunderbolt','hands-lower-legs','Hands catch the ankles, calves or thighs');
add('Rabbit','both-hands-feet','Hands meet the heels or feet');
add('HeadToKnee HeadToKneeII HeadToKneeIII SeatedForwardBend SeatedForwardBendThreeLimbs','hands-feet','Hands reach the extended foot or shin',{required:false,note:'Reach depth and leg-hold alternatives need variant review.'});
add('Cradle','cradle','The lifted knee and foot meet opposite elbow creases');
add('FootBehindHead FootBehindHeadForward FootBehindHeadElevated StandingFootBehindHead StandingForwardBendFootBehindHead','leg-behind-head','One lower leg reaches behind the head');
add('FootBehindHeadTwoLegged FootBehindHeadTwoLeggedElevated YogicSleep SupineTortoise','legs-behind-head','Both lower legs reach behind the head');
add('KneePile','stacked-knees','One bent knee stacks over the other');
add('Crow Crane FlyingLizard FlyingManRevolved EightAngle ElephantTrunk Grasshopper PigeonFlying VisvamitraFull ScaleForward','arm-leg-support','The named arm/leg support relationship is established');
add('TreePrayer','foot-thigh','Raised foot meets the opposite inner thigh');
add('LotusFull LotusElevated Rooster Embryo EmbryoWomb ShoulderstandLotus','lotus','Both feet rest across the opposite thighs');
add('FireLog','stacked-shins','Ankles and knees form stacked crossed shins');
add('HeadstandSupported StaffInverted','hands-together','Hands meet around the head');
add('DeafMan','knees-ears','Both knees descend beside the ears');
add('DeafMan','feet-floor','Both feet rest on the floor beyond the head');
add('DeafMan','arms-floor','Extended arms rest along the floor behind the body');
add('Caterpillar','hands-lower-legs','Hands may rest on the floor or catch the legs',{required:false,exempt:'The reviewed catalog variant uses grounded palms.'});
add('ForwardBendBigToe','both-hands-feet','Index and middle fingers hook both big toes',{exempt:'The catalog explicitly labels this as a toe-reaching preparation without a toe grip.'});
add('ForwardBend','hands-feet','Hands reach toward the lower legs',{required:false,exempt:'The reviewed catalog variant leaves the hands free.'});
add('Turtle','hands-knees','Arms enclose the knees');

// Existing dedicated validators provide stronger evidence than distance screens.
const validated={Archer:['both-hands-feet'],CrookedMonkey:['hand-foot'],BoundAngle:['soles-together'],Butterfly:['soles-together'],Crow:['arm-leg-support']};
export function referenceTasks(key){return (tasks[key]||[]).map(task=>({...task,validator:validated[key]?.includes(task.kind)?(task.kind==='soles-together'?'sole-pair':key==='Crow'?'crow-knees-on-arms':key==='Archer'?'both-toe-grips':'rear-foot-grip'):null}));}

export const REFERENCE_AUDIT_LIMITS=[
 'The audit covers static library poses after the same applyPose pipeline used by the editor. It does not validate arbitrary transitions or saved user sequences.',
 'A missing form contract is recorded as a coverage gap. Passing floor and ROM checks alone never establishes reference-pose accuracy.',
 'Reference relationship screens use conservative mesh bounds. A positive gap proves separation; nearby bounds do not prove surface contact or a grip.',
 'Optional reference alternatives and explicitly named modifications are recorded separately from mandatory relationship failures.',
 'Limb and core contacts use the existing capsule/ellipsoid proxies. Conservative external-hand/core findings are reported separately from confirmed support failures.',
 'The rig does not model friction, joint torque, center of mass, muscle forces, or soft tissue. Geometric contact is not a balance or load-bearing certification.',
 'The mirror audit also exposes side-specific contracts. A mirrored form-only failure may require a mirror-aware validator rather than different pose geometry.',
];
