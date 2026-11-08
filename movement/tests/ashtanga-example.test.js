import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ashtangaShortPractice} from '../ashtanga-example.js';
import {createBody} from '../body.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {createTimeline} from '../playback.js';
import {applyHandPreset} from '../hands.js';
import {placePalmsOnFloor,palmsAreSupported,preparePalmLanding} from '../palm-support.js';
import {inspectSupports,inspectJointRanges} from '../pose-validation.js';
import {capturePose} from '../pole-constraints.js';
import {movingFootSide,sampleContactSchedule} from '../contact-schedule.js';
import {inspectTransitionSupports} from '../transition-supports.js';
import {inspectScheduledHolds} from '../scheduled-supports.js';

const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
function fixture(){
 const material=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(mesh=>{if(mesh.isMesh)meshes.push(mesh);});
 const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(joint=>[joint.id,joint]))};
 return {...rig,floor:createFloorConstraints(rig),self:createSelfConstraints(rig)};
}
function apply(rig,step){
 rig.root.position.fromArray(step.rootPosition);
 for(const joint of rig.joints)joint.group.rotation.set(...(step.rotations[joint.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 for(const hand of Object.values(rig.hands))applyHandPreset(hand,'open');
 if(palmsAreSupported(step))placePalmsOnFloor(rig);
 rig.floor.settle();
}
test('short Ashtanga example covers four sections and plays without surface or body penetration',()=>{
 assert.equal(new Set(ashtangaShortPractice.steps.map(step=>step.id)).size,ashtangaShortPractice.steps.length);
 assert(ashtangaShortPractice.steps.findIndex(step=>step.name==='Boat')<ashtangaShortPractice.steps.findIndex(step=>step.name==='Bound Angle'));
 const material=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(mesh=>{if(mesh.isMesh)meshes.push(mesh);});
 const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(joint=>[joint.id,joint]))};
 const floor=createFloorConstraints(rig),self=createSelfConstraints(rig),timeline=createTimeline(ashtangaShortPractice.steps);
 const frames=ashtangaShortPractice.steps.map(step=>{
  body.root.position.fromArray(step.rootPosition);
  for(const joint of body.joints)joint.group.rotation.set(...(step.rotations[joint.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
  for(const hand of Object.values(body.hands))applyHandPreset(hand,'open');
  if(palmsAreSupported(step))placePalmsOnFloor(rig);
  floor.settle();return floor.snapshot().pose;
 });
 assert.deepEqual(inspectScheduledHolds(rig,ashtangaShortPractice.steps,frames),[],'all authored contact schedules pass playback preflight');
 for(let time=0;time<=timeline.duration;time+=.1){
  const sample=timeline.sample(time),from=frames[sample.index],to=frames[sample.next];
  body.root.position.lerpVectors(from.position,to.position,sample.mix);
  body.joints.forEach((joint,index)=>joint.group.quaternion.slerpQuaternions(from.rotations[index],to.rotations[index],sample.mix));
  const start=palmsAreSupported(ashtangaShortPractice.steps[sample.index]),end=palmsAreSupported(ashtangaShortPractice.steps[sample.next]);
  if(start&&end)placePalmsOnFloor(rig);else if(start||end)preparePalmLanding(rig);
  floor.settle();assert(floor.clearance()>=.0007-1e-8,`Floor penetration at ${time}`);
  if(time===0)self.sync();else assert(self.commit(),`Body or wrist block at ${time}: ${ashtangaShortPractice.steps[sample.index].name} to ${ashtangaShortPractice.steps[sample.next].name} ${JSON.stringify(self.failure())}`);
 }
});

test('Plant Hands transfers the right foot back while both palms and the left foot stay supported',()=>{
 const rig=fixture(),index=ashtangaShortPractice.steps.findIndex(step=>step.name==='Plant Hands');
 const from=ashtangaShortPractice.steps[index],to=ashtangaShortPractice.steps[index+1];
 assert.equal(to.name,'Step Back');assert(from.contactSchedule);assert.equal(movingFootSide(from.contactSchedule),'right');
 apply(rig,from);const a=capturePose(rig.root,rig.joints);apply(rig,to);const b=capturePose(rig.root,rig.joints);
 for(let frame=0;frame<=240;frame++){
  const progress=frame/240,mix=progress*progress*(3-2*progress);
  rig.root.position.lerpVectors(a.position,b.position,mix);
  rig.joints.forEach((joint,jointIndex)=>joint.group.quaternion.slerpQuaternions(a.rotations[jointIndex],b.rotations[jointIndex],mix));
  const movingFoot=progress>0&&progress<1?movingFootSide(from.contactSchedule):null;
  placePalmsOnFloor(rig,{constrainAnkles:true,movingFoot,footLift:movingFoot?Math.pow(Math.sin(Math.PI*progress),.25)*.03:0});rig.floor.settle();
  if(movingFoot)for(let pass=0;pass<2;pass++)placePalmsOnFloor(rig,{constrainAnkles:true,movingFoot,footLift:Math.pow(Math.sin(Math.PI*progress),.25)*.003});rig.floor.settle();
  const scheduled=sampleContactSchedule(from.contactSchedule,progress);
  assert.deepEqual(inspectSupports(rig,{supportRequirements:scheduled.requiredAnchors}).issues,[],`support loss at frame ${frame}: ${scheduled.requiredAnchors.join(', ')}`);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[],`joint range at frame ${frame}`);
  assert(rig.floor.clearance()>=.0007-1e-8,`floor penetration at frame ${frame}`);
  assert.deepEqual(rig.self.contacts(),[],`body contact at frame ${frame}`);
 }
});

test('Step Back transfers the forward foot to Plank without losing the three stable contacts',()=>{
 const rig=fixture(),from=ashtangaShortPractice.steps[5],to=ashtangaShortPractice.steps[6];
 assert.equal(from.name,'Step Back');assert.equal(to.name,'Plank');assert(from.contactSchedule);
 apply(rig,from);const a=capturePose(rig.root,rig.joints);apply(rig,to);const b=capturePose(rig.root,rig.joints);
 for(let frame=0;frame<=240;frame++){
  const progress=frame/240,mix=progress*progress*(3-2*progress);
  rig.root.position.lerpVectors(a.position,b.position,mix);
  rig.joints.forEach((joint,index)=>joint.group.quaternion.slerpQuaternions(a.rotations[index],b.rotations[index],mix));
  const movingFoot=progress>0&&progress<1?movingFootSide(from.contactSchedule):null;
  placePalmsOnFloor(rig,{constrainAnkles:true,movingFoot,footLift:movingFoot?Math.pow(Math.sin(Math.PI*progress),.25)*.03:0});rig.floor.settle();
  if(movingFoot)for(let pass=0;pass<2;pass++)placePalmsOnFloor(rig,{constrainAnkles:true,movingFoot,footLift:Math.pow(Math.sin(Math.PI*progress),.25)*.003});rig.floor.settle();
  const scheduled=sampleContactSchedule(from.contactSchedule,progress);
  assert.deepEqual(inspectSupports(rig,{supportRequirements:scheduled.requiredAnchors}).issues,[],`support loss at frame ${frame}: ${scheduled.requiredAnchors.join(', ')}`);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[],`joint range at frame ${frame}`);
  assert(rig.floor.clearance()>=.0007-1e-8,`floor penetration at frame ${frame}`);
  assert.deepEqual(rig.self.contacts(),[],`body contact at frame ${frame}`);
  assert.deepEqual(rig.self.jointViolations(),[],`wrist limit at frame ${frame}`);
 }
});

test('the default Ashtanga opening routes Upward Dog through Plank before Downward Dog',()=>{
 const rig=fixture(),up=ashtangaShortPractice.steps.findIndex(step=>step.name==='Upward-Facing Dog');
 assert.equal(ashtangaShortPractice.steps[up+1].name,'Plank');
 assert.equal(ashtangaShortPractice.steps[up+2].name,'Downward-Facing Dog');
 const steps=ashtangaShortPractice.steps.slice(up,up+3),frames=steps.map(step=>{apply(rig,step);return capturePose(rig.root,rig.joints);});
 for(let edge=0;edge<2;edge++)for(let frame=0;frame<=240;frame++){
  const progress=frame/240,mix=progress*progress*(3-2*progress),a=frames[edge],b=frames[edge+1];
  rig.root.position.lerpVectors(a.position,b.position,mix);
  rig.joints.forEach((joint,index)=>joint.group.quaternion.slerpQuaternions(a.rotations[index],b.rotations[index],mix));
  placePalmsOnFloor(rig,{constrainAnkles:true});rig.floor.settle();
  assert.equal(inspectTransitionSupports(rig,steps[edge],steps[edge+1],mix).pass,true,`support loss on edge ${edge}, frame ${frame}`);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[],`joint range on edge ${edge}, frame ${frame}`);
  assert.deepEqual(rig.self.contacts(),[],`body contact on edge ${edge}, frame ${frame}`);
 }
});

test('Downward Dog keeps both palms and the rear toes while the other foot steps forward',()=>{
 const rig=fixture(),index=ashtangaShortPractice.steps.findIndex(step=>step.name==='Downward-Facing Dog');
 const from=ashtangaShortPractice.steps[index],to=ashtangaShortPractice.steps[index+1];
 assert.equal(to.name,'Step Forward');assert(from.contactSchedule);
 apply(rig,from);const a=capturePose(rig.root,rig.joints);apply(rig,to);const b=capturePose(rig.root,rig.joints);
 for(let frame=0;frame<=240;frame++){
  const progress=frame/240,mix=progress*progress*(3-2*progress);
  rig.root.position.lerpVectors(a.position,b.position,mix);
  rig.joints.forEach((joint,jointIndex)=>joint.group.quaternion.slerpQuaternions(a.rotations[jointIndex],b.rotations[jointIndex],mix));
  const movingFoot=progress>0&&progress<1?movingFootSide(from.contactSchedule):null;
  assert.equal(progress>0&&progress<1?movingFoot:'left','left');
  placePalmsOnFloor(rig,{constrainAnkles:true,movingFoot,footLift:movingFoot?Math.pow(Math.sin(Math.PI*progress),.25)*.03:0});rig.floor.settle();
  if(movingFoot)for(let pass=0;pass<2;pass++)placePalmsOnFloor(rig,{constrainAnkles:true,movingFoot,footLift:Math.pow(Math.sin(Math.PI*progress),.25)*.003});rig.floor.settle();
  const scheduled=sampleContactSchedule(from.contactSchedule,progress);
  assert(scheduled.requiredAnchors.includes('left-palm')&&scheduled.requiredAnchors.includes('right-palm')&&scheduled.requiredAnchors.includes('right-toe'));
  assert.deepEqual(inspectSupports(rig,{supportRequirements:scheduled.requiredAnchors}).issues,[],`support loss at frame ${frame}: ${scheduled.requiredAnchors.join(', ')}`);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[],`joint range at frame ${frame}`);
  assert.deepEqual(rig.self.contacts(),[],`body contact at frame ${frame}`);
 }
});

