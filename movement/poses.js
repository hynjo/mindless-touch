import supportedPoses from './supported-poses.json' with {type:'json'};
import footCorrections from './foot-support-corrections.json' with {type:'json'};
import {standingSupportCorrections} from './standing-support-corrections.js';
import {lungeSupportCorrections} from './lunge-support-corrections.js';
import {bigToeCorrection} from './big-toe-correction.js';
import {boundAngleCorrection} from './bound-angle-correction.js';
import {crowCorrection} from './crow-correction.js';
import {archerCorrection} from './archer-correction.js';
import {bridgeCorrection,bridgeVariations} from './bridge-variations.js';
import catalog from './pose-catalog.json' with {type:'json'};
// Reviewed clearance offsets for the mannequin proportions; stored poses are not rewritten.
import corrections from './pose-corrections.json' with {type:'json'};
import {poseShapes,normalizeRotations} from './pose-shapes.js';
import {sunSalutation} from './examples.js';
// Independently authored mannequin poses. Pocket Yoga links identify the reference pose;
// no source illustrations or descriptive text are bundled.
const fromSequence=(id,name,category,source)=>({...structuredClone(sunSalutation.steps.find(step=>step.id===id)),id:`library-${id}`,name,category,source:`https://www.pocketyoga.com/pose/${source}`});
function pose(id,name,category,source,rotations,extra={}){
 return {id:`library-${id}`,name,category,source:`https://www.pocketyoga.com/pose/${source}`,rootPosition:[0,.97,0],rotations,holdSeconds:3,transitionSeconds:2.2,...extra};
}
const both=(joint,angle)=>({['left'+joint]:[angle,0,0],['right'+joint]:[angle,0,0]});
const table={pelvis:[90,0,0],...both('Hip',-90),...both('Knee',90),...both('Shoulder',-90)};
export const basicPoses=[
 fromSequence('mountain-start','Mountain','Standing','MountainArmsSide'),
 {...fromSequence('fold-start','Standing Forward Bend','Standing','ForwardBend'),...structuredClone(bigToeCorrection),supportRequirements:['soles'],modification:'Hands free · Grounded soles',cue:'Fold forward with both soles grounded. Hands reach down without requiring floor contact.'},
 pose('chair','Chair','Standing','Chair',{...both('Hip',-45),...both('Knee',65),...both('Ankle',-20),...both('Shoulder',-165),torso:[15,0,0]}),
 pose('star','Star','Standing','Star',{leftShoulder:[0,0,90],rightShoulder:[0,0,-90],leftHip:[0,0,20],rightHip:[0,0,-20]}),
 fromSequence('plank','Plank','Floor support','Plank'),
 fromSequence('low-plank','Low Push-up','Floor support','FourLimbedStaff'),
 fromSequence('upward-dog','Upward-Facing Dog','Floor support','UpwardDog'),
 fromSequence('downward-dog','Downward-Facing Dog','Floor support','DownwardDog'),
 pose('table','Tabletop','Floor support','BoxNeutral',table,{floorSupport:'palms-knees',rootPosition:[0,.46,0]}),
 pose('cat','Cat','Floor support','Cat',{...table,pelvis:[65,0,0],waist:[25,0,0],torso:[25,0,0],neck:[20,0,0]},{floorSupport:'palms-knees',rootPosition:[0,.46,0]}),
 pose('cow','Cow','Floor support','Dog',{...table,pelvis:[110,0,0],waist:[-20,0,0],torso:[-20,0,0],neck:[-20,0,0]},{floorSupport:'palms-knees',rootPosition:[0,.46,0]}),
 pose('corpse','Corpse','Reclining','Corpse',{pelvis:[-90,0,0],neck:[-5,0,0],leftShoulder:[0,0,12],rightShoulder:[0,0,-12],leftHip:[0,0,6],rightHip:[0,0,-6],...both('Knee',5),...both('Ankle',40),...both('Wrist',0)}),
];

const existingBySource=new Map(basicPoses.map(pose=>[pose.source.split('/').at(-1),pose]));
export const uncorrectedYogaPoses=catalog.map(entry=>{
 const existing=existingBySource.get(entry.key);
 if(existing)return {...existing,category:entry.category,difficulty:entry.difficulty,draft:false};
 const rotations=poseShapes[entry.key];
 if(!rotations)throw new Error(`Missing pose: ${entry.key}`);
 return {id:`library-${entry.key}`,name:entry.name,category:entry.category,difficulty:entry.difficulty,draft:true,source:`https://www.pocketyoga.com/pose/${entry.key}`,rootPosition:[0,.97,0],rotations:normalizeRotations({...rotations,...corrections[entry.key]}),...(entry.key==='Lizard'?{rootPosition:[0, 0.28, 0],floorSupport:'ground'}:entry.key==='Caterpillar'?{rootPosition:[0, 0.48976218889074685, 0],floorSupport:'ground'}:entry.key==='Lunge'?{floorSupport:'palms'}:{}),...supportedPoses[entry.key],holdSeconds:3,transitionSeconds:2.2};
}).sort((a,b)=>a.name.localeCompare(b.name));
const correctedYogaPoses=uncorrectedYogaPoses.map(pose=>{
 const key=pose.source.split('/').at(-1),correction=footCorrections[key];
 const grounded=correction?{...pose,...correction,rotations:{...pose.rotations,...correction.rotations}}:pose;
 // Full authored rotations replace old clearance/IK angles, rather than leaving
 // unrelated joints from the previous draft in the new stance.
 const authored=key==='ForwardBendBigToe'?bigToeCorrection:key==='BoundAngle'?boundAngleCorrection:key==='Crow'?crowCorrection:key==='Archer'?archerCorrection:key==='Bridge'?bridgeCorrection:standingSupportCorrections[key]||lungeSupportCorrections[key];
 const result=authored?{...grounded,...structuredClone(authored)}:grounded;
 const contract={ForwardBend:'forward-fold-v1',BoundAngle:'bound-angle-raised-knees-v1',Crow:'crow-bent-arms-v1',Archer:'archer-forward-lean-v1',Bridge:'bridge-interlaced-v1',BoxNeutral:'tabletop-neutral-v1',Cat:'cat-rounded-v1',Dog:'cow-extended-v1',Plank:'plank-straight-v1',FourLimbedStaff:'low-plank-v1',DownwardDog:'downward-dog-v1',Corpse:'corpse-supine-v1'}[key];
 return contract?{...result,poseContract:contract}:result;
});
export const yogaPoses=[...correctedYogaPoses,...bridgeVariations].sort((a,b)=>a.name.localeCompare(b.name));
