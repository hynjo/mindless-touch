import {sunSalutation} from './examples.js';
import {yogaPoses} from './poses.js';
import {ashtangaShapes,mirrorRotations} from './ashtanga-shapes.js';
import {caterpillarCorrection} from './caterpillar-correction.js';

const source='https://myyogateacher.com/articles/ashtanga-yoga-primary-series-guide';
const library=(name,id,cue,holdSeconds=5)=>{
 const pose=yogaPoses.find(item=>item.name===name);
 if(!pose)throw new Error(`Missing Ashtanga pose: ${name}`);
 return {...structuredClone(pose),...(ashtangaShapes[name]?{poseContract:undefined}:{}),rotations:structuredClone(ashtangaShapes[name]||pose.rotations),floorSupport:pose.floorSupport||'ground',id:`ashtanga-${id}`,cue,holdSeconds,transitionSeconds:2.4};
};
const sidePose=(name,id,side,cue)=>{
 const step=library(name,`${id}-${side}`,cue);
 if(side==='right')step.rotations=mirrorRotations(step.rotations);
 step.name=`${name} — ${side==='left'?'Left':'Right'}`;return step;
};
const reset=id=>({...library('Mountain',id,'Return upright with arms open before changing the stance.',.5),rotations:{...ashtangaShapes.Mountain,leftShoulder:[0,0,90],rightShoulder:[0,0,-90]},name:'Return Upright',kind:'transition'});
const seatedReset=id=>({...library('Staff',id,'Sit down evenly, then open the arms to clear the legs.',.5),name:'Seated Reset',kind:'transition',rotations:{...ashtangaShapes.Staff,leftShoulder:[0,0,90],rightShoulder:[0,0,-90],leftElbow:[0,0,0],rightElbow:[0,0,0]}});
const opening=sunSalutation.steps.map((step,index)=>({...structuredClone(step),id:`ashtanga-sun-a-${index+1}`}));
const seatedEntrySun=sunSalutation.steps.slice(1,13).map((step,index)=>({
 ...structuredClone(step),id:`ashtanga-seat-entry-${index+1}`,
 ...(step.id==='step-forward'?{name:'Walk Forward — First Step'}:{}),
 ...(step.id==='step-together'?{name:'Walk Forward — Feet Together'}:{}),
}));
const walkForward=seatedEntrySun.at(-1);
walkForward.contactSchedule={version:1,anchors:[
 {anchor:'left-palm',start:true,end:true},
 {anchor:'right-palm',start:true,end:true},
 {anchor:'left-heel',start:true,end:true},
 {anchor:'right-heel',start:true,end:true},
 {anchor:'left-forefoot',start:true,end:false,release:[.12,.2]},
 {anchor:'right-forefoot',start:true,end:false,release:[.12,.2]},
 {anchor:'seat',start:false,end:true,landing:[.92,1]},
]};
const lowerToSeat={
 ...structuredClone(yogaPoses.find(step=>step.name==='Caterpillar')),
 ...structuredClone(caterpillarCorrection),
 id:'ashtanga-lower-to-seat',name:'Lower to Seat',kind:'transition',
 cue:'Keep both palms and heels grounded while lowering the seat. Release the hands only after the pelvis lands.',
 holdSeconds:.5,transitionSeconds:2.8,poseContract:undefined,floorSupport:'palms',supportRequirements:['seat','palms','heels'],
 contactSchedule:{version:1,anchors:[
  {anchor:'left-palm',start:true,end:false,release:[.05,.3]},
  {anchor:'right-palm',start:true,end:false,release:[.05,.3]},
  {anchor:'left-heel',start:true,end:true},
  {anchor:'right-heel',start:true,end:true},
  {anchor:'seat',start:true,end:true},
 ]},
};
const canonicalBoundAngle=()=>{
 const pose=structuredClone(yogaPoses.find(step=>step.name==='Bound Angle'));
 return {...pose,id:'ashtanga-bound-angle',name:'Bound Angle',cue:'Sit upright on both sit bones with the knees open and the soles together. The knees may remain raised.',holdSeconds:8,transitionSeconds:2.4,supportRequirements:['sit-bones','sole-pair']};
};
const boundAngleStage=(id,name,x,knee,open)=>{
 const step=canonicalBoundAngle();delete step.poseContract;
 step.id=`ashtanga-${id}`;step.name=name;step.kind='transition';step.holdSeconds=.5;step.supportRequirements=['seat'];
 for(const [side,sign] of [['left',1],['right',-1]]){
  step.rotations[side+'Hip']=[x,30.697*open*sign,61.495*open*sign];
  step.rotations[side+'Knee']=[knee,0,0];
  step.rotations[side+'Ankle']=[13.17,-18.344*open*sign,-25.616*open*sign];
 }
 return step;
};
const liftFeet={...seatedReset('bound-angle-lift-feet'),name:'Lift Heels',cue:'Keep the pelvis grounded and lift both heels slightly before drawing the legs in.',supportRequirements:['seat'],rootPosition:[0,.1207,0]};
for(const side of ['left','right']){liftFeet.rotations[side+'Hip']=[-100,0,0];liftFeet.rotations[side+'Knee']=[20,0,0];}
const boundAngleEntry=[
 liftFeet,
 boundAngleStage('bound-angle-draw-heels','Draw Heels In',-130,60,.25),
 boundAngleStage('bound-angle-open-knees','Open Knees',-140,60,.75),
 boundAngleStage('bound-angle-join-soles','Bring Soles Together',-160,100,1),
];
boundAngleEntry.at(-1).contactSchedule={version:1,anchors:[
 {anchor:'seat',start:true,end:true},
 {anchor:'sole-pair',start:false,end:true,landing:[.96,1]},
]};
const boundAngle=canonicalBoundAngle();
boundAngle.contactSchedule={version:1,anchors:[
 {anchor:'seat',start:true,end:true},
 {anchor:'sole-pair',start:true,end:false,release:[0,.04]},
]};
const exitStage=(source,id,name)=>{const step={...structuredClone(source),id:`ashtanga-${id}`,name};delete step.contactSchedule;return step;};
const boundAngleExit=[
 exitStage(boundAngleEntry[3],'bound-angle-separate-soles','Separate Soles'),
 exitStage(boundAngleEntry[2],'bound-angle-keep-feet-lifted','Keep Feet Lifted'),
 exitStage(boundAngleEntry[1],'bound-angle-close-knees','Close Knees'),
 exitStage(boundAngleEntry[0],'bound-angle-extend-legs','Extend Legs'),
];
boundAngleExit.at(-1).contactSchedule={version:1,anchors:[
 {anchor:'seat',start:true,end:true},
 {anchor:'left-heel',start:false,end:true,landing:[.96,1]},
 {anchor:'right-heel',start:false,end:true,landing:[.96,1]},
]};
const bridgeLiftFeet=exitStage(boundAngleEntry[0],'bridge-lift-feet','Lift Feet for Recline');
bridgeLiftFeet.cue='Keep the pelvis grounded and lift both feet before rolling down.';
const rollDown={...structuredClone(yogaPoses.find(step=>step.name==='Corpse')),id:'ashtanga-roll-down',name:'Roll Down',kind:'transition',cue:'Lower the pelvis, back and head with both feet lifted.',holdSeconds:.5,transitionSeconds:2.8,poseContract:undefined,supportRequirements:['seat','back','back-head'],rootPosition:[0,.1207,0]};
for(const side of ['left','right']){rollDown.rotations[side+'Hip']=[-80,0,0];rollDown.rotations[side+'Knee']=[120,0,0];rollDown.rotations[side+'Ankle']=[0,0,0];}
const plantFeet={...structuredClone(rollDown),id:'ashtanga-plant-feet-for-bridge',name:'Plant Feet',cue:'Keep the pelvis, back and head grounded while placing both soles down.',supportRequirements:['seat','back','back-head','soles']};
for(const side of ['left','right']){plantFeet.rotations[side+'Hip']=[-45,0,0];plantFeet.rotations[side+'Knee']=[100,0,0];plantFeet.rotations[side+'Ankle']=[40,0,0];}
const lowerBridge=exitStage(plantFeet,'lower-bridge','Lower Bridge');
lowerBridge.cue='Lower the pelvis until the seat, back and head are supported.';
const bridgeExitLift=exitStage(rollDown,'bridge-exit-lift-feet','Lift Feet after Bridge');
bridgeExitLift.cue='Keep the pelvis, back and head grounded while lifting both feet.';
const extendLegs={...structuredClone(yogaPoses.find(step=>step.name==='Corpse')),id:'ashtanga-extend-legs-after-bridge',name:'Extend Legs',kind:'transition',cue:'Extend both legs and settle the heels while the trunk remains grounded.',holdSeconds:.5,transitionSeconds:2.8,poseContract:undefined,supportRequirements:['seat','back','back-head','heels']};