test('the standing section uses a supported Sun flow and lowers through hands, heels, then seat',()=>{
 const expected=['Return Upright','Upward Salute','Forward Fold','Halfway Lift','Plant Hands','Step Back','Plank','Low Plank','Upward-Facing Dog','Plank','Downward-Facing Dog','Walk Forward — First Step','Walk Forward — Feet Together','Lower to Seat','Staff — Arms Forward'];
 const start=ashtangaShortPractice.steps.findIndex(step=>step.id==='ashtanga-prepare-seated');
 assert.deepEqual(ashtangaShortPractice.steps.slice(start,start+expected.length).map(step=>step.name),expected);
 const rig=fixture(),from=ashtangaShortPractice.steps[start+12],to=ashtangaShortPractice.steps[start+13];
 apply(rig,from);const a=capturePose(rig.root,rig.joints);apply(rig,to);const b=capturePose(rig.root,rig.joints);
 for(let frame=0;frame<=240;frame++){
  const progress=frame/240,mix=progress*progress*(3-2*progress);
  rig.root.position.lerpVectors(a.position,b.position,mix);
  rig.joints.forEach((joint,index)=>joint.group.quaternion.slerpQuaternions(a.rotations[index],b.rotations[index],mix));
  placePalmsOnFloor(rig,{constrainAnkles:true});rig.floor.settle();
  const scheduled=sampleContactSchedule(from.contactSchedule,progress);
  assert.deepEqual(inspectSupports(rig,{supportRequirements:scheduled.requiredAnchors}).issues,[],`seated entry support loss at frame ${frame}: ${scheduled.requiredAnchors.join(', ')}`);
  assert(rig.floor.clearance()>=.0007-1e-8,`seated entry floor penetration at frame ${frame}`);
  assert.deepEqual(rig.self.contacts(),[],`seated entry body overlap at frame ${frame}`);
 }
 const staff=ashtangaShortPractice.steps[start+14];
 assert.deepEqual(sampleContactSchedule(to.contactSchedule,0).requiredAnchors.sort(),['left-heel','left-palm','right-heel','right-palm','seat']);
 assert.deepEqual(sampleContactSchedule(to.contactSchedule,1).requiredAnchors.sort(),['left-heel','right-heel','seat']);
 apply(rig,staff);assert.deepEqual(inspectSupports(rig,staff).issues,[]);
});

