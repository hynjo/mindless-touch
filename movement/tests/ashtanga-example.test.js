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
 assert(ashtangaShortPractice.steps.findIndex(step=>step.name==='Boat')<ashtangaShortPractice.steps.findIndex(step=>step.name==='Bound Angle Preparation'));
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

test('revised holds keep their required supports and stay inside the measured joint envelope',()=>{
 const rig=fixture();
 for(const step of ashtangaShortPractice.steps.filter(step=>step.source)){
  apply(rig,step);
  const {surfaces}=inspectSupports(rig,step),key=step.source.split('/').at(-1);
  const supports=step.category==='Standing'?['left-sole','right-sole']:
   key==='Bridge'?['left-sole','right-sole','back','back-head']:
   key==='FishPreparation'?['seat','head','left-heel','right-heel']:
   key==='Corpse'?['seat','back','back-head','left-heel','right-heel']:
   key==='BoundAngle'?['seat','left-foot-edge','right-foot-edge']:
   key==='BoatFull'?['seat']:['seat','left-heel','right-heel'];
  for(const support of supports)assert(surfaces[support].pass,`${step.name}: ${support} ${JSON.stringify(surfaces[support])}`);
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