// A deliberately shortened adaptation, not the complete Primary Series. Named
// modifications make the current mannequin's reach and support limits explicit.
export const ashtangaShortPractice={
 id:'ashtanga-short-practice',name:'Ashtanga Short Practice',source,
 sourceLabel:'MyYogaTeacher Primary Series guide',
 description:'Shortened Primary Series study: one Sun Salutation A, both sides of selected standing poses, seated poses and rest. Sun Salutation B, repeated vinyasas, binds and inversions are omitted. Shallow bends, bent-knee folds and a supine finish are explicit modifications; timing is for preview, not a breath count.',
 steps:[
  ...opening,
  {...library('Big Toe','big-toe','Preparation for Big Toe Pose: bend the knees and lower the hands beside the feet. Both soles stay grounded; no toe grip.'),name:'Forward Fold — Bent Knees'},
  reset('rise-from-fold'),
  sidePose('Triangle','triangle','left','Keep both soles grounded; reach the lower hand toward the shin. Modified depth.'),
  reset('switch-triangle'),
  sidePose('Triangle','triangle','right','Keep both soles grounded; reach the lower hand toward the shin. Modified depth.'),
  reset('prepare-revolved'),
  sidePose('Revolved Triangle','revolved-triangle','left','Ground both soles and rotate the chest. The lower hand remains lifted in this shallow modification.'),
  reset('switch-revolved'),
  sidePose('Revolved Triangle','revolved-triangle','right','Ground both soles and rotate the chest. The lower hand remains lifted in this shallow modification.'),
  reset('prepare-warrior'),
  sidePose('Warrior I','warrior-one','left','Both heels down; front knee over the ankle. Shallow lunge.'),
  sidePose('Warrior II','warrior-two','left','Turn the chest and reach over the front and rear legs. Shallow lunge.'),
  reset('switch-warrior'),
  sidePose('Warrior I','warrior-one','right','Both heels down; front knee over the ankle. Shallow lunge.'),
  sidePose('Warrior II','warrior-two','right','Turn the chest and reach over the front and rear legs. Shallow lunge.'),
  reset('prepare-seated'),
  ...seatedEntrySun,
  lowerToSeat,
  {...library('Staff','staff','Sit on the pelvis with both heels grounded. Knees are softly bent and arms reach forward.'),name:'Staff — Arms Forward'},
  seatedReset('open-from-staff'),
  {...library('Seated Forward Bend I','seated-forward-bend','Keep the pelvis and heels grounded; fold with softly bent knees.',8),name:'Seated Forward Bend — Bent Knees'},
  seatedReset('open-after-fold'),
  library('Boat','boat','Balance on the pelvis and lift the legs.',5),
  seatedReset('prepare-bound-angle'),
  ...boundAngleEntry,
  boundAngle,
  ...boundAngleExit,
  {...seatedReset('prepare-bridge'),name:'Lower Heels'},
  bridgeLiftFeet,
  rollDown,
  plantFeet,
  {...library('Bridge','bridge','Press both soles down and keep the upper back grounded.',6),name:'Low Bridge'},
  lowerBridge,
  bridgeExitLift,
  extendLegs,
  {...library('Fish','fish','A low chest-opening modification with the pelvis, head and heels supported.',5),name:'Fish Preparation'},
  library('Corpse','corpse','Release effort with the pelvis, upper back, head and heels supported.',15),
 ],
};
// These modifications deliberately release binds/hand supports; retain the
// actual support contract when cards are captured and saved.
for(const step of ashtangaShortPractice.steps){
 if(step.supportRequirements||step.poseContract)continue;
 const key=step.source?.split('/').at(-1);
 step.supportRequirements=step.category==='Standing'?['soles']:
  key==='Bridge'?['soles','back','back-head']:
  key==='FishPreparation'?['seat','head','heels']:
  key==='Corpse'?['seat','back','back-head','heels']:
  key==='BoundAngle'?['seat','any-foot-edge']:
  key==='BoatFull'?['seat']:['seat','heels'];
}