test('Bound Angle entry keeps the pelvis supported while the feet lift, open and meet',()=>{
 const names=['Seated Reset','Lift Heels','Draw Heels In','Open Knees','Bring Soles Together','Bound Angle'];
 const end=ashtangaShortPractice.steps.findIndex(step=>step.name==='Bound Angle'),steps=ashtangaShortPractice.steps.slice(end-names.length+1,end+1);
 assert.deepEqual(steps.map(step=>step.name),names);
 const rig=fixture(),frames=steps.map(step=>{apply(rig,step);return capturePose(rig.root,rig.joints);});
 for(let edge=0;edge<steps.length-1;edge++)for(let frame=0;frame<=240;frame++){
  const progress=frame/240,mix=progress*progress*(3-2*progress),a=frames[edge],b=frames[edge+1];
  rig.root.position.lerpVectors(a.position,b.position,mix);
  rig.joints.forEach((joint,index)=>joint.group.quaternion.slerpQuaternions(a.rotations[index],b.rotations[index],mix));rig.floor.settle();
  const schedule=steps[edge].contactSchedule;
  const support=schedule?inspectSupports(rig,{supportRequirements:sampleContactSchedule(schedule,progress).requiredAnchors}):inspectTransitionSupports(rig,steps[edge],steps[edge+1],mix);
  assert.equal(schedule?!support.issues.length:support.pass,true,`Bound Angle support loss on edge ${edge}, frame ${frame}`);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[],`Bound Angle range on edge ${edge}, frame ${frame}`);
  assert.deepEqual(rig.self.contacts(),[],`Bound Angle body overlap on edge ${edge}, frame ${frame}`);
 }
});

