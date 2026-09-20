import {sunSalutation} from './examples.js';
import {yogaPoses} from './poses.js';
import {ashtangaShapes,mirrorRotations} from './ashtanga-shapes.js';

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

// A deliberately shortened adaptation, not the complete Primary Series. Named
// modifications make the current mannequin's reach and support limits explicit.
export const ashtangaShortPractice={
 id:'ashtanga-short-practice',name:'Ashtanga Short Practice',source,
 sourceLabel:'MyYogaTeacher Primary Series guide',
 description:'Shortened Primary Series study: one Sun Salutation A, both sides of selected standing poses, seated poses and rest. Sun Salutation B, repeated vinyasas, binds and inversions are omitted. Shallow bends, bent-knee folds and an open seated finish are explicit modifications; timing is for preview, not a breath count.',
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
  {...library('Staff','staff','Sit on the pelvis with both heels grounded. Knees are softly bent and arms reach forward.'),name:'Staff — Arms Forward'},
  seatedReset('open-from-staff'),
  {...library('Seated Forward Bend I','seated-forward-bend','Keep the pelvis and heels grounded; fold with softly bent knees.',8),name:'Seated Forward Bend — Bent Knees'},
  seatedReset('open-after-fold'),
  library('Boat','boat','Balance on the pelvis and lift the legs.',5),
  seatedReset('prepare-bound-angle'),
  {...library('Bound Angle','bound-angle','Keep the pelvis grounded. Open-knee preparation; the sole-to-sole bind is not modeled.',8),name:'Bound Angle Preparation'},
  seatedReset('prepare-bridge'),
  {...library('Bridge','bridge','Press both soles down and keep the upper back grounded.',6),name:'Low Bridge'},
  {...library('Fish','fish','A low chest-opening modification with the pelvis, head and heels supported.',5),name:'Fish Preparation'},
  seatedReset('prepare-closing-seat'),
  {...library('Bound Angle','closing-seat','Rest seated with the pelvis grounded. Open-leg alternative to the reference Lotus finish.',8),name:'Closing Seat — Open Legs'},
  library('Corpse','corpse','Release effort with the pelvis, upper back, head and heels supported.',15),
 ],
};
// These modifications deliberately release binds/hand supports; retain the
// actual support contract when cards are captured and saved.
for(const step of ashtangaShortPractice.steps){
 if(step.supportRequirements)continue;
 const key=step.source?.split('/').at(-1);
 step.supportRequirements=step.category==='Standing'?['soles']:
  key==='Bridge'?['soles','back','back-head']:
  key==='FishPreparation'?['seat','head','heels']:
  key==='Corpse'?['seat','back','back-head','heels']:
  key==='BoundAngle'?['seat','any-foot-edge']:
  key==='BoatFull'?['seat']:['seat','heels'];
}
