import supportedPoses from './supported-poses.json' with {type:'json'};
import footCorrections from './foot-support-corrections.json' with {type:'json'};
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
 fromSequence('fold-start','Standing Forward Bend','Standing','ForwardBend'),
 pose('chair','Chair','Standing','Chair',{...both('Hip',-45),...both('Knee',65),...both('Ankle',-20),...both('Shoulder',-165),torso:[15,0,0]}),
 pose('star','Star','Standing','Star',{leftShoulder:[0,0,90],rightShoulder:[0,0,-90],leftHip:[0,0,20],rightHip:[0,0,-20]}),
 fromSequence('plank','Plank','Floor support','Plank'),
 fromSequence('low-plank','Low Push-up','Floor support','FourLimbedStaff'),
 fromSequence('upward-dog','Upward-Facing Dog','Floor support','UpwardDog'),
 fromSequence('downward-dog','Downward-Facing Dog','Floor support','DownwardDog'),
 pose('table','Tabletop','Floor support','BoxNeutral',table,{floorSupport:'palms-knees',rootPosition:[0,.46,0]}),
 pose('cat','Cat','Floor support','Cat',{...table,pelvis:[65,0,0],waist:[25,0,0],torso:[25,0,0],neck:[20,0,0]},{floorSupport:'palms-knees',rootPosition:[0,.46,0]}),
 pose('cow','Cow','Floor support','Dog',{...table,pelvis:[110,0,0],waist:[-20,0,0],torso:[-20,0,0],neck:[-20,0,0]},{floorSupport:'palms-knees',rootPosition:[0,.46,0]}),
 pose('corpse','Corpse','Reclining','Corpse',{pelvis:[-90,0,0],leftShoulder:[0,0,12],rightShoulder:[0,0,-12],leftHip:[0,0,6],rightHip:[0,0,-6],...both('Wrist',0)}),
];

const existingBySource=new Map(basicPoses.map(pose=>[pose.source.split('/').at(-1),pose]));
export const uncorrectedYogaPoses=catalog.map(entry=>{
 const existing=existingBySource.get(entry.key);
 if(existing)return {...existing,category:entry.category,difficulty:entry.difficulty,draft:false};
 const rotations=poseShapes[entry.key];
 if(!rotations)throw new Error(`Missing pose: ${entry.key}`);
 return {id:`library-${entry.key}`,name:entry.name,category:entry.category,difficulty:entry.difficulty,draft:true,source:`https://www.pocketyoga.com/pose/${entry.key}`,rootPosition:[0,.97,0],rotations:normalizeRotations({...rotations,...corrections[entry.key]}),...(entry.key==='Lizard'?{rootPosition:[0, 0.28, 0],floorSupport:'ground'}:entry.key==='Caterpillar'?{rootPosition:[0, 0.48976218889074685, 0],floorSupport:'ground'}:entry.key==='Lunge'?{floorSupport:'palms'}:{}),...supportedPoses[entry.key],holdSeconds:3,transitionSeconds:2.2};
}).sort((a,b)=>a.name.localeCompare(b.name));
export const yogaPoses=uncorrectedYogaPoses.map(pose=>{
 const correction=footCorrections[pose.source.split('/').at(-1)];
 return correction?{...pose,...correction,rotations:{...pose.rotations,...correction.rotations}}:pose;
});