test('the bridge entry rolls onto the back before planting the feet and lifting the pelvis',()=>{
 const names=['Lower Heels','Lift Feet for Recline','Roll Down','Plant Feet','Low Bridge'];
 const start=ashtangaShortPractice.steps.findIndex(step=>step.name==='Lower Heels'),steps=ashtangaShortPractice.steps.slice(start,start+names.length);
 assert.deepEqual(steps.map(step=>step.name),names);
 const rig=fixture(),frames=steps.map(step=>{apply(rig,step);return capturePose(rig.root,rig.joints);});
 for(let edge=0;edge<steps.length-1;edge++)for(let frame=0;frame<=240;frame++){
  const progress=frame/240,mix=progress*progress*(3-2*progress),a=frames[edge],b=frames[edge+1];
  rig.root.position.lerpVectors(a.position,b.position,mix);
  rig.joints.forEach((joint,index)=>joint.group.quaternion.slerpQuaternions(a.rotations[index],b.rotations[index],mix));rig.floor.settle();
  assert.equal(inspectTransitionSupports(rig,steps[edge],steps[edge+1],mix).pass,true,`bridge support loss on edge ${edge}, frame ${frame}`);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[],`bridge range on edge ${edge}, frame ${frame}`);
  assert.deepEqual(rig.self.contacts(),[],`bridge body overlap on edge ${edge}, frame ${frame}`);
 }
});

test('the bridge exit grounds the trunk and heels before entering Fish',()=>{
 const names=['Low Bridge','Lower Bridge','Lift Feet after Bridge','Extend Legs','Fish Preparation'];
 const start=ashtangaShortPractice.steps.findIndex(step=>step.name==='Low Bridge'),steps=ashtangaShortPractice.steps.slice(start,start+names.length);
 assert.deepEqual(steps.map(step=>step.name),names);
 const rig=fixture(),frames=steps.map(step=>{apply(rig,step);return capturePose(rig.root,rig.joints);});
 for(let edge=0;edge<steps.length-1;edge++)for(let frame=0;frame<=240;frame++){
  const progress=frame/240,mix=progress*progress*(3-2*progress),a=frames[edge],b=frames[edge+1];
  rig.root.position.lerpVectors(a.position,b.position,mix);
  rig.joints.forEach((joint,index)=>joint.group.quaternion.slerpQuaternions(a.rotations[index],b.rotations[index],mix));rig.floor.settle();
  assert.equal(inspectTransitionSupports(rig,steps[edge],steps[edge+1],mix).pass,true,`Fish support loss on edge ${edge}, frame ${frame}`);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[],`Fish range on edge ${edge}, frame ${frame}`);
  assert.deepEqual(rig.self.contacts(),[],`Fish body overlap on edge ${edge}, frame ${frame}`);
 }
});

test('Fish releases directly into Corpse without a redundant seated reset',()=>{
 const index=ashtangaShortPractice.steps.findIndex(step=>step.name==='Fish Preparation'),steps=ashtangaShortPractice.steps.slice(index,index+2);
 assert.deepEqual(steps.map(step=>step.name),['Fish Preparation','Corpse']);
 assert.equal(ashtangaShortPractice.steps.some(step=>step.name==='Closing Seat — Open Legs'),false);
 const rig=fixture(),frames=steps.map(step=>{apply(rig,step);return capturePose(rig.root,rig.joints);});
 for(let frame=0;frame<=240;frame++){
  const progress=frame/240,mix=progress*progress*(3-2*progress);
  rig.root.position.lerpVectors(frames[0].position,frames[1].position,mix);
  rig.joints.forEach((joint,jointIndex)=>joint.group.quaternion.slerpQuaternions(frames[0].rotations[jointIndex],frames[1].rotations[jointIndex],mix));rig.floor.settle();
  assert.equal(inspectTransitionSupports(rig,steps[0],steps[1],mix).pass,true,`Fish release support loss at frame ${frame}`);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[],`Fish release range at frame ${frame}`);
  assert.deepEqual(rig.self.contacts(),[],`Fish release body overlap at frame ${frame}`);
 }
});

test('revised holds keep their required supports and stay inside the measured joint envelope',()=>{
 const rig=fixture();
 for(const step of ashtangaShortPractice.steps.filter(step=>step.source)){
  apply(rig,step);
  assert.deepEqual(inspectSupports(rig,step).issues,[],`${step.name}: required support`);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[],step.name);
  assert.deepEqual(rig.self.contacts(),[],`${step.name} starts with body overlap`);
 }
});

test('Triangle arms, feet and torso form the pose on both sides; Warriors bend the named front knee',()=>{
 const rig=fixture(),pos=id=>rig.byId[id].group.getWorldPosition(new THREE.Vector3());
 const axis=(id,vector)=>vector.applyQuaternion(rig.byId[id].group.getWorldQuaternion(new THREE.Quaternion()));
 for(const side of ['left','right']){
  const other=side==='left'?'right':'left';
  for(const kind of ['triangle','revolved-triangle']){
   const step=ashtangaShortPractice.steps.find(step=>step.id===`ashtanga-${kind}-${side}`);assert(step);apply(rig,step);
   const lower=kind==='triangle'?side:other,upper=kind==='triangle'?other:side;
   assert(pos(upper+'Wrist').y>pos('neck').y+.3,`${step.name}: upper hand above head`);
   assert(pos(lower+'Wrist').y<pos('pelvis').y-.25,`${step.name}: lower hand reaches down`);
   assert(axis(lower+'Shoulder',new THREE.Vector3(0,-1,0)).y<-.9);
   assert(axis(upper+'Shoulder',new THREE.Vector3(0,-1,0)).y>.99);
   assert(Math.abs(axis('torso',new THREE.Vector3(0,1,0)).y)<.5,`${step.name}: torso inclines`);
   assert(pos('leftAnkle').distanceTo(pos('rightAnkle'))>.7,`${step.name}: wide stance`);
  }
  for(const kind of ['one','two']){
   const step=ashtangaShortPractice.steps.find(step=>step.id===`ashtanga-warrior-${kind}-${side}`);assert(step);apply(rig,step);
   const knee=pos(side+'Knee'),ankle=pos(side+'Ankle');
   assert(Math.hypot(knee.x-ankle.x,knee.z-ankle.z)<.001,`${step.name}: shin vertical`);
   assert(rig.byId[side+'Knee'].group.rotation.x>.8);
   assert(Math.abs(rig.byId[other+'Knee'].group.rotation.x)<.001);
  }
 }
});

test('bent-knee Big Toe preparation reaches beside the feet and retains supports through entry and exit',()=>{
 const rig=fixture(),index=ashtangaShortPractice.steps.findIndex(p=>p.id==='ashtanga-big-toe'),pose=ashtangaShortPractice.steps[index];
 const position=id=>rig.byId[id].group.getWorldPosition(new THREE.Vector3());
 apply(rig,pose);
 assert.equal(pose.name,'Forward Fold — Bent Knees');
 for(const side of ['left','right']){
  const wrist=position(side+'Wrist'),ankle=position(side+'Ankle');
  assert(Math.abs(wrist.z-ankle.z)<.08,'hands must reach beside the feet, not float far ahead');
  assert(wrist.y<.22&&wrist.y>.14,'hands descend without requiring a floor-bearing palm');
  const knee=rig.byId[side+'Knee'].group.rotation;
  assert(knee.x>THREE.MathUtils.degToRad(15)&&knee.x<THREE.MathUtils.degToRad(35),'explicit moderate knee bend');
  assert(Math.abs(knee.y)+Math.abs(knee.z)<1e-8,'knee stays on its hinge');
 }
 const steps=ashtangaShortPractice.steps.slice(index-1,index+2),frames=steps.map(step=>{apply(rig,step);return capturePose(rig.root,rig.joints);});
 for(let edge=0;edge<2;edge++)for(let frame=0;frame<=100;frame++){
  const t=frame/100,a=frames[edge],b=frames[edge+1];
  rig.root.position.lerpVectors(a.position,b.position,t);rig.joints.forEach((j,i)=>j.group.quaternion.slerpQuaternions(a.rotations[i],b.rotations[i],t));rig.floor.settle();
  const at=`edge ${edge}, frame ${frame}`;
  assert.deepEqual(inspectSupports(rig,pose).issues,[],`sole support at ${at}`);
  assert.deepEqual(inspectJointRanges(rig.joints).issues,[],`joint envelope at ${at}`);
  assert.deepEqual(rig.self.contacts(),[],`body contact at ${at}`);
  assert.deepEqual(rig.self.jointViolations(),[],`wrist limit at ${at}`);
  // The general self guard covers limbs and within-hand collisions, not every
  // hand/foot pair. Disjoint mesh bounds prove clearance for these authored
  // transitions without pretending that box overlap proves penetration.
  const footBounds=Object.values(rig.feet).flatMap(foot=>foot.meshes.map(mesh=>new THREE.Box3().setFromObject(mesh,true)));
  for(const hand of Object.values(rig.hands))for(const mesh of hand.meshes){
   const box=new THREE.Box3().setFromObject(mesh,true);
   assert(footBounds.every(foot=>!box.intersectsBox(foot)),`hand/foot clearance at ${at}`);
  }
 }
});
